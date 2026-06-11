import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'dispositivos_tokens' })
export class DispositivoToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ type: 'varchar', length: 50 })
  rol: string;

  @Column({ name: 'expo_push_token', type: 'varchar', length: 255, unique: true })
  expoPushToken: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  plataforma: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
