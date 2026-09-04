import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';

import { map } from 'rxjs/operators';

// Инттерцептор это класс, который реализует интерфейс NestInterceptor и позволяет перехватывать и изменять
// входящие запросы и исходящие ответы в приложении NestJS.
@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => ({
        // Преобразовываем response в объект с полями success, status и data
        success: true,
        status: 'OK',
        data,
      })),
    );
  }
}
