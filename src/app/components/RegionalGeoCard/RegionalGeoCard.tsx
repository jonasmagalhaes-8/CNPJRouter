'use client';

import React from 'react';
import { MapPin, PlusCircle, ChevronDown, X } from 'lucide-react';
import type { NicheDTO } from '../../dtos/NicheDTO';
import type { GeoIntelligenceDTO } from '../../dtos/GeoIntelligenceDTO';
import type { PorteConfigDTO } from '../../dtos/PorteConfigDTO';
import { UFS } from '../../constants';
import interestModalStyles from '../InterestModal/InterestModal.module.css';
import nicheCardStyles from '../NicheCard/NicheCard.module.css';
import regionalGeoCardStyles from './RegionalGeoCard.module.css';
import PorteSection from '../PorteSection/PorteSection';

interface RegionalGeoCardProps {
  geo: GeoIntelligenceDTO;
  onUpdateGeo: (patch: Partial<GeoIntelligenceDTO>) => void;
  onRemoveGeo: () => void;
  onAddCity: () => void;
  onRemoveCity: (cityId: string) => void;
  onAddPorte: (porte: string) => void;
  onRemovePorte: (porteId: string) => void;
  onUpdatePorte: (porteId: string, patch: Partial<PorteConfigDTO>) => void;
  onAddPorteToCity: (cityId: string, porte: string) => void;
  onRemovePorteFromCity: (cityId: string, porteId: string) => void;
  onUpdatePorteInCity: (cityId: string, porteId: string, patch: Partial<PorteConfigDTO>) => void;
  canRemove: boolean;
}

export default function RegionalGeoCard({
  geo,
  onUpdateGeo,
  onRemoveGeo,
  onAddCity,
  onRemoveCity,
  onAddPorte,
  onRemovePorte,
  onUpdatePorte,
  onAddPorteToCity,
  onRemovePorteFromCity,
  onUpdatePorteInCity,
  canRemove,
}: RegionalGeoCardProps) {
  const geoTotal = geo.cities.length > 0
    ? geo.cities.reduce((s, c) => s + c.portes.reduce((ps, p) => ps + p.quantity, 0), 0)
    : geo.portes.reduce((s, p) => s + p.quantity, 0);

  const hasCities = geo.cities.length > 0;

  return (
    <div className={nicheCardStyles.geoCard}>
      <div className="flex flex-col gap-4">
        {/* State selector + total + add city */}
        <div className={nicheCardStyles.geoTopRow}>
          <div className={nicheCardStyles.geoSelectWrapper}>
            <select
              value={geo.state}
              onChange={(e) => onUpdateGeo({ state: e.target.value })}
              className={nicheCardStyles.geoSelect}
            >
              {UFS.map((u) => (
                <option key={u} value={u}>Estado: {u}</option>
              ))}
            </select>
            <ChevronDown className={nicheCardStyles.geoSelectIcon} />
          </div>
          <button onClick={onAddCity} className={nicheCardStyles.addCityBtn}>
            <PlusCircle className="w-3.5 h-3.5" /> Adicionar Cidade
          </button>
          <span className={nicheCardStyles.expectedLabel}>Total: {geoTotal}</span>
          {canRemove && (
            <button onClick={onRemoveGeo} className={nicheCardStyles.removeGeoBtn}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* When no cities: porte at state level */}
        {!hasCities && (
          <PorteSection
            portes={geo.portes}
            onAdd={onAddPorte}
            onRemove={onRemovePorte}
            onUpdate={onUpdatePorte}
          />
        )}

        {/* Cities list with porte per city */}
        {hasCities && (
          <div className={nicheCardStyles.citiesList}>
            {geo.cities.map((city) => (
              <CityBlock
                key={city.id}
                city={city}
                onRemove={() => onRemoveCity(city.id)}
                onAddPorte={(porte) => onAddPorteToCity(city.id, porte)}
                onRemovePorte={(pid) => onRemovePorteFromCity(city.id, pid)}
                onUpdatePorte={(pid, patch) => onUpdatePorteInCity(city.id, pid, patch)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- City block with its own porte section ---- */
function CityBlock({
  city,
  onRemove,
  onAddPorte,
  onRemovePorte,
  onUpdatePorte,
}: {
  city: { id: string; name: string; portes: PorteConfigDTO[] };
  onRemove: () => void;
  onAddPorte: (porte: string) => void;
  onRemovePorte: (porteId: string) => void;
  onUpdatePorte: (porteId: string, patch: Partial<PorteConfigDTO>) => void;
}) {
  const cityTotal = city.portes.reduce((s, p) => s + p.quantity, 0);

  return (
    <div className={nicheCardStyles.cityBlock}>
      {/* City header */}
      <div className={nicheCardStyles.cityHeader}>
        <MapPin className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-bold text-slate-700 flex-1">{city.name}</span>
        <span className={nicheCardStyles.expectedLabel}>{cityTotal}</span>
        <button onClick={onRemove} className={nicheCardStyles.removeCityBtn}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* City-level porte section */}
      <PorteSection
        portes={city.portes}
        onAdd={onAddPorte}
        onRemove={onRemovePorte}
        onUpdate={onUpdatePorte}
      />
    </div>
  );
}
