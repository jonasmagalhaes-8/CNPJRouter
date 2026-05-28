'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp,
  Building2,
} from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import type { EmpresaDTO } from '../../dtos/EmpresaDTO';
import analyticsDashboardStyles from './AnalyticsDashboard.module.css';

interface AnalyticsDashboardProps {
  data: EmpresaDTO[];
  nicho: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-300 text-xs font-bold mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-emerald-400 text-sm font-black">
          {payload[0].value}{' '}
          <span className="text-[10px] text-slate-500 font-normal">resultados</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function AnalyticsDashboard({ data, nicho }: AnalyticsDashboardProps) {
  const trendData = useMemo(() => {
    return [
      { name: 'Jan', valor: Math.floor(data.length * 0.4) },
      { name: 'Fev', valor: Math.floor(data.length * 0.5) },
      { name: 'Mar', valor: Math.floor(data.length * 0.45) },
      { name: 'Abr', valor: Math.floor(data.length * 0.7) },
      { name: 'Mai', valor: Math.floor(data.length * 0.85) },
      { name: 'Jun', valor: data.length },
    ];
  }, [data]);

  const topCities = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((d) => {
      counts[d.cidade] = (counts[d.cidade] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, volume]) => ({ name, volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [data]);

  return (
    <div className={analyticsDashboardStyles.dashboardContainer}>
      <div className={analyticsDashboardStyles.chartsGrid}>
        <div className={analyticsDashboardStyles.chartCard}>
          <div className={analyticsDashboardStyles.chartHeader}>
            <h3 className={analyticsDashboardStyles.chartTitle}>
              <TrendingUp className="w-5 h-5 text-primary" />
              Volume de Descoberta: {nicho}
            </h3>
            <span className={analyticsDashboardStyles.chartBadge}>
              PROJEÇÃO SEMESTRAL
            </span>
          </div>
          <div className={analyticsDashboardStyles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis dataKey="name" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="var(--primary)"
                  fillOpacity={1}
                  fill="url(#colorVal)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={analyticsDashboardStyles.chartCard}>
          <h3 className={analyticsDashboardStyles.chartTitle}>
            <Building2 className="w-5 h-5 text-blue-500" />
            Distribuição por Cidade
          </h3>
          <div className={analyticsDashboardStyles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={topCities} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--border)"
                />
                <XAxis type="number" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis
                  dataKey="name"
                  type="category"
                  fontSize={12}
                  stroke="var(--muted-foreground)"
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="volume"
                  fill="var(--accent)"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
