import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ImageService } from './image.service';
import { AuthGuard } from 'src/common/guards/auth.guards';

@Module({
  imports: [
    ConfigModule,
    // Подключаем ServeStaticModule для обслуживания статических файлов из папки uploads
    // это динамический импорт конфигурации, который позволяет использовать  конфигурацию для настройки поведения импортируемого модуля
    // обычно метод называют forRoot() или register()
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', // URL, по которому будут доступны файлы из папки uploads
    }),
  ],
  controllers: [ImageController],
  providers: [ImageService, AuthGuard],
  exports: [],
})
export class ImageModule {}
