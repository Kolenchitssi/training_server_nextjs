import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  type CanActivate,
} from '@nestjs/common';
import { type Request } from 'express';
import { getBearerToken, validateAccessToken } from '../utils/token';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as Request & {
      user?: { id: string };
    };

    // На клиенте токен обычно передают так: Authorization: Bearer <token>
    // Важный момент: getBearerToken разбирает именно этот формат,
    // поэтому тут мы получаем только чистое значение JWT без слова Bearer.
    const token = getBearerToken(request.headers['authorization']);
    const tokenValidationResult = token
      ? validateAccessToken(token)
      : {
          isValid: false,
          payload: null,
          // isExpired: false,
          // isConfigError: false,
          // errorMessage: 'Token is missing',
        };

    const isValid = tokenValidationResult.isValid;
    if (!isValid) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    // JWT payload обычно содержит subject (sub) — это и есть id пользователя.
    // Именно его мы кладём в request.user.id, чтобы дальше в контроллере использовать:
    // @Req() req: Request & { user: { id: string } }
    const userId = tokenValidationResult.payload?.sub;
    if (!userId) {
      throw new UnauthorizedException('Token does not contain user id');
    }

    request.user = { id: userId };

    return true;
  }
}
