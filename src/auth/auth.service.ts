import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { createAccessToken, IssuedAccessToken } from 'src/common/utils/token';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

// Коэффициент сложности (cost factor) для хеширования пароля в bcrypt.
const PASSWORD_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  mockLogin(): IssuedAccessToken {
    const token = createAccessToken({
      sub: 'fbcebc6b-2864-41d1-a6e4-dc5dd3041c3d', // sub это идентификатор пользователя (user id) в JWT payload
      email: 'testUser@example.com',
      role: 'ADMIN',
      expiresIn: 36000,
    });
    return token;
  }

  async login(dto: LoginDto): Promise<IssuedAccessToken> {
    // Email уникален, поэтому используем его как однозначный идентификатор для логина.
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // bcrypt-хеши начинаются с $2a$, $2b$ или $2y$.
    // Это нужно для совместимости со старыми записями, где пароль мог быть в открытом виде.
    const isHashPassword = /^\$2[aby]\$\d{2}\$/.test(user.password);
    const isPasswordValid = isHashPassword
      ? await compare(dto.password, user.password)
      : dto.password === user.password;

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Одноразовая миграция: при успешном legacy-логине сохраняем пароль уже как bcrypt-хеш.
    if (!isHashPassword) {
      const hashedPassword = await hash(dto.password, PASSWORD_SALT_ROUNDS);
      await this.prismaService.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    return createAccessToken({
      sub: user.id, //sub это идентификатор пользователя (user id) в JWT payload
      email: user.email,
      role: user.role,
    });
  }
}
