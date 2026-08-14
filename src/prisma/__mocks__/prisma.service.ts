// Этот файл — ручной mock для PrismaService.
// Jest автоматически подхватит его при вызове jest.mock('src/prisma/prisma.service').
// В тестах мы не хотим подключаться к реальной БД, поэтому возвращаем объект,
// который имитирует методы Prisma и имеет те же поля, что использует Nest-приложение.

export const PrismaService = jest.fn().mockImplementation(() => ({
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  post: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
}));
