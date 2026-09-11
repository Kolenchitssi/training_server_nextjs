import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'How to learn NestJS effectively',
    description: 'Заголовок поста',
    type: String,
  })
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(120, { message: 'Title must be at most 120 characters long' })
  title!: string;

  @ApiPropertyOptional({
    example: 'Start with modules, providers and controllers.',
    description: 'Текст поста',
  })
  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  content?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Опубликован ли пост',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean({ message: 'Published must be a boolean value' })
  published?: boolean;

  @ApiPropertyOptional({
    example: 'fbcebc6b-2864-41d1-a6e4-dc5dd3041c3d',
    description: 'ID автора поста',
  })
  @IsOptional()
  @IsUUID('4', { message: 'AuthorId must be a valid UUID v4' })
  authorId?: string;

  @ApiPropertyOptional({
    example: 'posts/7-sample.jpg',
    description: 'Относительный путь к картинке поста',
  })
  @IsOptional()
  @IsString({ message: 'ImagePath must be a string' })
  imagePath?: string;
}
