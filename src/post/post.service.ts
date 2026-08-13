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
