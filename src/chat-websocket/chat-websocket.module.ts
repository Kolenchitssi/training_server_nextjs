import { Module } from '@nestjs/common';
import { ChatWebsocketService } from './chat-websocket.service';
import { ChatWebsocketGateway } from './chat-websocket.gateway';
import { ChatGateway } from './chat.gateway';

@Module({
  providers: [/* ChatWebsocketGateway */ ChatGateway, ChatWebsocketService],
})
export class ChatWebsocketModule {}
