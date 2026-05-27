import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Document } from './document.entity';

@Entity('document_versions')
@Index(['documentId', 'versionNumber'])
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  documentId: string;

  @Column({ type: 'varchar', length: 20 })
  versionNumber: string; // e.g., '1.0', '1.1', '2.0'

  @Column({ type: 'varchar', length: 255, nullable: true })
  s3Key: string; // S3 object key for presigned URL generation

  @Column({ type: 'varchar', length: 255, nullable: true })
  originalFileName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mimeType: string;

  @Column({ type: 'integer', nullable: true })
  fileSizeBytes: number;

  @Column({ type: 'text', nullable: true })
  changelog: string; // User-provided description of changes

  @Column({ type: 'varchar', length: 255, nullable: true })
  uploadedBy: string; // userId

  @CreateDateColumn()
  uploadedAt: Date;

  @ManyToOne(() => Document, (doc) => doc.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;
}
