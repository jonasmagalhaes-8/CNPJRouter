'use client';

import React, {
  createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode,
} from 'react';
import { ITEMS_PER_PAGE } from '../constants';
import type { NicheDTO } from '../dtos/NicheDTO';
import { type EmpresaDTO } from '../dtos/EmpresaDTO';
import { getEmpresasController, blockEmpresaController, toggleFavoriteController, getFavoriteIdsController } from '../controllers/EmpresaController';

interface AppState {
  view: 'feed' | 'dashboard' | 'favorites' | 'profile';
  allResults: EmpresaDTO[];
  favorites: string[];
  blocked: string[];
  page: number;
  config: { niches: NicheDTO[]; limit: number } | null;
  showInterestModal: boolean;
  loading: boolean;
  filterNichos: string[];
  filterPeriodo: string;
  filterEstados: string[];
  filterCidades: string[];
  filterBairros: string[];
  filterPortes: string[];
  filteredResults: EmpresaDTO[];
  favoriteResults: EmpresaDTO[];
  paginatedResults: EmpresaDTO[];
  availableNichos: string[];
  availablePeriods: string[];
  availableEstados: string[];
  availableCidades: string[];
  availableBairros: string[];
  availablePortes: string[];
  dashboardData: EmpresaDTO[];
  activeDashboardNicho: string;
  totalPages: number;
}

interface AppDispatch {
  setView: (view: 'feed' | 'dashboard' | 'favorites' | 'profile') => void;
  setFilterNichos: (vals: string[]) => void;
  setFilterPeriodo: (val: string) => void;
  setFilterEstados: (vals: string[]) => void;
  setFilterCidades: (vals: string[]) => void;
  setFilterBairros: (vals: string[]) => void;
  setFilterPortes: (vals: string[]) => void;
  setPage: (page: number) => void;
  toggleFavorite: (id: string) => void;
  blockEmpresa: (id: string) => void;
  confirmConfig: (config: { niches: NicheDTO[]; limit: number }) => void;
}

