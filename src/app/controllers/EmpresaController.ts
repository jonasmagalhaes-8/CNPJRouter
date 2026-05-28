import {
  serviceGetEmpresas,
  serviceGetFavorites,
  serviceBlockEmpresa,
  serviceToggleFavorite,
  serviceGetFavoriteIds,
} from '../services/EmpresaService';
import type { EmpresaDTO } from '../dtos/EmpresaDTO';

export async function getEmpresasController(): Promise<EmpresaDTO[]> {
  const response = await serviceGetEmpresas();
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  return response.response;
}

export async function getFavoritesController(): Promise<EmpresaDTO[]> {
  const response = await serviceGetFavorites();
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  return response.response;
}

export async function blockEmpresaController(empresaId: string): Promise<void> {
  const response = await serviceBlockEmpresa(empresaId);
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
}

export async function toggleFavoriteController(empresaId: string): Promise<boolean> {
  const response = await serviceToggleFavorite(empresaId);
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  return response.response.favorited;
}

export async function getFavoriteIdsController(): Promise<string[]> {
  const response = await serviceGetFavoriteIds();
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  return response.response.favoriteIds;
}
