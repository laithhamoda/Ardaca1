import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { UserOrganisation } from './user-organisation.entity';
import { Project } from './project.entity';

@Entity({ name: 'organisations' })
export class Organisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 160 })
  name: string;

  @Column({ length: 3 })
  countryCode: string;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  logoUrl: string;

  @OneToMany(() => UserOrganisation, (userOrg) => userOrg.organisation)
  userOrganisations: UserOrganisation[];

  @OneToMany(() => Project, (project) => project.organisation)
  projects: Project[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
