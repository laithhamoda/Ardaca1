import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    const body = request.body;
    const entityId = request.params?.id;

    return next.handle().pipe(
      tap(async () => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          const auditRepository = this.dataSource.getRepository(AuditLog);
          const audit = auditRepository.create({
            userId: user?.id,
            organisationId: user?.organisationId,
            action: `${method} ${url}`,
            entity: request.route?.path || url,
            entityId,
            ipAddress: request.ip,
            metadata: JSON.stringify({ body }),
          });
          await auditRepository.save(audit);
        }
      }),
    );
  }
}
