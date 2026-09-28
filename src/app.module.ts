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
import { ScheduleModule } from '@nestjs/schedule';
import { ValueNotClassExampleModule } from './value-not-class-example/value-not-class-example.module';
import { valueNotClassExampleValue } from './value-not-class-example/value-not-class-example.service';
import { ValueClassExampleModule } from './value-class-example/value-class-example.module';

@Module({
  imports: [
    // это динамический импорт конфигурации, который позволяет использовать  конфигурацию для настройки поведения импортируемого модуля
    // обычно метод называют forRoot() или register()
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
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    PostModule,
    ValueNotClassExampleModule,
    ValueClassExampleModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TransformResponseInterceptor,
    AllExceptionFilter,
    AuthGuard,
    // пример импорта провайдера который просто значение и
    // тогда мы сможем получать это значение через DI в app.service.
    {
      provide: 'FIRST_VALUE',
      useValue: 'First value', // здесь мог бы быть сервис котрый возвращает значение для внедрения через DI куак в примере нижк
    },
    {
      // мы задаем имя(токен) для провайдера, чтобы потом можно было его использовать через DI
      // по этому мы можем использовать этот токен 'VALUE_NOT_CLASS_EXAMPLE' для внедрения ValueNotClassExampleService через DI в других частях приложения.
      provide: 'VALUE_NOT_CLASS_EXAMPLE',
      // здесь мы получаем просто значение
      useValue: valueNotClassExampleValue,
    },
  ],
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
