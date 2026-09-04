import { Module } from '@nestjs/common';
import { ImageController } from './image.controller';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ImageService } from './image.service';

@Module({
  imports: [
    ConfigModule,
    // Подключаем ServeStaticModule для обслуживания статических файлов из папки uploads
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [],
})
export class ImageModule {}