const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<AppDispatch | null>(null);

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export function useAppDispatch(): AppDispatch {
  const ctx = useContext(AppDispatchContext);
  if (!ctx) throw new Error('useAppDispatch must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<'feed' | 'dashboard' | 'favorites' | 'profile'>('feed');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [config, setConfig] = useState<{ niches: NicheDTO[]; limit: number } | null>(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [allResults, setAllResults] = useState<EmpresaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterNichos, setFilterNichos] = useState<string[]>([]);
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [filterEstados, setFilterEstados] = useState<string[]>([]);
  const [filterCidades, setFilterCidades] = useState<string[]>([]);
  const [filterBairros, setFilterBairros] = useState<string[]>([]);
  const [filterPortes, setFilterPortes] = useState<string[]>([]);

  /* Load empresas from API when config changes */
  useEffect(() => {
    if (!config) return;
    setLoading(true);
    getEmpresasController()
      .then((data) => setAllResults(data as EmpresaDTO[]))
      .catch(() => setAllResults([]))
      .finally(() => setLoading(false));
  }, [config]);

  /* Load favorite IDs from API */
  useEffect(() => {
    if (!config) return;
    getFavoriteIdsController()
      .then((ids) => setFavorites(ids))
      .catch(() => setFavorites([]));
  }, [config]);

  /* Initial Auth & Config Check */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!config) {
      setShowInterestModal(true);
    }
  }, [config]);

  const visibleResults = useMemo(
    () => allResults.filter((r) => !blocked.includes(r.id)),
    [allResults, blocked],
  );

  const availableNichos = useMemo(
    () => Array.from(new Set(visibleResults.map((r) => r.nicho))).sort(), [visibleResults],
  );
  const availablePortes = useMemo(
    () => Array.from(new Set(visibleResults.map((r) => r.porte))).sort(), [visibleResults],
  );

  const filteredByNicho = useMemo(
    () => filterNichos.length === 0 ? visibleResults : visibleResults.filter((r) => filterNichos.includes(r.nicho)),
    [visibleResults, filterNichos],
  );

  const availablePeriods = useMemo(
    () => Array.from(new Set(filteredByNicho.map((r) => r.dataAbertura))).sort(),
    [filteredByNicho],
  );
  const availableEstados = useMemo(
    () => Array.from(new Set(filteredByNicho.map((r) => r.estado))).sort(),
    [filteredByNicho],
  );
  const availableCidades = useMemo(() => {
    const res = filterEstados.length > 0 ? filteredByNicho.filter((r) => filterEstados.includes(r.estado)) : filteredByNicho;
    return Array.from(new Set(res.map((r) => `${r.cidade} - ${r.estado}`))).sort();
  }, [filteredByNicho, filterEstados]);
  const availableBairros = useMemo(() => {
    const res = filterCidades.length > 0
      ? filteredByNicho.filter((r) => filterCidades.includes(`${r.cidade} - ${r.estado}`))
      : filteredByNicho;
    return Array.from(new Set(res.map((r) => `${r.bairro} - ${r.estado}`))).sort();
  }, [filteredByNicho, filterCidades]);

  const filteredResults = useMemo(() => visibleResults.filter(
    (r) =>
      (filterNichos.length === 0 || filterNichos.includes(r.nicho)) &&
      (!filterPeriodo || r.dataAbertura === filterPeriodo) &&
      (filterEstados.length === 0 || filterEstados.includes(r.estado)) &&
      (filterCidades.length === 0 || filterCidades.includes(`${r.cidade} - ${r.estado}`)) &&
      (filterBairros.length === 0 || filterBairros.includes(`${r.bairro} - ${r.estado}`)) &&
      (filterPortes.length === 0 || filterPortes.includes(r.porte)),
  ), [visibleResults, filterNichos, filterPeriodo, filterEstados, filterCidades, filterBairros, filterPortes]);

  const favoriteResults = useMemo(
    () => visibleResults.filter((r) => favorites.includes(r.id)),
    [visibleResults, favorites],
  );

  const activeDashboardNicho = filterNichos.length > 0 ? filterNichos[0] : (availableNichos[0] || '');

  const dashboardData = useMemo(() => allResults.filter(
    (r) => r.nicho === activeDashboardNicho &&
      (filterEstados.length === 0 || filterEstados.includes(r.estado)) &&
      (filterCidades.length === 0 || filterCidades.includes(`${r.cidade} - ${r.estado}`)) &&
      (filterBairros.length === 0 || filterBairros.includes(`${r.bairro} - ${r.estado}`)) &&
      (filterPortes.length === 0 || filterPortes.includes(r.porte)) &&
      (!filterPeriodo || r.dataAbertura === filterPeriodo),
  ), [allResults, activeDashboardNicho, filterEstados, filterCidades, filterBairros, filterPortes, filterPeriodo]);

  const paginatedResults = useMemo(
    () => filteredResults.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE),
    [filteredResults, page],
  );
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);

  /* --- Dispatch functions --- */
  const confirmConfig = useCallback(async (newConfig: { niches: NicheDTO[]; limit: number }) => {
    const { saveSegmentationController } = await import('../controllers/SegmentationController');
    await saveSegmentationController(newConfig.niches, newConfig.limit);
    setConfig(newConfig);
    setShowInterestModal(false);
    setPage(0);
    setFilterNichos([]);
    setFilterPeriodo('');
    setFilterEstados([]);
    setFilterCidades([]);
    setFilterBairros([]);
    setFilterPortes([]);
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    const favorited = await toggleFavoriteController(id);
    setFavorites((prev) => favorited ? [...prev, id] : prev.filter((fid) => fid !== id));
  }, []);

  const blockEmpresa = useCallback(async (id: string) => {
    await blockEmpresaController(id);
    setBlocked((prev) => [...prev, id]);
  }, []);

  const getEmpresas = useCallback(async (niche: NicheDTO, period: string) => {
    await blockEmpresaController('');
    setBlocked((prev) => [...prev, '']);
  }, []);

  const resetFilters = useCallback(() => {
    setFilterPeriodo(''); setFilterEstados([]); setFilterCidades([]); setFilterBairros([]); setFilterPortes([]); setPage(0);
  }, []);

  const handleSetFilterNichos = useCallback((vals: string[]) => { setFilterNichos(vals); resetFilters(); }, [resetFilters]);
  const handleSetFilterPeriodo = useCallback((val: string) => { setFilterPeriodo(val); setPage(0); }, []);
  const handleSetFilterEstados = useCallback((vals: string[]) => { setFilterEstados(vals); setFilterCidades([]); setFilterBairros([]); setPage(0); }, []);
  const handleSetFilterCidades = useCallback((vals: string[]) => { setFilterCidades(vals); setFilterBairros([]); setPage(0); }, []);
  const handleSetFilterBairros = useCallback((vals: string[]) => { setFilterBairros(vals); setPage(0); }, []);
  const handleSetFilterPortes = useCallback((vals: string[]) => { setFilterPortes(vals); setPage(0); }, []);

  const dispatch: AppDispatch = useMemo(() => ({
    setView, setFilterNichos: handleSetFilterNichos, setFilterPeriodo: handleSetFilterPeriodo,
    setFilterEstados: handleSetFilterEstados, setFilterCidades: handleSetFilterCidades,
    setFilterBairros: handleSetFilterBairros, setFilterPortes: handleSetFilterPortes,
    setPage, toggleFavorite, blockEmpresa, confirmConfig,
  }), [handleSetFilterNichos, handleSetFilterPeriodo, handleSetFilterEstados, handleSetFilterCidades, handleSetFilterBairros, handleSetFilterPortes, toggleFavorite, blockEmpresa, confirmConfig]);

  const state: AppState = useMemo(() => ({
    view, allResults, favorites, blocked, page, config, showInterestModal, loading,
    filterNichos, filterPeriodo, filterEstados, filterCidades, filterBairros, filterPortes,
    filteredResults, favoriteResults, paginatedResults, availableNichos, availablePeriods,
    availableEstados, availableCidades, availableBairros, availablePortes,
    dashboardData, activeDashboardNicho, totalPages,
  }), [view, allResults, favorites, blocked, page, config, showInterestModal, loading, filterNichos, filterPeriodo, filterEstados, filterCidades, filterBairros, filterPortes, filteredResults, favoriteResults, paginatedResults, availableNichos, availablePeriods, availableEstados, availableCidades, availableBairros, availablePortes, dashboardData, activeDashboardNicho, totalPages]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
