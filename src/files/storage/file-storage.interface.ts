import { SaveFileInput, StoredFile } from './file-storage.types';

// Контракт для любого хранилища (local, облако, сетевое хранилище и т.д.).
// Бизнес-логика работает только с этим интерфейсом и не знает, где физически лежат файлы.
export interface FileStorage {
  saveFile(input: SaveFileInput): Promise<StoredFile>;
  deleteFile(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
