import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { Logger } from 'nestjs-pino/Logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error(
        'Environment variable DATABASE_URL is required to initialize Prisma',
      );
    }

    const adapter = new PrismaPg({ connectionString }); //добавлен адаптер для подключения к PostgreSQL через PrismaPg
    // Prisma 7 требует adapter при создании PrismaClient.
    // Здесь мы передаем адаптер в конструктор PrismaClient, чтобы Prisma могла использовать его для подключения к базе данных PostgreSQL.
    super({ adapter });
  }

  // Используем декоратор @Inject для внедрения зависимости Logger из модуля nestjs-pino.
  // Это позволяет нам использовать логгер внутри нашего сервиса PrismaService.
  @Inject(Logger)
  private readonly logger!: Logger;

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error(error, 'Failed to connect to database');
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error(error, 'Failed to disconnect from database');
    }
  }
}
