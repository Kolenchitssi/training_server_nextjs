import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { StartWith } from '../decorators/start-with.decorator';

export enum UserTags {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

export class CreateUserDto {
  @IsString() // декоратор @IsString() из библиотеки class-validator, который проверяет, что значение свойства является строкой.
  @IsNotEmpty() // декоратор проверяет, что значение свойства не является пустым.
  @MinLength(6) // декоратор проверяет, что длина строки не меньше 6 символов.
  @MaxLength(20) // декоратор проверяет, что длина строки не больше 20 символов.
  @StartWith('Mr.', { message: 'Name must start with "Mr."' })
  name!: string;

  @IsString({ message: 'Email must be a string' }) // кастомное сообщение об ошибке, которое будет возвращено, если значение свойства не является строкой.
  @IsNotEmpty()
  @IsEmail() // декоратор проверяет, что значение свойства является корректным email-адресом.
  @Length(6, 20) // декоратор проверяет, что длина строки не меньше 6 и не больше 20 символов.
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/, {
    message: 'Password must contain at least one letter and one number',
  }) // декоратор проверяет, что значение свойства соответствует регулярному выражению.
  password!: string;

  @IsString({ message: 'Address must be a string' }) // кастомное сообщение об ошибке, которое будет возвращено, если значение свойства не является строкой.
  @IsOptional() // декоратор проверяет, что значение свойства является необязательным.
  address?: string; // необязательное свойство, которое может быть строкой или undefined.

  @IsOptional()
  @IsNumber({}, { message: 'Age must be a number' }) // кастомное сообщение об ошибке, которое будет возвращено, если значение свойства не является числом.
  @IsInt({ message: 'Age must be a int number' }) // кастомное сообщение об ошибке, которое будет возвращено, если значение свойства не является целым числом.
  @IsPositive() // декоратор проверяет, что значение свойства является положительным числом.
  age?: number;

  @IsArray({ message: 'Tags must be an array' }) // кастомное сообщение об ошибке, которое будет возвращено, если значение свойства не является массивом.
  @IsOptional() // декоратор проверяет, что значение свойства является необязательным.
  @IsString({ each: true, message: 'Each tag must be a string' }) // декоратор проверяет, что каждый элемент массива является строкой.
  @IsEnum(UserTags, { each: true, message: 'Each tag must be a valid enum value' }) // декоратор проверяет, что каждый элемент массива является допустимым значением перечисления.
  tags?: string[]; // необязательное свойство, которое может быть массивом строк или undefined.
}
