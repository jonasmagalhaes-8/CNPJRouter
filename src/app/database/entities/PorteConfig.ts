import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('porte_configs')
export class PorteConfigEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  porte: string;

  @Column('text', { default: '' })
  period: string;

  @Column('int', { default: 0 })
  quantity: number;

  @Column('text', { nullable: true })
  geoId: string;

  @Column('text', { nullable: true })
  cityId: string | null;
}
