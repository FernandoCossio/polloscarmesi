import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

export enum EstadoRepartidor {
  DISPONIBLE = 'DISPONIBLE',
  OCUPADO = 'OCUPADO',
  OFFLINE = 'OFFLINE',
}

@Entity({ name: 'repartidores_disponibilidad' })
export class RepartidorDisponibilidad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'repartidor_id', type: 'bigint', unique: true })
  repartidorId: number;

  @Column({
    type: 'enum',
    enum: EstadoRepartidor,
    default: EstadoRepartidor.OFFLINE,
  })
  estado: EstadoRepartidor;

  @Column({ name: 'latitud_actual', type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitudActual: number;

  @Column({ name: 'longitud_actual', type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitudActual: number;

  @UpdateDateColumn({ name: 'ultima_actualizacion' })
  ultimaActualizacion: Date;
}
