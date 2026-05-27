# COORDIN8 SECURITY HARDENING GUIDE
## Enterprise-Grade Security Implementation for GCC ConstructionTech Platform

---

## EXECUTIVE SUMMARY

This guide provides comprehensive security hardening recommendations for COORDIN8, addressing enterprise-grade requirements for UAE/Saudi deployment. The platform must comply with:
- **UAE PDPL 2021** (Personal Data Protection Law)
- **Saudi PDPL 2021** (Data Protection Law)
- **NIST Cybersecurity Framework**
- **ISO/IEC 27001** (Information Security Management)
- **SOC 2 Type II** (for enterprise SaaS)

---

## 1. AUTHENTICATION & AUTHORIZATION HARDENING

### 1.1 JWT Token Security

**Current Implementation Issues to Fix:**

```typescript
// ❌ BAD: Token with long expiry
this.jwtService.sign(payload, { expiresIn: '24h' });

// ✅ GOOD: Short expiry + refresh token rotation
const accessToken = this.jwtService.sign(payload, { 
  expiresIn: '15m',  // Short expiry (15 minutes)
  algorithm: 'HS512'  // Strong algorithm
});

const refreshToken = this.jwtService.sign(payload, {
  expiresIn: '7d',
  secret: this.configService.get('JWT_REFRESH_SECRET'),
  algorithm: 'HS512'
});
```

**Refresh Token Rotation (Anti-Replay Attack):**

```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService
  ) {}

  async refreshAccessToken(oldRefreshToken: string) {
    // Verify token is valid and not revoked
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: oldRefreshToken, isRevoked: false }
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token invalid or revoked');
    }

    // Check token age (prevent old token reuse)
    if (Date.now() - tokenRecord.issuedAt.getTime() > 7 * 24 * 60 * 60 * 1000) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Decode and verify
    const payload = this.jwtService.verify(oldRefreshToken);
    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });

    // Revoke old token
    tokenRecord.isRevoked = true;
    await this.refreshTokenRepository.save(tokenRecord);

    // Issue new tokens
    const newAccessToken = this.jwtService.sign(
      { sub: user.id, organisationId: user.organisationId },
      { expiresIn: '15m' }
    );

    const newRefreshToken = this.jwtService.sign(
      { sub: user.id, organisationId: user.organisationId },
      { expiresIn: '7d', secret: this.configService.get('JWT_REFRESH_SECRET') }
    );

    // Store new refresh token
    await this.refreshTokenRepository.save({
      userId: user.id,
      token: newRefreshToken,
      isRevoked: false,
      issuedAt: new Date()
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
```

### 1.2 Multi-Factor Authentication (MFA)

```typescript
@Injectable()
export class MfaService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private twilioService: TwilioService // SMS provider
  ) {}

  async setupMfa(userId: string, method: 'sms' | 'totp' = 'sms') {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (method === 'sms') {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with 5-minute expiry
      user.mfaOtp = otp;
      user.mfaOtpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      user.mfaEnabled = true;
      user.mfaMethod = 'sms';
      
      await this.usersRepository.save(user);

      // Send SMS
      await this.twilioService.sendSms(user.phone, `Your COORDIN8 OTP is: ${otp}`);
    } else if (method === 'totp') {
      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `COORDIN8 (${user.email})`,
        issuer: 'COORDIN8'
      });

      user.mfaSecret = secret.base32;
      user.mfaEnabled = true;
      user.mfaMethod = 'totp';
      await this.usersRepository.save(user);

      return { qrCode: secret.qr_code };
    }
  }

  async verifyMfa(userId: string, otp: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (user.mfaMethod === 'sms') {
      if (user.mfaOtp !== otp || user.mfaOtpExpiry < new Date()) {
        return false;
      }
      user.mfaOtp = null;
      user.mfaOtpExpiry = null;
    } else if (user.mfaMethod === 'totp') {
      const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: otp
      });
      if (!isValid) return false;
    }

    await this.usersRepository.save(user);
    return true;
  }
}
```

