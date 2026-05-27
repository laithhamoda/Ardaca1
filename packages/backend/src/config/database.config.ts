import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfigService {
  constructor(private readonly configService: ConfigService) {}

  get host(): string {
    return this.configService.get<string>('DB_HOST', 'localhost');
  }

  get port(): number {
    return this.configService.get<number>('DB_PORT', 5432);
  }

  get username(): string {
    return this.configService.get<string>('DB_USERNAME', 'postgres');
  }

  get password(): string {
    return this.configService.get<string>('DB_PASSWORD', 'postgres');
  }

  get database(): string {
    return this.configService.get<string>('DB_NAME', 'ardaca');
  }

  get url(): string {
    return this.configService.get<string>('DATABASE_URL');
  }
}
