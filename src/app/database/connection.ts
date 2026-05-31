import { DataSource } from 'typeorm';
import { UserEntity } from './entities/User';
import { EmpresaEntity } from './entities/Empresa';
import { FavoriteEntity } from './entities/Favorite';
import { DiscoveryHistoryEntity } from './entities/DiscoveryHistory';
import { UserBlockEntity } from './entities/UserBlock';
import { DailyUsageEntity } from './entities/DailyUsage';
import { UserAlertEntity } from './entities/UserAlert';
import { GlobalCooldownEntity } from './entities/GlobalCooldown';
import { SegmentationEntity } from './entities/Segmentation';
import { UserContactEntity } from './entities/UserContact';

const ENTITIES = [
  UserEntity,
  EmpresaEntity,
  FavoriteEntity,
  DiscoveryHistoryEntity,
  UserBlockEntity,
  DailyUsageEntity,
  UserAlertEntity,
  GlobalCooldownEntity,
  SegmentationEntity,
  UserContactEntity,
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
