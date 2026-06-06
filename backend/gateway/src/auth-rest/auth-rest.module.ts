import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthRestService } from './auth-rest.service';
import { AuthRestController } from './auth-rest.controller';

@Module({
  imports: [HttpModule],
  controllers: [AuthRestController],
  providers: [AuthRestService],
})
export class AuthRestModule {}
