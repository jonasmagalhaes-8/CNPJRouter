'use client';

import React from 'react';
import { Target, Zap, Users } from 'lucide-react';
import type { EmpresaDTO } from '../../dtos/EmpresaDTO';
import quickStatsStyles from './QuickStats.module.css';

interface QuickStatsProps {
  results: EmpresaDTO[];
}

export default function QuickStats({ results }: QuickStatsProps) {
  const stats = [
    {
      label: 'CNPJs Descobertos',
      value: results.length,
      icon: Target,
      color: 'text-emerald-500',
    },
    {
      label: 'Nichos Ativos',
      value: new Set(results.map((r) => r.nicho)).size,
      icon: Zap,
      color: 'text-amber-500',
    },
    {
      label: 'Cidades Mapeadas',
      value: new Set(results.map((r) => r.cidade)).size,
      icon: Users,
      color: 'text-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((s, i) => (
        <div
          key={i}
          className="bg-secondary/50 border border-border p-4 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-2">
            <s.icon className={`w-4 h-4 ${s.color}`} />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              {s.label}
            </span>
          </div>
          <div className="text-xl font-black text-white">{s.value}</div>
        </div>
      ))}
    </div>
  );
}
