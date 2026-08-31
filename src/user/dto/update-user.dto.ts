import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Имя пользователя', //показывавается в schemas в самом низу  после запросов
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Электронная почта пользователя',
  })
  @IsString()
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Пароль пользователя',
  })
  @IsString()
  password!: string;

  @ApiPropertyOptional({
    example: '123 Main St, Springfield',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 30,
  })
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @IsInt()
  age?: number;
}
