import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './User';
import { EmpresaEntity } from './Empresa';

@Entity('discovery_history')
export class DiscoveryHistoryEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  empresaId: string;

  @Column('text')
  cnpj: string;

  @Column('text')
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ name: 'viewed_at' })
  viewedAt: Date;
}
