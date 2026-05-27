import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { Approval } from '../../database/entities/approval.entity';
import { ApprovalStep } from '../../database/entities/approval-step.entity';
import { Project } from '../../database/entities/project.entity';
import { Organisation } from '../../database/entities/organisation.entity';
import { Comment } from '../../database/entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Approval, ApprovalStep, Project, Organisation, Comment])],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
})
export class ApprovalsModule {}
