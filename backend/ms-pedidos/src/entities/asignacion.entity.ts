import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PedidoDelivery } from './pedido-delivery.entity';

export enum EstadoAsignacion {
  ASIGNADO = 'ASIGNADO',
  COMPLETADO = 'COMPLETADO',
  RECHAZADO = 'RECHAZADO',
}

@Entity({ name: 'asignaciones' })
export class Asignacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PedidoDelivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: PedidoDelivery;

  @Column({ name: 'repartidor_id', type: 'bigint' })
  repartidorId: number;

  @Column({
    type: 'enum',
    enum: EstadoAsignacion,
    default: EstadoAsignacion.ASIGNADO,
  })
  estado: EstadoAsignacion;

  @Column({ name: 'motivo_rechazo', type: 'text', nullable: true })
  motivoRechazo: string;

  @CreateDateColumn({ name: 'asignado_at' })
  asignadoAt: Date;

  @Column({ name: 'completado_at', type: 'timestamp', nullable: true })
  completadoAt: Date;

  @Column({ name: 'rechazado_at', type: 'timestamp', nullable: true })
  rechazadoAt: Date;
}
