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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PublicPost } from './post.service';

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
}
