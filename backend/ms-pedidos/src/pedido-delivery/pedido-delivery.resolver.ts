import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { ConfigService } from '@nestjs/config';
import { PedidoDeliveryService } from './pedido-delivery.service';
import { AsignacionService } from '../asignacion/asignacion.service';
import { PedidoDelivery, EstadoDelivery } from '../entities/pedido-delivery.entity';
import { RepartidorDisponibilidad } from '../entities/repartidor-disponibilidad.entity';

@Resolver('PedidoDelivery')
export class PedidoDeliveryResolver {
  constructor(
    private readonly pedidoService: PedidoDeliveryService,
    private readonly asignacionService: AsignacionService,
    private readonly configService: ConfigService,
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

  private async getRepartidorInfo(repartidorId: number, disponible: boolean, coordenadasActuales: string | null): Promise<any> {
    const defaultMock = {
      id: repartidorId.toString(),
      nombre: `Repartidor #${repartidorId}`,
      disponible,
      coordenadasActuales,
      telefono: null as string | null,
    };

    try {
      const authUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:8081';
      const response = await fetch(`${authUrl}/auth/usuarios/${repartidorId}`);
      if (response.ok) {
        const json = await response.json();
        const usuario = json?.data;
        if (usuario) {
          return {
            id: repartidorId.toString(),
            nombre: usuario.nombreCompleto || `Repartidor #${repartidorId}`,
            disponible,
            coordenadasActuales,
            telefono: usuario.telefono || null,
          };
        }
      }
      return defaultMock;
    } catch (err: any) {
      console.warn('Error conectando al microservicio de Auth, usando fallback mock:', err.message);
      let fallbackTelefono: string | null = null;
      let fallbackNombre = `Repartidor #${repartidorId}`;
      if (repartidorId.toString() === '4') {
        fallbackTelefono = '59171355794';
        fallbackNombre = 'Usuario Repartidor (Principal)';
      } else if (repartidorId.toString() === '2') {
        fallbackTelefono = '59178945612';
        fallbackNombre = 'Pedro Cajero (Cajero / Soporte)';
      }
      return {
        ...defaultMock,
        nombre: fallbackNombre,
        telefono: fallbackTelefono,
      };
    }
  }

  @Query('obtenerRepartidoresDisponibles')
  async obtenerRepartidoresDisponibles(): Promise<any[]> {
    const drivers = await this.asignacionService.obtenerRepartidoresDisponibles();
    return Promise.all(
      drivers.map(async (driver) => {
        const coords = driver.latitudActual && driver.longitudActual 
          ? `${driver.latitudActual},${driver.longitudActual}` 
          : null;
        return this.getRepartidorInfo(
          driver.repartidorId,
          driver.estado === 'DISPONIBLE',
          coords
        );
      })
    );
  }

  @Query('obtenerRepartidor')
  async obtenerRepartidor(@Args('id') id: string): Promise<any> {
    const driver = await this.asignacionService.obtenerRepartidor(Number(id));
    const coords = driver.latitudActual && driver.longitudActual 
      ? `${driver.latitudActual},${driver.longitudActual}` 
      : null;
    return this.getRepartidorInfo(
      driver.repartidorId,
      driver.estado === 'DISPONIBLE',
      coords
    );
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

    let disponible = false;
    let coordenadasActuales: string | null = null;
    try {
      const driver = await this.asignacionService.obtenerRepartidor(Number(assignment.repartidorId));
      disponible = driver.estado === 'DISPONIBLE';
      coordenadasActuales = driver.latitudActual && driver.longitudActual 
        ? `${driver.latitudActual},${driver.longitudActual}` 
        : null;
    } catch (e) {
      // Ignorar fallo de consulta local de disponibilidad
    }

    return this.getRepartidorInfo(
      Number(assignment.repartidorId),
      disponible,
      coordenadasActuales
    );
  }

  @ResolveField('clienteNombre')
  async clienteNombre(@Parent() pedido: PedidoDelivery): Promise<string> {
    try {
      const authUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:8081';
      const response = await fetch(`${authUrl}/auth/usuarios/${pedido.clienteId}`);
      if (response.ok) {
        const json = await response.json();
        return json?.data?.nombreCompleto || `Cliente #${pedido.clienteId}`;
      }
    } catch (err: any) {
      console.warn('Error al obtener nombre del cliente desde Auth:', err.message);
    }
    return `Cliente #${pedido.clienteId}`;
  }

  @ResolveField('clienteTelefono')
  async clienteTelefono(@Parent() pedido: PedidoDelivery): Promise<string | null> {
    try {
      const authUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:8081';
      const response = await fetch(`${authUrl}/auth/usuarios/${pedido.clienteId}`);
      if (response.ok) {
        const json = await response.json();
        return json?.data?.telefono || null;
      }
    } catch (err: any) {
      console.warn('Error al obtener teléfono del cliente desde Auth:', err.message);
    }
    
    // Fallback de desarrollo para pruebas del parcial
    if (pedido.clienteId.toString() === '1') {
      return '59171234567'; // Cliente #1
    }
    return null;
  }
}
