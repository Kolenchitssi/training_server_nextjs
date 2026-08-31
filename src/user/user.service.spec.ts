import 'src/test-utils/mocks/generated-prisma-client.mock';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createPrismaServiceMock,
  PrismaServiceMock,
} from 'src/test-utils/mocks/prisma.service.mock';

describe('UserService', () => {
  let service: UserService;
  let prismaMock: PrismaServiceMock;

  beforeEach(async () => {
    prismaMock = createPrismaServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    jest.clearAllMocks();
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all users', async () => {
    const users = [
      {
        id: 'u1',
        name: 'test-user',
        email: 'user01@example.com',
        role: 'GUEST',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    prismaMock.user.findMany.mockResolvedValue(users);

    await expect(service.getAllUsers()).resolves.toEqual(users);
    expect(prismaMock.user.findMany).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when user is missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.getUserById('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should return favorite posts for current user', async () => {
    const favoritePosts = [
      {
        id: 7,
        title: 'Favorite post',
        content: 'Content',
        published: true,
        authorId: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    prismaMock.user.findUnique.mockResolvedValue({ favoritePosts });

    await expect(service.getUserFavorites('u1')).resolves.toEqual(favoritePosts);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: {
        favoritePosts: {
          select: {
            id: true,
            title: true,
            content: true,
            published: true,
            authorId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  });
});
