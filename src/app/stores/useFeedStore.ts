import { create } from 'zustand';
import { type EmpresaDTO } from '../dtos/EmpresaDTO';
import { getEmpresasController, blockEmpresaController, getFilterOptionsController } from '../controllers/EmpresaController';
import { serviceRecordHistory } from '../services/UserService';
import type { FilterOptions } from '../services/EmpresaService';

type ViewType = 'feed' | 'dashboard' | 'favorites' | 'profile';

interface FeedState {
  view: ViewType;
  setView: (view: ViewType) => void;
  allResults: EmpresaDTO[];
  page: number;
  batchSize: number;
  hasMore: boolean;
  loading: boolean;
  filterCategorias: string[];
  filterPeriodo: string;
  filterEstados: string[];
  filterMunicipios: string[];
  filterBairros: string[];
  filterPortes: string[];
  filteredResults: EmpresaDTO[];
  paginatedResults: EmpresaDTO[];
  totalPages: number;
  availableCategorias: string[];
  availableEstados: string[];
  availableMunicipios: string[];
  availableBairros: string[];
  availablePortes: string[];
  dashboardData: EmpresaDTO[];
  activeDashboardCategoria: string;
  viewedIds: Set<string>;
  semanticQuery: string;
  setSemanticQuery: (q: string) => void;
  loadEmpresas: () => Promise<void>;
  loadFilterOptions: () => Promise<void>;
  setFilterCategorias: (vals: string[]) => void;
  setFilterPeriodo: (val: string) => void;
  setFilterEstados: (vals: string[]) => void;
  setFilterMunicipios: (vals: string[]) => void;
  setFilterBairros: (vals: string[]) => void;
  setFilterPortes: (vals: string[]) => void;
  setPage: (page: number) => void;
  setBatchSize: (size: number, planLimit: number, showToast: (msg: string) => void) => void;
  recordView: (empresa: EmpresaDTO) => Promise<void>;
  blockEmpresa: (id: string) => Promise<void>;
  resetFilters: () => void;
  reset: () => void;
  _recompute: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  view: 'feed' as ViewType,
  setView: (view) => set({ view }),
  allResults: [],
  page: 0,
  batchSize: 6,
  hasMore: true,
  loading: false,
  filterCategorias: [],
  filterPeriodo: '',
  filterEstados: [],
  filterMunicipios: [],
  filterBairros: [],
  filterPortes: [],
  filteredResults: [],
  paginatedResults: [],
  totalPages: 1,
  availableCategorias: [],
  availableEstados: [],
  availableMunicipios: [],
  availableBairros: [],
  availablePortes: [],
  dashboardData: [],
  activeDashboardCategoria: '',
  viewedIds: new Set<string>(),
  semanticQuery: '',
  setSemanticQuery: (q) => set({ semanticQuery: q }),

  loadEmpresas: async () => {
    set({ loading: true });
    try {
      const state = get();
      const batchSize = state.batchSize; // Use the user-configured page size directly

      const filters: Record<string, string | undefined> = {};
      if (state.filterEstados.length > 0) filters.estado = state.filterEstados[0];
      if (state.filterMunicipios.length > 0) filters.municipio = state.filterMunicipios[0];
      if (state.filterCategorias.length > 0) filters.categoriaIA = state.filterCategorias[0];
      if (state.filterPortes.length > 0) filters.porte = state.filterPortes[0];
      if (state.filterPeriodo) filters.periodo = state.filterPeriodo;
      // Always fetch the NEXT unloaded page index (based on how many items we already have)
      const nextPageIndex = Math.floor(state.allResults.length / batchSize);
      filters.page = String(nextPageIndex);
      filters.limit = String(batchSize);

      const data = await getEmpresasController(filters) as EmpresaDTO[];
      const newBatch = data ?? [];

      // Always append to the cache (never replace unless starting fresh)
      const allResults = state.allResults.length === 0
        ? newBatch
        : [...state.allResults, ...newBatch];

      // hasMore = the API returned a full batch (meaning there could be more)
      const hasMore = newBatch.length >= batchSize;

      set({ allResults, hasMore });
      get()._recompute();
    } catch {
      set({ hasMore: false });
    } finally {
      set({ loading: false });
    }
  },

  loadFilterOptions: async () => {
    try {
      const state = get();
      const filterParams: { estado?: string; categoria?: string; municipio?: string } = {};
      if (state.filterEstados.length > 0) filterParams.estado = state.filterEstados[0];
      if (state.filterCategorias.length > 0) filterParams.categoria = state.filterCategorias[0];
      if (state.filterMunicipios.length > 0) filterParams.municipio = state.filterMunicipios[0];

      const options: FilterOptions = await getFilterOptionsController(filterParams);
      set({
        availableCategorias: options.categorias,
        availableEstados: options.estados,
        availableMunicipios: options.municipios,
        availableBairros: options.bairros,
        availablePortes: options.portes,
      });
    } catch {
      // silently fail — will keep whatever was loaded before
    }
  },

