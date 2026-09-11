import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { FileStorage } from './file-storage.interface';
import { SaveFileInput, StoredFile } from './file-storage.types';

const MIME_TO_EXTENSION: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

@Injectable()
export class LocalStorageService implements FileStorage {
  private readonly storageRoot: string;
  private readonly publicBasePath: string;

  constructor(private readonly configService: ConfigService) {
    // Корневая директория для локального хранения файлов.
    this.storageRoot = resolve(
      process.cwd(),
      this.configService.get<string>('FILE_STORAGE_LOCAL_ROOT') ?? 'uploads',
    );

    // URL-префикс, через который файлы доступны снаружи.
    const configuredBasePath =
      this.configService.get<string>('FILE_STORAGE_PUBLIC_BASE_PATH') ?? '/uploads';

    this.publicBasePath = configuredBasePath.startsWith('/')
      ? configuredBasePath
      : `/${configuredBasePath}`;
  }

  async saveFile(input: SaveFileInput): Promise<StoredFile> {
    const extension = MIME_TO_EXTENSION[input.mimeType];
    if (!extension) {
      throw new BadRequestException('Unsupported file type');
    }

    const folder = this.normalizeSegment(input.folder);
    const fileName = this.normalizeSegment(input.fileName);
    const key = `${folder}/${fileName}.${extension}`;
    const targetPath = this.resolveSafePath(key);

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, input.buffer);

    return {
      key,
      url: this.getPublicUrl(key),
      mimeType: input.mimeType,
      size: input.buffer.byteLength,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const targetPath = this.resolveSafePath(key);

    try {
      await unlink(targetPath);
    } catch (error) {
      // Если файла уже нет, считаем удаление успешным (идемпотентное поведение).
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getPublicUrl(key: string): string {
    const basePath = this.publicBasePath.replace(/\/+$/, '');
    const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');

    return `${basePath}/${normalizedKey}`;
  }

  private normalizeSegment(value: string): string {
    // Нормализуем сегмент пути, чтобы исключить пробелы, спецсимволы и слэши.
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return normalized || 'file';
  }

  private resolveSafePath(key: string): string {
    const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    const absolutePath = resolve(join(this.storageRoot, normalizedKey));
    const storageRootWithSeparator = this.storageRoot.endsWith(sep)
      ? this.storageRoot
      : `${this.storageRoot}${sep}`;

    // Защита от path traversal: целевой путь обязан оставаться внутри storageRoot.
    if (
      absolutePath !== this.storageRoot &&
      !absolutePath.startsWith(storageRootWithSeparator)
    ) {
      throw new BadRequestException('Invalid file path');
    }

    return absolutePath;
  }
}
