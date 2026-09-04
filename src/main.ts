import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { loggerMiddlewareForMain } from './common/middlewares/logger.middleware';
import { Logger } from 'nestjs-pino/Logger';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';
import { TransformResponseInterceptor } from './common/interceptors/responce.interceptor';
import { AllExceptionFilter } from './common/filters/all-exceptions.filter';
// import { AuthGuard } from './common/guards/auth.guards';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true, // включаем буферизацию логов для использования с pino
  });

  const configService = app.get(ConfigService);
  const fileStorageRoot =
    configService.get<string>('FILE_STORAGE_LOCAL_ROOT') ?? 'uploads';
  const fileStoragePublicPrefix =
    configService.get<string>('FILE_STORAGE_PUBLIC_BASE_PATH') ?? '/uploads';

  // Раздаем файлы как статику из локальной папки хранения.
  app.useStaticAssets(join(process.cwd(), fileStorageRoot), {
    prefix: `${fileStoragePublicPrefix.replace(/\/+$/, '')}/`,
  });

  // Настройка CORS для разрешения запросов с указанных источников и с определенными методами и заголовками.
  app.enableCors({
    origin: ['https://site.com', 'https://admin.site.com', 'http://localhost:3000'], //todo лучше через  .env  разрешаем запросы с указанных источников
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // разрешаем указанные HTTP-методы в кросс-доменных запросах
    allowedHeaders: ['Content-Type', 'Authorization'], // разрешаем указанные заголовки в кросс-доменных запросах
    credentials: true, // разрешаем отправку куки и авторизационных заголовков при кросс-доменных запросах
  });

  // Включаем  валидацию глобально чтобы не нужно было добавлять
  // декоратор @UsePipes(ValidationPipe) в каждом контроллере.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // параметры, которые не указаны в DTO, будут удалены из запроса.
      forbidNonWhitelisted: true, // если в запросе будут присутствовать параметры, которые не указаны в DTO, будет выброшена ошибка.
      transform: true, // автоматически преобразует входные данные в типы, указанные в DTO.
      // Например, если в DTO указано, что параметр должен быть числом, а в запросе приходит строка, ValidationPipe попытается преобразовать строку в число.
    }),
  );

  // Включаем глобальный интерцептор для преобразования всех ответов в единый формат.
  // app.useGlobalInterceptors(new TransformResponseInterceptor()); // 1 вариант, но лучше использовать DI-вариант, чтобы Nest создавал интерцептор как провайдер со всеми зависимостями.
  // Используем DI-вариант: так Nest создаст интерцептор как провайдер со всеми зависимостями.
  // app.useGlobalInterceptors(app.get(TransformResponseInterceptor));
  // Важно: строковый токен 'TransformResponseInterceptor' здесь не подойдет,
  // потому что провайдер зарегистрирован по классу в providers AppModule.

  // Включаем глобальный фильтр для обработки всех исключений в приложении.
  app.useGlobalFilters(new AllExceptionFilter());
  // тут также можно сделать по 2му варианту как и с интерцептором, но я оставил так, чтобы видеть возможные варианты
  //  app.useGlobalFilters(app.get(AllExceptionFilter)); // 2 вариант, но надо зарегистрировать AllExceptionFilter в providers AppModule, чтобы Nest создавал фильтр как провайдер со всеми зависимостями.

  // Включаем глобальный guard для аутентификации.
  //* app.useGlobalGuards(new AuthGuard());

  app.setGlobalPrefix('api', {
    exclude: ['test', 'mock', 'health'],
  }); // Устанавливаем глобальный префикс для всех маршрутов, например, все маршруты будут начинаться с /api.
  //кроме маршрутов, указанных в exclude, все остальные маршруты будут иметь префикс /api.

  // app.use(loggerMiddlewareForMain);// заменил на pino
  app.useLogger(app.get(Logger)); // используем pino для логирования в приложении NestJS

  // Только для development
  // Настройка Swagger документации для API, доступной только в режиме разработки.
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('My test NestJS API')
      .setDescription('Документация API пользователей')
      .setVersion('1.0')
      .addTag('Test server ')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введите JWT токен без префикса Bearer',
        },
        'bearer',
      ) // Добавляем поддержку Bearer Auth в Swagger документации
      .build(); // обязяателно не забыть build

    const document = SwaggerModule.createDocument(app, config, {
      //include: [AppModule], // Указываем, что документация будет генерироваться только для AppModule и его зависимостей.
      extraModels: [], // Здесь можно указать дополнительные модели, которые не связаны напрямую с контроллерами, но должны быть включены в документацию.
      /** дополнительные опции для генерации документации Swagger, такие как:
        include?: Function[];
        extraModels?: Function[];
        ignoreGlobalPrefix?: boolean;
        deepScanRoutes?: boolean; 
        operationIdFactory?: OperationIdFactory;
        linkNameFactory?: (controllerKey: string, methodKey: string, fieldKey: string) => string;
        autoTagControllers?: boolean;
        onlyIncludeDecoratedEndpoints?: boolean;
        excludeDynamicDefaults?: boolean;
        exampleMaxDepth?: number;
       */
    });
    document.security = [{ bearer: [] }]; // Устанавливаем глобальную безопасность для Swagger документации с использованием Bearer Auth.

    SwaggerModule.setup('api-docs', app, document, {
      // api-docs - это путь, по которому будет доступна документация Swagger
      jsonDocumentUrl: 'api-docs-json', // путь для получения JSON документации Swagger
      yamlDocumentUrl: 'api-docs-yaml', // путь для получения YAML документации Swagger
      customSiteTitle: 'My test NestJS API', // заголовок вкладки Swagger в браузере
      swaggerOptions: {
        persistAuthorization: true, // сохраняем авторизацию между перезагрузками страницы Swagger
      },
    }); // находится по url http://localhost:3001/api-docs (или соответствующему порту)
  }

  const PORT = process.env.PORT ?? 5001;
  console.log(`✅ Server running on http://localhost:${PORT}`);
  await app.listen(PORT);
}
bootstrap(); // Запускаем приложение NestJS.
