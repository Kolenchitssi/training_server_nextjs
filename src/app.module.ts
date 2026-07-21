// import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { validateEnv } from './config/validation';
import defaults from './config/defaults';
// import { LoggerMiddleware } from './common/middlewares/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      // чтобы читал значения из .env файла пакет @nestjs/config надо установить
      isGlobal: true,
      // Use .env.test during Jest/NODE_ENV=test runs, otherwise use .env
      // envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      load: [defaults],
      validate: validateEnv,
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

//* вариант для подключения middleware в AppModule через implements NestModule
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(LoggerMiddleware).forRoutes('*');
//   }
// }
