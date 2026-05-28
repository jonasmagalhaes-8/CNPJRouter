import { apiBackend } from '../config/apiBackend';
import type { ResponseDTO } from '../dtos/ResponseDTO';
import type { EmpresaDTO } from '../dtos/EmpresaDTO';

export async function serviceGetEmpresas(): Promise<ResponseDTO<EmpresaDTO[]>> {
  const json = await apiBackend.get<ResponseDTO<EmpresaDTO[]>>('/empresas');
  return json.data;
}

export async function serviceGetFavorites(): Promise<ResponseDTO<EmpresaDTO[]>> {
  const json = await apiBackend.get<ResponseDTO<EmpresaDTO[]>>('/empresas?favorites=true');
  return json.data;
}

export async function serviceBlockEmpresa(
  empresaId: string,
): Promise<ResponseDTO<{ id: string }>> {
  const json = await apiBackend.patch<ResponseDTO<{ id: string }>>('/empresas/block', { empresaId });
  return json.data;
}

export async function serviceToggleFavorite(
  empresaId: string,
): Promise<ResponseDTO<{ favorited: boolean }>> {
  const json = await apiBackend.post<ResponseDTO<{ favorited: boolean }>>('/empresas/favorite', { empresaId });
  return json.data;
}

export async function serviceGetFavoriteIds(): Promise<ResponseDTO<{ favoriteIds: string[] }>> {
  const json = await apiBackend.get<ResponseDTO<{ favoriteIds: string[] }>>('/filters');
  return json.data;
}
