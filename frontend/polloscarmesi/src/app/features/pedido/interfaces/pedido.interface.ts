import { Producto } from '../../producto/interfaces/producto.interface';

export type TipoPedido = 'PRESENCIAL' | 'DELIVERY';

export type EstadoPedido = 
  | 'PENDIENTE'
  | 'CONFIRMADO'
  | 'EN_PREPARACION'
  | 'EN_CAMINO'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type MetodoPago = 'EFECTIVO' | 'QR';

export type EstadoPago = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'REVISION_MANUAL';

export interface DetallePedidoInput {
  productoId: string | number;
  cantidad: number;
}

export interface PedidoInput {
  tipo: TipoPedido;
  descuento?: number;
  clienteId?: string | number;
  detalles: DetallePedidoInput[];
}

export interface DetallePedido {
  id?: string | number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string | number;
  numeroFicha: string;
  tipo: TipoPedido;
  estado: EstadoPedido;
  subtotal: number;
  descuento: number;
  total: number;
  tiempoEstimadoPreparacion?: number;
  clienteId?: string | number;
  motivoCancelacion?: string;
  detalles: DetallePedido[];
  fechaCreacion?: string;
}

export interface PagoInput {
  pedidoId: string | number;
  metodo: MetodoPago;
  montoRecibido: number;
}

export interface Pago {
  id: string | number;
  pedidoId: string | number;
  metodo: MetodoPago;
  estado: EstadoPago;
  montoRecibido: number;
  montoTotal: number;
  cambio: number;
  comprobanteUrl?: string;
  txHash?: string;
  fechaCreacion: string;
}
