import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import configuration from './config/configuration';

import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

// Entities
import { PedidoDelivery } from './entities/pedido-delivery.entity';
import { DetallePedidoDelivery } from './entities/detalle-pedido-delivery.entity';
import { Asignacion } from './entities/asignacion.entity';
import { RepartidorDisponibilidad } from './entities/repartidor-disponibilidad.entity';
import { Incidencia } from './entities/incidencia.entity';
import { DispositivoToken } from './entities/dispositivo-token.entity';

// Feature Modules
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { AsignacionModule } from './asignacion/asignacion.module';
import { TrackingModule } from './tracking/tracking.module';
import { IncidenciasModule } from './incidencias/incidencias.module';
import { AutomatizacionModule } from './automatizacion/automatizacion.module';
import { PedidoDeliveryModule } from './pedido-delivery/pedido-delivery.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        entities: [
          PedidoDelivery,
          DetallePedidoDelivery,
          Asignacion,
          RepartidorDisponibilidad,
          Incidencia,
          DispositivoToken,
        ],
        synchronize: true,
        ssl: config.get<boolean>('database.ssl')
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ['./**/*.graphqls'],
      playground: true,
    }),

    // Local modules
    InfrastructureModule,
    NotificacionesModule,
    AsignacionModule,
    TrackingModule,
    IncidenciasModule,
    AutomatizacionModule,
    PedidoDeliveryModule,
    ChatModule,
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
