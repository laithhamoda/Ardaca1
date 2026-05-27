import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';

export enum ProjectMemberRole {
  OWNER = 'owner',
  LEAD = 'lead',
  ENGINEER = 'engineer',
  CONSULTANT = 'consultant',
  SUBCONTRACTOR = 'subcontractor',
  VIEWER = 'viewer',
}

@Entity('project_members')
@Index(['projectId', 'userId'])
@Unique(['projectId', 'userId'])
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ProjectMemberRole,
    default: ProjectMemberRole.MEMBER,
  })
  role: ProjectMemberRole;

  @Column({ type: 'varchar', length: 255, nullable: true })
  department: string; // e.g., "Designing", "Space Engineering"

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string; // External contractor/consultant company

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @ManyToOne(() => User, (user) => user.projectMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
