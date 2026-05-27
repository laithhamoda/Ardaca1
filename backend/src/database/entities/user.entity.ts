import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { UserOrganisation } from './user-organisation.entity';
import { ProjectMember } from './project-member.entity';
import { Comment } from './comment.entity';
import { AuditLog } from './audit-log.entity';
import { Notification } from './notification.entity';

@Entity('users')
@Index(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string; // bcrypt hashed

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string; // S3 path

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  emailVerificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationTokenExpiry: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpiry: Date;

  @Column({ type: 'varchar', length: 2, default: 'en' })
  language: string; // 'en' or 'ar'

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastLoginIp: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date; // Soft delete

  // Relations
  @OneToMany(() => UserOrganisation, (uo) => uo.user, { cascade: true })
  userOrganisations: UserOrganisation[];

  @OneToMany(() => ProjectMember, (pm) => pm.user, { cascade: true })
  projectMembers: ProjectMember[];

  @OneToMany(() => Comment, (comment) => comment.author, { cascade: true })
  comments: Comment[];

  @OneToMany(() => AuditLog, (log) => log.user, { cascade: true })
  auditLogs: AuditLog[];

  @OneToMany(() => Notification, (notif) => notif.user, { cascade: true })
  notifications: Notification[];
}
