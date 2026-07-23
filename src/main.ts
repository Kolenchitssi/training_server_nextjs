import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// import { loggerMiddlewareForMain } from './common/middlewares/logger.middleware';
import { Logger } from 'nestjs-pino/Logger';
// import { AuthGuard } from './common/guards/auth.guards';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // включаем буферизацию логов для использования с pino
  });

  // Настройка CORS для разрешения запросов с указанных источников и с определенными методами и заголовками.
  app.enableCors({
    origin: ['https://site.com', 'https://admin.site.com', 'http://localhost:3000'], // разрешаем запросы с указанных источников
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

  // Включаем глобальный guard для аутентификации.
  // app.useGlobalGuards(new AuthGuard());

  app.setGlobalPrefix('api', {
    exclude: ['test', 'mock', 'health'],
  }); // Устанавливаем глобальный префикс для всех маршрутов, например, все маршруты будут начинаться с /api.
  //кроме маршрутов, указанных в exclude, все остальные маршруты будут иметь префикс /api.

  // app.use(loggerMiddlewareForMain);// заменил на pino
  app.useLogger(app.get(Logger));

  const PORT = process.env.PORT ?? 5001;
  console.log(`✅ Server running on http://localhost:${PORT}`);
  await app.listen(PORT);
}
bootstrap(); // Запускаем приложение NestJS.
