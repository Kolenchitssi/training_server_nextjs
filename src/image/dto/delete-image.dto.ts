import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteImageDto {
  @ApiProperty({
    example: 'f8b6c3a7-5f2d-4f80-a4b0-2b2e6d6e95d7.jpg',
    description: 'Имя файла для удаления',
  })
  @IsString({ message: 'file должен быть строкой' })
  @IsNotEmpty({ message: 'file не должен быть пустым' })
  file!: string;

  @ApiPropertyOptional({
    example: 'img',
    description: 'Папка внутри uploads (по умолчанию images)',
  })
  @IsOptional()
  @IsString({ message: 'folder должен быть строкой' })
  folder?: string;
}
