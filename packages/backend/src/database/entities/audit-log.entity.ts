import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  organisationId?: string;

  @Column({ length: 14 })
  action: string;

  @Column({ length: 240 })
  entity: string;

  @Column({ nullable: true })
  entityId?: string;

  @Column({ type: 'text', nullable: true })
  metadata?: string;

  @Column({ length: 45, nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  createdAt: Date;
}
