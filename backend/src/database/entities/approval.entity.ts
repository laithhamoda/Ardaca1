import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Project } from './project.entity';
import { ApprovalStep } from './approval-step.entity';
import { Comment } from './comment.entity';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
}

@Entity('approvals')
@Index(['projectId', 'status'])
export class Approval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  documentId: string; // Link to document if approval is for a doc

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ type: 'varchar', length: 50, default: 'sequential' })
  workflowType: string; // 'sequential' or 'parallel'

  @Column({ type: 'integer', default: 0 })
  currentStep: number; // Track which step is active

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string; // userId

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany(() => ApprovalStep, (step) => step.approval, { cascade: true })
  steps: ApprovalStep[];

  @OneToMany(() => Comment, (comment) => comment.approval, { cascade: true })
  comments: Comment[];
}
