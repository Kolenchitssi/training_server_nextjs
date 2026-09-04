import 'src/test-utils/mocks/generated-prisma-client.mock';
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { createUserServiceMock } from 'src/test-utils/mocks/services.mock';

describe('UserController', () => {
  let controller: UserController;
  let serviceMock: ReturnType<typeof createUserServiceMock>;

  beforeEach(async () => {
    serviceMock = createUserServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findAllUsers to service', async () => {
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

    serviceMock.getAllUsers.mockResolvedValue(users);

    await expect(controller.findAllUsers()).resolves.toEqual(users);
    expect(serviceMock.getAllUsers).toHaveBeenCalledTimes(1);
  });

  it('should delegate getFavorites to service for current user', async () => {
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

    serviceMock.getUserFavorites.mockResolvedValue(favoritePosts);

    await expect(controller.getFavorites({ user: { id: 'u1' } } as any)).resolves.toEqual(
      favoritePosts,
    );
    expect(serviceMock.getUserFavorites).toHaveBeenCalledWith('u1');
  });

  it('should delegate getAvatar to service for current user', async () => {
    serviceMock.getAvatar.mockResolvedValue({ avatarUrl: '/uploads/avatars/u1.jpg' });

    await expect(controller.getAvatar({ user: { id: 'u1' } } as any)).resolves.toEqual({
      avatarUrl: '/uploads/avatars/u1.jpg',
    });

    expect(serviceMock.getAvatar).toHaveBeenCalledWith('u1');
  });
});
