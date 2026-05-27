import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async listRecent(organisationId?: string): Promise<AuditLog[]> {
    const query = this.auditRepository.createQueryBuilder('audit').orderBy('audit.createdAt', 'DESC').limit(100);
    if (organisationId) {
      query.where('audit.organisationId = :organisationId', { organisationId });
    }
    return query.getMany();
  }
}
