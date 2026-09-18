// import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import type { Env } from './config/env';
import { validateEnv } from './config/validation';
import { LoggerModule } from 'nestjs-pino';
import defaults from './config/defaults';
// import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { PostModule } from './post/post.module';
import { TransformResponseInterceptor } from './common/interceptors/responce.interceptor';
import { AllExceptionFilter } from './common/filters/all-exceptions.filter';
import { AuthGuard } from './common/guards/auth.guards';

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
    // MulterModule добавили  его не потому, что без него приложение не работает,
    //  а чтобы вынести настройку загрузки файлов в конфиг.
    //
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env>) => {
        const maxUploadSizeMb = configService.get<number>('MAX_UPLOAD_SIZE_MB') ?? 10;
        // можно использовать getOrThrow тогда приложение упадет с ошибкой, если переменная окружения не задана.
        // а не тихо подставит 10
        const maxUploadSizeBytes = maxUploadSizeMb * 1024 * 1024;

        return {
          limits: {
            fileSize: maxUploadSizeBytes,
          },
        };
      },
    }),
    // Логирование HTTP-запросов с использованием pino-pretty в режиме разработки
    // для удобного форматирования логов в режиме разработки
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env>) => {
        const nodeEnv = configService.get<Env['NODE_ENV']>('NODE_ENV') ?? 'development';
        const isDevelopment = nodeEnv === 'development';

        return {
          pinoHttp: {
            level: isDevelopment ? 'debug' : 'info', // todo лучше через .env LOG_LEVEL уровень логирования в зависимости от окружения
            redact: ['req.headers.authorization'], // это нужно для того, чтобы скрыть авторизационный заголовок в логах
            // указывает на способ форматирования логов, например, использование pino-pretty в режиме разработки
            transport: isDevelopment
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
        };
      },
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    PostModule,
  ],
  controllers: [AppController],
  providers: [AppService, TransformResponseInterceptor, AllExceptionFilter, AuthGuard],
  // добавляем TransformResponseInterceptor в providers, чтобы его можно было использовать в app.module.ts
  // AllExceptionFilter и AuthGuard также добавлены в providers, чтобы их можно было использовать в app.module.ts через DI.
})
export class AppModule {}

//* вариант для подключения middleware в AppModule через implements NestModule
// В декораторе нет места для промежуточного Применения middleware, поэтому используется configure метод

// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(LoggerMiddleware).forRoutes('*');
//   }
// }

//*
// forRoutes() может принимать строку с путем, объект RouteInfo или массив таких объектов, чтобы указать, к каким маршрутам применять middleware.
// exclude() используется для исключения определенных маршрутов из применения middleware.
//метод принимает один или несколько объектов, идентифицирующих маршруты , pathкоторые methodнеобходимо исключить, как показано ниже:
// consumer.apply(LoggerMiddleware).exclude(
//   { path: 'auth', method: RequestMethod.ALL },
//   { path: 'user', method: RequestMethod.GET },
// ).forRoutes('*');
