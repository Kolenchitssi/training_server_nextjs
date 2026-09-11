import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @ApiPropertyOptional({
    example: ['d9b3a4a0-7f2a-4a2a-b28f-7cbfa83e9b11'],
    description: 'Массив ID картинок (PostImage), которые необходимо удалить при обновлении поста',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'removeImageIds must be an array' })
  @IsUUID('4', { each: true, message: 'Each image ID must be a valid UUID v4' })
  removeImageIds?: string[];

  @ApiPropertyOptional({
    example: null,
    description: 'Путь к картинке поста (или null для очистки)',
  })
  @IsOptional()
  @IsString({ message: 'ImagePath must be a string or null' })
  declare imagePath?: string | null;
}
