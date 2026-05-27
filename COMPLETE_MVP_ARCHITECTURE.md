# ARDACA PHASE-1 MVP – COMPLETE ARCHITECTURE & IMPLEMENTATION GUIDE

## Project Overview
Ardaca is a billion-dollar-class ConstructionTech & PropTech SaaS platform for the GCC market (UAE, Saudi Arabia). This document provides the complete Phase-1 MVP architecture, including backend (NestJS), frontend (Next.js), database schema, infrastructure, and deployment.

---

## TABLE OF CONTENTS
1. Technology Stack
2. Architecture Overview
3. Backend Structure
4. Frontend Structure
5. Database Schema
6. API Endpoints
7. Authentication & Authorization Flow
8. Deployment & Infrastructure
9. Development Setup
10. Security Considerations

---

## 1. TECHNOLOGY STACK

### Backend
- **Framework**: NestJS 10+ (TypeScript)
- **Database**: PostgreSQL 15+
- **ORM**: TypeORM with migrations
- **Authentication**: JWT + Refresh Tokens
- **Authorization**: RBAC (Role-Based Access Control)
- **Validation**: class-validator, class-transformer
- **Logging**: Winston
- **Caching**: Redis with Bull queues
- **File Storage**: AWS S3 (presigned URLs)
- **Real-time**: WebSocket (Socket.IO for notifications)
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + PostCSS RTL plugin
- **UI Components**: shadcn/ui (Radix primitives)
- **State**: React Context API + Hooks
- **HTTP Client**: Axios with interceptors
- **Internationalization**: next-intl (Arabic/English)
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack React Table (advanced features)
- **Charts**: Recharts for analytics

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions / GitLab CI
- **Cloud**: AWS (RDS PostgreSQL, S3, CloudFront)
- **Monitoring**: Winston logs, Sentry
- **DNS**: Cloudflare (with WAF)

---

## 2. ARCHITECTURE OVERVIEW

### Monorepo Structure
```
ardaca/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   ├── config/
│   │   │   │   ├── configuration.ts
│   │   │   │   ├── typeorm.ts
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── email.config.ts
│   │   │   │   └── storage.config.ts
│   │   │   ├── database/
│   │   │   │   ├── entities/ (all 14 entities)
│   │   │   │   ├── migrations/
│   │   │   │   └── seeds/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── organisations/
│   │   │   │   ├── projects/
│   │   │   │   ├── documents/
│   │   │   │   ├── approvals/
│   │   │   │   ├── notifications/
│   │   │   │   ├── admin/
│   │   │   │   ├── audit/
│   │   │   │   └── health/
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   ├── decorators/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── filters/
│   │   │   │   └── pipes/
│   │   │   └── test/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── reset-password/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── projects/
│   │   │   │   ├── documents/
│   │   │   │   ├── approvals/
│   │   │   │   ├── team/
│   │   │   │   └── settings/
│   │   │   ├── api/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/ (shadcn components)
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   └── common/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── i18n.ts
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useOrganisation.ts
│   │   │   ├── useApi.ts
│   │   │   └── useNotifications.ts
│   │   ├── public/
│   │   │   ├── locales/
│   │   │   │   ├── en.json
│   │   │   │   └── ar.json
│   │   │   └── assets/
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── tailwind.config.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   └── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx.conf
├── .env.example
├── README.md
└── ARCHITECTURE.md
```

---

## 3. BACKEND STRUCTURE

### 3.1 Database Entities (14 Total)

All entities use:
- UUID primary keys
- Timestamps (createdAt, updatedAt)
- Soft deletes (deletedAt, nullable)
- Proper indexing for query performance
- Multi-tenancy (organisationId foreign key)

**Entities:**
1. `Organisation` – Tenant container
2. `User` – Platform users
3. `UserOrganisation` – User-Org mapping with roles
4. `Team` – Department/team within org
5. `Project` – Construction/property projects
6. `ProjectMember` – Project team assignments
7. `Document` – Files/drawings with versioning
8. `DocumentVersion` – Version history
9. `Approval` – Approval workflows
10. `ApprovalStep` – Sequential approval steps
11. `Comment` – Threaded comments on docs/approvals
12. `Notification` – User notifications
13. `AuditLog` – Change tracking
14. `AIInsight` – Placeholder for AI features

### 3.2 Module Architecture

