import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Project } from './project.entity';
import { DocumentVersion } from './document-version.entity';
import { Comment } from './comment.entity';

export enum DocumentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('documents')
@Index(['projectId', 'status'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string; // e.g., 'drawing', 'specification', 'schedule'

  @Column({ type: 'varchar', length: 255, nullable: true })
  folderPath: string; // e.g., '/drawings/structural'

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string; // userId

  @Column({ type: 'integer', default: 1 })
  currentVersion: number; // major.minor tracked separately in DocumentVersion

  @Column({ type: 'text', nullable: true })
  metadata: string; // JSON: file size, mime type, S3 key

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Relations
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany(() => DocumentVersion, (version) => version.document, { cascade: true })
  versions: DocumentVersion[];

  @OneToMany(() => Comment, (comment) => comment.document, { cascade: true })
  comments: Comment[];
}
