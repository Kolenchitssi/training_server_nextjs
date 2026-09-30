import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { ChatWebsocketService as ChatService } from './chat-websocket.service';
import { CreateChatWebsocketDto } from './dto/create-chat-websocket.dto';
import { UpdateChatWebsocketDto } from './dto/update-chat-websocket.dto';

@WebSocketGateway()
export class ChatWebsocketGateway {
  constructor(private readonly ChatService: ChatService) {}

  @SubscribeMessage('createChatWebsocket')
  create(@MessageBody() createChatWebsocketDto: CreateChatWebsocketDto) {
    return this.ChatService.create(createChatWebsocketDto);
  }

  @SubscribeMessage('findAllChatWebsocket')
  findAll() {
    return this.ChatService.findAll();
  }

  @SubscribeMessage('findOneChatWebsocket')
  findOne(@MessageBody() id: number) {
    return this.ChatService.findOne(id);
  }

  @SubscribeMessage('updateChatWebsocket')
  update(@MessageBody() updateChatWebsocketDto: UpdateChatWebsocketDto) {
    return this.ChatService.update(updateChatWebsocketDto.id, updateChatWebsocketDto);
  }

  @SubscribeMessage('removeChatWebsocket')
  remove(@MessageBody() id: number) {
    return this.ChatService.remove(id);
  }
}
