import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesService } from './files.service';
import { FileStorage } from './storage/file-storage.interface';
import { FILE_STORAGE } from './storage/file-storage.tokens';
import { LocalStorageService } from './storage/local-storage.service';

@Module({
  providers: [
    FilesService,
    LocalStorageService,
    {
      provide: FILE_STORAGE,
      inject: [ConfigService, LocalStorageService],
      useFactory: (
        configService: ConfigService,
        localStorageService: LocalStorageService,
      ): FileStorage => {
        // Через эту точку переключаем драйверы хранения без изменений в доменных модулях.
        // TODO: когда определитесь с облачным провайдером, добавить новый адаптер и кейс в switch.
        const driver = configService.get<string>('FILE_STORAGE_DRIVER') ?? 'local';

        switch (driver) {
          case 'local':
            return localStorageService;
          default:
            throw new Error(`Unsupported file storage driver: ${driver}`);
        }
      },
    },
  ],
  exports: [FilesService],
})
export class FilesModule {}
