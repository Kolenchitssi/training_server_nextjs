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
});
