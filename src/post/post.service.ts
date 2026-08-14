import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';

const postPublicSelect = {
  id: true,
  title: true,
  content: true,
  published: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PostSelect;

export type PublicPost = Prisma.PostGetPayload<{
  select: typeof postPublicSelect;
}>;

@Injectable()
export class PostService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllPosts(): Promise<PublicPost[]> {
    return this.prismaService.post.findMany({
      select: postPublicSelect,
    });
  }

  async getPostById(id: number): Promise<PublicPost> {
    const post = await this.prismaService.post.findUnique({
      where: { id },
      select: postPublicSelect,
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${id} not found`);
    }

    return post;
  }

  async createPost(dto: CreatePostDto): Promise<PublicPost> {
    const data = {
      title: dto.title,
      content: dto.content,
      published: dto.published,
      authorId: dto.authorId,
    };

    try {
      return await this.prismaService.post.create({
        data,
        select: postPublicSelect,
      });
    } catch (error) {
      this.handlePrismaError(error, 'author');
    }
  }

  async updatePost(id: number, dto: UpdatePostDto): Promise<PublicPost> {
    const data = {
      title: dto.title,
      content: dto.content,
      published: dto.published,
      authorId: dto.authorId,
    };

    try {
      return await this.prismaService.post.update({
        where: { id },
        data,
        select: postPublicSelect,
      });
    } catch (error) {
      this.handlePrismaError(error, 'post');
    }
  }

  async partialUpdatePost(
    id: number,
    dto: Partial<UpdatePostDto>,
  ): Promise<PublicPost> {
    const data: {
      title?: string;
      content?: string;
      published?: boolean;
      authorId?: string;
    } = {};

    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.content !== undefined) {
      data.content = dto.content;
    }
    if (dto.published !== undefined) {
      data.published = dto.published;
    }
    if (dto.authorId !== undefined) {
      data.authorId = dto.authorId;
    }

    try {
      return await this.prismaService.post.update({
        where: { id },
        data,
        select: postPublicSelect,
      });
    } catch (error) {
      this.handlePrismaError(error, 'post');
    }
  }

  async deletePost(id: number): Promise<PublicPost> {
    try {
      return await this.prismaService.post.delete({
        where: { id },
        select: postPublicSelect,
      });
    } catch (error) {
      this.handlePrismaError(error, 'post');
    }
  }

  async addPostToFavorites(userId: string, postId: number): Promise<PublicPost> {
    // 1) Сначала проверяем, что пользователь реально существует.
    // Важно: userId приходит из JWT-токена, а не из тела запроса, поэтому его нельзя доверять blindly.
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    // 2) Проверяем, что сам пост существует.
    // Это нужно, чтобы не попытаться связать несуществующую запись из many-to-many relation.
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    // 3) Prisma relation many-to-many работает через connect/disconnect.
    // Здесь мы говорим: "свяжи этот пост с этим пользователем как избранный".
    const favoritePost = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        favoritePosts: {
          connect: { id: postId },
        },
      },
      select: {
        favoritePosts: {
          where: { id: postId },
          select: postPublicSelect,
        },
      },
    });

    // user.update(...) возвращает массив favoritePosts, поэтому берем первый элемент.
    // Если по какой-то причине связь не создалась, выбрасываем понятную ошибку.
    const addedPost = favoritePost.favoritePosts[0];

    if (!addedPost) {
      throw new NotFoundException(`Post with id ${postId} not found in favorites`);
    }

    return addedPost;
  }

  async removePostFromFavorites(userId: string, postId: number): Promise<PublicPost> {
    // Сначала валидируем пользователя и пост, чтобы не удалять "пустую" связь по несуществующим данным.
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    // Для many-to-many связи удаление выполняется через disconnect.
    // Мы не удаляем сам пост из базы, а только разрываем связь между пользователем и этим постом.
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        favoritePosts: {
          disconnect: { id: postId },
        },
      },
    });

    // Возвращаем сам пост, чтобы клиент получил актуальный объект, который только что удалили из избранного.
    return post as PublicPost;
  }

  private handlePrismaError(error: unknown, entity: 'post' | 'author'): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException(`Post not found`);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new NotFoundException(
        entity === 'author'
          ? 'Author with provided id was not found'
          : 'Related record was not found',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Unique constraint failed for post data');
    }

    throw error;
  }
}
