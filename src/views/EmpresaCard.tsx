import React from 'react';
import { Building2, MapPin, Phone, Mail, User, ShieldCheck, Star, Ban } from 'lucide-react';
import styles from './EmpresaCard.module.css';
import { EmpresaModel } from '../models/Empresa.model';

interface EmpresaCardProps {
  empresa: EmpresaModel;
  isFavorite?: boolean;
  onFavorite?: () => void;
  onBlock?: () => void;
}

export const EmpresaCard: React.FC<EmpresaCardProps> = ({ 
  empresa, 
  isFavorite, 
  onFavorite, 
  onBlock 
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
                <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={styles.nome}>{empresa.nome}</h3>
            <div className="flex gap-1">
              {/* <button 
                onClick={(e) => { e.stopPropagation(); onFavorite?.(); }}
                className={`p-1.5 rounded-md transition-all ${isFavorite ? 'text-amber-400 bg-amber-400/10 scale-110' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'}`}
              >
                <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </button> */}
              <button 
                onClick={(e) => { e.stopPropagation(); onBlock?.(); }}
                className="p-2 rounded-md text-slate-500 hover:text-rose-500 hover:bg-slate-800 transition-colors"
              >
                <Ban className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={styles.cnpj}>{empresa.cnpj}</span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-tighter">Ativo</span>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.infoItem}>
          <MapPin className={styles.icon} />
          <span className="truncate">{empresa.bairro} — {empresa.cidade}/{empresa.estado}</span>
        </div>
        <div className={styles.infoItem}>
          <User className={styles.icon} />
          <span className="truncate">{empresa.socio}</span>
        </div>
        <div className={styles.infoItem}>
          <Phone className={styles.icon} />
          <span>{empresa.telefone}</span>
        </div>
        <div className={styles.infoItem}>
          <Mail className={styles.icon} />
          <span className="truncate">{empresa.email}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Propensão</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-black ${empresa.score > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {empresa.score}%
              </span>
              <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full ${empresa.score > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${empresa.score}%` }}></div>
              </div>
            </div>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Porte</span>
            <span className={styles.statValue}>{empresa.funcionarios}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={styles.verified}>
            <ShieldCheck className="w-5 h-5" />
            <span>Auditado</span>
          </div>
          <div className={styles.nichoBadge}>{empresa.nicho}</div>
        </div>
      </div>
    </div>
  );
};
