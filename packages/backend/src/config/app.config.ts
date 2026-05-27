import { ConfigService } from '@nestjs/config';

export class AppConfig {
  static getPort(configService: ConfigService): number {
    return parseInt(process.env.PORT || configService.get('PORT') || '3000', 10);
  }

  static getNodeEnv(configService: ConfigService): string {
    return process.env.NODE_ENV || configService.get('NODE_ENV') || 'development';
  }

  static isProduction(configService: ConfigService): boolean {
    return this.getNodeEnv(configService) === 'production';
  }

  static getDatabaseConfig(configService: ConfigService) {
    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST || configService.get('DATABASE_HOST') || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || configService.get('DATABASE_USER') || 'postgres',
      password: process.env.DATABASE_PASSWORD || configService.get('DATABASE_PASSWORD') || 'postgres',
      database: process.env.DATABASE_NAME || configService.get('DATABASE_NAME') || 'ardaca',
      synchronize: false,
      logging: this.getNodeEnv(configService) === 'development',
      retryAttempts: 5,
      retryDelay: 3000,
    };
  }

  static getJwtConfig(configService: ConfigService) {
    return {
      secret: process.env.JWT_SECRET || configService.get('JWT_SECRET') || 'dev-secret-key',
      expiresIn: '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET || configService.get('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
      refreshExpiresIn: '7d',
    };
  }

  static getRedisConfig(configService: ConfigService) {
    const redisUrl = process.env.REDIS_URL || configService.get('REDIS_URL') || 'redis://localhost:6379';
    return { url: redisUrl };
  }
}
