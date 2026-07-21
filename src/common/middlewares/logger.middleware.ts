import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

//* вариант для подколючения в app.module.ts через app.use() или app.useGlobalPipes()
@Injectable() // Декоратор, который делает этот класс доступным для внедрения зависимостей в NestJS.
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url}`);
    next();
  }
}

// Этот middleware логирует все входящие HTTP-запросы, выводя метод и URL запроса в консоль.
// NestMiddleware - интерфейс, который должен реализовывать класс middleware в NestJS.

//* вариант для подключения в main.ts
export const loggerMiddlewareForMain = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(`${req.method} ${req.url}`);
  next();
};
