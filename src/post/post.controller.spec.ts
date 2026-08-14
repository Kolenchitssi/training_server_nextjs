import 'src/test-utils/mocks/generated-prisma-client.mock';
import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { createPostServiceMock } from 'src/test-utils/mocks/services.mock';

describe('PostController', () => {
  let controller: PostController;
  let serviceMock: ReturnType<typeof createPostServiceMock>;

  beforeEach(async () => {
    serviceMock = createPostServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<PostController>(PostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate findAllPosts to service', async () => {
    const posts = [
      {
        id: 1,
        title: 'Post',
        content: null,
        published: false,
        authorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    serviceMock.getAllPosts.mockResolvedValue(posts);

    await expect(controller.findAllPosts()).resolves.toEqual(posts);
    expect(serviceMock.getAllPosts).toHaveBeenCalledTimes(1);
  });

  it('should add favorite post for current user', async () => {
    const post = {
      id: 7,
      title: 'Favorite post',
      content: 'Content',
      published: true,
      authorId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    serviceMock.addPostToFavorites.mockResolvedValue(post);

    await expect(
      controller.addPostToFavorites({ user: { id: 'user-1' } } as any, { postId: 7 }),
    ).resolves.toEqual(post);
    expect(serviceMock.addPostToFavorites).toHaveBeenCalledWith('user-1', 7);
  });

  it('should remove favorite post for current user', async () => {
    const post = {
      id: 7,
      title: 'Favorite post',
      content: 'Content',
      published: true,
      authorId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    serviceMock.removePostFromFavorites.mockResolvedValue(post);

    await expect(
      controller.removePostFromFavorites({ user: { id: 'user-1' } } as any, {
        postId: 7,
      }),
    ).resolves.toEqual(post);
    expect(serviceMock.removePostFromFavorites).toHaveBeenCalledWith('user-1', 7);
  });
});
