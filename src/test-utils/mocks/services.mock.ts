export const createPostServiceMock = () => ({
  createPost: jest.fn(),
  getAllPosts: jest.fn(),
  getPostById: jest.fn(),
  updatePost: jest.fn(),
  partialUpdatePost: jest.fn(),
  deletePost: jest.fn(),
});

export const createUserServiceMock = () => ({
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  partialUpdateUser: jest.fn(),
  deleteUser: jest.fn(),
});