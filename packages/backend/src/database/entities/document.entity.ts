import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Project } from './project.entity';
import { Organisation } from './organisation.entity';
import { DocumentVersion } from './document-version.entity';

@Entity({ name: 'documents' })
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 200 })
  title: string;

  @ManyToOne(() => Project, (project) => project.documents, { nullable: false })
  project: Project;

  @ManyToOne(() => Organisation, (organisation) => organisation.projects, { nullable: false })
  organisation: Organisation;

  @Column({ length: 80 })
  category: string;

  @Column({ default: false })
  confidential: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metadata: Record<string, any>;

  @OneToMany(() => DocumentVersion, (version) => version.document, { cascade: true })
  versions: DocumentVersion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
