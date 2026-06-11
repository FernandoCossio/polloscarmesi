import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Ms1GraphqlClient } from '../graphql/client/ms1-graphql.client';

@Module({
  controllers: [ChatController],
  providers: [ChatService, Ms1GraphqlClient],
})
export class ChatModule {}
