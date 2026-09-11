import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class DeleteImagesDto {
  @ApiProperty({
    example: [
      'f8b6c3a7-5f2d-4f80-a4b0-2b2e6d6e95d7.jpg',
      '0f9812b0-5d6e-4b4b-b9d3-8eb2aef0031f.png',
    ],
    description: 'Список имен файлов для удаления',
    type: [String],
  })
  @IsArray({ message: 'files должен быть массивом строк' })
  @ArrayMinSize(1, { message: 'Нужен хотя бы один файл для удаления' })
  @IsString({ each: true, message: 'Каждый элемент files должен быть строкой' })
  files!: string[];

  @ApiPropertyOptional({
    example: 'img',
    description: 'Папка внутри uploads (по умолчанию products)',
  })
  @IsOptional()
  @IsString({ message: 'folder должен быть строкой' })
  folder?: string;
}
