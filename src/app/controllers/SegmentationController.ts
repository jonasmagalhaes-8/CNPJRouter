import { serviceSaveSegmentation, serviceGetSegmentation } from '../services/SegmentationService';
import type { NicheDTO } from '../dtos/NicheDTO';

export async function saveSegmentationController(
  niches: NicheDTO[],
  limit: number,
): Promise<{ count: number; mensagem: string }> {
  const response = await serviceSaveSegmentation({ niches, limit });
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  return { count: response.response.count, mensagem: response.mensagem };
}

export async function getSegmentationController(): Promise<{ niches: NicheDTO[]; limit: number } | null> {
  const response = await serviceGetSegmentation();
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  return response.response ?? null;
}
// All empresa filtering is now done server-side via /api/empresas with query params.

// No exports — this file is intentionally left empty.
export {};
