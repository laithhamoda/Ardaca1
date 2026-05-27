# CRITICAL SECURITY FIXES - IMPLEMENTATION GUIDE
## COORDIN8 Urgent Remediation Steps

---

## ISSUE #1: Unencrypted PostgreSQL & Redis Connections

### Fix 1.1: Enable PostgreSQL SSL/TLS

**File: `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: ardaca-postgres
    environment:
      POSTGRES_DB: ardaca
      POSTGRES_USER: ardaca_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # Use env var, not hardcoded
      POSTGRES_INITDB_ARGS: |
        -c ssl=on
        -c ssl_cert_file=/var/lib/postgresql/server.crt
        -c ssl_key_file=/var/lib/postgresql/server.key
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./certs/server.crt:/var/lib/postgresql/server.crt:ro
      - ./certs/server.key:/var/lib/postgresql/server.key:ro
    ports:
      - "5432:5432"  # ONLY for dev; remove in production

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    environment:
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    ports:
      - "6379:6379"  # ONLY for dev; remove in production
```

**File: `backend/.env`**

```env
# DO NOT hardcode these; load from secrets manager
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=ardaca_user
DATABASE_PASSWORD=${DB_PASSWORD}  # Load from AWS Secrets Manager
DATABASE_NAME=ardaca
DATABASE_SSL_MODE=require
DATABASE_SSL_CERT=/app/certs/ca.crt

REDIS_URL=rediss://default:${REDIS_PASSWORD}@redis:6379  # rediss = Redis over TLS
```

**File: `backend/src/config/typeorm.ts`**

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const sslMode = configService.get('DATABASE_SSL_MODE') || 'disable';
  
  let ssl = false;
  if (sslMode === 'require') {
    ssl = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(configService.get('DATABASE_SSL_CERT')),
    };
  }

  return {
    type: 'postgres',
    host: configService.get('DATABASE_HOST'),
    port: parseInt(configService.get('DATABASE_PORT')),
    username: configService.get('DATABASE_USER'),
    password: configService.get('DATABASE_PASSWORD'),
    database: configService.get('DATABASE_NAME'),
    ssl: ssl,
    synchronize: false,
    logging: false,
  };
};
```

**File: `backend/src/services/redis.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async connect() {
    this.client = createClient({
      url: this.configService.get('REDIS_URL'),
      // Enable TLS if using rediss://
      tls: this.configService.get('REDIS_URL').startsWith('rediss') ? {} : undefined,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    await this.client.connect();
  }

  async disconnect() {
    await this.client.quit();
  }

  // ... rest of Redis methods
}
```

### Fix 1.2: Generate Self-Signed Certificates (Dev Only)

```bash
#!/bin/bash
# generate-certs.sh - Run ONCE for local development

mkdir -p certs

# Generate PostgreSQL certificates
openssl req -new -x509 -days 365 -nodes -out certs/server.crt -keyout certs/server.key -subj "/CN=postgres"
chmod 600 certs/server.key

# Generate Redis CA certificate (for rediss://)
openssl genrsa -out certs/ca-key.pem 2048
openssl req -new -x509 -days 365 -key certs/ca-key.pem -out certs/ca.crt -subj "/CN=redis"

echo "✓ Certificates generated in certs/ directory"
```

---

## ISSUE #2: Default Credentials in Version Control

### Fix 2.1: Move to Environment Variables

**File: `.env.local` (LOCAL DEVELOPMENT ONLY)**

```env
# Never commit this file! Add to .gitignore
NODE_ENV=development
DATABASE_HOST=postgres
DATABASE_USER=ardaca_user
DATABASE_PASSWORD=dev_password_change_in_prod
DATABASE_NAME=ardaca
REDIS_PASSWORD=redis_dev_password

JWT_SECRET=dev_jwt_secret_min_32_chars_long
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_min_32_chars
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

AWS_REGION=me-south-1
AWS_S3_BUCKET=ardaca-dev
AWS_ACCESS_KEY_ID=dev_key_id
AWS_SECRET_ACCESS_KEY=dev_secret_key
```

**File: `.gitignore` (Add these lines)**

```
.env
.env.local
.env.*.local
.env.production
*.key
*.crt
secrets/
```

**File: `backend/.env.production` (Production deployment via AWS Secrets Manager)**

```bash
#!/bin/bash
# This script runs in production container to fetch secrets

# Load secrets from AWS Secrets Manager
fetch_secret() {
  aws secretsmanager get-secret-value \
    --secret-id "coordin8/$1" \
    --region me-south-1 \
    --query SecretString \
    --output text
}

export DATABASE_PASSWORD=$(fetch_secret "db-password")
export JWT_SECRET=$(fetch_secret "jwt-secret")
export JWT_REFRESH_SECRET=$(fetch_secret "jwt-refresh-secret")
export REDIS_PASSWORD=$(fetch_secret "redis-password")
export AWS_ACCESS_KEY_ID=$(fetch_secret "aws-access-key")
export AWS_SECRET_ACCESS_KEY=$(fetch_secret "aws-secret-key")

node dist/main.js
```

### Fix 2.2: AWS Secrets Manager Integration

**File: `backend/src/config/secrets.service.ts`**

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretsService implements OnModuleInit {
  private secretsManager: SecretsManagerClient;
  private secretsCache: Map<string, { value: string; expiry: number }> = new Map();

  constructor(private configService: ConfigService) {
    this.secretsManager = new SecretsManagerClient({
      region: configService.get('AWS_REGION') || 'me-south-1'
    });
  }

  async onModuleInit() {
    // Pre-load critical secrets at startup
    if (this.configService.get('NODE_ENV') === 'production') {
      await this.getSecret('db-password');
      await this.getSecret('jwt-secret');
      await this.getSecret('redis-password');
    }
  }

  async getSecret(secretName: string): Promise<string> {
    // Check cache (1-hour TTL)
    const cached = this.secretsCache.get(secretName);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    try {
      const response = await this.secretsManager.send(
        new GetSecretValueCommand({
          SecretId: `coordin8/${secretName}`,
        })
      );

      const secretValue = response.SecretString;
      this.secretsCache.set(secretName, {
        value: secretValue,
        expiry: Date.now() + 60 * 60 * 1000 // 1 hour cache
      });

      return secretValue;
    } catch (error) {
      throw new Error(`Failed to retrieve secret ${secretName}: ${error.message}`);
    }
  }
}
```

### Fix 2.3: Credential Rotation

**File: `backend/src/services/credential-rotation.service.ts`**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SecretsService } from '@/config/secrets.service';

