import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './User';

@Entity('daily_usage')
export class DailyUsageEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  userId: string;

  @Column('int', { default: 0 })
  viewsCount: number;

  @Column('text')
  usageDate: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
