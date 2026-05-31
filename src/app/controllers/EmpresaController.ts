import {
  serviceGetEmpresas,
  serviceGetFavorites,
  serviceBlockEmpresa,
  serviceToggleFavorite,
  serviceGetFavoriteIds,
  serviceToggleContact,
  serviceGetContactIds,
  serviceSearchSemantic,
  serviceLookalike,
  serviceGetFilterOptions,
  serviceGetNicheGrowth,
  serviceGetPorteDistribution,
  serviceGetHeatmap,
} from '../services/EmpresaService';
import type { EmpresaDTO } from '../dtos/EmpresaDTO';
import type { FilterOptions } from '../services/EmpresaService';

export interface EmpresaFilterParams {
  estado?: string | null;
  municipio?: string | null;
  categoriaIA?: string | null;
  porte?: string | null;
  page?: number;
  limit?: number;
}

export async function getEmpresasController(
  filters: EmpresaFilterParams = {},
): Promise<EmpresaDTO[]> {
  const result = await serviceGetEmpresas(filters);
  return result.results;
}

export async function getEmpresasPaginatedController(
  filters: EmpresaFilterParams = {},
) {
  return serviceGetEmpresas(filters);
}

export async function getFavoritesController(): Promise<EmpresaDTO[]> {
  return serviceGetFavorites();
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

export async function toggleContactController(empresaId: string): Promise<boolean> {
  const response = await serviceToggleContact(empresaId);
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  return response.response.contacted;
}

export async function getContactIdsController(): Promise<string[]> {
  const response = await serviceGetContactIds();
  if (!response.sucesso) {
    throw new Error(response.mensagem);
  }
  return response.response.contactIds;
}

export async function searchSemanticController(params: {
  query: string;
  estado?: string | null;
  municipio?: string | null;
  porte?: string | null;
  page?: number;
  limit?: number;
}): Promise<EmpresaDTO[]> {
  const result = await serviceSearchSemantic(params);
  return result.results;
}

export async function lookalikeController(cnpj: string, limit?: number): Promise<EmpresaDTO[]> {
  return serviceLookalike(cnpj, limit);
}

export async function getFilterOptionsController(
  filters?: { estado?: string; categoria?: string; municipio?: string },
): Promise<FilterOptions> {
  return serviceGetFilterOptions(filters);
}

export async function getNicheGrowthController(
  categoria: string,
  filters?: { estado?: string; municipio?: string },
) {
  return serviceGetNicheGrowth(categoria, filters);
}

export async function getPorteDistributionController(
  filters?: { estado?: string; categoria?: string; municipio?: string },
) {
  return serviceGetPorteDistribution(filters);
}

export async function getHeatmapController(params: {
  type?: 'bairro' | 'cidade' | 'municipio';
  estado?: string;
  municipio?: string;
  categoria?: string;
  period?: string;
}) {
  return serviceGetHeatmap(params);
}
