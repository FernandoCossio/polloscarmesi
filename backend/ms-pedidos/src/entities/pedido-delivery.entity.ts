import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DetallePedidoDelivery } from './detalle-pedido-delivery.entity';

export enum EstadoDelivery {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  EN_PREPARACION = 'EN_PREPARACION',
  EN_CAMINO = 'EN_CAMINO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

@Entity({ name: 'pedidos_delivery' })
export class PedidoDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cliente_id', type: 'bigint' })
  clienteId: number;

  @Column({ name: 'direccion_id', type: 'bigint', nullable: true })
  direccionId: number | null;

  @Column({
    type: 'enum',
    enum: EstadoDelivery,
    default: EstadoDelivery.PENDIENTE,
  })
  estado: EstadoDelivery;

  @Column({ name: 'direccion_entrega', type: 'text' })
  direccionEntrega: string;

  @Column({ type: 'text', nullable: true })
  referencia: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitud: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitud: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'tiempo_estimado', type: 'integer', nullable: true })
  tiempoEstimado: number | null;

  @Column({ name: 'evidencia_s3_key', type: 'text', nullable: true })
  evidenciaS3Key: string | null;

  @Column({ name: 'evidencia_url', type: 'text', nullable: true })
  evidenciaUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => DetallePedidoDelivery, (detalle) => detalle.pedido, { cascade: true })
  detalles: DetallePedidoDelivery[];
}
