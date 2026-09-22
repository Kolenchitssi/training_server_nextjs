import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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
   * Автоматический запуск раз в неделю:
   * Воскресенье 03:00
   */
  @Cron('0 3 * * 0')
  async handleCron(): Promise<void> {
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
    this.logger.log('Starting orphan images cleanup');

    const uploadsDir = join(process.cwd(), 'uploads', POSTS_FOLDER);

    const filesOnDisk = await readdir(uploadsDir);

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

    const usedFiles = new Set<string>();

    for (const image of postImages) {
      usedFiles.add(image.path);
    }

    for (const post of posts) {
      if (post.imagePath) {
        usedFiles.add(post.imagePath);
      }
    }

    let deleted = 0;
    let skippedUsed = 0;
    let skippedYoung = 0;

    for (const fileName of filesOnDisk) {
      const fileKey = `${POSTS_FOLDER}/${fileName}`;

      // файл используется в БД
      if (usedFiles.has(fileKey)) {
        skippedUsed++;
        continue;
      }

      const fullPath = join(uploadsDir, fileName);

      try {
        const fileStats = await stat(fullPath);

        const ageMs = Date.now() - fileStats.mtime.getTime();

        // файл младше 2 дней
        if (ageMs < FILE_MIN_AGE_MS) {
          skippedYoung++;
          continue;
        }

        await this.filesService.deleteFile(fileKey);

        deleted++;

        this.logger.log(`Deleted orphan image: ${fileKey}`);
      } catch (error) {
        this.logger.error(
          `Failed to process file ${fileKey}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    const result = {
      scanned: filesOnDisk.length,
      deleted,
      skippedUsed,
      skippedYoung,
    };

    this.logger.log(`Cleanup completed: ${JSON.stringify(result)}`);

    return result;
  }
}
