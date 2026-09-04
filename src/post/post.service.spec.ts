import 'src/test-utils/mocks/generated-prisma-client.mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PostService } from './post.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilesService } from 'src/files/files.service';
import {
  createPrismaServiceMock,
  PrismaServiceMock,
} from 'src/test-utils/mocks/prisma.service.mock';

describe('PostService', () => {
  let service: PostService;
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
        PostService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: FilesService,
          useValue: filesServiceMock,
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
        imagePath: null,
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
      imagePath: null,
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
            imagePath: true,
            images: {
              select: {
                id: true,
                path: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
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
      imagePath: null,
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

  it('should upload images for own post and return image urls', async () => {
    prismaMock.post.findUnique.mockResolvedValue({
      id: 7,
      authorId: 'user-1',
      images: [
        {
          id: 'img-old',
          path: 'posts/7-old.jpg',
        },
      ],
    });

    filesServiceMock.saveFile
      .mockResolvedValueOnce({
        key: 'posts/7-f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
        url: '/uploads/posts/7-f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
        mimeType: 'image/jpeg',
        size: 4096,
      })
      .mockResolvedValueOnce({
        key: 'posts/7-b0f84f9a-2f32-43f7-bef3-0507f2c4ee3f.png',
        url: '/uploads/posts/7-b0f84f9a-2f32-43f7-bef3-0507f2c4ee3f.png',
        mimeType: 'image/png',
        size: 2048,
      });

    prismaMock.postImage.createMany.mockResolvedValue({ count: 2 });

    await expect(
      service.uploadPostImages('user-1', 7, [
        {
          buffer: Buffer.from('img-1'),
          mimetype: 'image/jpeg',
          originalname: 'img1.jpg',
          size: 4096,
        },
        {
          buffer: Buffer.from('img-2'),
          mimetype: 'image/png',
          originalname: 'img2.png',
          size: 2048,
        },
      ]),
    ).resolves.toEqual({
      imageUrls: [
        '/uploads/posts/7-f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg',
        '/uploads/posts/7-b0f84f9a-2f32-43f7-bef3-0507f2c4ee3f.png',
      ],
    });

    expect(filesServiceMock.saveFile).toHaveBeenCalledWith({
      buffer: Buffer.from('img-1'),
      mimeType: 'image/jpeg',
      folder: 'posts',
      fileName: expect.stringMatching(
        /^7-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
    });
    expect(prismaMock.postImage.createMany).toHaveBeenCalledWith({
      data: [
        { postId: 7, path: 'posts/7-f4f36273-3ab8-4b6a-b495-e6df2f3678cd.jpg' },
        { postId: 7, path: 'posts/7-b0f84f9a-2f32-43f7-bef3-0507f2c4ee3f.png' },
      ],
    });
    expect(filesServiceMock.deleteFile).not.toHaveBeenCalledWith('posts/7-old.jpg');
  });

  it('should throw ForbiddenException when uploading image to another user post', async () => {
    prismaMock.post.findUnique.mockResolvedValue({
      id: 7,
      authorId: 'user-2',
      images: [],
    });

    await expect(
      service.uploadPostImages('user-1', 7, [
        {
          buffer: Buffer.from('img'),
          mimetype: 'image/jpeg',
          originalname: 'img.jpg',
          size: 2048,
        },
      ]),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(filesServiceMock.saveFile).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when total images exceed limit', async () => {
    prismaMock.post.findUnique.mockResolvedValue({
      id: 7,
      authorId: 'user-1',
      images: [
        { id: '1', path: 'posts/7-1.jpg' },
        { id: '2', path: 'posts/7-2.jpg' },
        { id: '3', path: 'posts/7-3.jpg' },
        { id: '4', path: 'posts/7-4.jpg' },
      ],
    });

    await expect(
      service.uploadPostImages('user-1', 7, [
        {
          buffer: Buffer.from('img-1'),
          mimetype: 'image/jpeg',
          originalname: 'img1.jpg',
          size: 1024,
        },
        {
          buffer: Buffer.from('img-2'),
          mimetype: 'image/png',
          originalname: 'img2.png',
          size: 1024,
        },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(filesServiceMock.saveFile).not.toHaveBeenCalled();
  });
});
