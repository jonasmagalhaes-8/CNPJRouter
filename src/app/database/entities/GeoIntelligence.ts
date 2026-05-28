import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('geo_intelligences')
export class GeoIntelligenceEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  state: string;

  @Column('text')
  nicheId: string;
}
