import { IsInt, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  name!: string;
  @IsString()
  email!: string;
  @IsString()
  @IsOptional()
  address?: string;
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @IsInt()
  age?: number;
}
