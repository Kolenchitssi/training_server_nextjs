import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

export class ChatService {
  constructor(private readonly prismaService: PrismaService) {}
  async sendMessage(authorId: string, dto: SendMessageDto) {
    const { text } = dto;
    const message = await this.prismaService.chatMessage.create({
      data: {
				authorId,
        text,
      },
    });
    return message;
  }
}
