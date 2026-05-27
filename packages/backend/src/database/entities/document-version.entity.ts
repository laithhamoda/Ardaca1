import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Document } from './document.entity';

@Entity({ name: 'document_versions' })
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, (document) => document.versions, { nullable: false })
  document: Document;

  @Column({ length: 16 })
  version: string;

  @Column({ length: 180 })
  filename: string;

  @Column({ length: 512 })
  storageKey: string;

  @Column({ length: 50 })
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ default: false })
  approved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
