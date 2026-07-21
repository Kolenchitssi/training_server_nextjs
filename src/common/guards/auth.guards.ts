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
    const request = context.switchToHttp().getRequest() as Request;
    // const token = request.headers['authorization']?.split(' ')[1];
    const token = getBearerToken(request.headers['authorization']);
    const tokenValidationResult = token
      ? validateAccessToken(token)
      : {
          isValid: false,
          // isExpired: false,
          // isConfigError: false,
          // errorMessage: 'Token is missing',
        };
    const isValid = tokenValidationResult.isValid;
    if (!isValid) {
      throw new UnauthorizedException('Invalid or missing token');
    }
    return isValid;
  }
}
