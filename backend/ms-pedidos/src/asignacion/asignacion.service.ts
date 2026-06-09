import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asignacion, EstadoAsignacion } from '../entities/asignacion.entity';
import { RepartidorDisponibilidad, EstadoRepartidor } from '../entities/repartidor-disponibilidad.entity';
import { PedidoDelivery, EstadoDelivery } from '../entities/pedido-delivery.entity';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { DynamoDbService } from '../infrastructure/dynamodb/dynamodb.service';
import { RedisService } from '../infrastructure/redis/redis.service';

@Injectable()
export class AsignacionService {
  private readonly logger = new Logger(AsignacionService.name);

  constructor(
    @InjectRepository(Asignacion)
    private readonly asignacionRepo: Repository<Asignacion>,
    @InjectRepository(RepartidorDisponibilidad)
    private readonly repartidorRepo: Repository<RepartidorDisponibilidad>,
    @InjectRepository(PedidoDelivery)
    private readonly pedidoRepo: Repository<PedidoDelivery>,
    private readonly notificacionesService: NotificacionesService,
    private readonly dynamoDbService: DynamoDbService,
    private readonly redisService: RedisService,
  ) {}

  async obtenerRepartidoresDisponibles(): Promise<RepartidorDisponibilidad[]> {
    return this.repartidorRepo.find({ where: { estado: EstadoRepartidor.DISPONIBLE } });
  }

  async obtenerRepartidor(repartidorId: number): Promise<RepartidorDisponibilidad> {
    const r = await this.repartidorRepo.findOne({ where: { repartidorId } });
    if (!r) {
      throw new NotFoundException(`Repartidor con ID ${repartidorId} no registrado`);
    }
    return r;
  }

  async actualizarDisponibilidad(
    repartidorId: number,
    estado?: EstadoRepartidor,
    latitud?: number,
    longitud?: number,
  ): Promise<RepartidorDisponibilidad> {
    let r = await this.repartidorRepo.findOne({ where: { repartidorId } });
    if (!r) {
      r = new RepartidorDisponibilidad();
      r.repartidorId = Number(repartidorId);
      r.estado = EstadoRepartidor.OFFLINE;
    }
    if (estado !== undefined) {
      r.estado = estado;
    }
    if (latitud !== undefined) r.latitudActual = Number(latitud);
    if (longitud !== undefined) r.longitudActual = Number(longitud);

    const saved = await this.repartidorRepo.save(r);
    
    // Log GPS in DynamoDB if coordinates provided
    if (latitud !== undefined && longitud !== undefined) {
      await this.dynamoDbService.logGps(
        'DISPONIBILIDAD_UPDATE',
        repartidorId,
        'GPS_UPDATE',
        latitud,
        longitud,
      );
    }

    return saved;
  }

  async asignarRepartidorAutomaticamente(pedido: PedidoDelivery): Promise<Asignacion | null> {
    const lat = pedido.latitud;
    const lon = pedido.longitud;

    if (!lat || !lon) {
      this.logger.warn(`Pedido ${pedido.id} lacks coordinates. Falling back to default driver assignment.`);
      // Default to driver ID 4 (seeded repartidor) for dev convenience
      return this.crearAsignacionDirecta(pedido, 4);
    }

    const disponibles = await this.obtenerRepartidoresDisponibles();
    if (disponibles.length === 0) {
      this.logger.warn(`No drivers available for Pedido ${pedido.id}. Auto-assigning default driver ID 4.`);
      return this.crearAsignacionDirecta(pedido, 4);
    }

    let closestDriver: RepartidorDisponibilidad | null = null;
    let minDistance = Infinity;

    for (const d of disponibles) {
      if (d.latitudActual && d.longitudActual) {
        const dist = this.calculateDistance(
          Number(lat),
          Number(lon),
          Number(d.latitudActual),
          Number(d.longitudActual),
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestDriver = d;
        }
      }
    }

    if (closestDriver) {
      this.logger.log(`Closest driver for Pedido ${pedido.id} is ID: ${closestDriver.repartidorId} at distance ${minDistance.toFixed(2)} km`);
      return this.crearAsignacionDirecta(pedido, closestDriver.repartidorId);
    }

    // Fallback if coordinates were null
    return this.crearAsignacionDirecta(pedido, 4);
  }

  async crearAsignacionDirecta(pedido: PedidoDelivery, repartidorId: number): Promise<Asignacion> {
    // 1. Create assignment row
    const asignacion = new Asignacion();
    asignacion.pedido = pedido;
    asignacion.repartidorId = Number(repartidorId);
    asignacion.estado = EstadoAsignacion.ASIGNADO;
    const savedAsignacion = await this.asignacionRepo.save(asignacion);

    // 2. Set driver status to ocupado
    await this.actualizarDisponibilidad(repartidorId, EstadoRepartidor.OCUPADO);

    // 3. Update order status to CONFIRMADO
    pedido.estado = EstadoDelivery.CONFIRMADO;
    await this.pedidoRepo.save(pedido);

    // 4. Publish Redis event
    await this.redisService.publish('delivery.estado', {
      pedidoId: pedido.id,
      nuevoEstado: EstadoDelivery.CONFIRMADO,
      timestamp: new Date().toISOString(),
    });

    // 5. Log DynamoDB event
    await this.dynamoDbService.logEvent(pedido.id, 'REPARTIDOR_ASIGNADO', {
      repartidorId,
      asignacionId: savedAsignacion.id,
    });

    // 6. Send push notification to driver
    try {
      await this.notificacionesService.enviarNotificacion(
        repartidorId,
        '¡Nuevo Pedido Asignado!',
        `Se te ha asignado el pedido delivery #${pedido.id.substring(0, 8)}. ¡Dirígete a la tienda!`,
        { pedidoId: pedido.id },
      );
    } catch (err) {
      this.logger.warn(`Failed to send push notification to driver ${repartidorId}: ${err.message}`);
    }

    return savedAsignacion;
  }

  async liberarRepartidorPorPedido(pedidoId: string, isCompletado: boolean): Promise<void> {
    const asignacion = await this.asignacionRepo.findOne({
      where: { pedido: { id: pedidoId }, estado: EstadoAsignacion.ASIGNADO },
    });

    if (asignacion) {
      asignacion.estado = isCompletado ? EstadoAsignacion.COMPLETADO : EstadoAsignacion.RECHAZADO;
      if (isCompletado) {
        asignacion.completadoAt = new Date();
      } else {
        asignacion.rechazadoAt = new Date();
      }
      await this.asignacionRepo.save(asignacion);

      // Liberate driver
      await this.actualizarDisponibilidad(asignacion.repartidorId, EstadoRepartidor.DISPONIBLE);
      this.logger.log(`Driver ID ${asignacion.repartidorId} liberated from Pedido ${pedidoId}`);
    }
  }

  async obtenerAsignacionPorPedido(pedidoId: string): Promise<Asignacion | null> {
    return this.asignacionRepo.findOne({
      where: { pedido: { id: pedidoId } },
      order: { asignadoAt: 'DESC' },
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}