import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayService } from './gateway.service';
import { AuthRestModule } from '../auth-rest/auth-rest.module';

@Module({
  imports: [ConfigModule, AuthRestModule],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}
