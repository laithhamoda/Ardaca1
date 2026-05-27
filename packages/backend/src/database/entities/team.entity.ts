import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Organisation } from './organisation.entity';
import { ProjectMember } from './project-member.entity';

@Entity({ name: 'teams' })
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 140 })
  name: string;

  @ManyToOne(() => Organisation, (organisation) => organisation.projects, { nullable: false })
  organisation: Organisation;

  @OneToMany(() => ProjectMember, (member) => member.team)
  members: ProjectMember[];

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
