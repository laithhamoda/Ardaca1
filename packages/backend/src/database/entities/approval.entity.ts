import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Project } from './project.entity';
import { Organisation } from './organisation.entity';
import { ApprovalStep } from './approval-step.entity';

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity({ name: 'approvals' })
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 220 })
  title: string;

  @ManyToOne(() => Project, (project) => project.approvals, { nullable: false })
  project: Project;

  @ManyToOne(() => Organisation, { nullable: false })
  organisation: Organisation;

  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @OneToMany(() => ApprovalStep, (step) => step.approval, { cascade: true })
  steps: ApprovalStep[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
