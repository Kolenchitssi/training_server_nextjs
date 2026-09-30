import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { FilesModule } from 'src/files/files.module';
import { AuthGuard } from 'src/common/guards/auth.guards';
import { PostImagesCleanupService } from './jobs/post-images-cleanup.service';
import { PostAdminController } from './post-admin.controller';

@Module({
  imports: [FilesModule],
  controllers: [PostController, PostAdminController],
  providers: [PostService, AuthGuard, PostImagesCleanupService],
  exports: [PostImagesCleanupService],
})
export class PostModule {}
