import { Injectable } from '@nestjs/common';
import { CreateChatWebsocketDto } from './dto/create-chat-websocket.dto';
import { UpdateChatWebsocketDto } from './dto/update-chat-websocket.dto';

@Injectable()
export class ChatWebsocketService {
  create(createChatWebsocketDto: CreateChatWebsocketDto) {
    return 'This action adds a new chatWebsocket';
  }

  findAll() {
    return `This action returns all chatWebsocket`;
  }

  findOne(id: number) {
    return `This action returns a #${id} chatWebsocket`;
  }

  update(id: number, updateChatWebsocketDto: UpdateChatWebsocketDto) {
    return `This action updates a #${id} chatWebsocket`;
  }

  remove(id: number) {
    return `This action removes a #${id} chatWebsocket`;
  }
}
