import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PedidoDelivery,
  EstadoDelivery,
} from '../entities/pedido-delivery.entity';
import { AsignacionService } from '../asignacion/asignacion.service';
import { S3Service } from '../infrastructure/s3/s3.service';
import { DynamoDbService } from '../infrastructure/dynamodb/dynamodb.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectRepository(PedidoDelivery)
    private readonly pedidoRepo: Repository<PedidoDelivery>,
    private readonly asignacionService: AsignacionService,
    private readonly s3Service: S3Service,
    private readonly dynamoDbService: DynamoDbService,
    private readonly redisService: RedisService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async registrarPuntoClave(
    pedidoId: string,
    repartidorId: number,
    evento: string,
    latitud: number,
    longitud: number,
  ): Promise<void> {
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${pedidoId} no encontrado`);
    }

    // 1. Log GPS point to DynamoDB
    await this.dynamoDbService.logGps(
      pedidoId,
      repartidorId,
      evento,
      latitud,
      longitud,
    );

    // 2. If event changes order state, update PostgreSQL and Redis
    let nuevoEstado: EstadoDelivery | null = null;
    if (evento === 'EN_CAMINO') {
      nuevoEstado = EstadoDelivery.EN_CAMINO;
    } else if (evento === 'LLEGADA') {
      // Pedido remains EN_CAMINO, but we can update or notify
    }

    if (nuevoEstado && pedido.estado !== nuevoEstado) {
      pedido.estado = nuevoEstado;
      await this.pedidoRepo.save(pedido);

      // Publish Redis event
      await this.redisService.publish('delivery.estado', {
        pedidoId,
        nuevoEstado,
        timestamp: new Date().toISOString(),
      });

      // Log Event in DynamoDB
      await this.dynamoDbService.logEvent(pedidoId, `ESTADO_${evento}`, {
        nuevoEstado,
      });

      // Notify customer
      try {
        await this.notificacionesService.enviarNotificacion(
          pedido.clienteId,
          '¡Tu pedido está en camino!',
          `El repartidor ha iniciado la entrega de tu pedido Carmesí.`,
          { pedidoId },
        );
      } catch (err) {
        this.logger.warn(
          `Failed to send push notification to customer ${pedido.clienteId}: ${err.message}`,
        );
      }
    }

    // Also update driver's active GPS in availability repo
    try {
      await this.asignacionService.actualizarDisponibilidad(
        repartidorId,
        undefined,
        latitud,
        longitud,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to update driver availability GPS: ${err.message}`,
      );
    }
  }

  async confirmarEntrega(
    pedidoId: string,
    repartidorId: number,
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
  ): Promise<PedidoDelivery> {
    try {
      const pedido = await this.pedidoRepo.findOne({
        where: { id: pedidoId },
        relations: { detalles: true },
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido con ID ${pedidoId} no encontrado`);
      }

      // 1. Generate key and upload image
      const extension = originalName?.split('.').pop() || 'jpg';
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
      const timestamp = Date.now();
      const customKey = `evidencias/${dateStr}/${pedidoId}-${timestamp}.${extension}`;

      const url = await this.s3Service.uploadFile(
        fileBuffer,
        customKey,
        mimetype,
      );

      // 2. Save order state
      pedido.estado = EstadoDelivery.ENTREGADO;
      pedido.evidenciaUrl = url;
      pedido.evidenciaS3Key = customKey;
      const savedPedido = await this.pedidoRepo.save(pedido);

      // 3. Liberate driver
      await this.asignacionService.liberarRepartidorPorPedido(pedidoId, true);

      // 4. Log GPS and Event in DynamoDB
      if (pedido.latitud && pedido.longitud) {
        await this.dynamoDbService.logGps(
          pedidoId,
          repartidorId,
          'ENTREGADO',
          Number(pedido.latitud),
          Number(pedido.longitud),
        );
      }
      await this.dynamoDbService.logEvent(pedidoId, 'ENTREGA_CONFIRMADA', {
        repartidorId,
        evidenciaUrl: url,
      });

      // 5. Publish event to Redis
      await this.redisService.publish('entrega.confirmada', {
        pedidoId,
        repartidorId,
        evidenciaUrl: url,
        timestamp: new Date().toISOString(),
      });

      // 6. Notify customer
      try {
        await this.notificacionesService.enviarNotificacion(
          pedido.clienteId,
          '¡Pedido Entregado!',
          `Tu pedido Carmesí ha sido entregado correctamente. ¡Que lo disfrutes!`,
          { pedidoId },
        );
      } catch (err) {
        this.logger.warn(
          `Failed to send push notification to customer ${pedido.clienteId}: ${err.message}`,
        );
      }

      return savedPedido;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Error in confirmarEntrega: ${err.message}`, err.stack);
      throw new BadRequestException(
        `Fallo al confirmar entrega: ${err.message}`,
      );
    }
  }
}
