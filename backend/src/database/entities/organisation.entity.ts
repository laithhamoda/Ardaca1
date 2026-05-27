import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { UserOrganisation } from './user-organisation.entity';
import { Project } from './project.entity';
import { Team } from './team.entity';

@Entity('organisations')
@Index(['code'])
export class Organisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // e.g., 'ACME-1', used for subdomain or identification

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo: string; // S3 path

  @Column({ type: 'varchar', length: 2, default: 'en' })
  defaultLanguage: string; // 'en' or 'ar'

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  country: string; // 'AE', 'SA', etc.

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  settings: string; // JSON string for org-level settings

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date; // Soft delete

  // Relations
  @OneToMany(() => UserOrganisation, (uo) => uo.organisation, { cascade: true })
  userOrganisations: UserOrganisation[];

  @OneToMany(() => Project, (project) => project.organisation, { cascade: true })
  projects: Project[];

  @OneToMany(() => Team, (team) => team.organisation, { cascade: true })
  teams: Team[];
}
