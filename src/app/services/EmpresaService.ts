import { apiBackend } from '../config/apiBackend';
import type { ResponseDTO } from '../dtos/ResponseDTO';
import type { EmpresaDTO } from '../dtos/EmpresaDTO';

export interface EmpresaFilters {
  estado?: string | null;
  municipio?: string | null;
  categoriaIA?: string | null;
  porte?: string | null;
  page?: number;
  limit?: number;
}

// We now expect the API to return the plain data directly
export type EncryptedEmpresaResponse = EmpresaDTO[]; // Kept type alias to avoid breaking other imports accidentally, though we just return the array

export interface PaginatedResult {
  results: EmpresaDTO[];
  total: number;
  page: number;
  totalPages: number;
}

function extractFromEncrypted(
  response: ResponseDTO<any>,
): EmpresaDTO[] {
  if (response.response && Array.isArray(response.response)) {
    return response.response;
  }
  if (response.response && typeof response.response === 'object' && response.response._debug) {
    return response.response._debug;
  }
  return [];
}

export async function serviceGetEmpresas(
  filters: EmpresaFilters = {},
): Promise<PaginatedResult> {
  const params: Record<string, string> = {};
  if (filters.estado) params.estado = filters.estado;
  if (filters.municipio) params.municipio = filters.municipio;
  if (filters.categoriaIA) params.categoriaIA = filters.categoriaIA;
  if (filters.porte) params.porte = filters.porte;
  if (filters.page !== undefined) params.page = String(filters.page);
  if (filters.limit !== undefined) params.limit = String(filters.limit);

  const json = await apiBackend.get<ResponseDTO<EncryptedEmpresaResponse>>('/empresas', { params });
  const results = extractFromEncrypted(json.data);

  return {
    results,
    total: results.length,
    page: filters.page ?? 0,
    totalPages: 1,
  };
}

export async function serviceGetFavorites(): Promise<EmpresaDTO[]> {
  const json = await apiBackend.get<ResponseDTO<EncryptedEmpresaResponse>>('/empresas?favorites=true');
  return extractFromEncrypted(json.data);
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

export async function serviceToggleContact(
  empresaId: string,
): Promise<ResponseDTO<{ contacted: boolean }>> {
  const json = await apiBackend.post<ResponseDTO<{ contacted: boolean }>>('/empresas/contact', { empresaId });
  return json.data;
}

export async function serviceGetContactIds(): Promise<ResponseDTO<{ contactIds: string[] }>> {
  const json = await apiBackend.get<ResponseDTO<{ contactIds: string[] }>>('/empresas/contact-ids');
  return json.data;
}

// ── Semantic Search ──────────────────────────────────────────────────────────

export interface SemanticSearchParams {
  query: string;
  estado?: string | null;
  municipio?: string | null;
  porte?: string | null;
  page?: number;
  limit?: number;
}

export async function serviceSearchSemantic(
  params: SemanticSearchParams,
): Promise<PaginatedResult> {
  const json = await apiBackend.post<ResponseDTO<EncryptedEmpresaResponse>>('/search/semantic', params);
  const results = extractFromEncrypted(json.data);
  return {
    results,
    total: results.length,
    page: params.page ?? 0,
    totalPages: 1,
  };
}

// ── Lookalike ────────────────────────────────────────────────────────────────

export async function serviceLookalike(
  cnpj: string,
  limit: number = 20,
): Promise<EmpresaDTO[]> {
  const json = await apiBackend.post<ResponseDTO<EncryptedEmpresaResponse>>('/search/lookalike', { cnpj, limit });
  return extractFromEncrypted(json.data);
}

// ── Intelligence / Filter Options ───────────────────────────────────────────

export interface FilterOptions {
  categorias: string[];
  estados: string[];
  municipios: string[];
  bairros: string[];
  portes: string[];
}

export async function serviceGetFilterOptions(
  filters?: { estado?: string; categoria?: string; municipio?: string },
): Promise<FilterOptions> {
  const params: Record<string, string> = {};
  if (filters?.estado) params.estado = filters.estado;
  if (filters?.categoria) params.categoria = filters.categoria;
  if (filters?.municipio) params.municipio = filters.municipio;

  const json = await apiBackend.get<ResponseDTO<FilterOptions>>('/intelligence/filters', { params });
  if (!json.data.sucesso) {
    return { categorias: [], estados: [], municipios: [], bairros: [], portes: [] };
  }
  return json.data.response;
}

// ── Niche Growth ────────────────────────────────────────────────────────────

export interface NicheGrowthResponse {
  categoria: string;
  monthlyData: { month: string; count: number; growth: number | null }[];
  total: number;
  trend: 'growing' | 'stable' | 'declining';
}

export async function serviceGetNicheGrowth(
  categoria: string,
  filters?: { estado?: string; municipio?: string },
): Promise<NicheGrowthResponse | null> {
  const params: Record<string, string> = { categoria };
  if (filters?.estado) params.estado = filters.estado;
  if (filters?.municipio) params.municipio = filters.municipio;

  const json = await apiBackend.get<ResponseDTO<NicheGrowthResponse>>('/intelligence/niche-growth', { params });
  if (!json.data.sucesso) return null;
  return json.data.response;
}

// ── Porte Distribution ──────────────────────────────────────────────────────

export interface PorteDistributionItem {
  porte: string;
  count: number;
  percentage: number;
}

export async function serviceGetPorteDistribution(
  filters?: { estado?: string; categoria?: string; municipio?: string },
): Promise<PorteDistributionItem[]> {
  const params: Record<string, string> = {};
  if (filters?.estado) params.estado = filters.estado;
  if (filters?.categoria) params.categoria = filters.categoria;
  if (filters?.municipio) params.municipio = filters.municipio;

  const json = await apiBackend.get<ResponseDTO<PorteDistributionItem[]>>('/intelligence/porte-distribution', { params });
  if (!json.data.sucesso) return [];
  return json.data.response;
}

// ── Heatmap ──────────────────────────────────────────────────────────────────

export interface HeatmapData {
  labels: string[];
  months: string[];
  matrix: number[][];
}

export async function serviceGetHeatmap(
  params: {
    type?: 'bairro' | 'cidade' | 'municipio';
    estado?: string;
    municipio?: string;
    categoria?: string;
    period?: string;
  },
): Promise<HeatmapData | null> {
  const queryParams: Record<string, string> = {};
  if (params.type) queryParams.type = params.type;
  if (params.estado) queryParams.estado = params.estado;
  if (params.municipio) queryParams.municipio = params.municipio;
  if (params.categoria) queryParams.categoria = params.categoria;
  if (params.period) queryParams.period = params.period;

  const json = await apiBackend.get<ResponseDTO<HeatmapData>>('/intelligence/heatmap', { params: queryParams });
  if (!json.data.sucesso) return null;
  return json.data.response;
}