Each module follows a clean, layered pattern:

```
modules/{module}/
├── {module}.module.ts      # Module definition
├── {module}.controller.ts  # HTTP handlers
├── {module}.service.ts     # Business logic
├── {module}.repository.ts  # Data access (optional)
├── dto/
│   └── index.ts            # Request/response DTOs
├── guards/                 # Module-specific guards
├── interceptors/           # Module-specific interceptors
└── entities/               # Module-specific entities (if any)
```

### 3.3 Key Services

**AuthService**
- Register, Login, Refresh Token
- Password Reset Flow
- Email Verification
- Token Generation & Validation

**UsersService**
- CRUD user operations
- Invite team members
- Update profile
- Deactivate users

**OrganisationsService**
- Create/update org
- Logo upload
- Settings management
- Multi-org access

**ProjectsService**
- CRUD projects
- Assign members
- Status tracking
- Activity timeline

**DocumentsService**
- Upload with S3 integration
- Versioning (major.minor)
- Folder structure
- Presigned URLs

**ApprovalsService**
- Create approval workflows
- Step management
- Approval/rejection logic
- Audit trail

**NotificationsService**
- In-app notifications
- Email queue (Bull)
- Real-time via WebSocket
- User preferences

**AuditService**
- Log all mutations
- Query audit history
- Compliance reporting

---

## 4. FRONTEND STRUCTURE

### 4.1 Pages & Routing

**Authentication Pages:**
- `/login` – Login form
- `/register` – Registration with org creation
- `/forgot-password` – Password reset request
- `/reset-password/[token]` – Password reset confirmation

**Dashboard Pages (Protected):**
- `/dashboard` – Executive dashboard with KPIs
- `/projects` – Project list & management
- `/projects/[id]` – Project detail & team
- `/documents` – Document library
- `/approvals` – Approval workflow dashboard
- `/team` – Team management & invites
- `/settings` – Org & user settings
- `/admin` – Admin panel (super/org admin only)

### 4.2 Component Hierarchy

**Layout Components:**
- `RootLayout` – Language direction (RTL/LTR), providers
- `AuthLayout` – Login/register layout
- `DashboardLayout` – Sidebar + topbar + main
- `Sidebar` – Collapsible navigation
- `Topbar` – Search, notifications, user menu

**Dashboard Components:**
- `KPICard` – Metric display with trends
- `ProjectCard` – Project summary
- `ApprovalWidget` – Pending approvals
- `ActivityFeed` – Recent activity
- `NotificationBell` – Real-time notifications

**Data Components:**
- `ProjectsTable` – Advanced table with sorting/filtering
- `DocumentsGrid` – Document library with drag-drop
- `ApprovalsTimeline` – Approval step visualization
- `TeamDirectory` – Team member list

### 4.3 Hooks (Custom React Hooks)

```typescript
// Authentication
useAuth() – Current user, login/logout, token refresh
useOrganisation() – Selected org, switch org

// API
useApi() – Generic API calls with error handling
useProjects() – Projects CRUD
useDocuments() – Documents upload/download
useApprovals() – Approval workflow

// UI
useToast() – Toast notifications
useModal() – Modal management
useTheme() – Theme switching
useLanguage() – i18n integration
```

### 4.4 Internationalization (i18n)

**next-intl Setup:**
```
public/locales/
├── en.json  – English translations
└── ar.json  – Arabic translations
```

**Key Features:**
- RTL layout for Arabic (CSS logical properties)
- Language switcher in topbar
- Automatic direction flipping
- Number/date formatting (Intl API)
- Font stacks: Noto Kufi Arabic, Noto Sans

---

## 5. API ENDPOINTS

### 5.1 Authentication API
```
POST   /api/v1/auth/register           – Register new user
POST   /api/v1/auth/login              – Login
POST   /api/v1/auth/refresh            – Refresh access token
POST   /api/v1/auth/password-reset/request    – Request password reset
POST   /api/v1/auth/password-reset/confirm    – Confirm password reset
POST   /api/v1/auth/verify-email       – Verify email
GET    /api/v1/auth/me                 – Current user (protected)
```

### 5.2 Users API
```
GET    /api/v1/users                   – List org users (paginated)
GET    /api/v1/users/:id               – User detail
PATCH  /api/v1/users/:id               – Update user
POST   /api/v1/users/invite            – Invite user to org
POST   /api/v1/users/:id/deactivate    – Deactivate user
GET    /api/v1/users/profile           – Current user profile
PATCH  /api/v1/users/profile           – Update profile
```

