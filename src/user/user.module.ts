import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { FilesModule } from 'src/files/files.module';
import { AuthGuard } from 'src/common/guards/auth.guards';

@Module({
  imports: [FilesModule],
  controllers: [UserController],
  providers: [UserService, AuthGuard],
})
export class UserModule {}
