import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Inject,
  Logger as NestLogger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Logger as PinoLogger } from 'nestjs-pino';

// как фильтра исключений в NestJS.
// Он позволяет перехватывать и обрабатывать исключения, возникающие в приложении.
// Catch это декоратор, который используется для обозначения класса
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  // стандартный способ логирования ошибок в NestJS
  // private readonly logger = new NestLogger(AllExceptionFilter.name);

  // Если мы используем pino, то можно внедрить зависимость PinoLogger через декоратор @Inject.
  @Inject(PinoLogger)
  private readonly logger!: PinoLogger;

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    // Определяем статус код ошибки. Если исключение является экземпляром HttpException, то получаем его статус код, иначе используем 500 (Internal Server Error).
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    // Определяем сообщение ошибки. Если исключение является экземпляром HttpException, то получаем его сообщение, иначе используем 'Internal server error'.
    const message =
      exception instanceof HttpException ? exception.message : 'Internal server error';
    const request = ctx.getRequest<Request>();
    this.logger.error(message, exception);
    // Получим лог ошибки если 1й вариант через NestLogger
    // 2й вариант логирования через PinoLogger

    response.status(status).json({
      success: false,
      status: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
