import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmpresaEntity } from './Empresa';
import { UserEntity } from './User';

@Entity('favorites')
export class FavoriteEntity {
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
}
