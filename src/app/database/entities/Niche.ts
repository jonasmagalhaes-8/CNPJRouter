import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('niches')
export class NicheEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  name: string;

  @Column('text')
  scope: string;

  @Column('text')
  userId: string;
}
