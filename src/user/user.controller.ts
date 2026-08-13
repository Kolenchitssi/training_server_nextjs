import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/common/guards/auth.guards';
import { PublicUser } from './user.service';

// @UseGuards(AuthGuard) // Применяем guard для аутентификации ко всем маршрутам контроллера.
@ApiTags('User - Custom describe ') // Для swagger свой заголовок для группы запросов в контроллере но можно и без него
@Controller('user') // префикс маршрута. Сontroller - это декоратор, который определяет класс как контроллер и задает базовый путь для всех маршрутов внутри него.
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('all') // результирующий маршрут будет GET api/user/all
  // я думал будет конфликт с маршрутом GET /user/:id но все работает, так как NestJS сначала проверяет маршруты с конкретными путями, а затем с параметрами.
  //* для swager:
  @ApiOperation({ summary: 'Получить всех пользователей' }) // Описание операции для Swagger
  @ApiResponse({ status: 200, description: 'Список пользователей' }) // Описание ответа для Swagger
  async findAllUsers(): Promise<PublicUser[]> {
    return this.userService.getAllUsers();
  }

  @UseGuards(AuthGuard) // Применяем guard для аутентификации только к маршруту получения пользователя по ID.
  @Get(':id') // результирующий маршрут  GET api/user/:id
  @ApiOperation({ summary: 'Получить пользователя по ID' }) // Описание операции для Swagger
  @ApiResponse({ status: 200, description: 'Пользователь найден' }) // Описание ответа для Swagger
  @ApiResponse({ status: 404, description: 'Пользователь не найден' }) // Описание ответа для Swagger на случай, если пользователь не найден
  //ниже @Param('id') id: string - это декоратор, извлекает параметр id из маршрута и передает его в метод findUserById.
  async findUserById(@Param('id') id: string): Promise<PublicUser> {
    return this.userService.getUserById(id);
  }

  @ApiOperation({ summary: 'Создать нового пользователя' })
  @Post() // результирующий маршрут  POST api/user
  async createUser(@Body() dto: CreateUserDto): Promise<PublicUser> {
    return this.userService.createUser(dto);
  }

  @Put(':id') // результирующий маршрут PUT api/user/:id
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<PublicUser> {
    return this.userService.updateUser(id, dto);
  }

  @Patch(':id') //  маршрут PATCH api/user/:id
  async partialUpdateUser(
    @Param('id') id: string,
    @Body() dto: Partial<UpdateUserDto>,
  ): Promise<PublicUser> {
    return this.userService.partialUpdateUser(id, dto);
  }

  // Применяем guard для аутентификации только к маршруту удаления пользователя.
  @UseGuards(AuthGuard)
  @Delete(':id') //  маршрут  DELETE api/user/:id
  async deleteUser(@Param('id') id: string): Promise<PublicUser> {
    return this.userService.deleteUser(id);
  }
}
