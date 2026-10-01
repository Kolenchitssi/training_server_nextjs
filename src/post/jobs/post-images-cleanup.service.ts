import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval, Timeout } from '@nestjs/schedule';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { PrismaService } from 'src/prisma/prisma.service';
import { FilesService } from 'src/files/files.service';

const POSTS_FOLDER = 'posts';
const FILE_MIN_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 дня

@Injectable()
export class PostImagesCleanupService {
  private readonly logger = new Logger(PostImagesCleanupService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  /**
   * Автоматический запуск  
   */
  // @Cron('0 3 * * 0') // раз в неделю: Воскресенье 03:00
  // @Cron('*/2 * * * *') // каждые 2 минуты
  // @Cron(CronExpression.EVERY_10_MINUTES) // можем использовать константы
  @Cron(CronExpression.EVERY_11_HOURS) // можем использовать константы
  async handleCron(): Promise<void> {
    console.log('Running cleanup at cron');
    await this.cleanupOrphanImages();
  }

  // также есть Interval, можно использовать
  @Interval(1000 * 60 * 100) // задается в миллисекундах,= каждые 100 минут
  // метод который будет вызываться по интервалу
  async handleInterval(): Promise<void> {
    console.log('Running cleanup at interval');
    await this.cleanupOrphanImages();
  }

  @Timeout(1000 * 60 * 100) // запускается один раз через 100 минут после старта приложения
  async handleTimeout(): Promise<void> {
    console.log('Running cleanup at timeout');
    await this.cleanupOrphanImages();
  }

  /**
   * Можно вызвать вручную из контроллера,
   * команды или другого сервиса.
   */
  async cleanupOrphanImages(): Promise<{
    scanned: number;
    deleted: number;
    skippedUsed: number;
    skippedYoung: number;
  }> {
    // Фиксируем начало очистки в журнале приложения.
    this.logger.log('Starting orphan images cleanup');

    // Формируем путь к папке, где хранятся изображения постов.
    const uploadsDir = join(process.cwd(), 'uploads', POSTS_FOLDER);

    // Получаем имена файлов, находящихся непосредственно в папке изображений.
    const filesOnDisk = await readdir(uploadsDir);

    // Параллельно загружаем пути изображений из обеих схем хранения постов.
    const [postImages, posts] = await Promise.all([
      this.prismaService.postImage.findMany({
        select: {
          path: true,
        },
      }),

      this.prismaService.post.findMany({
        where: {
          imagePath: {
            not: null,
          },
        },
        select: {
          imagePath: true,
        },
      }),
    ]);

    // Собираем все пути, на которые ссылается база данных.
    const usedFiles = new Set<string>();

    // Добавляем пути изображений из отдельной таблицы postImage.
    for (const image of postImages) {
      usedFiles.add(image.path);
    }

    // Добавляем старые пути изображений, хранящиеся непосредственно в постах.
    for (const post of posts) {
      if (post.imagePath) {
        usedFiles.add(post.imagePath);
      }
    }

    // Счётчики итоговой статистики очистки.
    let deleted = 0;
    let skippedUsed = 0;
    let skippedYoung = 0;

    // Проверяем каждый найденный файл по очереди.
    for (const fileName of filesOnDisk) {
      // Создаём ключ в том же формате, в котором путь хранится в базе данных.
      const fileKey = `${POSTS_FOLDER}/${fileName}`;

      // Не удаляем файл, если на него ссылается хотя бы одна запись в базе.
      if (usedFiles.has(fileKey)) {
        skippedUsed++;
        continue;
      }

      // Получаем полный путь к файлу для проверки его атрибутов.
      const fullPath = join(uploadsDir, fileName);

      try {
        // Читаем метаданные файла, включая время последнего изменения.
        const fileStats = await stat(fullPath);

        // Вычисляем, сколько времени прошло с момента последнего изменения файла.
        const ageMs = Date.now() - fileStats.mtime.getTime();

        // Пропускаем файл младше 2 дней: его ссылка может ещё появиться в базе.
        if (ageMs < FILE_MIN_AGE_MS) {
          skippedYoung++;
          continue;
        }

        // Удаляем файл, если он не используется и старше минимального срока хранения.
        await this.filesService.deleteFile(fileKey);

        // Учитываем успешное удаление и записываем его в журнал.
        deleted++;

        this.logger.log(`Deleted orphan image: ${fileKey}`);
      } catch (error) {
        // Записываем ошибку для этого файла и продолжаем обработку остальных.
        this.logger.error(
          `Failed to process file ${fileKey}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    // Формируем сводку: сколько файлов проверено, удалено и пропущено.
    const result = {
      scanned: filesOnDisk.length,
      deleted,
      skippedUsed,
      skippedYoung,
    };

    // Записываем итоговую статистику и возвращаем её вызывающему коду.
    this.logger.log(`Cleanup completed: ${JSON.stringify(result)}`);

    return result;
  }
}
