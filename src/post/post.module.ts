import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { FilesModule } from 'src/files/files.module';
import { AuthGuard } from 'src/common/guards/auth.guards';

@Module({
  imports: [FilesModule],
  controllers: [PostController],
  providers: [PostService, AuthGuard],
})
export class PostModule {}
