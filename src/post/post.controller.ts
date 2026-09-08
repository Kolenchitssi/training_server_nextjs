import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UnprocessableEntityException,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { RemoveFavoriteDto } from './dto/remove-favorite.dto';
import { PublicPost } from './post.service';
import { AuthGuard } from 'src/common/guards/auth.guards';
import type { UploadedBinaryFile } from 'src/files/storage/file-storage.types';

const uploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 10);
const POST_IMAGES_MAX_COUNT = 5;
const POST_IMAGE_MAX_FILE_SIZE_BYTES =
  (Number.isFinite(uploadSizeMb) && uploadSizeMb > 0 ? uploadSizeMb : 10) * 1024 * 1024;

@ApiTags('Post')
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer') // Указываем, что маршрут требует Bearer токен для авторизации
  @ApiOperation({ summary: 'Загрузить картинки для своего поста' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['images'],
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Картинки поста успешно загружены' })
  @ApiResponse({ status: 403, description: 'Пост не принадлежит текущему пользователю' })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
  @ApiResponse({
    status: 400,
    description: `Превышен лимит картинок у поста (максимум ${POST_IMAGES_MAX_COUNT})`,
  })
  @ApiResponse({
    status: 422,
    description: 'Невалидный формат файла, размер или количество файлов',
  })
  // Эндпоинт POST /api/post/:id/images:
  // Загружает от 1 до 5 картинок к конкретному посту:
  // 1. Проверяет авторизацию (@UseGuards(AuthGuard)), получая userId из JWT токена.
  // 2. FilesInterceptor перехватывает файлы из поля 'images' формы multipart/form-data.
  // 3. validatePostImages валидирует наличие файлов, лимит на запрос (до 5 шт.), mime-тип (jpeg/png) и максимальный размер.
  // 4. Вызывает postService.uploadPostImages для проверки авторства поста, сохранения файлов и создания связей в БД (PostImage).
  @Post(':id/images')
  @UseInterceptors(
    // используем FilesInterceptor для обработки загружаемых файлов
    FilesInterceptor('images', POST_IMAGES_MAX_COUNT, {
      limits: {
        files: POST_IMAGES_MAX_COUNT,
        fileSize: POST_IMAGE_MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  async uploadPostImages(
    @Req() req: Request & { user: { id: string } },
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() images: UploadedBinaryFile[],
  ): Promise<{ imageUrls: string[] }> {
    this.validatePostImages(images);
    return this.postService.uploadPostImages(req.user.id, id, images);
  }

  private validatePostImages(images: UploadedBinaryFile[] | undefined): void {
    if (!images || images.length === 0) {
      throw new UnprocessableEntityException('At least one image is required');
    }

    if (images.length > POST_IMAGES_MAX_COUNT) {
      throw new UnprocessableEntityException(
        `Maximum ${POST_IMAGES_MAX_COUNT} images are allowed per request`,
      );
    }

    for (const image of images) {
      if (!/^image\/(jpeg|png)$/.test(image.mimetype)) {
        throw new UnprocessableEntityException(
          'Only image/jpeg and image/png files are allowed',
        );
      }

      if (image.size > POST_IMAGE_MAX_FILE_SIZE_BYTES) {
        throw new UnprocessableEntityException(
          `Each image must be at most ${uploadSizeMb}MB`,
        );
      }
    }
  }

  @ApiOperation({ summary: 'Создать новый пост' })
  @ApiResponse({ status: 201, description: 'Пост успешно создан' })
  @Post()
  async createPost(@Body() dto: CreatePostDto): Promise<PublicPost> {
    return this.postService.createPost(dto);
  }

  @ApiOperation({ summary: 'Получить все посты' })
  @ApiResponse({ status: 200, description: 'Список постов' })
  // @ApiQuery используется для описания параметров запроса, которые передаются в URL после знака вопроса (например, ?page=1&limit=10).
  // В данном случае мы описываем два параметра: page и limit, которые используются для пагинации.
  // это как пример
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Номер страницы для пагинации (по умолчанию 1)',
    schema: { type: 'integer', default: 1, minimum: 1 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Количество постов на странице (по умолчанию 10)',
    schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
  })
  @Get('all')
  async findAllPosts(): Promise<PublicPost[]> {
    return this.postService.getAllPosts();
  }

  @ApiOperation({ summary: 'Получить пост по ID' })
  @ApiResponse({ status: 200, description: 'Пост найден' })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
  // По идее нужен @ApiParam, чтобы Swagger понимал, что в URL есть параметр id.
  //* Но в Swagger уже видно поле для ввода id просто появляется надпись ID поста над полем ввода, поэтому видимо можно не указывать @ApiParam.
  // @ApiParam({ name: 'id', type: Number, description: 'ID поста' })
  @Get(':id')
  async findPostById(@Param('id', ParseIntPipe) id: number): Promise<PublicPost> {
    return this.postService.getPostById(id);
  }

  @ApiOperation({ summary: 'Полностью обновить пост' })
  @ApiResponse({ status: 200, description: 'Пост успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
  @Put(':id')
  async updatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ): Promise<PublicPost> {
    return this.postService.updatePost(id, dto);
  }

  @ApiOperation({ summary: 'Частично обновить пост' })
  @ApiResponse({ status: 200, description: 'Пост успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
  @Patch(':id')
  async partialUpdatePost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<UpdatePostDto>,
  ): Promise<PublicPost> {
    return this.postService.partialUpdatePost(id, dto);
  }

  @ApiOperation({ summary: 'Удалить пост' })
  @ApiResponse({ status: 200, description: 'Пост успешно удален' })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
  @Delete(':id')
  async deletePost(@Param('id', ParseIntPipe) id: number): Promise<PublicPost> {
    return this.postService.deletePost(id);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer') // Этот декоратор указывает, что для доступа к этому эндпоинту требуется Bearer токен.
  @ApiOperation({ summary: 'Добавить пост в избранное' })
  @ApiResponse({ status: 200, description: 'Пост успешно добавлен в избранное' })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
  @ApiBody({ type: AddFavoriteDto }) // Указывает, что в body запроса ожидается объект типа AddFavoriteDto.
  @Post('favorite')
  async addPostToFavorites(
    // Guard уже проверил JWT и положил текущего пользователя в request.user.id.
    // Поэтому нам не нужно передавать userId в body: мы получаем его из токена.
    @Req() req: Request & { user: { id: string } },
    // Важный момент: для этой операции postId передаётся в body, а не в URL.
    // Такой стиль удобен для Swagger, validation и единообразия API.
    @Body() dto: AddFavoriteDto,
  ): Promise<PublicPost> {
    return this.postService.addPostToFavorites(req.user.id, dto.postId);
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer') // Этот декоратор указывает, что для доступа к этому эндпоинту требуется Bearer токен.
  @ApiOperation({ summary: 'Удалить пост из избранного' })
  @ApiResponse({ status: 200, description: 'Пост успешно удален из избранного' })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
  @ApiBody({ type: RemoveFavoriteDto })
  @Delete('favorite')
  async removePostFromFavorites(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: RemoveFavoriteDto,
  ): Promise<PublicPost> {
    return this.postService.removePostFromFavorites(req.user.id, dto.postId);
  }
}
