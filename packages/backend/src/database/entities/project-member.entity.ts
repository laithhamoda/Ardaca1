import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Team } from './team.entity';

@Entity({ name: 'project_members' })
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.projectMemberships, { nullable: false, eager: true })
  user: User;

  @ManyToOne(() => Project, (project) => project.members, { nullable: false })
  project: Project;

  @ManyToOne(() => Team, (team) => team.members, { nullable: true })
  team?: Team;

  @Column({ length: 64, nullable: true })
  role?: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