### 5.3 Organisations API
```
GET    /api/v1/organisations           – List orgs for current user
GET    /api/v1/organisations/:id       – Org detail
PATCH  /api/v1/organisations/:id       – Update org
POST   /api/v1/organisations/:id/logo  – Upload org logo
GET    /api/v1/organisations/:id/settings  – Org settings
PATCH  /api/v1/organisations/:id/settings  – Update settings
```

### 5.4 Projects API
```
GET    /api/v1/projects                – List org projects (paginated)
POST   /api/v1/projects                – Create project
GET    /api/v1/projects/:id            – Project detail
PATCH  /api/v1/projects/:id            – Update project
DELETE /api/v1/projects/:id            – Soft delete project
POST   /api/v1/projects/:id/members    – Add team member
DELETE /api/v1/projects/:id/members/:memberId    – Remove member
GET    /api/v1/projects/:id/activity   – Activity timeline
```

### 5.5 Documents API
```
GET    /api/v1/projects/:id/documents  – List project documents
POST   /api/v1/projects/:id/documents  – Create/upload document
GET    /api/v1/projects/:id/documents/:docId – Document detail
PATCH  /api/v1/projects/:id/documents/:docId  – Update document
DELETE /api/v1/projects/:id/documents/:docId  – Delete document
POST   /api/v1/documents/:id/versions  – Upload new version
GET    /api/v1/documents/:id/versions  – List versions
GET    /api/v1/documents/:id/download  – Presigned S3 URL
GET    /api/v1/documents/:id/preview   – File preview
```

### 5.6 Approvals API
```
GET    /api/v1/projects/:id/approvals  – List approvals
POST   /api/v1/projects/:id/approvals  – Create approval workflow
GET    /api/v1/approvals/:id           – Approval detail
POST   /api/v1/approvals/:id/approve   – Approve step
POST   /api/v1/approvals/:id/reject    – Reject approval
POST   /api/v1/approvals/:id/comments  – Add comment
GET    /api/v1/approvals/:id/comments  – List comments
```

### 5.7 Notifications API
```
GET    /api/v1/notifications           – List user notifications (paginated)
PATCH  /api/v1/notifications/:id/read  – Mark as read
PATCH  /api/v1/notifications/read-all  – Mark all as read
DELETE /api/v1/notifications/:id       – Delete notification
GET    /api/v1/notifications/preferences – User notification preferences
PATCH  /api/v1/notifications/preferences – Update preferences
```

### 5.8 Admin API
```
GET    /api/v1/admin/users             – All platform users (super admin)
PATCH  /api/v1/admin/users/:id/role    – Change user role
GET    /api/v1/admin/organisations     – All organisations
PATCH  /api/v1/admin/organisations/:id/status  – Activate/deactivate org
GET    /api/v1/admin/audit-logs        – Audit logs (super admin)
GET    /api/v1/admin/stats             – Platform statistics
```

### 5.9 Health & Info API
```
GET    /health                         – Health check
GET    /info                           – API info & version
GET    /api-docs                       – Swagger UI
```

---

## 6. AUTHENTICATION & AUTHORIZATION FLOW

### 6.1 JWT Structure
```json
// Access Token (15 minutes)
{
  "sub": "user-uuid",
  "organisationId": "org-uuid",
  "email": "user@example.com",
  "role": "org_admin",
  "iat": 1234567890,
  "exp": 1234568790
}

// Refresh Token (7 days, stored in httpOnly cookie)
{
  "sub": "user-uuid",
  "organisationId": "org-uuid",
  "iat": 1234567890,
  "exp": 1234600000
}
```

### 6.2 RBAC Roles

| Role | Org | Project | Approvals | Admin |
|------|-----|---------|-----------|-------|
| Super Admin | Full | Full | Full | Full |
| Org Admin | Full | Full | Full | Org |
| Project Manager | Read | Full | Full | None |
| Member | Read | Own | Own | None |
| Viewer | Read | View | View | None |

### 6.3 Multi-Tenant Isolation

**Implementation:**
1. JWT contains `organisationId`
2. All queries filtered by `organisationId` (typeorm QueryBuilder)
3. Global interceptor validates `organisationId` in request
4. Cannot access data from other orgs

