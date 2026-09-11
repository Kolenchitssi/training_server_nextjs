import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ImageService } from './image.service';
import { AuthGuard } from 'src/common/guards/auth.guards';
import { DeleteImageDto } from './dto/delete-image.dto';
import { DeleteImagesDto } from './dto/delete-images.dto';

@ApiTags('Image')
@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @HttpCode(200) // Устанавливаем код ответа 200 OK
  @UseGuards(AuthGuard) // применяем guard для защиты маршрута
  @ApiBearerAuth('bearer') // Указываем, что маршрут требует Bearer токен для авторизации
  @ApiOperation({ summary: 'Загрузить одно изображение с ресайзом' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'folder',
    required: false,
    description:
      'Папка внутри uploads для сохранения файла (по умолчанию images-resized)',
    schema: { type: 'string', example: 'avatars' },
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Изображение успешно загружено',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'f8b6c3a7-5f2d-4f80-a4b0-2b2e6d6e95d7.jpg' },
        url: {
          type: 'string',
          example: '/images-resized/f8b6c3a7-5f2d-4f80-a4b0-2b2e6d6e95d7.jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Невалидный файл изображения' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @UseInterceptors(FileInterceptor('file')) // используем FileInterceptor для обработки загружаемого файла
  // Эндпоинт POST /api/image/single:
  // Сохраняет одиночное изображение с ресайзом (320x240) на диск.
  // Обратите внимание: этот метод не привязывает файл к пользователю и не обновляет поле avatarPath.
  // Для сохранения аватара конкретного пользователя (связь 1-к-1) используется эндпоинт POST /api/user/avatar.
  @Post('single')
  async saveImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    return await this.imageService.saveImage(file, folder);
  }

  @HttpCode(200) // Устанавливаем код ответа 200 OK
  @UseGuards(AuthGuard) // применяем guard для защиты маршрута
  @ApiBearerAuth('bearer') // Указываем, что маршрут требует Bearer токен для авторизации
  @ApiOperation({ summary: 'Загрузить несколько изображений' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Папка внутри uploads для сохранения файлов (по умолчанию img)',
    schema: { type: 'string', example: 'img' },
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'],
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Изображения успешно загружены',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'f8b6c3a7-5f2d-4f80-a4b0-2b2e6d6e95d7.jpg' },
          url: {
            type: 'string',
            example: '/img/f8b6c3a7-5f2d-4f80-a4b0-2b2e6d6e95d7.jpg',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @ApiResponse({ status: 422, description: 'Файлы не переданы или невалидны' })
  @UseInterceptors(FilesInterceptor('files')) // используем FileInterceptor для обработки загружаемых файлов
  // Эндпоинт POST /api/image/multiple:
  // Принимает массив файлов и сохраняет их как пакет изображений без изменения размера (raw buffer).
  // Обратите внимание: метод является общим (утилитарным) хранилищем файлов и не привязывает картинки к постам в БД.
  // Для добавления изображений к посту с проверкой прав автора и лимитов используйте POST /api/post/:id/images.
  @Post('multiple')
  async saveImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    return await this.imageService.saveImages(files, folder);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Удалить одно изображение' })
  @ApiBody({ type: DeleteImageDto })
  @ApiResponse({ status: 200, description: 'Файл обработан' })
  @ApiResponse({ status: 400, description: 'Некорректный путь к файлу' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @Delete()
  async deleteImage(@Body() dto: DeleteImageDto) {
    return await this.imageService.deleteImage(dto.file, dto.folder);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Удалить несколько изображений' })
  @ApiBody({ type: DeleteImagesDto })
  @ApiResponse({ status: 200, description: 'Пакетное удаление завершено' })
  @ApiResponse({ status: 400, description: 'Некорректные входные данные' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация' })
  @Delete('batch')
  async deleteImages(@Body() dto: DeleteImagesDto) {
    return await this.imageService.deleteImages(dto.files, dto.folder);
  }
}

/*
  async saveImage(@UploadedFiles() files: Express.Multer.File[]) {
    const filePaths = await this.imageService.uploadImage(files);
    return files.map((file, index) => ({
      name: file.originalname,
      url: this.imageService.getFileUrl(filePaths[index]),
    }));
  }
		*/
