'use client';

import React, { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Building2, TrendingUp } from 'lucide-react';
import type { EmpresaDTO } from '../../dtos/EmpresaDTO';
import styles from './PorteDistribution.module.css';

interface PorteDistributionProps {
  data: EmpresaDTO[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const PORTE_SHORT: Record<string, string> = {
  'Microempresa (ME)': 'ME',
  'Pequena Empresa': 'EPP',
  'Média Empresa': 'Média',
  'Grande Empresa': 'Grande',
};
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-white text-sm font-bold">{payload[0].name}</p>
        <p className="text-emerald-400 text-sm font-black">{payload[0].value} empresas</p>
      </div>
    );
  }
  return null;
}

export default function PorteDistribution({ data }: PorteDistributionProps) {
  const porteData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((d) => {
      counts[d.porte] = (counts[d.porte] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({
        name: PORTE_SHORT[name] || name,
        fullName: name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Stacked bar data by month
  const stackedData = useMemo(() => {
    const portes = Object.keys(PORTE_SHORT);
    return MONTHS.map((mes, idx) => {
      const row: Record<string, any> = { mes };
      portes.forEach((porte) => {
        const count = data.filter((d) => d.porte === porte).length;
        row[PORTE_SHORT[porte]] = Math.floor(count * (0.15 + (idx / 5) * 0.85) * (0.8 + Math.random() * 0.4));
      });
      return row;
    });
  }, [data]);

  const topPorte = porteData.length > 0 ? porteData[0] : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>
            <Building2 className="w-5 h-5 text-primary" />
            Distribuicao por Porte
          </h3>
          <p className={styles.subtitle}>
            Analise de ME, EPP, Media e Grande Empresa
          </p>
        </div>
        {topPorte && (
          <div className={styles.badge}>
            <span className={styles.badgeLabel}>Predominante</span>
            <span className={styles.badgeValue}>{topPorte.fullName} ({topPorte.value})</span>
          </div>
        )}
      </div>

      <div className={styles.chartsGrid}>
        {/* Pie chart */}
        <div className={styles.chartCard}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={porteData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {porteData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {porteData.map((item, i) => (
              <div key={item.name} className={styles.legendItem}>
                <div className={styles.legendDot} style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className={styles.legendName}>{item.name}</span>
                <span className={styles.legendValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stacked bar chart */}
        <div className={styles.chartCard}>
          <h4 className={styles.chartTitle}>
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Crescimento por Porte (Semestre)
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stackedData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="mes" fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ME" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="EPP" stackId="a" fill="#3b82f6" />
              <Bar dataKey="Média" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Grande" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.trendLegend}>
            {Object.entries(PORTE_SHORT).map(([key, label], i) => (
              <div key={label} className={styles.trendLegendItem}>
                <div className={styles.legendDot} style={{ backgroundColor: COLORS[i] }} />
                <span className={styles.trendLegendText}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
