import {
  Controller,
  UseInterceptors,
  UploadedFiles,
  Post,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { AuthGuard } from 'src/common/guards/auth.guards';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @HttpCode(200) // Устанавливаем код ответа 200 OK
  @UseGuards(AuthGuard) // применяем guard для защиты маршрута
  @UseInterceptors(FilesInterceptor('files')) // используем FileInterceptor для обработки загружаемых файлов
  @Post()
  async saveImage(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    return await this.imageService.saveImages(files, folder);
  }
}

/*
  async saveImage(@UploadedFiles() files: Express.Multer.File[]) {
    const filePaths = await this.imageService.uploadImage(files);
    return files.map((file, index) => ({
      name: file.originalname,
      url: this.imageService.getFileUrl(filePaths[index]),
    }));
  }
		*/
