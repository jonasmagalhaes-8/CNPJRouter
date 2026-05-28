'use client';

import { useAppState, useAppDispatch } from '../../context/AppContext';
import FilterDropdown from '../FilterDropdown/FilterDropdown';
import searchFiltersStyles from './SearchFilters.module.css';

export default function SearchFilters() {
  const {
    view,
    filterNichos,
    filterPeriodo,
    filterEstados,
    filterCidades,
    filterBairros,
    filterPortes,
    availableNichos,
    availablePeriods,
    availableEstados,
    availableCidades,
    availableBairros,
    availablePortes,
  } = useAppState();

  const {
    setFilterNichos,
    setFilterPeriodo,
    setFilterEstados,
    setFilterCidades,
    setFilterBairros,
    setFilterPortes,
  } = useAppDispatch();

  const periodOptions = ['Todos', ...availablePeriods];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      <FilterDropdown
        label="Nichos"
        options={availableNichos}
        selected={filterNichos}
        onChange={setFilterNichos}
        placeholder="Todos"
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
        label="Cidades"
        options={availableCidades}
        selected={filterCidades}
        onChange={setFilterCidades}
        placeholder="Todas"
      />

      <FilterDropdown
        label="Bairros"
        options={availableBairros}
        selected={filterBairros}
        onChange={setFilterBairros}
        placeholder="Todos"
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
