import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoDelivery } from '../entities/pedido-delivery.entity';
import { DetallePedidoDelivery } from '../entities/detalle-pedido-delivery.entity';
import { Incidencia } from '../entities/incidencia.entity';
import { PedidoDeliveryService } from './pedido-delivery.service';
import { PedidoDeliveryController } from './pedido-delivery.controller';
import { PedidoDeliveryResolver } from './pedido-delivery.resolver';
import { AsignacionModule } from '../asignacion/asignacion.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PedidoDelivery, DetallePedidoDelivery, Incidencia]),
    AsignacionModule,
    NotificacionesModule,
  ],
  controllers: [PedidoDeliveryController],
  providers: [PedidoDeliveryService, PedidoDeliveryResolver],
  exports: [PedidoDeliveryService],
})
export class PedidoDeliveryModule {}
