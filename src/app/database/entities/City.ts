import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('cities')
export class CityEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  name: string;

  @Column('text')
  geoId: string;
}
