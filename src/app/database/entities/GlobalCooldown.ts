import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmpresaEntity } from './Empresa';
import { UserEntity } from './User';

@Entity('global_cooldowns')
export class GlobalCooldownEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  empresaId: string;

  @ManyToOne(() => EmpresaEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa: EmpresaEntity;

  @Column('text')
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column('int', { default: 0 })
  exposures: number;

  @CreateDateColumn({ name: 'first_seen_at' })
  firstSeenAt: Date;

  @CreateDateColumn({ name: 'last_seen_at' })
  lastSeenAt: Date;

  @Column('text')
  weekStart: string;
}
