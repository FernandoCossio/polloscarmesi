import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import configuration from './config/configuration';
import { GatewayModule } from './gateway/gateway.module';
import { AuditModule } from './audit/audit.module';
import { GatewayService } from './gateway/gateway.service';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuthRestModule } from './auth-rest/auth-rest.module';
import { ProductosProxyController } from './productos-proxy.controller';

const logger = new Logger('AppModule');

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [GatewayModule, AuditModule],
      useFactory: async (gatewayService: GatewayService) => {
        // initialize() bloquea aquí hasta conectar con MS1,
        // así Apollo recibe el schema real desde el primer momento.
        await gatewayService.initialize();

        const schema = gatewayService.getSchema();
        logger.log(
          `Apollo registrando schema: ${Object.keys(schema.getQueryType()?.getFields() ?? {})}`,
        );

        return {
          schema,
          context: ({ req }) => ({ req }),
          playground: true,
          introspection: true,
          csrfPrevention: false,
        };
      },
      inject: [GatewayService],
    }),
    HttpModule,
    GatewayModule,
    AuditModule,
    AuthRestModule,
  ],
  controllers: [ProductosProxyController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}