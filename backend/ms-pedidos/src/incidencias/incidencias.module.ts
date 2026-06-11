import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incidencia } from '../entities/incidencia.entity';
import { PedidoDelivery } from '../entities/pedido-delivery.entity';
import { IncidenciasService } from './incidencias.service';
import { IncidenciasController } from './incidencias.controller';
import { AsignacionModule } from '../asignacion/asignacion.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incidencia, PedidoDelivery]),
    AsignacionModule,
    NotificacionesModule,
  ],
  providers: [IncidenciasService],
  controllers: [IncidenciasController],
  exports: [IncidenciasService],
})
export class IncidenciasModule {}