**Guard Example:**
```typescript
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(UserRole.ORG_ADMIN, UserRole.PROJECT_MANAGER)
@Post('projects')
async createProject(@Body() dto: CreateProjectDto) {
  // organisationId automatically injected from JWT
}
```

---

## 7. KEY IMPLEMENTATION PATTERNS

### 7.1 Repository Pattern
```typescript
// Generic repository for reuse
@Injectable()
export class BaseRepository<T> {
  constructor(private repository: Repository<T>) {}

  async find(filters: FindOptions): Promise<T[]> { }
  async findOne(id: string): Promise<T> { }
  async create(data: Partial<T>): Promise<T> { }
  async update(id: string, data: Partial<T>): Promise<T> { }
  async delete(id: string): Promise<void> { } // Soft delete
}
```

### 7.2 Error Handling
```typescript
// Custom exception filters
@Catch(TypeOrmError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: TypeOrmError, host: ArgumentsHost) {
    // Handle unique constraints, foreign key errors gracefully
  }
}

// Standard HTTP exceptions with localized messages
throw new BadRequestException('validation.email_already_exists');
```

### 7.3 Logging & Monitoring
```typescript
// Winston logger with structured logging
@Injectable()
export class LoggerService {
  info(message: string, meta?: any) { }
  error(message: string, error: Error, meta?: any) { }
  audit(action: AuditAction, entity: string, entityId: string, changes?: any) { }
}
```

### 7.4 File Upload (S3)
```typescript
// Presigned upload URL for direct browser → S3 upload
POST /api/v1/documents/upload-url
Returns: { uploadUrl, s3Key, expiresIn }

// After upload, webhook confirms
POST /api/v1/documents/confirm-upload (internal)

// Download: Presigned URL with temp access
GET /api/v1/documents/:id/download
Returns: { downloadUrl, expiresIn }
```

### 7.5 Real-Time Notifications (WebSocket)
```typescript
// Socket events
socket.on('approvals:new', (approval) => { })
socket.on('documents:uploaded', (doc) => { })
socket.on('notifications:new', (notif) => { })

// Server-side gateway
@WebSocketGateway()
export class NotificationGateway {
  @SubscribeMessage('join-project')
  handleJoinProject(client: Socket, projectId: string) { }

  broadcastToProject(projectId: string, event: string, data: any) { }
}
```

---

## 8. DATABASE SCHEMA SQL

```sql
-- Organisations
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  logo VARCHAR(255),
  default_language VARCHAR(2) DEFAULT 'en',
  website VARCHAR(255),
  country VARCHAR(50),
  phone VARCHAR(20),
  address TEXT,
  settings TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_organisations_code ON organisations(code);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(500),
  email_verification_token_expiry TIMESTAMP,
  password_reset_token VARCHAR(500),
  password_reset_token_expiry TIMESTAMP,
  language VARCHAR(2) DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);

-- User-Organisation mapping with roles
CREATE TABLE user_organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  permissions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, organisation_id)
);
CREATE INDEX idx_user_organisations_user_id_org_id ON user_organisations(user_id, organisation_id);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  lead_user_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_teams_organisation_id ON teams(organisation_id);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(100),
  location VARCHAR(255),
  address VARCHAR(255),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  status VARCHAR(50) DEFAULT 'draft',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  client_name VARCHAR(255),
  contract_value VARCHAR(20),
  metadata TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_projects_organisation_id_status ON projects(organisation_id, status);

-- Project Members
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  department VARCHAR(255),
  company VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id)
);
CREATE INDEX idx_project_members_project_id_user_id ON project_members(project_id, user_id);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  type VARCHAR(50),
  folder_path VARCHAR(255),
  created_by VARCHAR(255),
  current_version INTEGER DEFAULT 1,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
CREATE INDEX idx_documents_project_id_status ON documents(project_id, status);

-- Document Versions
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number VARCHAR(20) NOT NULL,
  s3_key VARCHAR(255),
  original_file_name VARCHAR(255),
  mime_type VARCHAR(50),
  file_size_bytes INTEGER,
  changelog TEXT,
  uploaded_by VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_document_versions_document_id_version ON document_versions(document_id, version_number);

-- Approvals
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  document_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  workflow_type VARCHAR(50) DEFAULT 'sequential',
  current_step INTEGER DEFAULT 0,
  created_by VARCHAR(255),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_approvals_project_id_status ON approvals(project_id, status);

-- Approval Steps
CREATE TABLE approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  approver_name VARCHAR(255) NOT NULL,
  approver_email VARCHAR(255) NOT NULL,
  approver_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  comment TEXT,
  actioned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_approval_steps_approval_id_step_order ON approval_steps(approval_id, step_order);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  approval_id UUID REFERENCES approvals(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_comments_document_id_created_at ON comments(document_id, created_at);
CREATE INDEX idx_comments_approval_id_created_at ON comments(approval_id, created_at);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'system',
  related_entity_id VARCHAR(255),
  related_entity_type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  email_notification_sent BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user_id_created_at ON notifications(user_id, created_at);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  organisation_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  user_agent VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_organisation_id_created_at ON audit_logs(organisation_id, created_at);
CREATE INDEX idx_audit_logs_entity_type_entity_id ON audit_logs(entity_type, entity_id);

-- AI Insights
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  metadata TEXT,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_ai_insights_organisation_id_created_at ON ai_insights(organisation_id, created_at);
```

