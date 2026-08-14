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
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
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

@ApiTags('Post')
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiOperation({ summary: 'Создать новый пост' })
  @ApiResponse({ status: 201, description: 'Пост успешно создан' })
  @Post()
  async createPost(@Body() dto: CreatePostDto): Promise<PublicPost> {
    return this.postService.createPost(dto);
  }

  @ApiOperation({ summary: 'Получить все посты' })
  @ApiResponse({ status: 200, description: 'Список постов' })
  @Get('all')
  async findAllPosts(): Promise<PublicPost[]> {
    return this.postService.getAllPosts();
  }

  @ApiOperation({ summary: 'Получить пост по ID' })
  @ApiResponse({ status: 200, description: 'Пост найден' })
  @ApiResponse({ status: 404, description: 'Пост не найден' })
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
