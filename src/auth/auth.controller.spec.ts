import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    mockLogin: jest.Mock;
    login: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      mockLogin: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call AuthService.login with LoginDto', async () => {
    const dto: LoginDto = {
      email: 'user@example.com',
      password: 'Pass1234',
    };
    const expectedResult = {
      token: 'jwt-token',
      expiresAt: new Date(),
      expiresInSeconds: 3600,
    };

    authService.login.mockResolvedValue(expectedResult);

    const result = await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expectedResult);
  });
});