---

## 9. DOCKER & DEPLOYMENT

### 9.1 Backend Dockerfile
```dockerfile
# Multi-stage build for NestJS backend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

USER nestjs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### 9.2 Frontend Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### 9.3 docker-compose.yml (Development)
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ardaca-postgres
    environment:
      POSTGRES_DB: ardaca
      POSTGRES_USER: ardaca_user
      POSTGRES_PASSWORD: ardaca_password_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ardaca_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ardaca-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    container_name: ardaca-backend
    environment:
      NODE_ENV: development
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_USER: ardaca_user
      DATABASE_PASSWORD: ardaca_password_dev
      DATABASE_NAME: ardaca
      JWT_SECRET: your-super-secret-jwt-key-change-in-prod
      JWT_REFRESH_SECRET: your-super-secret-refresh-key-change-in-prod
      REDIS_URL: redis://redis:6379
      AWS_REGION: us-east-1
      AWS_ACCESS_KEY_ID: your-aws-key
      AWS_SECRET_ACCESS_KEY: your-aws-secret
      AWS_S3_BUCKET: ardaca-dev
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./packages/backend/src:/app/src
    command: npm run start:dev

  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile
    container_name: ardaca-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000/api
      NODE_ENV: development
    ports:
      - "3001:3000"
    depends_on:
      - backend
    volumes:
      - ./packages/frontend:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:
```

### 9.4 Nginx Configuration
```nginx
upstream backend {
  server backend:3000;
}

upstream frontend {
  server frontend:3000;
}

server {
  listen 80;
  server_name _;

  # Frontend
  location / {
    proxy_pass http://frontend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  # API Backend
  location /api {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # WebSocket support
  location /socket.io {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## 10. DEVELOPMENT SETUP

### 10.1 Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Git

### 10.2 Initial Setup
```bash
# Clone repository
git clone <repo-url>
cd ardaca

# Install dependencies (both packages)
npm install -w packages/backend -w packages/frontend

# Copy environment variables
cp .env.example .env.local

# Start services
docker-compose up -d

# Run migrations (in backend container or locally)
npm run -w packages/backend migration:run

# Seed initial data
npm run -w packages/backend seed

# Access applications
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000/api-docs
# Swagger: http://localhost:3000/api-docs
```

### 10.3 Development Workflow
```bash
# Backend development (with hot reload)
npm run -w packages/backend start:dev

# Frontend development (with hot reload)
npm run -w packages/frontend dev

# Run tests
npm run -w packages/backend test
npm run -w packages/frontend test

# Build for production
npm run -w packages/backend build
npm run -w packages/frontend build

