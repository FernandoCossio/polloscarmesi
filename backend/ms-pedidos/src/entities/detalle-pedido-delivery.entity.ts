import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PedidoDelivery } from './pedido-delivery.entity';

@Entity({ name: 'detalle_pedidos_delivery' })
export class DetallePedidoDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PedidoDelivery, (pedido) => pedido.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: PedidoDelivery;

  @Column({ name: 'producto_id', type: 'bigint' })
  productoId: number;

  @Column({ name: 'nombre_producto', type: 'varchar', length: 255 })
  nombreProducto: string;

  @Column({ type: 'integer' })
  cantidad: number;

  @Column({ name: 'precio_unitario', type: 'decimal', precision: 10, scale: 2 })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;
}
