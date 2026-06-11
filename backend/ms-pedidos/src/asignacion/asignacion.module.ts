import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asignacion } from '../entities/asignacion.entity';
import { RepartidorDisponibilidad } from '../entities/repartidor-disponibilidad.entity';
import { PedidoDelivery } from '../entities/pedido-delivery.entity';
import { AsignacionService } from './asignacion.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asignacion,
      RepartidorDisponibilidad,
      PedidoDelivery,
    ]),
    NotificacionesModule,
  ],
  providers: [AsignacionService],
  exports: [AsignacionService],
})
export class AsignacionModule {}
