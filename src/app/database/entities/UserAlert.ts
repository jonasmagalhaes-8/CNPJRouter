import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './User';

@Entity('user_alerts')
export class UserAlertEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column('text')
  query: string;

  @Column('text', { nullable: true })
  municipio: string;

  @Column('text', { nullable: true })
  estado: string;

  @Column('text', { nullable: true })
  bairro: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column('date', { nullable: true })
  lastTriggeredAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
