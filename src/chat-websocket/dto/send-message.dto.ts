import { IsInt, IsString, Min } from 'class-validator';

//для сохранения в таблице сообщений в базе данных

export class MessageEntityDTO {
  text!: string;
  chatId!: number;
  authorId!: string;
}

export class SendMessageDto {
  @IsString()
  text!: string;
}
