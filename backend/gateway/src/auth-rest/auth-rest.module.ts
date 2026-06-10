import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthRestService } from './auth-rest.service';
import { AuthRestController } from './auth-rest.controller';
import { InternalServiceAuthService } from './internal-service-auth.service';

@Module({
  imports: [HttpModule],
  controllers: [AuthRestController],
  providers: [
    AuthRestService,
    InternalServiceAuthService,
  ],
  exports: [
    AuthRestService,
    InternalServiceAuthService,
  ],
})
export class AuthRestModule {}
