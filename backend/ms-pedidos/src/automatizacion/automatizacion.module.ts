import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoDelivery } from '../entities/pedido-delivery.entity';
import { AutomatizacionService } from './automatizacion.service';
import { AutomatizacionController } from './automatizacion.controller';
import { Ms1GraphqlClient } from '../graphql/client/ms1-graphql.client';

@Module({
  imports: [TypeOrmModule.forFeature([PedidoDelivery])],
  providers: [AutomatizacionService, Ms1GraphqlClient],
  controllers: [AutomatizacionController],
  exports: [AutomatizacionService],
})
export class AutomatizacionModule {}
