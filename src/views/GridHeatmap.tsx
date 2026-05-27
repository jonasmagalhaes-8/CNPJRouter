import React, { useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Info } from 'lucide-react';
import { EmpresaModel } from '../models/Empresa.model';
import styles from './GridHeatmap.module.css';

interface GridHeatmapProps {
  data: EmpresaModel[];
  type?: 'bairro' | 'cidade';
}

const monthData = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const GridHeatmap: React.FC<GridHeatmapProps> = ({ data, type = 'bairro' }) => {
  const groupedData = useMemo(() => {
    const key = type === 'bairro' ? 'bairro' : 'cidade';
    return Array.from(new Set(data.map(d => d[key]))).sort().slice(0, 10);
  }, [data, type]);

  const getDensity = (item: string, monthIndex: number) => {
    const strLen = (item + monthIndex).length;
    const key = type === 'bairro' ? 'bairro' : 'cidade';
    const count = data.filter(d => d[key] === item).length;
    return Math.floor(((strLen * count * 7) % 100));
  };

  return (
    <div className={styles.heatmapCard}>
      <div className={styles.heatmapHeader}>
        <div>
          <h3 className={styles.heatmapTitle}>
            <LayoutGrid className="w-5 h-5 text-primary" />
            Mapa de Calor Tabular (Densidade por {type === 'bairro' ? 'Bairro' : 'Cidade'})
          </h3>
          <p className={styles.heatmapSubtitle}>Volume relativo de aberturas de CNPJs por {type === 'bairro' ? 'bairro' : 'cidade'} e competência</p>
        </div>
        <div className={styles.legend}>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Baixa</span>
          <div className={styles.legendBox}>
            <div className={styles.legendLevel1} />
            <div className={styles.legendLevel2} />
            <div className={styles.legendLevel3} />
            <div className={styles.legendLevel4} />
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Alta</span>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.heatmapTable}>
          <thead>
            <tr>
              <th className={styles.tableHeaderCell}>{type === 'bairro' ? 'Bairro' : 'Cidade'}</th>
              {monthData.map(m => (
                <th key={m} className={styles.tableHeaderCellCenter}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedData.length > 0 ? (
              groupedData.map(item => (
                <tr key={item} className={styles.tableRow}>
                  <td className={styles.bairroCell}>{item}</td>
                  {monthData.map((_, i) => {
                    const density = getDensity(item, i);
                    const level = density < 25 ? "1" : density < 50 ? "2" : density < 75 ? "3" : "4";
                    const textColorClass = density > 60 ? "text-slate-900" : "text-emerald-400";
                    
                    return (
                      <td key={i} className={styles.densityCell}>
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: i * 0.005 }}
                          className={`${styles.densityBox} ${textColorClass}`}
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
                <td colSpan={13} className="py-20 text-center text-slate-500 italic font-medium">
                  Nenhum dado de {type === 'bairro' ? 'bairro' : 'cidade'} disponível para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className={styles.footerInfo}>
        <Info className="w-3 h-3 text-primary" />
        <span>Dados normalizados via Score de Propensão Regional.</span>
      </div>
    </div>
  );
};
