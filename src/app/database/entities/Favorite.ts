import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('favorites')
export class FavoriteEntity {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  empresaId: string;

  @Column('text')
  userId: string;
}
