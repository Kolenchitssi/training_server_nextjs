import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  ParseFilePipeBuilder,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/common/guards/auth.guards';
import { PublicUser } from './user.service';

const uploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10);
// TODO: если появятся другие upload endpoint'ы, лимиты и fileType лучше вынести в files-домен (shared policy).
const AVATAR_MAX_FILE_SIZE_BYTES =
  (Number.isFinite(uploadSizeMb) && uploadSizeMb > 0 ? uploadSizeMb : 10) * 1024 * 1024;

// @UseGuards(AuthGuard) // Применяем guard для аутентификации ко всем маршрутам контроллера.
@ApiTags('User - Custom describe ') // Для swagger свой заголовок для группы запросов в контроллере но можно и без него
@Controller('user') // префикс маршрута. Сontroller - это декоратор, который определяет класс как контроллер и задает базовый путь для всех маршрутов внутри него.
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard)
  @Get('avatar')
  @ApiOperation({ summary: 'Получить URL аватара текущего пользователя' })
  @ApiBearerAuth('bearer')
  @ApiResponse({ status: 200, description: 'URL аватара получен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getAvatar(
    @Req() req: Request & { user: { id: string } },
  ): Promise<{ avatarUrl: string | null }> {
    return this.userService.getAvatar(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: {
        fileSize: AVATAR_MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  @ApiOperation({ summary: 'Загрузить аватар текущего пользователя' })
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['avatar'],
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Аватар успешно загружен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({
    status: 422,
    description: 'Невалидный формат файла или превышен размер',
  })
  async uploadAvatar(
    @Req() req: Request & { user: { id: string } },
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|png)$/ })
        .addMaxSizeValidator({ maxSize: AVATAR_MAX_FILE_SIZE_BYTES })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    avatar: any,
  ): Promise<{ avatarUrl: string }> {
    return this.userService.uploadAvatar(req.user.id, avatar);
  }

  @Get('all') // результирующий маршрут будет GET api/user/all
  // я думал будет конфликт с маршрутом GET /user/:id но все работает, так как NestJS сначала проверяет маршруты с конкретными путями, а затем с параметрами.
  //* для swager:
  @ApiOperation({ summary: 'Получить всех пользователей' }) // Описание операции для Swagger
  @ApiResponse({ status: 200, description: 'Список пользователей' }) // Описание ответа для Swagger
  async findAllUsers(): Promise<PublicUser[]> {
    return this.userService.getAllUsers();
  }

  @UseGuards(AuthGuard)
  @Get('favorites')
  @ApiOperation({ summary: 'Получить избранные посты текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Список избранных постов' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async getFavorites(
    // Здесь мы берем id текущего пользователя из request.user.id.
    // Это id добавляется в AuthGuard после проверки JWT, поэтому передавать его в body не нужно.
    @Req() req: Request & { user: { id: string } },
  ): Promise<ReturnType<UserService['getUserFavorites']>> {
    return this.userService.getUserFavorites(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get('profile') // результирующий маршрут GET api/user/profile
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя найден' })
  @ApiResponse({ status: 404, description: 'Профиль пользователя не найден' })
  async getProfile(
    // декоратор @Req() извлекает объект запроса из Express и позволяет получить текущего пользователя из него.
    @Req() req: Request & { user: { id: string } },
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<ReturnType<UserService['getUserProfile']>> {
    console.log('req:', req);
    return this.userService.getUserProfile(req.user.id, Number(page), Number(limit));
  }

  // 2й вариант когда получаем профиль пользователя по его ID, а не текущего пользователя.
  @UseGuards(AuthGuard)
  @Get('profile/:id') // результирующий маршрут GET api/user/profile/:id
  @ApiOperation({ summary: 'Получить профиль пользователя по ID' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя найден' })
  @ApiResponse({ status: 404, description: 'Профиль пользователя не найден' })
  async getUserProfileById(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<ReturnType<UserService['getUserProfile']>> {
    return this.userService.getUserProfile(id, Number(page), Number(limit));
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
