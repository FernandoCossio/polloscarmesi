import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incidencia } from '../entities/incidencia.entity';
import { PedidoDelivery, EstadoDelivery } from '../entities/pedido-delivery.entity';
import { AsignacionService } from '../asignacion/asignacion.service';
import { DynamoDbService } from '../infrastructure/dynamodb/dynamodb.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { RedisService } from '../infrastructure/redis/redis.service';

@Injectable()
export class IncidenciasService {
  private readonly logger = new Logger(IncidenciasService.name);

  constructor(
    @InjectRepository(Incidencia)
    private readonly incidenciaRepo: Repository<Incidencia>,
    @InjectRepository(PedidoDelivery)
    private readonly pedidoRepo: Repository<PedidoDelivery>,
    private readonly asignacionService: AsignacionService,
    private readonly dynamoDbService: DynamoDbService,
    private readonly notificacionesService: NotificacionesService,
    private readonly redisService: RedisService,
  ) {}

  async reportarIncidencia(
    pedidoId: string,
    repartidorId: number,
    tipo: string,
    descripcion: string,
  ): Promise<Incidencia> {
    const pedido = await this.pedidoRepo.findOne({ where: { id: pedidoId } });
    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${pedidoId} no encontrado`);
    }

    const incidencia = new Incidencia();
    incidencia.pedido = pedido;
    incidencia.repartidorId = Number(repartidorId);
    incidencia.tipo = tipo;
    incidencia.descripcion = descripcion;
    const savedIncidencia = await this.incidenciaRepo.save(incidencia);

    await this.dynamoDbService.logEvent(pedidoId, `INCIDENCIA_${tipo}`, {
      repartidorId,
      descripcion,
      incidenciaId: savedIncidencia.id,
    });

    if (tipo === 'RECHAZO_PEDIDO') {
      this.logger.log(`Driver ID ${repartidorId} rejected Pedido ${pedidoId}. Liberating and reassigning.`);
      await this.asignacionService.liberarRepartidorPorPedido(pedidoId, false);
      
      pedido.estado = EstadoDelivery.PENDIENTE;
      await this.pedidoRepo.save(pedido);

      await this.redisService.publish('delivery.estado', {
        pedidoId,
        nuevoEstado: EstadoDelivery.PENDIENTE,
        timestamp: new Date().toISOString(),
      });

      setTimeout(async () => {
        try {
          await this.asignacionService.asignarRepartidorAutomaticamente(pedido);
        } catch (err) {
          this.logger.error(`Failed auto-reassigning Pedido ${pedidoId} after rejection: ${err.message}`);
        }
      }, 2000);
    } else {
      if (pedido.latitud && pedido.longitud) {
        await this.dynamoDbService.logGps(
          pedidoId,
          repartidorId,
          `INCIDENCIA_${tipo}`,
          Number(pedido.latitud),
          Number(pedido.longitud),
        );
      }
    }

    try {
      await this.notificacionesService.enviarNotificacion(
        1, // Admin ID
        `¡Incidencia en Delivery! - Pedido #${pedidoId.substring(0, 8)}`,
        `Repartidor #${repartidorId} reportó: ${tipo}. Motivo: ${descripcion}`,
        { pedidoId, incidenciaId: savedIncidencia.id },
      );
    } catch (err) {
      this.logger.warn(`Failed to send push alert to admin: ${err.message}`);
    }

    return savedIncidencia;
  }
}
