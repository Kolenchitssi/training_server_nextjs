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
});
