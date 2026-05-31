import type { PorteConfigDTO } from '@/app/dtos/PorteConfigDTO';

export interface CityDTO {
  id: string;
  name: string;
  portes: PorteConfigDTO[];
}
