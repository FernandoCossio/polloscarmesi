import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PedidoDelivery } from './pedido-delivery.entity';

@Entity({ name: 'incidencias' })
export class Incidencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PedidoDelivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: PedidoDelivery;

  @Column({ name: 'repartidor_id', type: 'bigint' })
  repartidorId: number;

  @Column({ type: 'varchar', length: 100 })
  tipo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
