import type { NicheDTO } from '@/app/dtos/NicheDTO';

export interface SegmentationPayloadDTO {
  niches: NicheDTO[];
  limit: number;
}
