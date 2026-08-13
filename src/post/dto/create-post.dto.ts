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
	})
	@IsOptional()
	@IsBoolean({ message: 'Published must be a boolean value' })
	published?: boolean;

	@ApiPropertyOptional({
		example: '550e8400-e29b-41d4-a716-446655440000',
		description: 'ID автора поста',
	})
	@IsOptional()
	@IsUUID('4', { message: 'AuthorId must be a valid UUID v4' })
	authorId?: string;
}