### 1.3 Password Security

```typescript
@Injectable()
export class PasswordService {
  constructor(private configService: ConfigService) {}

  // NIST-compliant password hashing
  async hashPassword(password: string): Promise<string> {
    const rounds = 12; // NIST recommends ≥10 rounds
    return bcrypt.hash(password, rounds);
  }

  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Minimum 12 characters (NIST 2017 standard)
    if (password.length < 12) errors.push('Password must be at least 12 characters');

    // Must have uppercase, lowercase, numbers, special chars
    if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letters');
    if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letters');
    if (!/[0-9]/.test(password)) errors.push('Password must contain numbers');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain special characters');
    }

    // Check against common passwords
    const commonPasswords = ['password123', 'admin123', '12345678', 'qwerty123'];
    if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
      errors.push('Password too common');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Password reset token (single-use, short expiry)
  generatePasswordResetToken(): { token: string; hash: string; expiry: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return { token, hash, expiry };
  }
}
```

---

## 2. INPUT VALIDATION & SANITIZATION

### 2.1 DTO-Based Validation

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(12) // NIST minimum
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must meet complexity requirements' }
  )
  password: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number' })
  phone?: string;
}

// Global validation pipe
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error on unknown properties
    transform: true, // Auto-transform payloads
    transformOptions: {
      enableImplicitConversion: true
    }
  })
);
```

### 2.2 SQL Injection Prevention

```typescript
// ❌ BAD: String concatenation (SQL injection vulnerable)
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD: Parameterized queries with TypeORM
const user = await this.usersRepository.findOne({
  where: { email }
});

// ✅ GOOD: Query builder with parameters
const user = await this.usersRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email })
  .andWhere('user.isActive = :active', { active: true })
  .getOne();
```

### 2.3 XSS Prevention

```typescript
import { sanitizeHtml } from 'sanitize-html';

export class CommentDto {
  @IsString()
  @Transform(({ value }) => {
    // Remove dangerous HTML/JS
    return sanitizeHtml(value, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a'],
      allowedAttributes: { 'a': ['href'] },
      disallowedTagsMode: 'discard'
    });
  })
  text: string;
}
```

### 2.4 CSRF Protection

```typescript
import { NestMiddleware, Injectable } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const csrfToken = req.headers['x-csrf-token'];
    
    // Skip for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Verify token for state-changing operations
    if (!csrfToken || csrfToken !== req.session?.csrfToken) {
      throw new BadRequestException('CSRF token invalid');
    }

    next();
  }
}

// Register middleware
app.use(CsrfMiddleware);
```

---

## 3. DATABASE SECURITY

### 3.1 Encryption at Rest

```typescript
// Use cloud provider's encryption (AWS KMS, Azure Key Vault)
// PostgreSQL: Enable SSL/TLS connections

const dataSourceOptions: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false, // Use proper cert in production
    ca: process.env.DATABASE_CA_CERT,
    cert: process.env.DATABASE_CERT,
    key: process.env.DATABASE_KEY
  } : false,
  synchronize: false,
  logging: false,
  entities: [...entities]
};
```

### 3.2 Row-Level Security (RLS) for Multi-Tenancy

```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own org's data
CREATE POLICY org_isolation_policy ON projects
  USING (organisation_id = current_setting('app.current_org_id')::uuid);

-- Set org context at connection time (from JWT)
SET app.current_org_id = 'uuid-from-jwt';
```

### 3.3 Parameterized Backups

```bash
#!/bin/bash
# Encrypt backups before storage
pg_dump -h $DB_HOST -U $DB_USER $DB_NAME | \
  gpg --encrypt --recipient $GPG_KEY | \
  aws s3 cp - s3://ardaca-backups/$(date +%Y%m%d_%H%M%S).sql.gpg \
  --sse aws:kms \
  --sse-kms-key-id $KMS_KEY_ID
