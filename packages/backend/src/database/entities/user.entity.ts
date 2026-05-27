import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { UserOrganisation } from './user-organisation.entity';
import { ProjectMember } from './project-member.entity';
import { Notification } from './notification.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  PROJECT_MANAGER = 'project_manager',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 160 })
  email: string;

  @Column({ length: 120 })
  fullName: string;

  @Column({ nullable: true })
  mobile?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role: UserRole;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  disabled: boolean;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true, select: false })
  refreshToken?: string;

  @OneToMany(() => UserOrganisation, (userOrg) => userOrg.user)
  userOrganisations: UserOrganisation[];

  @OneToMany(() => ProjectMember, (member) => member.user)
  projectMemberships: ProjectMember[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
