import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';
import { FilesService } from 'src/files/files.service';
import type { UploadedBinaryFile } from 'src/files/storage/file-storage.types';

const POST_IMAGE_FOLDER = 'posts';
const MAX_IMAGES_PER_POST = 5;

const postImagePublicSelect = {
  id: true,
  path: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PostImageSelect;

const postPublicSelect = {
  id: true,
  title: true,
  content: true,
  published: true,
  imagePath: true,
  images: {
    select: postImagePublicSelect,
    orderBy: {
      createdAt: 'asc',
    },
  },
  authorId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PostSelect;

export type PublicPost = Prisma.PostGetPayload<{
  select: typeof postPublicSelect;
}>;

@Injectable()
export class PostService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly filesService: FilesService,
  ) {}

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
    const data: {
      title: string;
      content?: string;
      published?: boolean;
      authorId?: string;
      imagePath?: string;
    } = {
      title: dto.title,
      content: dto.content,
      published: dto.published,
      authorId: dto.authorId,
    };

    if (dto.imagePath !== undefined) {
      data.imagePath = dto.imagePath;
    }

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
    await this.cleanPostImagesOnUpdate(id, dto);

    const data: {
      title?: string;
      content?: string;
      published?: boolean;
      authorId?: string;
      imagePath?: string | null;
    } = {
      title: dto.title,
      content: dto.content,
      published: dto.published,
      authorId: dto.authorId,
    };

    if (dto.imagePath !== undefined) {
      data.imagePath = dto.imagePath;
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

  async partialUpdatePost(id: number, dto: Partial<UpdatePostDto>): Promise<PublicPost> {
    await this.cleanPostImagesOnUpdate(id, dto);

    const data: {
      title?: string;
      content?: string;
      published?: boolean;
      authorId?: string;
      imagePath?: string | null;
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
    if (dto.imagePath !== undefined) {
      data.imagePath = dto.imagePath;
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

  // Очистка удаляемых или заменяемых картинок при редактировании поста:
  // 1. Если переданы removeImageIds, находим привязанные к этому посту записи PostImage,
  //    удаляем их из БД и физически удаляем файлы с диска через FilesService.
  // 2. Если передан новый imagePath (или null для очистки), и у поста уже был старый imagePath,
  //    физически удаляем старый файл с диска, чтобы не оставлять сиротские файлы.
  private async cleanPostImagesOnUpdate(
    postId: number,
    dto: Partial<UpdatePostDto>,
  ): Promise<void> {
    const hasRemoveImageIds =
      Array.isArray(dto.removeImageIds) && dto.removeImageIds.length > 0;
    const hasImagePath = dto.imagePath !== undefined;

    if (!hasRemoveImageIds && !hasImagePath) {
      return;
    }

    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        imagePath: true,
        images: {
          select: { id: true, path: true },
        },
      },
    });

    if (!post) {
      return;
    }

    // Удаление выбранных картинок из PostImage
    if (hasRemoveImageIds && dto.removeImageIds) {
      const imagesToDelete = post.images.filter((img) =>
        dto.removeImageIds!.includes(img.id),
      );

      if (imagesToDelete.length > 0) {
        const idsToDelete = imagesToDelete.map((img) => img.id);

        await this.prismaService.postImage.deleteMany({
          where: {
            id: { in: idsToDelete },
            postId,
          },
        });

        for (const img of imagesToDelete) {
          try {
            await this.filesService.deleteFile(img.path);
          } catch (fileError) {
            console.error(`Failed to delete post image file ${img.path}:`, fileError);
          }
        }
      }
    }

    // Удаление старого файла при замене или очистке imagePath
    if (hasImagePath && post.imagePath && post.imagePath !== dto.imagePath) {
      try {
        await this.filesService.deleteFile(post.imagePath);
      } catch (fileError) {
        console.error(
          `Failed to delete old imagePath file ${post.imagePath}:`,
          fileError,
        );
      }
    }
  }

  // Удаление поста и очистка прикрепленных к нему картинок:
  // 1. Prisma каскадно удаляет связанные записи PostImage в БД (onDelete: Cascade).
  // 2. Возвращаемый объект удаленного поста содержит массив images (и imagePath, если использовался).
  // 3. После успешного удаления поста из базы данных мы физически удаляем все файлы картинок через FilesService,
  //    чтобы на диске не оставалось "мусорных" файлов (orphan files).
  // 4. Ошибки удаления отдельных файлов с диска логируются/подавляются, так как пост из БД уже удален.
  async deletePost(id: number): Promise<PublicPost> {
    let deletedPost: PublicPost;

    try {
      deletedPost = await this.prismaService.post.delete({
        where: { id },
        select: postPublicSelect,
      });
    } catch (error) {
      this.handlePrismaError(error, 'post');
    }

    // Собираем пути всех файлов картинок, привязанных к посту (PostImage и legacy imagePath)
    const fileKeysToDelete: string[] = [];

    if (deletedPost.images && deletedPost.images.length > 0) {
      for (const img of deletedPost.images) {
        if (img.path) {
          fileKeysToDelete.push(img.path);
        }
      }
    }

    if (deletedPost.imagePath) {
      fileKeysToDelete.push(deletedPost.imagePath);
    }

    // Удаляем файлы с диска через FilesService
    if (fileKeysToDelete.length > 0) {
      await Promise.all(
        fileKeysToDelete.map(async (key) => {
          try {
            await this.filesService.deleteFile(key);
          } catch (fileError) {
            // Ошибка удаления файла не должна ломать результат, если пост уже удален из БД,
            // но важно зафиксировать проблему в консоли/логах
            console.error(`Failed to delete post image file ${key}:`, fileError);
          }
        }),
      );
    }

    return deletedPost;
  }

  // Загрузка и привязка картинок к посту со связью One-to-Many:
  // В Prisma модель Post имеет отношение `images PostImage[]`, а модель PostImage ссылается на Post через postId.
  // Этот метод реализует полный бизнес-процесс прикрепления изображений:
  // 1. Проверяет существование поста и текущее количество уже прикрепленных картинок.
  // 2. Проверяет права доступа: только автор поста (authorId === userId) может загружать картинки к своему посту.
  // 3. Контролирует суммарный лимит картинок: у одного поста не может быть более MAX_IMAGES_PER_POST (5) изображений.
  // 4. Сохраняет файлы через FilesService в папку uploads/posts/ под уникальным именем `${postId}-${randomUUID()}.${ext}`.
  // 5. Создает записи в таблице post_images через prismaService.postImage.createMany с привязкой postId и path.
  // 6. Механизм транзакционного отката (Rollback): если сохранение на диск или запись в БД прерываются ошибкой,
  //    все созданные в рамках этого запроса файлы немедленно удаляются, предотвращая появление "сиротских" файлов на диске.
  async uploadPostImages(
    userId: string,
    postId: number,
    images: UploadedBinaryFile[],
  ): Promise<{ imageUrls: string[] }> {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        images: {
          select: {
            id: true,
            path: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    // Разрешаем загружать картинку только владельцу поста.
    if (!post.authorId || post.authorId !== userId) {
      throw new ForbiddenException('You can upload image only for your own post');
    }

    // Ограничиваем общее количество картинок у поста до 5.
    if (post.images.length + images.length > MAX_IMAGES_PER_POST) {
      throw new BadRequestException(
        `Post can contain at most ${MAX_IMAGES_PER_POST} images`,
      );
    }

    const storedImages: Array<{ key: string; url: string }> = [];

    try {
      for (const image of images) {
        // Имя файла строим как postId + UUID, чтобы каждая новая картинка была уникальна.
        const storedImage = await this.filesService.saveFile({
          buffer: image.buffer,
          mimeType: image.mimetype,
          folder: POST_IMAGE_FOLDER,
          fileName: `${postId}-${randomUUID()}`,
        });
        storedImages.push({ key: storedImage.key, url: storedImage.url });
      }
    } catch (error) {
      await Promise.all(
        storedImages.map((item) => this.filesService.deleteFile(item.key)),
      );
      throw error;
    }

    try {
      await this.prismaService.postImage.createMany({
        data: storedImages.map((item) => ({
          postId,
          path: item.key,
        })),
      });
    } catch (error) {
      // Если запись в БД не удалась, удаляем уже сохраненный файл.
      await Promise.all(
        storedImages.map((item) => this.filesService.deleteFile(item.key)),
      );
      throw error;
    }

    return {
      imageUrls: storedImages.map((item) => item.url),
    };
  }

  // Удаление одной картинки поста:
  // 1. Проверяем существование поста и права автора (только автор может удалять картинки своего поста).
  // 2. Проверяем, что картинка с imageId принадлежит именно этому посту.
  // 3. Удаляем запись PostImage из БД.
  // 4. Физически удаляем файл с диска через FilesService, предотвращая появление сиротских файлов.
  async deletePostImage(
    userId: string,
    postId: number,
    imageId: string,
  ): Promise<PublicPost> {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        images: {
          select: {
            id: true,
            path: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    if (!post.authorId || post.authorId !== userId) {
      throw new ForbiddenException('You can delete images only from your own post');
    }

    const targetImage = post.images.find((img) => img.id === imageId);
    if (!targetImage) {
      throw new NotFoundException(
        `Image with id ${imageId} not found for post ${postId}`,
      );
    }

    await this.prismaService.postImage.delete({
      where: { id: imageId },
    });

    try {
      await this.filesService.deleteFile(targetImage.path);
    } catch (fileError) {
      console.error(
        `Failed to delete post image file ${targetImage.path}:`,
        fileError,
      );
    }

    return this.getPostById(postId);
  }

  // Замена одной конкретной картинки поста на новую:
  // 1. Проверяем существование поста, авторство и наличие заменяемой картинки.
  // 2. Сохраняем новый файл на диск через FilesService с уникальным UUID.
  // 3. Обновляем путь в записи PostImage в БД.
  //    Если обновление в БД завершилось ошибкой — откатываем (удаляем) новый файл.
  // 4. После успешного обновления в БД удаляем старый файл с диска, исключая накопление мусора.
  async replacePostImage(
    userId: string,
    postId: number,
    imageId: string,
    image: UploadedBinaryFile,
  ): Promise<{ imageUrl: string }> {
    const post = await this.prismaService.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        images: {
          select: {
            id: true,
            path: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with id ${postId} not found`);
    }

    if (!post.authorId || post.authorId !== userId) {
      throw new ForbiddenException('You can replace images only for your own post');
    }

    const targetImage = post.images.find((img) => img.id === imageId);
    if (!targetImage) {
      throw new NotFoundException(
        `Image with id ${imageId} not found for post ${postId}`,
      );
    }

    const storedImage = await this.filesService.saveFile({
      buffer: image.buffer,
      mimeType: image.mimetype,
      folder: POST_IMAGE_FOLDER,
      fileName: `${postId}-${randomUUID()}`,
    });

    try {
      await this.prismaService.postImage.update({
        where: { id: imageId },
        data: {
          path: storedImage.key,
        },
      });
    } catch (error) {
      // Если запись в БД не удалась, откатываем сохраненный файл
      await this.filesService.deleteFile(storedImage.key);
      throw error;
    }

    // Удаляем старый файл только после успешного обновления БД
    if (targetImage.path && targetImage.path !== storedImage.key) {
      try {
        await this.filesService.deleteFile(targetImage.path);
      } catch (fileError) {
        console.error(
          `Failed to delete old post image file ${targetImage.path}:`,
          fileError,
        );
      }
    }

    return {
      imageUrl: storedImage.url,
    };
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(`Post not found`);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new NotFoundException(
        entity === 'author'
          ? 'Author with provided id was not found'
          : 'Related record was not found',
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Unique constraint failed for post data');
    }

    throw error;
  }
}
