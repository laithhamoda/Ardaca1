import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Document } from './document.entity';
import { Approval } from './approval.entity';

@Entity('comments')
@Index(['documentId', 'createdAt'])
@Index(['approvalId', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  documentId: string;

  @Column({ type: 'uuid', nullable: true })
  approvalId: string;

  @Column({ type: 'uuid' })
  authorId: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string; // e.g., 'resolved', 'pending'

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Document, (doc) => doc.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @ManyToOne(() => Approval, (approval) => approval.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'approvalId' })
  approval: Approval;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;
}
