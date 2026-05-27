import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval, ApprovalStatus } from '../../database/entities/approval.entity';
import { ApprovalStep, StepStatus } from '../../database/entities/approval-step.entity';
import { Project } from '../../database/entities/project.entity';
import { Organisation } from '../../database/entities/organisation.entity';
import { Comment } from '../../database/entities/comment.entity';

export interface CreateApprovalDto {
  projectId: string;
  title: string;
  summary?: string;
  steps: Array<{ name: string; approver: string }>;
}

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(Approval)
    private readonly approvalRepository: Repository<Approval>,
    @InjectRepository(ApprovalStep)
    private readonly stepRepository: Repository<ApprovalStep>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Organisation)
    private readonly organisationRepository: Repository<Organisation>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async createApproval(organisationId: string, dto: CreateApprovalDto): Promise<Approval> {
    const project = await this.projectRepository.findOne({ where: { id: dto.projectId, organisation: { id: organisationId } } });
    const organisation = await this.organisationRepository.findOne({ where: { id: organisationId } });
    if (!project || !organisation) {
      throw new NotFoundException('Project or organisation not found');
    }

    const approval = this.approvalRepository.create({
      title: dto.title,
      summary: dto.summary,
      project,
      organisation,
      status: ApprovalStatus.PENDING,
    });

    approval.steps = dto.steps.map((stepDto) =>
      this.stepRepository.create({
        name: stepDto.name,
        approver: stepDto.approver,
        status: StepStatus.PENDING,
        approval,
      }),
    );

    return this.approvalRepository.save(approval);
  }

  async listApprovals(organisationId: string): Promise<Approval[]> {
    return this.approvalRepository.find({
      where: { organisation: { id: organisationId } },
      relations: ['steps', 'project'],
      order: { createdAt: 'DESC' },
    });
  }

  async actionStep(organisationId: string, approvalId: string, stepId: string, approve: boolean, comment: string, userId: string) {
    const approval = await this.approvalRepository.findOne({
      where: { id: approvalId, organisation: { id: organisationId } },
      relations: ['steps'],
    });
    if (!approval) {
      throw new NotFoundException('Approval workflow not found');
    }

    const step = approval.steps.find((item) => item.id === stepId);
    if (!step) {
      throw new NotFoundException('Approval step not found');
    }

    step.status = approve ? StepStatus.APPROVED : StepStatus.REJECTED;
    step.comments = comment;
    await this.stepRepository.save(step);

    approval.status = approval.steps.some((s) => s.status === StepStatus.REJECTED)
      ? ApprovalStatus.REJECTED
      : approval.steps.every((s) => s.status === StepStatus.APPROVED)
      ? ApprovalStatus.APPROVED
      : ApprovalStatus.PENDING;

    await this.approvalRepository.save(approval);

    if (comment) {
      await this.commentRepository.save(
        this.commentRepository.create({
          approval,
          author: { id: userId } as any,
          message: comment,
        }),
      );
    }

    return approval;
  }
}
