import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  constructor(private configService: ConfigService) {
    const databaseUrl = process.env.DATABASE_URL || 
      `postgresql://${process.env.DATABASE_USER || 'ardaca_user'}:${process.env.DATABASE_PASSWORD || 'ardaca_password'}@${process.env.DATABASE_HOST || 'postgres'}:${process.env.DATABASE_PORT || 5432}/${process.env.DATABASE_NAME || 'ardaca'}`;

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? 
        ['query', 'info', 'warn', 'error'] : 
        ['error'],
    });

    this.logger.debug(`Database URL: ${databaseUrl.replace(/:[^:]*@/, ':***@')}`);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
