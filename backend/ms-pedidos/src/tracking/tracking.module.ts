import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoDelivery } from '../entities/pedido-delivery.entity';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';
import { AsignacionModule } from '../asignacion/asignacion.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PedidoDelivery]),
    AsignacionModule,
    NotificacionesModule,
  ],
  providers: [TrackingService],
  controllers: [TrackingController],
  exports: [TrackingService],
})
export class TrackingModule {}
