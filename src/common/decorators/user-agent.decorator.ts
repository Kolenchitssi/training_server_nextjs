import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const UserAgent = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    // Получаем объект запроса из контекста выполнения и извлекаем заголовок 'user-agent'.
    // switchToHttp() используется для получения контекста HTTP-запроса, а getRequest() возвращает объект запроса.
    const request = context.switchToHttp().getRequest() as Request;
    return request.headers['user-agent'];
  },
);
