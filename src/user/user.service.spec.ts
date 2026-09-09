import 'src/test-utils/mocks/generated-prisma-client.mock';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilesService } from 'src/files/files.service';
import { Logger } from 'nestjs-pino/Logger';
import {
  createPrismaServiceMock,
  PrismaServiceMock,
} from 'src/test-utils/mocks/prisma.service.mock';

describe('UserService', () => {
  let service: UserService;
  let prismaMock: PrismaServiceMock;
  let filesServiceMock: jest.Mocked<
    Pick<FilesService, 'saveFile' | 'deleteFile' | 'getPublicUrl'>
  >;

  beforeEach(async () => {
    prismaMock = createPrismaServiceMock();
    filesServiceMock = {
      saveFile: jest.fn(),
      deleteFile: jest.fn(),
      getPublicUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: FilesService,
          useValue: filesServiceMock,
        },
        {
          provide: Logger,
          useValue: {
            verbose: jest.fn(),
            debug: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            fatal: jest.fn(),
          },
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

  it('should upload avatar and return public url', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      avatarPath: 'avatars/u1.png',
    });
    prismaMock.user.update.mockResolvedValue({
      id: 'u1',
      avatarPath: 'avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
    });
    filesServiceMock.saveFile.mockResolvedValue({
      key: 'avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
      url: '/uploads/avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
    });

    await expect(
      service.uploadAvatar('u1', {
        buffer: Buffer.from('file'),
        mimetype: 'image/jpeg',
        originalname: 'avatar.jpg',
        size: 1024,
      }),
    ).resolves.toEqual({
      avatarUrl: '/uploads/avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
    });

    expect(filesServiceMock.saveFile).toHaveBeenCalledWith({
      buffer: Buffer.from('file'),
      mimeType: 'image/jpeg',
      folder: 'avatars',
      fileName: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { avatarPath: 'avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg' },
    });
    expect(filesServiceMock.deleteFile).toHaveBeenCalledWith('avatars/u1.png');
  });

  it('should return avatar url for current user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      avatarPath: 'avatars/u1.jpg',
    });
    filesServiceMock.getPublicUrl.mockReturnValue('/uploads/avatars/u1.jpg');

    await expect(service.getAvatar('u1')).resolves.toEqual({
      avatarUrl: '/uploads/avatars/u1.jpg',
    });

    expect(filesServiceMock.getPublicUrl).toHaveBeenCalledWith('avatars/u1.jpg');
  });

  it('should not fail upload when old avatar cleanup fails', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      avatarPath: 'avatars/old-avatar.jpg',
    });
    prismaMock.user.update.mockResolvedValue({
      id: 'u1',
      avatarPath: 'avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
    });
    filesServiceMock.saveFile.mockResolvedValue({
      key: 'avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
      url: '/uploads/avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
    });
    filesServiceMock.deleteFile.mockRejectedValueOnce(new Error('disk I/O error'));

    await expect(
      service.uploadAvatar('u1', {
        buffer: Buffer.from('file'),
        mimetype: 'image/jpeg',
        originalname: 'avatar.jpg',
        size: 1024,
      }),
    ).resolves.toEqual({
      avatarUrl: '/uploads/avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { avatarPath: 'avatars/f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg' },
    });
    expect(filesServiceMock.deleteFile).toHaveBeenCalledWith('avatars/old-avatar.jpg');
  });

  it('should delete user and remove avatar file from disk if present', async () => {
    const deletedRecord = {
      id: 'u1',
      name: 'User 1',
      email: 'user1@test.com',
      role: 'GUEST' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatarPath: 'avatars/u1-avatar.jpg',
    };

    prismaMock.user.delete.mockResolvedValue(deletedRecord);
    filesServiceMock.deleteFile.mockResolvedValue();

    const result = await service.deleteUser('u1');

    expect(result).toEqual({
      id: 'u1',
      name: 'User 1',
      email: 'user1@test.com',
      role: 'GUEST',
      createdAt: deletedRecord.createdAt,
      updatedAt: deletedRecord.updatedAt,
    });
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: expect.objectContaining({ avatarPath: true }),
    });
    expect(filesServiceMock.deleteFile).toHaveBeenCalledWith('avatars/u1-avatar.jpg');
  });

  it('should delete user without file removal if avatar is null', async () => {
    const deletedRecord = {
      id: 'u2',
      name: 'User 2',
      email: 'user2@test.com',
      role: 'GUEST' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatarPath: null,
    };

    prismaMock.user.delete.mockResolvedValue(deletedRecord);

    const result = await service.deleteUser('u2');

    expect(result.id).toBe('u2');
    expect(filesServiceMock.deleteFile).not.toHaveBeenCalled();
  });
});
