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

export async function getSegmentationController(): Promise<NicheDTO[]> {
  const response = await serviceGetSegmentation();
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  return response.response;
}
