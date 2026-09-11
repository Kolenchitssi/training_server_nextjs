import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { UserAgent } from './common/decorators/user-agent.decorator';
import { AuthGuard } from './common/guards/auth.guards';
import { AllExceptionFilter } from './common/filters/all-exceptions.filter';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Пример использования кастомного декоратора UserAgent
  @Get('me')
  @UseGuards(AuthGuard) // Применяем guard для защиты маршрута
  @UseFilters(AllExceptionFilter) // Применяем фильтр для обработки исключений
  // AllExceptionFilter позволяет получит ответ об ошибке в формате JSON, вместо стандартного HTML ответа об ошибке.
  getMeInfo(@UserAgent() userAgent: string) {
    return {
      id: 0,
      name: 'fakename',
      // чтобы получить информацию о user-agent, мы используем декоратор @UserAgent() в параметрах метода getMeInfo.
      user_agent: userAgent,
    };
  }
}
