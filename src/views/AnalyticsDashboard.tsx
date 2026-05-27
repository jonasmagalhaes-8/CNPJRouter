import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { TrendingUp, ThermometerSun, Map, BarChart3, Building2 } from 'lucide-react';
import { EmpresaModel } from '../models/Empresa.model';
import styles from './AnalyticsDashboard.module.css';

interface AnalyticsDashboardProps {
  data: EmpresaModel[];
  nicho: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
        <p className="text-slate-300 text-xs font-bold mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-emerald-400 text-sm font-black">
          {payload[0].value} <span className="text-[10px] text-slate-500 font-normal">resultados</span>
        </p>
      </div>
    );
  }
  return null;
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data, nicho }) => {
  const stats = useMemo(() => {
    const neighborhoodCount = new Set(data.map(d => d.bairro)).size;
    const scores = data.map(d => d.score);
    const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
    
    return {
      neighborhoods: neighborhoodCount,
      leads: data.length,
      avgScore: avgScore,
      health: data.length > 50 ? 'Crítico' : data.length > 20 ? 'Estável' : 'Aquecido'
    };
  }, [data]);

  const topNeighborhoods = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(d => {
      counts[d.bairro] = (counts[d.bairro] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, volume]) => ({ name, volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [data]);

  const trendData = useMemo(() => {
    // Simulated trend based on scores
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
    data.forEach(d => {
      counts[d.cidade] = (counts[d.cidade] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, volume]) => ({ name, volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [data]);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.statsGrid}>
        <StatCard icon={TrendingUp} label="Volume Total" value={data.length} color="text-emerald-500" />
        <StatCard icon={ThermometerSun} label="Termômetro Regional" value={stats.health} color="text-orange-500" />
        <StatCard icon={Map} label="Bairros Ativos" value={stats.neighborhoods} color="text-blue-500" />
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              <TrendingUp className="w-5 h-5 text-primary" />
              Volume de Descoberta: {nicho}
            </h3>
            <span className={styles.chartBadge}>PROJEÇÃO SEMESTRAL</span>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="valor" stroke="var(--primary)" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <ThermometerSun className="w-5 h-5 text-orange-500" />
            Distribuição por Bairro
          </h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topNeighborhoods} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis dataKey="name" type="category" fontSize={12} stroke="var(--muted-foreground)" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="volume" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <Building2 className="w-5 h-5 text-blue-500" />
            Distribuição por Cidade
          </h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCities} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis dataKey="name" type="category" fontSize={12} stroke="var(--muted-foreground)" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="volume" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className={styles.statCard}>
    <div className={styles.statIconWrapper}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
    <div>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
    </div>
  </div>
);
