import type { CityDTO } from '@/app/dtos/CityDTO';
import type { PorteConfigDTO } from '@/app/dtos/PorteConfigDTO';

export interface GeoIntelligenceDTO {
  id: string;
  state: string;
  cities: CityDTO[];
  portes: PorteConfigDTO[];
}
