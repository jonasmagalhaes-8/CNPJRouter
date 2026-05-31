'use client';

import { useEffect } from 'react';
import { useFeedStore } from '../../stores/useFeedStore';
import { useFavoritesStore } from '../../stores/useFavoritesStore';
import { PERIODS } from '../../constants';
import FilterDropdown from '../FilterDropdown/FilterDropdown';

export default function SearchFilters() {
  const {
    view,
    allResults,
    filterCategorias,
    filterPeriodo,
    filterEstados,
    filterMunicipios,
    filterBairros,
    filterPortes,
    setFilterCategorias,
    setFilterPeriodo,
    setFilterEstados,
    setFilterMunicipios,
    setFilterBairros,
    setFilterPortes,
    loadFilterOptions,
  } = useFeedStore();

  const { favoriteResults } = useFavoritesStore();

  const data = view === 'favorites' ? favoriteResults : allResults;

  const availableCategorias = Array.from(new Set(data.map(r => r.categoriaIA).filter(Boolean))).sort();
  const availableEstados = Array.from(new Set(data.map(r => r.estado).filter(Boolean))).sort();
  const availableMunicipios = Array.from(new Set(data.map(r => r.municipio).filter(Boolean))).sort();
  const availableBairros = Array.from(new Set(data.map(r => r.bairro).filter(Boolean))).sort();
  const availablePortes = Array.from(new Set(data.map(r => r.porte).filter(Boolean))).sort();

  const periodOptions = ['Todos', ...PERIODS];

  // Load filter options when the component mounts or filters change
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  const getMunicipioLabel = (municipio: string) => {
    const item = data.find((r) => r.municipio === municipio);
    if (item && item.estado) {
      return `${municipio}/${item.estado}`;
    }
    return municipio;
  };

  const getBairroLabel = (bairro: string) => {
    const item = data.find((r) => r.bairro === bairro);
    if (item && item.municipio && item.estado) {
      return `${bairro} - ${item.municipio}/${item.estado}`;
    }
    return bairro;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <FilterDropdown
        label="Categorias"
        options={availableCategorias}
        selected={filterCategorias}
        onChange={setFilterCategorias}
        placeholder="Todas"
        single={view === 'dashboard'}
      />

      <FilterDropdown
        label="Tempo de Mercado"
        options={periodOptions}
        selected={filterPeriodo ? [filterPeriodo] : ['Todos']}
        onChange={(vals) => setFilterPeriodo(vals[0] === 'Todos' ? '' : vals[0] || '')}
        placeholder="Todos"
        single
      />

      <FilterDropdown
        label="UF"
        options={availableEstados}
        selected={filterEstados}
        onChange={setFilterEstados}
        placeholder="Todos"
      />

      <FilterDropdown
        label="Municípios"
        options={availableMunicipios}
        selected={filterMunicipios}
        onChange={setFilterMunicipios}
        placeholder="Todos"
        getOptionLabel={getMunicipioLabel}
      />

      <FilterDropdown
        label="Bairros"
        options={availableBairros}
        selected={filterBairros}
        onChange={setFilterBairros}
        placeholder="Todos"
        getOptionLabel={getBairroLabel}
      />

      <FilterDropdown
        label="Porte da Empresa"
        options={availablePortes}
        selected={filterPortes}
        onChange={setFilterPortes}
        placeholder="Todos"
      />
    </div>
  );
}
