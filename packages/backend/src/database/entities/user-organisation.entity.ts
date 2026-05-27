import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User, UserRole } from './user.entity';
import { Organisation } from './organisation.entity';

@Entity({ name: 'user_organisations' })
export class UserOrganisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.userOrganisations, { eager: true })
  user: User;

  @ManyToOne(() => Organisation, (organisation) => organisation.userOrganisations, { eager: true })
  organisation: Organisation;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ default: false })
  primary: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
