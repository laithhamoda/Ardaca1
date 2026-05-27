# Ardaca

Ardaca is an enterprise-grade, bilingual ConstructionTech platform for GCC organisations. This MVP includes a NestJS backend, Next.js frontend, PostgreSQL, Redis, and Docker infrastructure for local development and production deployment.

## Repository structure

- `packages/backend/` - NestJS API with modules for auth, users, organisations, projects, documents, approvals, notifications, audit, and health.
- `packages/frontend/` - Next.js App Router application with TailwindCSS and enterprise dashboard layout.
- `docker-compose.yml` - Development orchestration for backend, frontend, PostgreSQL, Redis, and Nginx.
- `docker-compose.prod.yml` - Production-ready compose configuration.
- `nginx.conf` - Reverse proxy routing requests to frontend and backend.

## Local development

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Start the stack:
   ```bash
   docker-compose up --build
   ```

3. Run database migrations:
   ```bash
   cd packages/backend
   npm install
   npm run migration:run
   npm run seed:run
   ```

4. Access the app:
   - Frontend: `http://localhost`
   - API docs: `http://localhost:4000/api/docs`

## Backend commands

From `packages/backend`:

- `npm run start:dev` - Start NestJS in development mode
- `npm run build` - Compile TypeScript
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run migration:run` - Run TypeORM migrations
- `npm run seed:run` - Seed default tenant and admin user

## Frontend commands

From `packages/frontend`:

- `npm run dev` - Start Next.js development server
- `npm run build` - Build production assets
- `npm run start` - Start production server

## Architecture overview

- Multi-tenant platform driven by `organisationId` on JWT payloads and tenant guards.
- RBAC with `SUPER_ADMIN`, `ORG_ADMIN`, `PROJECT_MANAGER`, `MEMBER`, and `VIEWER` roles.
- Document versioning and approval workflow system with sequential steps and comments.
- Audit trail for all mutation operations.
- Real-time notification scaffolding with Socket.IO, Bull queue support, and email-ready architecture.
- Bilingual-ready frontend with RTL support and enterprise dashboard components.

## Deployment recommendations

- Use managed PostgreSQL with read replicas for production.
- Use Redis cluster for cache and queues.
- Store files in AWS S3 or compatible object storage.
- Terminate TLS at Nginx or cloud load balancer.
- Use GitHub Actions to build, test, and deploy containers.
- Enable horizontal scaling for backend services behind a load balancer.
- Monitor API latency, queue health, and audit log integrity.
