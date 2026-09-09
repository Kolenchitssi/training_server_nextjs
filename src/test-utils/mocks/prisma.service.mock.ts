type CrudDelegateMock = {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  createMany: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
};

export type PrismaServiceMock = {
  user: CrudDelegateMock;
  post: CrudDelegateMock;
  postImage: CrudDelegateMock;
};

const createCrudDelegateMock = (): CrudDelegateMock => ({
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
});

export const createPrismaServiceMock = (): PrismaServiceMock => ({
  user: createCrudDelegateMock(),
  post: createCrudDelegateMock(),
  postImage: createCrudDelegateMock(),
});
