export const createPostServiceMock = () => ({
  createPost: jest.fn(),
  getAllPosts: jest.fn(),
  getPostById: jest.fn(),
  updatePost: jest.fn(),
  partialUpdatePost: jest.fn(),
  deletePost: jest.fn(),
  uploadPostImages: jest.fn(),
  replacePostImage: jest.fn(),
  deletePostImage: jest.fn(),
  addPostToFavorites: jest.fn(),
  removePostFromFavorites: jest.fn(),
});

export const createUserServiceMock = () => ({
  getAllUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  partialUpdateUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserFavorites: jest.fn(),
  getAvatar: jest.fn(),
  uploadAvatar: jest.fn(),
});
