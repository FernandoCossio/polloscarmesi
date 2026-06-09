import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { PedidoDeliveryService } from './pedido-delivery.service';
import { AsignacionService } from '../asignacion/asignacion.service';
import { PedidoDelivery, EstadoDelivery } from '../entities/pedido-delivery.entity';
import { RepartidorDisponibilidad } from '../entities/repartidor-disponibilidad.entity';

@Resolver('PedidoDelivery')
export class PedidoDeliveryResolver {
  constructor(
    private readonly pedidoService: PedidoDeliveryService,
    private readonly asignacionService: AsignacionService,
  ) {}

  @Query('obtenerPedidoDelivery')
  async obtenerPedidoDelivery(@Args('id') id: string): Promise<PedidoDelivery> {
    return this.pedidoService.obtenerPedido(id);
  }

  @Query('obtenerPedidosDeliveryPorCliente')
  async obtenerPedidosDeliveryPorCliente(@Args('clienteId') clienteId: string): Promise<PedidoDelivery[]> {
    return this.pedidoService.obtenerPedidosPorCliente(Number(clienteId));
  }

  @Query('obtenerPedidosDeliverySinAsignar')
  async obtenerPedidosDeliverySinAsignar(): Promise<PedidoDelivery[]> {
    return this.pedidoService.obtenerPedidosSinAsignar();
  }

  @Query('obtenerPedidosPorRepartidor')
  async obtenerPedidosPorRepartidor(@Args('repartidorId') repartidorId: string): Promise<PedidoDelivery[]> {
    return this.pedidoService.obtenerPedidosPorRepartidor(Number(repartidorId));
  }

  @Query('obtenerPedidosDeliveryPorFecha')
  async obtenerPedidosDeliveryPorFecha(@Args('fecha') fecha: string): Promise<PedidoDelivery[]> {
    return this.pedidoService.obtenerPedidosPorFecha(fecha);
  }

  @Query('obtenerRepartidoresDisponibles')
  async obtenerRepartidoresDisponibles(): Promise<RepartidorDisponibilidad[]> {
    return this.asignacionService.obtenerRepartidoresDisponibles();
  }

  @Query('obtenerRepartidor')
  async obtenerRepartidor(@Args('id') id: string): Promise<RepartidorDisponibilidad> {
    return this.asignacionService.obtenerRepartidor(Number(id));
  }

  @Query('obtenerResumenDeliveryDia')
  async obtenerResumenDeliveryDia(@Args('fecha') fecha: string): Promise<any> {
    return this.pedidoService.obtenerResumenDeliveryDia(fecha);
  }

  @Mutation('crearPedidoDelivery')
  async crearPedidoDelivery(@Args('input') input: any): Promise<PedidoDelivery> {
    return this.pedidoService.crearPedido(input);
  }

  @Mutation('asignarRepartidor')
  async asignarRepartidor(
    @Args('pedidoId') pedidoId: string,
    @Args('repartidorId') repartidorId: string,
  ): Promise<PedidoDelivery> {
    const pedido = await this.pedidoService.obtenerPedido(pedidoId);
    await this.asignacionService.crearAsignacionDirecta(pedido, Number(repartidorId));
    return this.pedidoService.obtenerPedido(pedidoId);
  }

  @Mutation('actualizarEstadoDelivery')
  async actualizarEstadoDelivery(
    @Args('pedidoId') pedidoId: string,
    @Args('estado') estado: EstadoDelivery,
  ): Promise<PedidoDelivery> {
    return this.pedidoService.actualizarEstado(pedidoId, estado);
  }

  @ResolveField('coordenadasEntrega')
  coordenadasEntrega(@Parent() pedido: PedidoDelivery): string | null {
    if (pedido.latitud && pedido.longitud) {
      return `${pedido.latitud},${pedido.longitud}`;
    }
    return null;
  }

  @ResolveField('evidenciaEntregaUrl')
  evidenciaEntregaUrl(@Parent() pedido: PedidoDelivery): string | null {
    return pedido.evidenciaUrl;
  }

  @ResolveField('fechaCreacion')
  fechaCreacion(@Parent() pedido: PedidoDelivery): string {
    return pedido.createdAt instanceof Date ? pedido.createdAt.toISOString() : String(pedido.createdAt);
  }

  @ResolveField('fechaEntrega')
  async fechaEntrega(@Parent() pedido: PedidoDelivery): Promise<string | null> {
    const assignment = await this.asignacionService.obtenerAsignacionPorPedido(pedido.id);
    if (assignment && assignment.completadoAt) {
      return assignment.completadoAt instanceof Date ? assignment.completadoAt.toISOString() : String(assignment.completadoAt);
    }
    return null;
  }

  @ResolveField('repartidorAsignado')
  async repartidorAsignado(@Parent() pedido: PedidoDelivery): Promise<any> {
    const assignment = await this.asignacionService.obtenerAsignacionPorPedido(pedido.id);
    if (!assignment) {
      return null;
    }
    try {
      const driver = await this.asignacionService.obtenerRepartidor(Number(assignment.repartidorId));
      return {
        id: driver.repartidorId.toString(),
        nombre: `Repartidor #${driver.repartidorId}`,
        disponible: driver.estado === 'DISPONIBLE',
        coordenadasActuales: driver.latitudActual && driver.longitudActual 
          ? `${driver.latitudActual},${driver.longitudActual}` 
          : null,
      };
    } catch (err) {
      return {
        id: assignment.repartidorId.toString(),
        nombre: `Repartidor #${assignment.repartidorId}`,
        disponible: false,
        coordenadasActuales: null,
      };
    }
  }
}
