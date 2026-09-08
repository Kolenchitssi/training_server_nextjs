import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma/client';
import { FilesService } from 'src/files/files.service';
import type { UploadedBinaryFile } from 'src/files/storage/file-storage.types';
import { Logger } from 'nestjs-pino/Logger';

// Коэффициент сложности (cost factor) для хеширования пароля в bcrypt.
const PASSWORD_SALT_ROUNDS = 10;
const USER_AVATAR_FOLDER = 'avatars';

// Единый безопасный набор полей для ответов API.
// Пароль намеренно исключен, чтобы никогда не попадать в ответы клиенту.
const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const favoritePostSelect = {
  id: true,
  title: true,
  content: true,
  published: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PostSelect;

// Публичная форма пользователя, которую возвращают сервис и контроллер.
export type PublicUser = Prisma.UserGetPayload<{
  select: typeof userPublicSelect;
}>;

export type PublicFavoritePost = Prisma.PostGetPayload<{
  select: typeof favoritePostSelect;
}>;

@Injectable() // Это декоратор, который делает класс UserService доступным
// для внедрения зависимостей в других частях приложения.

/* Декоратор, помечающий класс как провайдер. Провайдеры могут быть внедрены
 в другие классы посредством внедрения параметров конструктора с использованием 
 встроенной в Nest системы внедрения зависимостей (DI).

При внедрении провайдера он должен быть видим в области видимости модуля 
(если говорить упрощенно, содержащего модуля) класса, в который он внедряется.
 Это можно сделать следующим образом:
- определить провайдера в той же области видимости модуля;
- экспортировать провайдера из одной области видимости модуля и импортировать этот модуль 
в область видимости модуля класса, в который он внедряется;
- экспортировать провайдера из модуля, помеченного как глобальный с помощью декоратора @Global(). */
export class UserService {
  // Используем pino-логгер через DI, чтобы логи шли в единый транспорт приложения.
  @Inject(Logger)
  private readonly logger!: Logger;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  // Загрузка и привязка аватара к пользователю (связь One-to-One):
  // В схеме Prisma модель User содержит скалярное поле `avatarPath String? @map("avatar_path")`.
  // За счет того, что поле принадлежит самой таблице users, для каждого пользователя может существовать
  // только один актуальный avatarPath (связь 1-к-1: один пользователь — один аватар).
  // Этот метод:
  // 1. Проверяет существование пользователя в БД и получает текущий oldAvatarPath.
  // 2. Сохраняет файл аватара на диск через FilesService в папку uploads/avatars/<uuid>.<ext>.
  // 3. Записывает путь к файлу (ключ) в поле avatarPath конкретного пользователя через prismaService.user.update.
  // 4. Если запись в БД успешна — удаляет старый файл аватара (если он был), чтобы не копить мусор.
  // 5. Если запись в БД упала с ошибкой — удаляет только что созданный новый файл (rollback).
  async uploadAvatar(
    userId: string,
    avatar: UploadedBinaryFile,
  ): Promise<{ avatarUrl: string }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatarPath: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const oldAvatarPath = user.avatarPath;

    // Физическое сохранение файла делегируем в files-домен,
    // чтобы user-сервис не зависел от способа хранения (локально/облако).
    // Для аватара используем UUID в имени, чтобы браузер не кешировал старую картинку
    // по тому же URL после обновления аватара.
    const storedAvatar = await this.filesService.saveFile({
      buffer: avatar.buffer,
      mimeType: avatar.mimetype,
      folder: USER_AVATAR_FOLDER,
      fileName: randomUUID(),
    });

    try {
      await this.prismaService.user.update({
        where: { id: userId },
        data: {
          avatarPath: storedAvatar.key,
        },
      });
    } catch (error) {
      // Если БД-обновление не удалось, удаляем уже записанный файл,
      // чтобы не оставлять "сиротские" объекты в хранилище.
      await this.filesService.deleteFile(storedAvatar.key);
      throw error;
    }

    // Старый файл удаляем только после успешного обновления БД,
    // чтобы при ошибке сохранения пользователь не остался без аватара.
    if (oldAvatarPath && oldAvatarPath !== storedAvatar.key) {
      try {
        await this.filesService.deleteFile(oldAvatarPath);
      } catch (error) {
        // Если удаление старого файла не удалось, не откатываем успешную операцию:
        // у пользователя уже сохранен новый avatarPath в БД.
        this.logger.warn(
          {
            userId,
            oldAvatarPath,
            error,
          },
          'Failed to delete old avatar file after avatar replacement',
        );
      }
    }

    return {
      avatarUrl: storedAvatar.url,
    };
  }

  async getAvatar(userId: string): Promise<{ avatarUrl: string | null }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatarPath: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return {
      avatarUrl: user.avatarPath ? this.filesService.getPublicUrl(user.avatarPath) : null,
    };
  }

  async getAllUsers(): Promise<PublicUser[]> {
    return this.prismaService.user.findMany({
      select: userPublicSelect,
    });
  }

  async getUserById(id: string): Promise<PublicUser> {
    const user = await this.prismaService.user.findUnique({
      where: { id: id },
      select: userPublicSelect,
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  // DTO (Data Transfer Object) - это объект, который используется для передачи данных между слоями приложения.
  // В данном случае, CreateUserDto используется для передачи данных при создании нового пользователя.
  async createUser(dto: CreateUserDto): Promise<PublicUser> {
    const hashedPassword = await hash(dto.password, PASSWORD_SALT_ROUNDS);

    const data = {
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    };

    try {
      const newUser = await this.prismaService.user.create({
        data,
        select: userPublicSelect,
      });
      return newUser;
    } catch (error) {
      // P2002 = нарушение уникального ограничения в БД (например, duplicate email).
      // Возвращаем понятный 409 вместо "внутренней" 500 ошибки Prisma.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      throw error;
    }
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const hashedPassword = await hash(dto.password, PASSWORD_SALT_ROUNDS);

    const data = {
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
    };

    try {
      const updatedUser = await this.prismaService.user.update({
        where: { id: id },
        data,
        select: userPublicSelect,
      });
      return updatedUser;
    } catch (error) {
      // P2002 = попытка записать неуникальный email.
      // Возвращаем 409 Conflict с понятным текстом для клиента.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      throw error;
    }
  }

  async partialUpdateUser(id: string, dto: Partial<UpdateUserDto>): Promise<PublicUser> {
    const data: { name?: string; email?: string; password?: string } = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.email !== undefined) {
      data.email = dto.email;
    }
    if (dto.password !== undefined) {
      data.password = await hash(dto.password, PASSWORD_SALT_ROUNDS);
    }

    try {
      const updatedUser = await this.prismaService.user.update({
        where: { id: id },
        data,
        select: userPublicSelect,
      });
      return updatedUser;
    } catch (error) {
      // P2002 = попытка записать неуникальный email.
      // Возвращаем 409 Conflict с понятным текстом для клиента.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
      throw error;
    }
  }

  async deleteUser(id: string): Promise<PublicUser> {
    const deletedUser = await this.prismaService.user.delete({
      where: { id: id },
      select: userPublicSelect,
    });
    return deletedUser;
  }

  async getUserFavorites(userId: string): Promise<PublicFavoritePost[]> {
    // Здесь мы ищем пользователя по id, который пришёл из токена и уже был записан в request.user.id.
    // После этого возвращаем только связанные посты через relation favoritePosts.
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        favoritePosts: {
          select: favoritePostSelect,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user.favoritePosts;
  }

  async getUserProfile(userId: string, page = 1, limit = 10) {
    const safePage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
    const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 10;
    const skip = (safePage - 1) * safeLimit;

    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        // можно использовать вместо include select если нужны только определенные поля
        profile: true,

        favoritePosts: {
          orderBy: {
            createdAt: 'desc',
          },
        },

        posts: {
          orderBy: {
            createdAt: 'desc',
          },
          skip, // пропускаем первые (page - 1) * limit записей
          take: safeLimit, // показываем limit(default 10) записей на странице
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const totalPosts = await this.prismaService.post.count({
      where: {
        authorId: userId,
      },
    });

    return {
      ...user,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / safeLimit),
      },
    };
  }

  //пример с использованием select
  async getUserProfilePartialField(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        // email: true, // если ненужен то не помещаем его в select
        profile: true,
        favoritePosts: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        posts: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip, // пропускаем первые (page - 1) * limit записей
          take: limit, // показываем limit(default 10) записей на странице

          // с помощью include можно подгружать связанные сущности, например отзывы к посту вместе с их авторами
          include: {
            reviews: {
              include: {
                author: true,
              },
            },
          },
        },
      },
    });
    return user;
  }

  // Если нужно еще количество всех постов пользователя
  /**Обычно для фронтенда пагинации нужны:
    - текущая страница
    - лимит
    - общее количество постов
    - количество страниц

  Тогда лучше сделать два запроса в транзакции: */

  async getUserProfileWithCountPosts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    // $transaction это транзакция, которая выполняет несколько запросов к базе данных атомарно.
    // то есть либо все запросы выполняются успешно, либо ни один из них не выполняется.
    const [user, totalPosts] = await this.prismaService.$transaction([
      this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          profile: true,

          favoritePosts: {
            orderBy: {
              createdAt: 'desc',
            },
          },

          posts: {
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take: limit,
          },
        },
      }),

      this.prismaService.post.count({
        where: {
          authorId: userId,
        },
      }),
    ]);

    return {
      ...user,

      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
      },
    };
  }
}
