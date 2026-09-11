import { Inject, Injectable } from '@nestjs/common';
import type { FileStorage } from './storage/file-storage.interface';
import { FILE_STORAGE } from './storage/file-storage.tokens';
import { SaveFileInput, StoredFile } from './storage/file-storage.types';

@Injectable()
export class FilesService {
  constructor(@Inject(FILE_STORAGE) private readonly fileStorage: FileStorage) {}

  // Фасад поверх хранилища.
  // Если позже добавятся логирование, метаданные или антивирусная проверка,
  // это можно централизованно добавить здесь.
  saveFile(input: SaveFileInput): Promise<StoredFile> {
    return this.fileStorage.saveFile(input);
  }

  deleteFile(key: string): Promise<void> {
    return this.fileStorage.deleteFile(key);
  }

  getPublicUrl(key: string): string {
    return this.fileStorage.getPublicUrl(key);
  }
}
