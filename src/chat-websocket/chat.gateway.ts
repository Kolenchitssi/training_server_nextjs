import {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { ChatWebsocketService as ChatService } from './chat-websocket.service';

import { Server, Socket } from 'socket.io';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  constructor(private readonly ChatService: ChatService) {}

  afterInit(server: Server) {
    // Логика после инициализации веб-сокета
    console.log('WebSocket server initialized', server);
  }

  handleConnection(client: Socket, ...args: any[]) {
    // Логика при подключении клиента
    console.log('Client connected', client.id);
  }

  handleDisconnect(client: Socket) {
    // Логика при отключении клиента
    console.log('Client disconnected', client.id);
  }

  // SubscribeMessage - это декоратор, который позволяет подписываться на определенные события веб-сокета
  @SubscribeMessage('sendMessage') // 'sendMessage' - это название события, на которое подписан сервер
  async handleMessage(client: Socket, @MessageBody() dto: SendMessageDto) {
    console.log('Received message from client', client.id, dto);
    const { text } = dto;
    this.server.emit('messages', text);
    // первый параметр это название события (event), второй - данные события
  }
}
