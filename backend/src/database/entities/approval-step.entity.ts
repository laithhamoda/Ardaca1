import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Approval } from './approval.entity';

export enum ApprovalStepStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SKIPPED = 'skipped',
}

@Entity('approval_steps')
@Index(['approvalId', 'stepOrder'])
export class ApprovalStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  approvalId: string;

  @Column({ type: 'integer' })
  stepOrder: number; // 1, 2, 3, etc.

  @Column({ type: 'varchar', length: 255 })
  approverName: string;

  @Column({ type: 'varchar', length: 255 })
  approverEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  approverId: string; // userId if in system

  @Column({
    type: 'enum',
    enum: ApprovalStepStatus,
    default: ApprovalStepStatus.PENDING,
  })
  status: ApprovalStepStatus;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'timestamp', nullable: true })
  actionedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Approval, (approval) => approval.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'approvalId' })
  approval: Approval;
}
