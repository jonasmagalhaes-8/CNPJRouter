import { DataSource } from 'typeorm';
import { UserEntity } from './entities/User';
import { NicheEntity } from './entities/Niche';
import { GeoIntelligenceEntity } from './entities/GeoIntelligence';
import { CityEntity } from './entities/City';
import { PorteConfigEntity } from './entities/PorteConfig';
import { EmpresaEntity } from './entities/Empresa';
import { FavoriteEntity } from './entities/Favorite';

const ENTITIES = [
  UserEntity, NicheEntity, GeoIntelligenceEntity,
  CityEntity, PorteConfigEntity, EmpresaEntity, FavoriteEntity,
];

let dataSource: DataSource | null = null;

export function getDataSource(): DataSource {
  if (!dataSource) {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: 'data/cnpjbi.sqlite',
      synchronize: true,
      dropSchema: false,
      entities: ENTITIES,
      logging: false,
    });
  }
  return dataSource;
}

export async function initializeDataSource(): Promise<DataSource> {
  const ds = getDataSource();
  if (!ds.isInitialized) {
    await ds.initialize();
  }
  return ds;
}
