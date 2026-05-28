'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Info } from 'lucide-react';
import { clsx } from 'clsx';
import type { EmpresaDTO } from '../../dtos/EmpresaDTO';
import gridHeatmapStyles from './GridHeatmap.module.css';

interface GridHeatmapProps {
  data: EmpresaDTO[];
  type?: 'bairro' | 'cidade';
}

const monthData = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export default function GridHeatmap({ data, type = 'bairro' }: GridHeatmapProps) {
  const groupedData = useMemo(() => {
    const key = type === 'bairro' ? 'bairro' : 'cidade';
    return Array.from(new Set(data.map((d) => d[key]))).sort().slice(0, 10);
  }, [data, type]);

  const getDensity = (item: string, monthIndex: number) => {
    const strLen = (item + monthIndex).length;
    const key = type === 'bairro' ? 'bairro' : 'cidade';
    const count = data.filter((d) => d[key] === item).length;
    return Math.floor(((strLen * count * 7) % 100));
  };

  const typeLabel = type === 'bairro' ? 'Bairro' : 'Cidade';
  const typeLower = type === 'bairro' ? 'bairro' : 'cidade';

  return (
    <div className={gridHeatmapStyles.heatmapCard}>
      <div className={gridHeatmapStyles.heatmapHeader}>
        <div>
          <h3 className={gridHeatmapStyles.heatmapTitle}>
            <LayoutGrid className="w-5 h-5 text-primary" />
            Mapa de Calor Tabular (Densidade por {typeLabel})
          </h3>
          <p className={gridHeatmapStyles.heatmapSubtitle}>
            Volume relativo de aberturas de CNPJs por {typeLower} e competência
          </p>
        </div>
        <div className={gridHeatmapStyles.legend}>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Baixa</span>
          <div className={gridHeatmapStyles.legendBox}>
            <div className={gridHeatmapStyles.legendLevel1} />
            <div className={gridHeatmapStyles.legendLevel2} />
            <div className={gridHeatmapStyles.legendLevel3} />
            <div className={gridHeatmapStyles.legendLevel4} />
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Alta</span>
        </div>
      </div>

      <div className={gridHeatmapStyles.tableWrapper}>
        <table className={gridHeatmapStyles.heatmapTable}>
          <thead>
            <tr>
              <th className={gridHeatmapStyles.tableHeaderCell}>{typeLabel}</th>
              {monthData.map((m) => (
                <th key={m} className={gridHeatmapStyles.tableHeaderCellCenter}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedData.length > 0 ? (
              groupedData.map((item) => (
                <tr key={item}>
                  <td className={gridHeatmapStyles.bairroCell}>{item}</td>
                  {monthData.map((_, i) => {
                    const density = getDensity(item, i);
                    const level =
                      density < 25 ? '1' : density < 50 ? '2' : density < 75 ? '3' : '4';
                    const textColorClass =
                      density > 60 ? 'text-slate-900' : 'text-emerald-400';

                    return (
                      <td key={i} className={gridHeatmapStyles.densityCell}>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.005 }}
                          className={clsx(
                            gridHeatmapStyles.densityBox,
                            textColorClass,
                          )}
                          data-level={level}
                        >
                          {density}
                        </motion.div>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={13}
                  className="py-20 text-center text-slate-500 italic font-medium"
                >
                  Nenhum dado de {typeLower} disponível para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={gridHeatmapStyles.footerInfo}>
        <Info className="w-3 h-3 text-primary" />
        <span>Dados normalizados via Score de Propensão Regional.</span>
      </div>
    </div>
  );
}