@Injectable()
export class CredentialRotationService {
  private readonly logger = new Logger('CredentialRotation');

  constructor(private secretsService: SecretsService) {}

  // Rotate credentials every 30 days
  @Cron('0 0 * * *') // Daily check (actual rotation every 30 days)
  async rotateCredentials() {
    this.logger.log('Checking credential rotation schedule...');

    try {
      // Check if 30 days have passed since last rotation
      const lastRotation = await this.getLastRotationDate();
      const daysSinceRotation = (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceRotation >= 30) {
        await this.rotateJwtSecret();
        await this.rotateDbPassword();
        await this.rotateRedisPassword();
        await this.recordRotation();
        this.logger.log('✓ Credentials rotated successfully');
      }
    } catch (error) {
      this.logger.error('Credential rotation failed', error);
      // Alert security team
    }
  }

  private async rotateJwtSecret() {
    // Generate new JWT secret
    const newSecret = require('crypto').randomBytes(32).toString('hex');
    
    // Update in AWS Secrets Manager
    await this.secretsService.updateSecret('jwt-secret', newSecret);
    
    // Keep old secret in rotation (grace period)
    this.logger.log('JWT secret rotated');
  }

  private async rotateDbPassword() {
    // Change database password
    const newPassword = require('crypto').randomBytes(16).toString('hex');
    await this.changeDbPassword(newPassword);
    await this.secretsService.updateSecret('db-password', newPassword);
    this.logger.log('Database password rotated');
  }

