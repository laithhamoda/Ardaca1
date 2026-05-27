import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'STORAGE_CONFIG',
      useFactory: (configService: ConfigService) => ({
        bucket: configService.get<string>('S3_BUCKET'),
        region: configService.get<string>('S3_REGION'),
        accessKeyId: configService.get<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: configService.get<string>('S3_SECRET_ACCESS_KEY'),
        endpoint: configService.get<string>('S3_ENDPOINT'),
      }),
      inject: [ConfigService],
    },
  ],
  exports: ['STORAGE_CONFIG'],
})
export class StorageConfigModule {}
