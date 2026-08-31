import 'src/test-utils/mocks/generated-prisma-client.mock';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PostService } from './post.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createPrismaServiceMock,
  PrismaServiceMock,
} from 'src/test-utils/mocks/prisma.service.mock';

describe('PostService', () => {
  let service: PostService;
  let prismaMock: PrismaServiceMock;

  beforeEach(async () => {
    prismaMock = createPrismaServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    jest.clearAllMocks();
    service = module.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all posts', async () => {
    const posts = [
      {
        id: 1,
        title: 'Test post',
        content: 'Content',
        published: false,
        authorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    prismaMock.post.findMany.mockResolvedValue(posts);

    await expect(service.getAllPosts()).resolves.toEqual(posts);
    expect(prismaMock.post.findMany).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException when post is missing', async () => {
    prismaMock.post.findUnique.mockResolvedValue(null);

    await expect(service.getPostById(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should add a post to current user favorites', async () => {
    const post = {
      id: 7,
      title: 'Favorite post',
      content: 'Content',
      published: true,
      authorId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prismaMock.post.findUnique.mockResolvedValue({ id: 7 });
    prismaMock.user.update.mockResolvedValue({
      favoritePosts: [post],
    });

    await expect(service.addPostToFavorites('user-1', 7)).resolves.toEqual(post);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { id: true },
    });
    expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        favoritePosts: {
          connect: { id: 7 },
        },
      },
      select: {
        favoritePosts: {
          where: { id: 7 },
          select: {
            id: true,
            title: true,
            content: true,
            published: true,
            authorId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  });

  it('should remove a post from current user favorites', async () => {
    const post = {
      id: 7,
      title: 'Favorite post',
      content: 'Content',
      published: true,
      authorId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1' });
    prismaMock.post.findUnique.mockResolvedValue(post);
    prismaMock.user.update.mockResolvedValue({});

    await expect(service.removePostFromFavorites('user-1', 7)).resolves.toEqual(post);
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        favoritePosts: {
          disconnect: { id: 7 },
        },
      },
    });
  });
});
