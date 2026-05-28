'use client';

import React from 'react';
import { Package, ChevronDown } from 'lucide-react';
import type { PorteConfigDTO } from '../../dtos/PorteConfigDTO';
import { PERIODS, PORTE_EMPRESA } from '../../constants';
import interestModalStyles from '../InterestModal/InterestModal.module.css';
import porteSectionStyles from './PorteSection.module.css';

interface PorteSectionProps {
  portes: PorteConfigDTO[];
  onAdd: (porte: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<PorteConfigDTO>) => void;
}

export default function PorteSection({
  portes,
  onAdd,
  onRemove,
  onUpdate,
}: PorteSectionProps) {
  const selectedNames = new Set(portes.map((p) => p.porte));

  return (
    <div className={porteSectionStyles.section}>
      <div className={porteSectionStyles.header}>
        <Package className="w-4 h-4 text-slate-500" />
        <span className={porteSectionStyles.title}>Porte da Empresa</span>
      </div>

      <div className={porteSectionStyles.porteRows}>
        {PORTE_EMPRESA.map((porte) => {
          const config = portes.find((p) => p.porte === porte);
          const isActive = config !== undefined;

          return (
            <div
              key={porte}
              className={`${porteSectionStyles.porteRow} ${isActive ? porteSectionStyles.porteRowActive : ''}`}
            >
              {/* Toggle */}
              <button
                type="button"
                className={porteSectionStyles.porteToggle}
                onClick={() => isActive ? onRemove(config.id) : onAdd(porte)}
              >
                <div className={`${porteSectionStyles.porteCheck} ${isActive ? porteSectionStyles.porteCheckOn : ''}`} />
                <span className={porteSectionStyles.porteName}>{porte}</span>
              </button>

              {/* Config fields when active */}
              {isActive && (
                <div className={porteSectionStyles.porteFields}>
                  <div className={porteSectionStyles.field}>
                    <label className={porteSectionStyles.fieldLabel}>Período de Abertura</label>
                    <div className={porteSectionStyles.selectWrapper}>
                      <select
                        value={config.period}
                        onChange={(e) => onUpdate(config.id, { period: e.target.value })}
                        className={porteSectionStyles.fieldSelect}
                      >
                        {PERIODS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      <ChevronDown className={porteSectionStyles.selectIcon} />
                    </div>
                  </div>
                  <div className={porteSectionStyles.field}>
                    <label className={porteSectionStyles.fieldLabel}>Resultados Esperados</label>
                    <input
                      type="number"
                      min="0"
                      value={config.quantity}
                      onChange={(e) =>
                        onUpdate(config.id, { quantity: parseInt(e.target.value) || 0 })
                      }
                      className={porteSectionStyles.fieldInput}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
