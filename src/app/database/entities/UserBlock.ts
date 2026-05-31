import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './User';

@Entity('user_blocks')
export class UserBlockEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  empresaId: string;

  @Column('text')
  cnpj: string;

  @Column('text')
  empresaNome: string;

  @Column('text')
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ name: 'blocked_at' })
  blockedAt: Date;
}
