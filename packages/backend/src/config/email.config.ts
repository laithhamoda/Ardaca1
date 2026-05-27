import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'EMAIL_CONFIG',
      useFactory: (configService: ConfigService) => ({
        provider: configService.get<string>('EMAIL_PROVIDER', 'smtp'),
        apiKey: configService.get<string>('EMAIL_API_KEY'),
        from: configService.get<string>('EMAIL_FROM', 'noreply@ardaca.com'),
      }),
      inject: [ConfigService],
    },
  ],
  exports: ['EMAIL_CONFIG'],
})
export class EmailConfigModule {}
