import {
  Injectable,
  BadRequestException,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { ensureDir } from 'fs-extra';
import path, { join, extname, resolve } from 'path';
import { randomUUID } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { ImageResponse } from './image.interface';

//* название Images  чтобы отличать от 2 варианта с files
@Injectable()
export class ImageService {
  // для чего нужен ConfigService в этом сервисе? Он используется для доступа к конфигурации приложения,
  // например, для получения настроек, связанных с загрузкой изображений, таких как путь к папке загрузки или другие параметры.
  constructor(private configService: ConfigService) {} // Инжектируем ConfigService для доступа к конфигурации приложения

  // проверка типа файла, чтобы убедиться, что это изображение для обоих методов saveImage и saveImages. Если тип файла не является изображением, выбрасывается исключение BadRequestException.
  private async validateImageType(file: Express.Multer.File) {
    //проверяем с помошью библиотеки file-type, которая определяет тип файла на основе его содержимого (буфера), а не только по расширению. Это более надежный способ проверки типа файла, так как расширение может быть изменено пользователем.
    const fileType = await fileTypeFromBuffer(file.buffer);
    if (!fileType || !fileType.mime.startsWith('image/')) {
      throw new BadRequestException('Invalid image file');
    }
  }

  // метод изменения размера изображения с помощью библиотеки sharp. Он принимает загруженный файл и необязательный параметр folder, который указывает, в какую папку сохранять изображение. Если папка не указана, используется папка по умолчанию 'images'. Метод проверяет тип файла, чтобы убедиться, что это изображение, затем изменяет размер изображения до 320x240 пикселей и сохраняет его в указанной папке. После сохранения возвращается объект ImageResponse с именем файла и URL для доступа к изображению.
  private async resizeImage(file: Express.Multer.File): Promise<Buffer> {
    await this.validateImageType(file);

    const result = await sharp(file.buffer)
      .resize({ width: 320, height: 240 })
      .toBuffer();
    return result;
  }

  // Метод saveImage выполняет физическую обработку и сохранение одного изображения:
  // 1. Валидирует mime-тип изображения (image/*).
  // 2. Делает ресайз через sharp (320x240).
  // 3. Сохраняет файл на диск в папку uploads/<folder> (по умолчанию images-resized).
  // ВАЖНО: Сам по себе этот метод НЕ привязывает аватар к базе данных и НЕ обновляет поле avatarPath в таблице User!
  // Привязка аватара к конкретному пользователю (связь 1-к-1 через поле avatarPath в БД)
  // реализована в UserService.uploadAvatar (src/user/user.service.ts) через эндпоинт POST /api/user/avatar.
  async saveImage(file: Express.Multer.File, folder?: string): Promise<ImageResponse> {
    // Проверяем тип файла, чтобы убедиться, что это изображение
    await this.validateImageType(file);

    //изменяем размер изображения с помощью метода resizeImage
    const resizedImageBuffer = await this.resizeImage(file);

    const uploadedFolder = resolve(process.cwd(), 'uploads', folder || 'images-resized');
    await ensureDir(uploadedFolder); // создаем папку uploads/images-resized (или другую указанную папку) перед сохранением файла, если она еще не существует.

    const imageName = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    const fullPath = join(uploadedFolder, imageName);
    await fs.writeFile(fullPath, resizedImageBuffer); // сохраняем измененное изображение в указанной папке

    return {
      name: imageName,
      url: `/${folder || 'images-resized'}/${imageName}`,
    };
  }

  // Метод saveImages выполняет пакетное сохранение нескольких изображений на диск:
  // 1. Принимает массив загруженных файлов files (Express.Multer.File[]) и опциональное имя папки.
  // 2. Создает папку назначения (по умолчанию uploads/img), если она еще не создана.
  // 3. Сохраняет каждый файл в исходном разрешении (без ресайза sharp) с уникальным именем на базе randomUUID().
  // 4. Возвращает массив объектов с именем файла и относительным URL для статической отдачи.
  // ВАЖНО: Этот метод утилитарный — он НЕ привязывает картинки к базе данных и НЕ создает связей с постами!
  // Для сохранения картинок к конкретному посту со связью One-to-Many в таблице post_images
  // используется специализированный метод PostService.uploadPostImages (src/post/post.service.ts).
  async saveImages(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<ImageResponse[]> {
    const uploadedFolder = resolve(process.cwd(), 'uploads', folder || 'img');
    await ensureDir(uploadedFolder); // ensureDir для создания папки uploads/img (или другой указанной папки) перед сохранением файлов, если она еще не существует.

    const results = await Promise.all(
      files.map(async (file) => {
        const imageName = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
        const fullPath = join(uploadedFolder, imageName);
        await fs.writeFile(fullPath, file.buffer);
        return {
          name: imageName,
          url: `/${folder || 'img'}/${imageName}`,
        };
      }),
    );

    return results;
  }

  async deleteImage(file: string, folder = 'images') {
    const targetFolder = resolve(process.cwd(), 'uploads', folder);
    const filePath = resolve(targetFolder, file);

    if (!filePath.startsWith(targetFolder)) {
      throw new BadRequestException('Некорректный путь к файлу');
    }

    try {
      await fs.unlink(filePath); //unlink удаляет файл по указанному пути. Если файл не существует, выбрасывается исключение, которое можно обработать в блоке catch.

      return {
        file,
        deleted: true,
        message: 'Файл успешно удален',
      };
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return {
          file,
          deleted: false,
          message: 'Файл не найден',
        };
      }

      throw new BadGatewayException(`Ошибка при удалении файла ${file}: ${err.message}`);
    }
  }

  async deleteImages(files: string[], folder = 'products') {
    const results = await Promise.all(
      files.map((file) => this.deleteImage(file, folder)),
    );

    return {
      total: files.length,
      deleted: results.filter((r) => r.deleted).length,
      results,
    };
  }

  getFileUrl(path: string) {
    return `/${path}`;
  }
}
