import { apiBackend } from '../config/apiBackend';
import type { ResponseDTO } from '../dtos/ResponseDTO';
import type { NicheDTO } from '../dtos/NicheDTO';
import type { SegmentationPayloadDTO } from '../dtos/SegmentationPayloadDTO';

export async function serviceSaveSegmentation(
  data: SegmentationPayloadDTO,
): Promise<ResponseDTO<{ count: number }>> {
  const json = await apiBackend.post<ResponseDTO<{ count: number }>>('/segmentation', data);
  return json.data;
}

export async function serviceGetSegmentation(): Promise<ResponseDTO<{ niches: NicheDTO[]; limit: number }>> {
  const json = await apiBackend.get<ResponseDTO<{ niches: NicheDTO[]; limit: number }>>('/segmentation');
  return json.data;
}
// All empresa filtering is now done server-side via /api/empresas with query params.

// No exports — this file is intentionally left empty.
export {};
