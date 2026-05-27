import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import { DatabaseConfigService } from './database.config';
import { User } from '../database/entities/user.entity';
import { Organisation } from '../database/entities/organisation.entity';
import { Team } from '../database/entities/team.entity';
import { Project } from '../database/entities/project.entity';
import { Document } from '../database/entities/document.entity';
import { DocumentVersion } from '../database/entities/document-version.entity';
import { Approval } from '../database/entities/approval.entity';
import { ApprovalStep } from '../database/entities/approval-step.entity';
import { Comment } from '../database/entities/comment.entity';
import { Notification } from '../database/entities/notification.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import { Insight } from '../database/entities/insight.entity';

export const typeOrmConfigAsync = async (
  configService: ConfigService,
): Promise<DataSourceOptions> => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  return {
    type: 'postgres',
    url: databaseUrl,
    synchronize: false,
    logging: false,
    entities: [
      User,
      Organisation,
      Team,
      Project,
      Document,
      DocumentVersion,
      Approval,
      ApprovalStep,
      Comment,
      Notification,
      AuditLog,
      Insight,
    ],
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: false,
    subscribers: [],
  };
};
