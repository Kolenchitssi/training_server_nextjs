import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';

jest.mock('src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaServiceMock: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  const initialJwtSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterAll(() => {
    process.env.JWT_SECRET = initialJwtSecret;
  });

  beforeEach(async () => {
    prismaServiceMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should login and return token for valid email and hashed password', async () => {
    const plainPassword = 'Pass1234';
    const hashedPassword = await hash(plainPassword, 10);

    prismaServiceMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'GUEST',
    });

    const result = await service.login({
      email: 'user@example.com',
      password: plainPassword,
    });

    expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    expect(prismaServiceMock.user.update).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        token: expect.any(String),
      }),
    );
  });

  it('should throw UnauthorizedException when user does not exist', async () => {
    prismaServiceMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'Pass1234' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when password is invalid', async () => {
    const hashedPassword = await hash('Pass1234', 10);

    prismaServiceMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'GUEST',
    });

    await expect(
      service.login({ email: 'user@example.com', password: 'Wrong123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should rehash legacy plain password on successful login', async () => {
    prismaServiceMock.user.findUnique.mockResolvedValue({
      id: 'legacy-user',
      email: 'legacy@example.com',
      password: 'Pass1234',
      role: 'GUEST',
    });

    await service.login({
      email: 'legacy@example.com',
      password: 'Pass1234',
    });

    expect(prismaServiceMock.user.update).toHaveBeenCalledTimes(1);
    expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
      where: { id: 'legacy-user' },
      data: {
        password: expect.stringMatching(/^\$2[aby]\$\d{2}\$/),
      },
    });
  });
});
