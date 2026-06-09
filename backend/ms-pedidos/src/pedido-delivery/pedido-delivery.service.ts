import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PedidoDelivery, EstadoDelivery } from '../entities/pedido-delivery.entity';
import { DetallePedidoDelivery } from '../entities/detalle-pedido-delivery.entity';
import { Incidencia } from '../entities/incidencia.entity';
import { AsignacionService } from '../asignacion/asignacion.service';
import { DynamoDbService } from '../infrastructure/dynamodb/dynamodb.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class PedidoDeliveryService {
  private readonly logger = new Logger(PedidoDeliveryService.name);

  constructor(
    @InjectRepository(PedidoDelivery)
    private readonly pedidoRepo: Repository<PedidoDelivery>,
    @InjectRepository(DetallePedidoDelivery)
    private readonly detalleRepo: Repository<DetallePedidoDelivery>,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepo: Repository<Incidencia>,
    private readonly asignacionService: AsignacionService,
    private readonly dynamoDbService: DynamoDbService,
    private readonly redisService: RedisService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  async obtenerPedido(id: string): Promise<PedidoDelivery> {
    const pedido = await this.pedidoRepo.findOne({
      where: { id },
      relations: { detalles: true },
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido delivery con ID ${id} no encontrado`);
    }
    return pedido;
  }

  async obtenerPedidosPorCliente(clienteId: number): Promise<PedidoDelivery[]> {
    return this.pedidoRepo.find({
      where: { clienteId },
      relations: { detalles: true },
      order: { createdAt: 'DESC' },
    });
  }

  async obtenerPedidosSinAsignar(): Promise<PedidoDelivery[]> {
    return this.pedidoRepo.find({
      where: { estado: EstadoDelivery.PENDIENTE },
      relations: { detalles: true },
      order: { createdAt: 'DESC' },
    });
  }

  async obtenerPedidosPorRepartidor(repartidorId: number): Promise<PedidoDelivery[]> {
    return this.asignacionService.obtenerRepartidoresDisponibles().then(() => {
      return this.pedidoRepo.createQueryBuilder('pedido')
        .innerJoin('asignaciones', 'asig', 'asig.pedido_id = pedido.id')
        .where('asig.repartidor_id = :repartidorId', { repartidorId })
        .andWhere('asig.estado = :estado', { estado: 'ASIGNADO' })
        .leftJoinAndSelect('pedido.detalles', 'detalles')
        .orderBy('asig.asignado_at', 'DESC')
        .getMany();
    });
  }

  async obtenerPedidosDelDia(): Promise<PedidoDelivery[]> {
    const today = new Date().toISOString().slice(0, 10);
    return this.obtenerPedidosPorFecha(today);
  }

  async obtenerPedidosPorFecha(fecha: string): Promise<PedidoDelivery[]> {
    const start = new Date(`${fecha}T00:00:00.000Z`);
    const end = new Date(`${fecha}T23:59:59.999Z`);
    return this.pedidoRepo.find({
      where: { createdAt: Between(start, end) },
      relations: { detalles: true },
      order: { createdAt: 'DESC' },
    });
  }

  async obtenerResumenDeliveryDia(fecha: string): Promise<any> {
    const start = new Date(`${fecha}T00:00:00.000Z`);
    const end = new Date(`${fecha}T23:59:59.999Z`);

    const pedidos = await this.pedidoRepo.find({
      where: { createdAt: Between(start, end) },
    });

    const entregados = pedidos.filter((p) => p.estado === EstadoDelivery.ENTREGADO);
    const cancelados = pedidos.filter((p) => p.estado === EstadoDelivery.CANCELADO);
    const totalVentas = entregados.reduce((sum, p) => sum + Number(p.total), 0);

    const incidencias = await this.incidenciaRepo.count({
      where: { createdAt: Between(start, end) },
    });

    return {
      fecha,
      totalPedidos: pedidos.length,
      pedidosEntregados: entregados.length,
      pedidosCancelados: cancelados.length,
      montoTotalDelivery: totalVentas,
      incidencias,
    };
  }

  async crearPedido(input: any): Promise<PedidoDelivery> {
    const pedido = new PedidoDelivery();
    pedido.clienteId = Number(input.clienteId);
    pedido.direccionId = input.direccionId ? Number(input.direccionId) : null;
    pedido.direccionEntrega = input.direccionEntrega;
    pedido.referencia = input.referencia || null;
    pedido.latitud = input.latitud ? Number(input.latitud) : null;
    pedido.longitud = input.longitud ? Number(input.longitud) : null;
    pedido.subtotal = Number(input.subtotal);
    pedido.descuento = input.descuento ? Number(input.descuento) : 0;
    pedido.total = Number(input.total);
    pedido.estado = EstadoDelivery.PENDIENTE;

    pedido.detalles = input.detalles.map((d: any) => {
      const det = new DetallePedidoDelivery();
      det.productoId = Number(d.productoId);
      det.nombreProducto = d.nombreProducto;
      det.cantidad = Number(d.cantidad);
      det.precioUnitario = Number(d.precioUnitario);
      det.subtotal = Number(d.cantidad) * Number(d.precioUnitario);
      return det;
    });

    const savedPedido = await this.pedidoRepo.save(pedido);

    await this.redisService.publish('pedido.creado', {
      pedidoId: savedPedido.id,
      tipo: 'DELIVERY',
      clienteId: savedPedido.clienteId,
      productos: savedPedido.detalles.map((d) => ({
        productoId: d.productoId,
        nombre: d.nombreProducto,
        cantidad: d.cantidad,
      })),
      coordenadasEntrega: savedPedido.latitud && savedPedido.longitud 
        ? `${savedPedido.latitud},${savedPedido.longitud}` 
        : null,
    });

    await this.dynamoDbService.logEvent(savedPedido.id, 'PEDIDO_CREADO', {
      total: savedPedido.total,
      clienteId: savedPedido.clienteId,
    });

    setTimeout(async () => {
      try {
        await this.asignacionService.asignarRepartidorAutomaticamente(savedPedido);
      } catch (err) {
        this.logger.error(`Failed auto-assigning driver for Pedido ${savedPedido.id}: ${err.message}`);
      }
    }, 1000);

    return savedPedido;
  }

  async actualizarEstado(id: string, estado: EstadoDelivery): Promise<PedidoDelivery> {
    const pedido = await this.obtenerPedido(id);
    const oldEstado = pedido.estado;
    pedido.estado = estado;
    const saved = await this.pedidoRepo.save(pedido);

    await this.dynamoDbService.logEvent(id, 'ESTADO_UPDATE', { oldEstado, nuevoEstado: estado });

    await this.redisService.publish('delivery.estado', {
      pedidoId: id,
      nuevoEstado: estado,
      timestamp: new Date().toISOString(),
    });

    if (estado === EstadoDelivery.ENTREGADO || estado === EstadoDelivery.CANCELADO) {
      const isCompletado = estado === EstadoDelivery.ENTREGADO;
      await this.asignacionService.liberarRepartidorPorPedido(id, isCompletado);
    }

    try {
      await this.notificacionesService.enviarNotificacion(
        pedido.clienteId,
        `Estado de tu pedido: ${estado}`,
        `Tu pedido Carmesí ha cambiado a estado: ${estado}.`,
        { pedidoId: id, estado },
      );
    } catch (err) {
      this.logger.warn(`Failed to send push notification to customer ${pedido.clienteId}: ${err.message}`);
    }

    return saved;
  }

  async cancelarPedido(id: string): Promise<PedidoDelivery> {
    const pedido = await this.obtenerPedido(id);

    if (pedido.estado !== EstadoDelivery.PENDIENTE) {
      throw new BadRequestException('El pedido solo puede ser cancelado antes de ser asignado y confirmado.');
    }

    return this.actualizarEstado(id, EstadoDelivery.CANCELADO);
  }
}
