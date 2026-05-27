import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Organisation } from './organisation.entity';

@Entity({ name: 'ai_insights' })
export class Insight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Organisation, { nullable: false })
  organisation: Organisation;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  metrics: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
