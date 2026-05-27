import React from 'react';
import { FilterDropdown } from './FilterDropdown';

interface SearchFiltersProps {
  view: 'feed' | 'dashboard' | 'favorites';
  filterNichos: string[];
  filterPeriodo: string;
  filterEstados: string[];
  filterCidades: string[];
  filterBairros: string[];
  availableNichos: string[];
  availablePeriods: string[];
  availableEstados: string[];
  availableCidades: string[];
  availableBairros: string[];
  consultationDate: string;
  consultationDates: string[];
  onNichoChange: (vals: string[]) => void;
  onPeriodoChange: (val: string) => void;
  onEstadoChange: (vals: string[]) => void;
  onCidadeChange: (vals: string[]) => void;
  onBairroChange: (vals: string[]) => void;
  onConsultationDateChange: (val: string) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  view,
  filterNichos, filterPeriodo, filterEstados, filterCidades, filterBairros,
  availableNichos, availablePeriods, availableEstados, availableCidades, availableBairros,
  consultationDate, consultationDates,
  onNichoChange, onPeriodoChange, onEstadoChange, onCidadeChange, onBairroChange, onConsultationDateChange
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {/* <FilterDropdown 
        label="Data da Consulta"
        options={consultationDates}
        selected={[consultationDate]}
        onChange={(vals) => onConsultationDateChange(vals[0] || consultationDate)}
        placeholder="Selecionar Data"
        single
      /> */}

      <FilterDropdown 
        label="Nichos"
        options={availableNichos}
        selected={filterNichos}
        onChange={onNichoChange}
        placeholder="Todos os nichos"
        single={view === 'dashboard'}
      />
      
      <FilterDropdown 
        label="Tempo de Mercado"
        options={['Todos', ...availablePeriods]}
        selected={filterPeriodo ? [filterPeriodo] : ['Todos']}
        onChange={(vals) => onPeriodoChange(vals[0] === 'Todos' ? '' : vals[0] || '')}
        placeholder="Todos"
        single
      />

      <FilterDropdown 
        label="Localização (Estado)"
        options={availableEstados}
        selected={filterEstados}
        onChange={onEstadoChange}
        placeholder="Todos os estados"
      />

      <FilterDropdown 
        label="Cidades"
        options={availableCidades}
        selected={filterCidades}
        onChange={onCidadeChange}
        placeholder="Todas as cidades"
      />

      <FilterDropdown 
        label="Bairros"
        options={availableBairros}
        selected={filterBairros}
        onChange={onBairroChange}
        placeholder="Todos os bairros"
      />
    </div>
  );
};
