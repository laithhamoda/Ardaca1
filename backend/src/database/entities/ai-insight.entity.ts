import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('ai_insights')
@Index(['organisationId', 'createdAt'])
export class AIInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organisationId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // 'risk', 'recommendation', 'alert', 'insight'

  @Column({ type: 'varchar', length: 50 })
  severity: string; // 'low', 'medium', 'high', 'critical'

  @Column({ type: 'text', nullable: true })
  metadata: string; // JSON: related entities, metrics

  @Column({ type: 'boolean', default: false })
  isDismissed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