  setFilterCategorias: (vals) => {
    set({ filterCategorias: vals, page: 0, allResults: [], hasMore: true });
    get().loadEmpresas();
    get().loadFilterOptions();
  },
  setFilterPeriodo: (val) => { set({ filterPeriodo: val, page: 0, allResults: [], hasMore: true }); get().loadEmpresas(); },
  setFilterEstados: (vals) => {
    set({ filterEstados: vals, filterMunicipios: [], filterBairros: [], page: 0, allResults: [], hasMore: true });
    get().loadEmpresas();
    get().loadFilterOptions();
  },
  setFilterMunicipios: (vals) => {
    set({ filterMunicipios: vals, filterBairros: [], page: 0, allResults: [], hasMore: true });
    get().loadEmpresas();
    get().loadFilterOptions();
  },
  setFilterBairros: (vals) => { set({ filterBairros: vals, page: 0, allResults: [], hasMore: true }); get().loadEmpresas(); },
  setFilterPortes: (vals) => { set({ filterPortes: vals, page: 0, allResults: [], hasMore: true }); get().loadEmpresas(); },
  setPage: (newPage) => {
    const state = get();
    const { allResults, batchSize } = state;
    // Check if the target page is already in cache
    const cacheHasPage = (newPage + 1) * batchSize <= allResults.length;
    set({ page: newPage });
    if (cacheHasPage) {
      // Page is cached — just recompute the slice, no network request
      get()._recompute();
    } else {
      // Need to fetch more from the server
      get().loadEmpresas();
    }
  },

  setBatchSize: (size: number, planLimit: number, showToast: (msg: string) => void) => {
    let capped = size;
    if (size > planLimit) {
      capped = planLimit;
      showToast(`Limite do plano é ${planLimit} resultados. Valor ajustado automaticamente.`);
    }
    if (capped < 1) capped = 1;
    set({ batchSize: capped, page: 0, allResults: [], hasMore: true });
    get().loadEmpresas();
  },

  recordView: async (empresa: EmpresaDTO) => {
    const viewedIds = get().viewedIds;
    if (viewedIds.has(empresa.id)) return;
    try {
      await serviceRecordHistory(empresa.id, empresa.cnpj);
      set({ viewedIds: new Set([...viewedIds, empresa.id]) });
    } catch {
      // silently fail
    }
  },

  blockEmpresa: async (id: string) => {
    try {
      await blockEmpresaController(id);
      const allResults = get().allResults.filter((r) => r.id !== id);
      set({ allResults });
      get()._recompute();
    } catch {
      // silently fail
    }
  },

  resetFilters: () => {
    set({
      filterPeriodo: '',
      filterEstados: [],
      filterMunicipios: [],
      filterBairros: [],
      filterPortes: [],
      filterCategorias: [],
      page: 0,
    });
  },

  reset: () => {
    set({
      allResults: [], page: 0, loading: false, hasMore: true,
      filterCategorias: [], filterPeriodo: '', filterEstados: [],
      filterMunicipios: [], filterBairros: [], filterPortes: [],
      filteredResults: [], paginatedResults: [], totalPages: 1,
      availableCategorias: [], availableEstados: [], availableMunicipios: [],
      availableBairros: [], availablePortes: [],
      dashboardData: [], activeDashboardCategoria: '', viewedIds: new Set(),
      semanticQuery: '',
    });
  },

  _recompute: () => {
    const state = get();
    const { allResults, filterCategorias, filterEstados, filterMunicipios, filterBairros, filterPortes, page, batchSize } = state;

    // filteredResults = all accumulated results with client-side filters applied
    const filtered = allResults.filter(
      (r) =>
        (filterCategorias.length === 0 || filterCategorias.includes(r.categoriaIA)) &&
        (filterEstados.length === 0 || filterEstados.includes(r.estado)) &&
        (filterMunicipios.length === 0 || filterMunicipios.includes(r.municipio)) &&
        (filterBairros.length === 0 || filterBairros.includes(r.bairro)) &&
        (filterPortes.length === 0 || filterPortes.includes(r.porte)),
    );

    // paginatedResults = slice of filtered for the current page
    const start = page * batchSize;
    const end = start + batchSize;
    const paginated = filtered.slice(start, end);

    const activeDashboardCategoria = filterCategorias.length > 0
      ? filterCategorias[0]
      : (allResults.length > 0 ? allResults[0].categoriaIA : '');

    const dashboardData = allResults.filter(
      (r) => r.categoriaIA === activeDashboardCategoria &&
        (filterEstados.length === 0 || filterEstados.includes(r.estado)) &&
        (filterMunicipios.length === 0 || filterMunicipios.includes(r.municipio)) &&
        (filterBairros.length === 0 || filterBairros.includes(r.bairro)) &&
        (filterPortes.length === 0 || filterPortes.includes(r.porte)),
    );

    set({
      filteredResults: filtered,
      paginatedResults: paginated,
      dashboardData,
      activeDashboardCategoria,
    });
  },
}));
