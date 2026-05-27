import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Organisation } from './organisation.entity';
import { ProjectMember } from './project-member.entity';
import { Approval } from './approval.entity';
import { Document } from './document.entity';

export enum ProjectStatus {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  ON_HOLD = 'On Hold',
  COMPLETED = 'Completed',
}

@Entity({ name: 'projects' })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 180 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Organisation, (organisation) => organisation.projects, { nullable: false })
  organisation: Organisation;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.DRAFT })
  status: ProjectStatus;

  @Column({ nullable: true })
  startDate?: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];

  @OneToMany(() => Approval, (approval) => approval.project)
  approvals: Approval[];

  @OneToMany(() => Document, (document) => document.project)
  documents: Document[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  timeline: Array<{ milestone: string; dueDate: string; owner: string }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