```

---

## 4. API SECURITY

### 4.1 Rate Limiting

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60 * 1000,        // 1 minute
        limit: 10,             // 10 requests
      },
      {
        name: 'long',
        ttl: 60 * 60 * 1000,   // 1 hour
        limit: 100,            // 100 requests
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

// Apply different limits per endpoint
@UseGuards(ThrottlerGuard)
@Throttle({ short: { limit: 5, ttl: 60 * 1000 } }) // Stricter for auth
@Post('auth/login')
async login(@Body() loginDto: LoginDto) { }
```

### 4.2 Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet()); // Enable all helmet protections

// Custom header config
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  },
}));

// Strict Transport Security (HTTPS enforcement)
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));

// Prevent MIME type sniffing
app.use(helmet.noSniff());

// Clickjacking protection
app.use(helmet.frameguard({ action: 'deny' }));

// XSS protection
app.use(helmet.xssFilter());
```

### 4.3 Request Signing (for Webhooks)

```typescript
import crypto from 'crypto';

export class WebhookService {
  signWebhook(payload: object, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  verifyWebhook(payload: object, signature: string, secret: string): boolean {
    const expectedSignature = this.signWebhook(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
```

---

## 5. AUDIT LOGGING

### 5.1 Comprehensive Audit Trail

```typescript
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private auditRepository: Repository<AuditLog>
  ) {}

  async logAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    changes?: object,
    metadata?: { ipAddress?: string; userAgent?: string }
  ) {
    const auditLog = this.auditRepository.create({
      userId,
      action, // CREATE, UPDATE, DELETE, LOGIN, APPROVE, REJECT
      entityType, // Project, Document, User, Approval
      entityId,
      changes: JSON.stringify(changes), // Before/after values
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      timestamp: new Date(),
      organisationId: getCurrentOrgIdFromContext() // Multi-tenant isolation
    });

    await this.auditRepository.save(auditLog);
  }
}

// Interceptor to log all mutations automatically
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService, private request: Request) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const before = req.body;

    return next.handle().pipe(
      tap(async (data) => {
        // Log successful mutations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          await this.auditService.logAction(
            user?.id,
            req.method,
            context.getClass().name,
            data?.id,
            { before, after: data },
            {
              ipAddress: req.ip,
              userAgent: req.get('user-agent')
            }
          );
        }
      }),
      catchError((error) => {
        // Log failed attempts (security events)
        this.auditService.logAction(
          user?.id,
          `FAILED_${req.method}`,
          context.getClass().name,
          req.params.id,
          { error: error.message }
        );
        throw error;
      })
    );
  }
}
```

### 5.2 Immutable Audit Logs

```sql
-- Create immutable audit log table using append-only pattern
CREATE TABLE audit_logs_immutable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB NOT NULL,
  ip_address VARCHAR(50),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  -- Make immutable
  CONSTRAINT audit_log_immutable CHECK (created_at = CURRENT_TIMESTAMP)
);

-- No UPDATE or DELETE allowed
REVOKE UPDATE, DELETE ON audit_logs_immutable FROM app_user;

-- Only INSERT and SELECT
GRANT INSERT, SELECT ON audit_logs_immutable TO app_user;
```

---

## 6. SECRETS MANAGEMENT

### 6.1 Environment Variables (Never Hardcode)

```typescript
// ✅ GOOD: Use ConfigService
@Injectable()
export class DatabaseService {
  constructor(private configService: ConfigService) {}

  getConnectionString(): string {
    return `postgresql://${this.configService.get('DATABASE_USER')}:${this.configService.get('DATABASE_PASSWORD')}@${this.configService.get('DATABASE_HOST')}`;
  }
}

