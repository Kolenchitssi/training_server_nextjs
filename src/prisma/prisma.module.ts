import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

//  @Global делает модуль глобальным, что позволяет использовать
// его сервисы в любом месте приложения без необходимости импортировать модуль.
// подключим его 1 раз в AppModule, и он будет доступен во всех других модулях приложения.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
  // Нужно экспортировать PrismaService, чтобы его можно было использовать
  // в других модулях приложения.
})
export class PrismaModule {}
