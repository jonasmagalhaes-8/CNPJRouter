import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './User';

@Entity('user_contacts')
export class UserContactEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  empresaId: string;

  @Column('text')
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ name: 'contacted_at' })
  contactedAt: Date;
}
