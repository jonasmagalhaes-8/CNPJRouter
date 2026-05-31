import type { GeoIntelligenceDTO } from '@/app/dtos/GeoIntelligenceDTO';

export interface NicheDTO {
  id: string;
  name: string;
  scope: string;
  type?: 'LOOKALIKE' | 'NICHE';
  sourceEmbedding?: number[];
  geographies: GeoIntelligenceDTO[];
}
