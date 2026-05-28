import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  nome: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text')
  senha: string;

  @Column('int', { default: 50 })
  plano: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column('text', { nullable: true })
  perfil: string;

  @Column('text', { nullable: true })
  perfilOutro: string;
}
