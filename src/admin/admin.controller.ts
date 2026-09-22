import { Controller, Post } from '@nestjs/common';
import { PostImagesCleanupService } from 'src/post/jobs/post-images-cleanup.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly cleanupService: PostImagesCleanupService) {}

  // Запрос для ручной очистки изображений постов
  // admin/posts/cleanup-images
  // todo добавить проверку прав администратора перед выполнением очистки
  @Post('posts/cleanup-images')
  async cleanupImages() {
    return this.cleanupService.cleanupOrphanImages();
  }
}
