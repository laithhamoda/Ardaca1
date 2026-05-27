# Infrastructure Guidance

This directory contains architecture guidance for Ardaca deployment.

## Production readiness

- Use AWS RDS or Azure Database for PostgreSQL for managed data.
- Use AWS ElastiCache or Azure Cache for Redis for Redis-backed queues and caching.
- Store files in AWS S3 or Azure Blob Storage using the storage configuration service.
- Terminate TLS at the load balancer and route public traffic through Nginx or reverse proxy.
- Configure environment variables securely using secrets stores.

## Scaling notes

- Backend is stateless and scales horizontally behind a load balancer.
- Use Redis to coordinate Bull queues across workers.
- Use PostgreSQL read replicas for analytics and reporting workloads.
- Use object storage for all document assets and store only metadata in PostgreSQL.
- Deploy Socket.IO using sticky sessions or use a managed WebSocket service.
