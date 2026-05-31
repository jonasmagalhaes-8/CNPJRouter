'use client';

import React from 'react';
import {
  Building2, Trash2, Globe, Map, CheckCircle2,
  MapPin, PlusCircle,
} from 'lucide-react';
import type { NicheDTO } from '../../dtos/NicheDTO';
import type { GeoIntelligenceDTO } from '../../dtos/GeoIntelligenceDTO';
import type { PorteConfigDTO } from '../../dtos/PorteConfigDTO';
import { PORTE_EMPRESA } from '../../constants';
import interestModalStyles from '../InterestModal/InterestModal.module.css';
import nicheCardStyles from './NicheCard.module.css';
import PorteSection from '../PorteSection/PorteSection';
import RegionalGeoCard from '../RegionalGeoCard/RegionalGeoCard';

interface NicheCardProps {
  niche: NicheDTO;
  niches: NicheDTO[];
  setNiches: (val: NicheDTO[]) => void;
}

export default function NicheCard({ niche, niches, setNiches }: NicheCardProps) {
  const updateNiche = (patch: Partial<NicheDTO>) => {
    setNiches(niches.map((n) => (n.id === niche.id ? { ...n, ...patch } : n)));
  };

  const updateGeo = (geoId: string, patch: Partial<GeoIntelligenceDTO>) => {
    setNiches(niches.map((n) => {
      if (n.id !== niche.id) return n;
      return {
        ...n,
        geographies: n.geographies.map((g) => g.id === geoId ? { ...g, ...patch } : g),
      };
    }));
  };

  const removeNiche = () => setNiches(niches.filter((x) => x.id !== niche.id));

  const addGeo = () => {
    updateNiche({
      geographies: [...niche.geographies, {
        id: Math.random().toString(36).substr(2, 9),
        state: 'SP',
        cities: [],
        portes: [],
      }],
    });
  };

  const removeGeo = (geoId: string) => {
    updateNiche({ geographies: niche.geographies.filter((g) => g.id !== geoId) });
  };

  /* Porte helpers for geo level */
  const addPorteToGeo = (geoId: string, porte: string) => {
    const geo = niche.geographies.find((g) => g.id === geoId);
    if (!geo || geo.portes.some((p) => p.porte === porte)) return;
    updateGeo(geoId, {
      portes: [...geo.portes, {
        id: Math.random().toString(36).substr(2, 9), porte, period: '', quantity: 0,
      }],
    });
  };

  const removePorteFromGeo = (geoId: string, porteId: string) => {
    const geo = niche.geographies.find((g) => g.id === geoId);
    if (!geo) return;
    updateGeo(geoId, { portes: geo.portes.filter((p) => p.id !== porteId) });
  };

  const updatePorteInGeo = (geoId: string, porteId: string, patch: Partial<PorteConfigDTO>) => {
    const geo = niche.geographies.find((g) => g.id === geoId);
    if (!geo) return;
    updateGeo(geoId, {
      portes: geo.portes.map((p) => p.id === porteId ? { ...p, ...patch } : p),
    });
  };

  /* City helpers with porte */
  const addCity = (geoId: string) => {
    const cityName = prompt('Nome da Cidade:');
    if (!cityName) return;
    const geo = niche.geographies.find((g) => g.id === geoId);
    if (!geo) return;
    updateGeo(geoId, {
      cities: [...geo.cities, {
        id: Math.random().toString(36).substr(2, 9),
        name: cityName,
        portes: [],
      }],
    });
  };

  const removeCity = (geoId: string, cityId: string) => {
    const geo = niche.geographies.find((g) => g.id === geoId);
    if (!geo) return;
    updateGeo(geoId, { cities: geo.cities.filter((c) => c.id !== cityId) });
  };

  /* Porte helpers for city level */
  const addPorteToCity = (geoId: string, cityId: string, porte: string) => {
    const geo = niche.geographies.find((g) => g.id === geoId);
    if (!geo) return;
    updateGeo(geoId, {
      cities: geo.cities.map((c) => {
        if (c.id !== cityId) return c;
        if (c.portes.some((p) => p.porte === porte)) return c;
        return {
          ...c,
          portes: [...c.portes, {
            id: Math.random().toString(36).substr(2, 9), porte, period: '', quantity: 0,
          }],
        };
      }),
    });
  };

  const removePorteFromCity = (geoId: string, cityId: string, porteId: string) => {
    const geo = niche.geographies.find((g) => g.id === geoId);
    if (!geo) return;
    updateGeo(geoId, {
      cities: geo.cities.map((c) => {
        if (c.id !== cityId) return c;
        return { ...c, portes: c.portes.filter((p) => p.id !== porteId) };
      }),
    });
  };

  const updatePorteInCity = (geoId: string, cityId: string, porteId: string, patch: Partial<PorteConfigDTO>) => {
    const geo = niche.geographies.find((g) => g.id === geoId);
    if (!geo) return;
    updateGeo(geoId, {
      cities: geo.cities.map((c) => {
        if (c.id !== cityId) return c;
        return { ...c, portes: c.portes.map((p) => p.id === porteId ? { ...p, ...patch } : p) };
      }),
    });
  };

  const geoTotal = (geo: GeoIntelligenceDTO) => {
    if (geo.cities.length > 0) {
      return geo.cities.reduce((sum, c) => sum + c.portes.reduce((ps, p) => ps + p.quantity, 0), 0);
    }
    return geo.portes.reduce((sum, p) => sum + p.quantity, 0);
  };

  return (
    <div className={interestModalStyles.nicheCard}>
      <div className={nicheCardStyles.nicheHeader}>
        <div className={nicheCardStyles.nicheHeaderLeft}>
          <div className={nicheCardStyles.nicheIconBox}>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <span className={nicheCardStyles.nicheName}>
            {niche.type === 'LOOKALIKE' ? `Empresas similares ao CNPJ: ${niche.name}` : niche.name}
          </span>
        </div>
        <button onClick={removeNiche} className={nicheCardStyles.deleteBtn}>
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className={nicheCardStyles.nicheBody}>
        <div className="flex flex-col gap-6">
          {/* Scope selection */}
          <div className={nicheCardStyles.scopeRow}>
            <label
              className={interestModalStyles.radioLabel}
              data-active={niche.scope === 'NACIONAL'}
              onClick={() => {
                if (niche.scope !== 'NACIONAL') {
                  const freshGeo = {
                    id: Math.random().toString(36).substr(2, 9),
                    state: niche.geographies[0]?.state || 'SP',
                    cities: [],
                    portes: [],
                  };
                  updateNiche({ scope: 'NACIONAL', geographies: [freshGeo] });
                }
              }}
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold">Nacional (Todos)</span>
            </label>
            <label
              className={interestModalStyles.radioLabel}
              data-active={niche.scope === 'REGIONAL'}
              onClick={() => {
                if (niche.scope !== 'REGIONAL') {
                  const freshGeo = {
                    id: Math.random().toString(36).substr(2, 9),
                    state: niche.geographies[0]?.state || 'SP',
                    cities: [],
                    portes: [],
                  };
                  updateNiche({ scope: 'REGIONAL', geographies: [freshGeo] });
                }
              }}
            >
              <Map className="w-4 h-4" />
              <span className="text-xs font-bold">Especificar Região</span>
            </label>
          </div>

          {/* Nacional */}
          {niche.scope === 'NACIONAL' && (
            <div className="flex flex-col gap-4">
              <div className={nicheCardStyles.nacionalBanner}>
                <div className={nicheCardStyles.nacionalBannerLeft}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">
                    Busca em todo território nacional
                  </span>
                </div>
                <span className={nicheCardStyles.expectedLabel}>
                  Total: {geoTotal(niche.geographies[0])}
                </span>
              </div>
              <PorteSection
                portes={niche.geographies[0].portes}
                onAdd={(porte) => addPorteToGeo(niche.geographies[0].id, porte)}
                onRemove={(pid) => removePorteFromGeo(niche.geographies[0].id, pid)}
                onUpdate={(pid, patch) => updatePorteInGeo(niche.geographies[0].id, pid, patch)}
              />
            </div>
          )}

          {/* Regional */}
          {niche.scope === 'REGIONAL' && (
            <>
              <div className={nicheCardStyles.geoSectionHeader}>
                <span className={nicheCardStyles.geoSectionLabel}>
                  Configuração Geográfica
                </span>
              </div>

              <div className={nicheCardStyles.geoGrid}>
                {niche.geographies.map((geo) => (
                  <RegionalGeoCard
                    key={geo.id}
                    geo={geo}
                    onUpdateGeo={(patch) => updateGeo(geo.id, patch)}
                    onRemoveGeo={() => removeGeo(geo.id)}
                    onAddCity={() => addCity(geo.id)}
                    onRemoveCity={(cid) => removeCity(geo.id, cid)}
                    onAddPorte={(porte) => addPorteToGeo(geo.id, porte)}
                    onRemovePorte={(pid) => removePorteFromGeo(geo.id, pid)}
                    onUpdatePorte={(pid, patch) => updatePorteInGeo(geo.id, pid, patch)}
                    onAddPorteToCity={(cid, porte) => addPorteToCity(geo.id, cid, porte)}
                    onRemovePorteFromCity={(cid, pid) => removePorteFromCity(geo.id, cid, pid)}
                    onUpdatePorteInCity={(cid, pid, patch) => updatePorteInCity(geo.id, cid, pid, patch)}
                    canRemove={niche.geographies.length > 1}
                  />
                ))}
              </div>

              <button onClick={addGeo} className={interestModalStyles.addGeoBtn}>
                <MapPin className="w-4 h-4" /> Adicionar Nova Busca Geográfica
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
