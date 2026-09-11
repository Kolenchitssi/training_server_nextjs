// import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { validateEnv } from './config/validation';
import { LoggerModule } from 'nestjs-pino';
import defaults from './config/defaults';
// import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { PostModule } from './post/post.module';
import { TransformResponseInterceptor } from './common/interceptors/responce.interceptor';
import { AllExceptionFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      // чтобы читал значения из .env файла пакет @nestjs/config надо установить
      isGlobal: true,
      expandVariables: true,
      // Use .env.test during Jest/NODE_ENV=test runs, otherwise use .env
      // envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      load: [defaults],
      validate: validateEnv,
    }),
    // Логирование HTTP-запросов с использованием pino-pretty в режиме разработки
    // для удобного форматирования логов в режиме разработки
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info', //todo лучше через .env LOG_LEVEL уровень логирования в зависимости от окружения
        redact: ['req.headers.authorization'], // это нужно для того, чтобы скрыть авторизационный заголовок в логах
        // указывает на способ форматирования логов, например, использование pino-pretty в режиме разработки
        transport:
          process.env.NODE_ENV === 'development'
            ? {
                targets: [
                  {
                    target: 'pino-pretty',
                    level: 'debug',
                    options: {
                      colorize: true,
                    },
                  },
                  {
                    target: 'pino/file',
                    level: 'info',
                    options: {
                      destination: './logs/app-develop.log',
                      mkdir: true,
                    },
                  },
                  {
                    target: 'pino/file',
                    level: 'error',
                    options: {
                      destination: './logs/error.log',
                      mkdir: true,
                    },
                  },
                ],
              }
            : {
                target: 'pino/file',
                level: 'info',
                options: {
                  destination: './logs/app.log', // можно написать  транспорт чтобы удобно просматривать
                  //или google analytics for azure insights
                  mkdir: true,
                },
              },
        // : undefined, // при undefined логирование будет использовать стандартный формат без pino-pretty тоесть обычный JSON-формат логов
      },
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    PostModule,
  ],
  controllers: [AppController],
  providers: [AppService, TransformResponseInterceptor, AllExceptionFilter],
  // добавляем TransformResponseInterceptor в providers, чтобы его можно было использовать в app.module.ts
})
export class AppModule {}

//* вариант для подключения middleware в AppModule через implements NestModule
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(LoggerMiddleware).forRoutes('*');
//   }
// }
