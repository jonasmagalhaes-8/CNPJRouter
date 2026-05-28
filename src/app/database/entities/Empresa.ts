import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserEntity } from './User';

@Entity('empresas')
export class EmpresaEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  nome: string;

  @Column('text')
  cnpj: string;

  @Column('text')
  nicho: string;

  @Column('text')
  estado: string;

  @Column('text')
  cidade: string;

  @Column('text')
  bairro: string;

  @Column('text')
  telefone: string;

  @Column('text')
  email: string;

  @Column('text', { default: 'Disponível' })
  whatsapp: string;

  @Column('int', { default: 0 })
  score: number;

  @Column('text')
  socio: string;

  @Column('text', { default: 'Sob Consulta' })
  receita: string;

  @Column('text', { default: '1-5' })
  funcionarios: string;

  @Column('text')
  porte: string;

  @Column('text', { default: '' })
  dataAbertura: string;

  @Column('boolean', { default: false })
  isBlocked: boolean;

  @Column('text')
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
