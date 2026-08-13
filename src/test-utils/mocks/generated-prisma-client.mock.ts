jest.mock('generated/prisma/client', () => {
  class PrismaClient {}

  class PrismaClientKnownRequestError extends Error {
    code: string;

    constructor(message: string, options: { code: string }) {
      super(message);
      this.code = options.code;
    }
  }

  return {
    PrismaClient,
    Prisma: {
      PrismaClientKnownRequestError,
    },
  };
});

export {};