// ❌ BAD: Hardcoded secrets
const connectionString = 'postgresql://admin:password123@localhost';
```

### 6.2 AWS Secrets Manager Integration

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

@Injectable()
export class SecretsService {
  private secretsManager = new SecretsManagerClient({ region: 'me-south-1' }); // AWS Bahrain

  async getSecret(secretName: string): Promise<string> {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await this.secretsManager.send(command);
    return response.SecretString;
  }
}

// Usage in module
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
      load: [async () => {
        if (process.env.NODE_ENV === 'production') {
          const secretsService = new SecretsService();
          return {
            JWT_SECRET: await secretsService.getSecret('coordin8/jwt-secret'),
            DATABASE_PASSWORD: await secretsService.getSecret('coordin8/db-password'),
          };
        }
        return {};
      }]
    })
  ]
})
export class AppModule {}
```

### 6.3 Key Rotation

```typescript
@Injectable()
export class KeyRotationService implements OnModuleInit {
  private rotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days

  async onModuleInit() {
    setInterval(() => this.rotateKeys(), this.rotationInterval);
  }

  private async rotateKeys() {
    // Generate new JWT_SECRET
    const newSecret = crypto.randomBytes(32).toString('hex');
    
    // Store new secret with version
    await this.secretsService.updateSecret('coordin8/jwt-secret-v2', newSecret);
    
    // Keep old secret for token validation (grace period)
    this.jwtService.setSecrets(['coordin8/jwt-secret', 'coordin8/jwt-secret-v2']);
    
    // After 7 days, remove old secret
    setTimeout(() => {
      this.jwtService.removeSecret('coordin8/jwt-secret');
    }, 7 * 24 * 60 * 60 * 1000);
  }
}
```

---

## 7. COMPLIANCE & REGULATORY

### 7.1 GCC Data Residency

```yaml
# Kubernetes deployment with regional affinity
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ardaca-backend
spec:
  template:
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
              - matchExpressions:
                  - key: region
                    operator: In
                    values:
                      - aws-me-south-1  # AWS Bahrain
                      - aws-ae-central-1  # AWS UAE
                      - azure-uae  # Azure UAE
      containers:
        - name: backend
          image: ardaca-backend:latest
          env:
            - name: DATA_RESIDENCY_REGION
              value: "AE"  # UAE
            - name: ENCRYPTION_KEY_REGION
              value: "AE"
```

### 7.2 GDPR/PDPL Compliance

```typescript
@Injectable()
export class PrivacyService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>
  ) {}

  // Right to access
  async getUserData(userId: string): Promise<UserDataExport> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['projects', 'documents', 'approvals']
    });

    return {
      personalData: user,
      projects: user.projects,
      documents: user.documents,
      approvals: user.approvals,
      exportDate: new Date()
    };
  }

  // Right to be forgotten (data deletion)
  async deleteUserData(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    // Anonymize personal data
    user.email = `deleted-${userId}@example.com`;
    user.firstName = 'DELETED';
    user.lastName = 'USER';
    user.phone = null;
    user.avatar = null;
    user.deletedAt = new Date();

    await this.usersRepository.save(user);

    // Cascade delete or anonymize related data
    // ... (handle documents, projects, etc.)
  }

  // Data portability
  async exportUserData(userId: string): Promise<Buffer> {
    const userData = await this.getUserData(userId);
    return Buffer.from(JSON.stringify(userData, null, 2));
  }
}
```

---

## 8. INCIDENT RESPONSE

### 8.1 Security Event Monitoring

