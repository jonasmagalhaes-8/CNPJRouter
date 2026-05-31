import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('empresas')
@Index('idx_empresas_cnpj', ['cnpj'], { unique: true })
@Index('idx_empresas_categoriaIA', ['categoriaIA'])
@Index('idx_empresas_municipio_estado', ['municipio', 'estado'])
export class EmpresaEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text', { unique: true })
  cnpj: string;

  @Column('text')
  razaoSocial: string;

  @Column('text')
  nomeFantasia: string;

  @Column('text')
  cnaePrincipal: string;

  @Column('text')
  cnaeDescricao: string;

  @Column('text')
  situacaoCadastral: string;

  @Column('text')
  endereco: string;

  @Column('text')
  municipio: string;

  @Column('text')
  bairro: string;

  @Column('text')
  estado: string;

  @Column('text')
  cep: string;

  @Column('text')
  telefone: string;

  @Column('text')
  email: string;

  @Column('text')
  socio: string;

  @Column('text')
  porte: string;

  @Column('text')
  funcionarios: string;

  @Column('text')
  receitaAnual: string;

  @Column('text')
  dataAbertura: string;

  @Column('text')
  categoriaIA: string;

  @Column('text')
  embedding: string;

  @Column('text', { nullable: true })
  logradouro: string | null;

  @Column('text', { nullable: true })
  dataProcessamento: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