# Lint & format
npm run -w packages/backend lint
npm run -w packages/frontend lint
```

---

## 11. SECURITY CONSIDERATIONS

1. **Authentication**
   - Bcrypt password hashing (min 10 rounds)
   - JWT with short expiry (15 mins)
   - Refresh token rotation
   - httpOnly, Secure cookies

2. **Authorization**
   - RBAC on all endpoints
   - Tenant isolation at DB query level
   - Row-level security (RLS) on PostgreSQL

3. **Input Validation**
   - class-validator DTOs
   - Request size limits
   - File upload MIME validation
   - SQL injection prevention (ORM)

4. **Data Protection**
   - AES-256 encryption for sensitive fields (if needed)
   - PII handling per GDPR
   - Audit logging of all changes
   - Soft deletes for compliance

5. **Infrastructure**
   - Helmet.js for security headers
   - CORS with whitelisted origins
   - Rate limiting (ThrottlerModule)
   - DDoS protection (Cloudflare)
   - WAF rules

6. **Monitoring**
   - Winston structured logging
   - Sentry error tracking
   - CloudWatch/DataDog metrics
   - Alerting on anomalies

---

## 12. PRODUCTION DEPLOYMENT

### 12.1 AWS Deployment (ECS/RDS/S3)
1. RDS PostgreSQL (Multi-AZ, automated backups)
2. ElastiCache Redis (cluster mode)
3. ECS Fargate for containerized backend/frontend
4. Application Load Balancer
5. S3 for file storage + CloudFront CDN
6. CloudWatch for monitoring
7. Route53 for DNS

### 12.2 Environment Variables (Production)
```
DATABASE_HOST=ardaca-prod.xxxxx.rds.amazonaws.com
DATABASE_PORT=5432
JWT_SECRET=<use-secrets-manager>
JWT_REFRESH_SECRET=<use-secrets-manager>
AWS_S3_BUCKET=ardaca-prod
REDIS_URL=<elasticache-endpoint>
SENTRY_DSN=<your-sentry-dsn>
```

### 12.3 CI/CD Pipeline (GitHub Actions)
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm run test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker images
        run: |
          docker build -t ardaca-backend:${{ github.sha }} ./packages/backend
          docker push your-registry/ardaca-backend:${{ github.sha }}
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ardaca-prod \
            --service backend \
            --force-new-deployment
```

---

## 13. FINAL DEPLOYMENT CHECKLIST

- [ ] Database backups configured
- [ ] SSL/TLS certificates installed
- [ ] Environment variables set (no secrets in code)
- [ ] Logging & monitoring active
- [ ] CDN configured (CloudFront)
- [ ] Rate limiting enabled
- [ ] WAF rules applied
- [ ] Email service configured (SendGrid/SES)
- [ ] S3 bucket policies secured
- [ ] Database encryption at rest
- [ ] Automated scaling policies
- [ ] Disaster recovery plan
- [ ] Incident response procedures
- [ ] Security audit completed
- [ ] Performance baseline established

---

## 14. DELIVERABLES SUMMARY

This MVP includes:

✅ **Backend (NestJS)**
- 14 production-ready entities with proper relationships
- 8 fully implemented modules (Auth, Users, Organisations, Projects, Documents, Approvals, Notifications, Audit, Admin, Health)
- Comprehensive error handling & logging
- RBAC with multi-tenant isolation
- S3 file upload with presigned URLs
- WebSocket real-time notifications
- TypeORM migrations & seeds
- Swagger API documentation

✅ **Frontend (Next.js)**
- Full App Router setup with proper layouts
- Authentication flows (Login, Register, Password Reset)
- Executive dashboard with KPI widgets
- Projects, Documents, Approvals management
- Team & settings management
- Admin panel (org/platform level)
- Full Arabic/English i18n support (RTL)
- Dark mode ready
- Responsive mobile design

✅ **Database**
- Normalized PostgreSQL schema
- Multi-tenancy support
- Audit logging
- Soft deletes for compliance

✅ **Infrastructure**
- Production-ready Dockerfiles
- docker-compose for development
- Nginx configuration
- CI/CD pipeline ready
- AWS deployment-ready

✅ **Security**
- JWT authentication
- RBAC authorization
- Input validation
- Audit logging
- Helmet security headers
- Rate limiting

---

## NEXT STEPS (PHASE 2 - FUTURE)

1. AI-powered insights (ML models for risk prediction)
2. Mobile app (React Native / Flutter)
3. Advanced reporting & analytics dashboard
4. Marketplace for integrations (APIs)
5. Video conferencing for site coordination
6. AR/VR for site visualization
7. Government portal integrations (Saudi, UAE)
8. Advanced billing & payments (Stripe)
9. Multi-language support expansion
10. Enterprise features (SSO, advanced RBAC)

---

**VERSION**: 1.0.0-MVP
**LAST UPDATED**: 2025
**STATUS**: Production-Ready
**ARCHITECTURE OWNER**: CTO / Engineering Lead
