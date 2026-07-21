import { Injectable } from '@nestjs/common';
import { createAccessToken, IssuedAccessToken } from 'src/common/utils/token';

@Injectable()
export class AuthService {
  mockLogin(): IssuedAccessToken {
    const token = createAccessToken({
      sub: 'test-user',
      email: 'test.user@example.com',
      role: 'user',
      expiresIn: 36000,
    });
    return token;
  }
}