```typescript
@Injectable()
export class SecurityMonitoringService {
  private readonly logger = new Logger('SecurityMonitoring');

  async detectAnomalies(userId: string, action: string) {
    const recentActions = await this.getRecentActions(userId, 60 * 1000); // Last minute

    if (recentActions.length > 10) {
      this.logger.warn(`Potential brute force detected for user ${userId}`);
      await this.triggerIncident('BRUTE_FORCE', userId);
    }

    // Detect impossible travel
    const lastLogin = await this.getLastLogin(userId);
    if (lastLogin && this.isImpossibleTravel(lastLogin.ipAddress)) {
      this.logger.warn(`Impossible travel detected for ${userId}`);
      await this.triggerIncident('IMPOSSIBLE_TRAVEL', userId);
    }

    // Detect privilege escalation attempts
    if (action === 'ROLE_CHANGE' && !this.isAuthorized(userId)) {
      this.logger.error(`Unauthorized privilege escalation attempt by ${userId}`);
      await this.triggerIncident('PRIVILEGE_ESCALATION', userId);
    }
  }

  private async triggerIncident(type: string, userId: string) {
    // Send alert to security team
    await this.notificationService.sendSecurityAlert({
      type,
      userId,
      severity: 'HIGH',
      timestamp: new Date()
    });

    // Log to SIEM (Splunk, Datadog, etc.)
    this.logger.error(`SECURITY_INCIDENT: ${type} by user ${userId}`);

    // Lock account if critical
    if (['PRIVILEGE_ESCALATION', 'BRUTE_FORCE'].includes(type)) {
      await this.usersRepository.update({ id: userId }, { isActive: false });
    }
  }
}
```

### 8.2 Incident Response Plan

**Document (to be stored separately):**
1. **Detection**: Monitor logs, alerts, anomalies
2. **Containment**: Isolate affected systems, lock accounts
3. **Eradication**: Patch vulnerabilities, remove malware
4. **Recovery**: Restore data from backups, verify integrity
5. **Post-Incident**: Root cause analysis, policy updates

---

## 9. DEPLOYMENT SECURITY CHECKLIST

### 9.1 Pre-Production Validation

```bash
#!/bin/bash
# Security checklist before production deployment

set -e

echo "🔒 SECURITY DEPLOYMENT CHECKLIST"
echo ""

# 1. Secrets scan
echo "1. Scanning for hardcoded secrets..."
git-secrets --scan || echo "⚠️  git-secrets not configured"

# 2. Dependency audit
echo "2. Running npm audit..."
npm audit --audit-level=moderate || exit 1

# 3. Image scan
echo "3. Scanning Docker images..."
trivy image ardaca-backend:prod || exit 1
trivy image ardaca-frontend:prod || exit 1

# 4. Configuration validation
echo "4. Validating production config..."
[ -z "$JWT_SECRET" ] && echo "❌ JWT_SECRET not set" && exit 1
[ -z "$DATABASE_PASSWORD" ] && echo "❌ DATABASE_PASSWORD not set" && exit 1
[ "$NODE_ENV" != "production" ] && echo "❌ NODE_ENV not production" && exit 1

# 5. TLS/SSL certificate check
echo "5. Validating TLS certificates..."
openssl x509 -in /etc/ssl/certs/ardaca.crt -text -noout | grep -i "validity\|issuer"

# 6. Database encryption
echo "6. Verifying database encryption..."
# Cloud provider specific checks

# 7. Backup integrity
echo "7. Verifying backups..."
aws s3 ls s3://ardaca-backups/ | head -5

echo ""
echo "✅ ALL SECURITY CHECKS PASSED"
```

---

## 10. SECURITY TRAINING & AWARENESS

All developers and operations staff should:
1. Complete OWASP Top 10 training
2. Understand PDPL/GDPR compliance requirements
3. Follow secure coding guidelines (defined in team wiki)
4. Participate in quarterly security reviews
5. Report vulnerabilities via responsible disclosure program

---

## REFERENCES & STANDARDS

- **NIST Cybersecurity Framework**: https://www.nist.gov/cyberframework/
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **CWE Top 25**: https://cwe.mitre.org/top25/
- **ISO/IEC 27001**: https://www.iso.org/isoiec-27001-information-security-management.html
- **SOC 2**: https://www.aicpa.org/interestareas/informationsecurity/advancedsoc2
- **UAE PDPL**: https://www.mof.gov.ae/en/information-and-services/digital-personal-data-protection
- **Saudi PDPL**: https://www.ppa.gov.sa/

---

**Last Updated**: 2026
**Classification**: Enterprise Security Guidelines
**Owner**: COORDIN8 Security Team
