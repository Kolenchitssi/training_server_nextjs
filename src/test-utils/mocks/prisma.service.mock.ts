type CrudDelegateMock = {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
};

export type PrismaServiceMock = {
  user: CrudDelegateMock;
  post: CrudDelegateMock;
};

const createCrudDelegateMock = (): CrudDelegateMock => ({
  findMany: jest.fn(),
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

export const createPrismaServiceMock = (): PrismaServiceMock => ({
  user: createCrudDelegateMock(),
  post: createCrudDelegateMock(),
});
