import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { GatewayModule } from './gateway/gateway.module';
import { AuditModule } from './audit/audit.module';
import { GatewayService } from './gateway/gateway.service';
import { AuditInterceptor } from './audit/audit.interceptor';
import { AuthRestModule } from './auth-rest/auth-rest.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [GatewayModule, AuthModule, AuditModule],
      useFactory: (gatewayService: GatewayService) => ({
        schema: gatewayService.getSchema(),
        context: ({ req }) => ({ req }),
        playground: true,
        introspection: true,
      }),
      inject: [GatewayService],
    }),
    AuthModule,
    GatewayModule,
    AuditModule,
    AuthRestModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
