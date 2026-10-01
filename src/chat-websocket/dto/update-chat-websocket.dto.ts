import { PartialType } from '@nestjs/mapped-types';
import { CreateChatWebsocketDto } from './create-chat-websocket.dto';

export class UpdateChatWebsocketDto extends PartialType(CreateChatWebsocketDto) {
  id!: number;
}
