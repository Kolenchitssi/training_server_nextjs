import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { StringToLowercasePipe } from 'src/common/pipes/string-to-lowercase.pipe';

@Controller({
  path: 'auth', // префикс маршрута для всех маршрутов внутри контроллера AuthController.
  host: 'localhost', // можно указать хост для контроллера. Это ограничит доступ к маршрутам данного контроллера только с указанного хоста.
  //или массив хостов, например: host: ['localhost', '127.0.0.1'],
  // можно добавить дополнительные настройки для контроллера, например guards, interceptors и т.д.
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('mock-login')
  mockLogin() {
    return this.authService.mockLogin();
  }

  // пример использования Pipe
  @UsePipes(StringToLowercasePipe)
  @Post('test-pipe')
  testPipe(@Body('name') name: string, @Body('email') email: string) {
    return `testPipe works. name:${name} - email: ${email}`;
  }
}