  private async rotateRedisPassword() {
    const newPassword = require('crypto').randomBytes(16).toString('hex');
    await this.changeRedisPassword(newPassword);
    await this.secretsService.updateSecret('redis-password', newPassword);
    this.logger.log('Redis password rotated');
  }

  private async recordRotation() {
    // Log to audit trail
    await this.secretsService.logRotation('credentials', new Date());
  }
}
```

---

## ISSUE #3: JWT Token Expiry Too Long

### Fix 3.1: Reduce JWT Expiry

**File: `backend/src/modules/auth/auth.service.ts`**

```typescript
async generateTokens(userId: string, organisationId: string) {
  const accessToken = this.jwtService.sign(
    { sub: userId, organisationId },
    { 
      expiresIn: '15m',  // ← Changed from 24h to 15 minutes
      algorithm: 'HS512'  // Strong algorithm
    }
  );

  const refreshToken = this.jwtService.sign(
    { sub: userId, organisationId },
    {
      expiresIn: '7d',  // Keep refresh token longer
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      algorithm: 'HS512'
    }
  );

  return { accessToken, refreshToken };
}
```

### Fix 3.2: Implement Token Refresh Flow

**File: `backend/src/modules/auth/auth.controller.ts`**

```typescript
@Post('refresh')
@HttpCode(200)
async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
  return this.authService.refreshToken(refreshTokenDto);
}
```

**File: `frontend/lib/api.ts`**

```typescript
import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      withCredentials: true,
    });

    // Request interceptor: Add access token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor: Handle token expiry
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try refresh
          if (!this.refreshPromise) {
            this.refreshPromise = this.refreshAccessToken();
          }

          try {
            const newToken = await this.refreshPromise;
            localStorage.setItem('accessToken', newToken);

            // Retry original request
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return this.client(error.config);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            window.location.href = '/login';
            throw refreshError;
          } finally {
            this.refreshPromise = null;
          }
        }
        throw error;
      }
    );
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await this.client.post('/auth/refresh', { refreshToken });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data.accessToken;
  }

  get<T = any>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  // ... other methods
}

export default new ApiClient().client;
```

---

## ISSUE #4: Missing CSRF Protection

### Fix 4.1: Implement CSRF Tokens

**File: `backend/src/common/middlewares/csrf.middleware.ts`**

```typescript
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate CSRF token on GET requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const token = crypto.randomBytes(32).toString('hex');
      req.session.csrfToken = token;
      res.setHeader('X-CSRF-Token', token);
      return next();
    }

    // Verify CSRF token on state-changing requests
    const token = req.headers['x-csrf-token'] as string;
    if (!token || token !== req.session?.csrfToken) {
      throw new BadRequestException('CSRF token validation failed');
    }

    next();
  }
}
```

**File: `backend/src/app.module.ts`**

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CsrfMiddleware } from '@/common/middlewares/csrf.middleware';

@Module({
  imports: [/* ... */],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
```

**File: `frontend/lib/api.ts`**

```typescript
// Add CSRF token to all requests
export async function makeRequest(method: string, url: string, data?: any) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  const response = await fetch(url, {
    method,
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken || '',
    },
  });

  return response.json();
}
```

**File: `frontend/app/layout.tsx`**

```typescript
// Add CSRF token to HTML head
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const csrfToken = getCsrfToken(); // From server

  return (
    <html>
      <head>
        <meta name="csrf-token" content={csrfToken} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## DEPLOYMENT CHECKLIST

- [ ] Fix critical issues (above)
- [ ] Run security audit script
- [ ] Scan Docker images with Trivy
- [ ] Verify no hardcoded secrets in code
- [ ] Enable Helmet security headers
- [ ] Test JWT refresh flow
- [ ] Verify CSRF protection
- [ ] Test database connection with SSL
- [ ] Run npm audit
- [ ] Conduct code review
- [ ] Deploy to staging
- [ ] Run penetration tests
- [ ] Get security approval
- [ ] Deploy to production

---

**Timeline**: All critical fixes should be completed BEFORE any production deployment.

**Owner**: Security Team  
**Status**: 🔴 IN PROGRESS  
**Target Completion**: May 28, 2026
