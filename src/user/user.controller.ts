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
import { UserService } from './user.service';
import type { User } from './user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/common/guards/auth.guards';

// @UseGuards(AuthGuard) // Применяем guard для аутентификации ко всем маршрутам контроллера.
@Controller('user') // префикс маршрута. Сontroller - это декоратор, который определяет класс как контроллер и задает базовый путь для всех маршрутов внутри него.
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('all') // результирующий маршрут будет GET api/user/all
  // я думал будет конфликт с маршрутом GET /user/:id но все работает, так как NestJS сначала проверяет маршруты с конкретными путями, а затем с параметрами.
  findAllUsers(): User[] {
    return this.userService.getAllUsers();
  }

  @UseGuards(AuthGuard) // Применяем guard для аутентификации только к маршруту получения пользователя по ID.
  @Get(':id') // результирующий маршрут  GET api/user/:id
  // @Param('id') id: string - это декоратор, извлекает параметр id из маршрута и передает его в метод findUserById.
  findUserById(@Param('id') id: string): User | undefined {
    return this.userService.getUserById(id);
  }

  @Post() // результирующий маршрут  POST api/user
  createUser(@Body() dto: CreateUserDto): User {
    return this.userService.createUser(dto);
  }

  @Put(':id') // результирующий маршрут PUT api/user/:id
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto): User {
    return this.userService.updateUser(id, dto);
  }

  @Patch(':id') //  маршрут PATCH api/user/:id
  partialUpdateUser(@Param('id') id: string, @Body() dto: Partial<UpdateUserDto>): User {
    return this.userService.partialUpdateUser(id, dto);
  }

  // Применяем guard для аутентификации только к маршруту удаления пользователя.
  @UseGuards(AuthGuard)
  @Delete(':id') //  маршрут  DELETE api/user/:id
  deleteUser(@Param('id') id: string): User {
    return this.userService.deleteUser(id);
  }
}
