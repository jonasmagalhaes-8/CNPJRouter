'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, User, Ban, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { EmpresaDTO } from '../../dtos/EmpresaDTO';
import { useAppDispatch } from '../../context/AppContext';
import empresaCardStyles from './EmpresaCard.module.css';

interface EmpresaCardProps {
  empresa: EmpresaDTO;
  isFavorite: boolean;
}

export default function EmpresaCard({ empresa, isFavorite }: EmpresaCardProps) {
  const { toggleFavorite, blockEmpresa } = useAppDispatch();
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const handleBlock = () => {
    blockEmpresa(empresa.id);
    setShowBlockConfirm(false);
  };

  return (
    <div className={empresaCardStyles.card}>
      <div className={empresaCardStyles.header}>
        <div className={empresaCardStyles.titleGroup}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={empresaCardStyles.nome}>{empresa.nome}</h3>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockConfirm(true);
                }}
                className="p-2 rounded-md text-slate-500 hover:text-rose-500 hover:bg-slate-800 transition-colors"
              >
                <Ban className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={empresaCardStyles.cnpj}>{empresa.cnpj}</span>
            <span className="text-[11px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-tighter">
              Ativo
            </span>
          </div>
        </div>
      </div>

      <div className={empresaCardStyles.grid}>
        <div className={empresaCardStyles.infoItem}>
          <MapPin className={empresaCardStyles.icon} />
          <span className="truncate">
            {empresa.cidade === 'Todas'
              ? `${empresa.bairro} — ${empresa.estado}`
              : `${empresa.bairro} — ${empresa.cidade}/${empresa.estado}`}
          </span>
        </div>
        <div className={empresaCardStyles.infoItem}>
          <User className={empresaCardStyles.icon} />
          <span className="truncate">{empresa.socio}</span>
        </div>
        <div className={empresaCardStyles.infoItem}>
          <Phone className={empresaCardStyles.icon} />
          <span>{empresa.telefone}</span>
        </div>
        <div className={empresaCardStyles.infoItem}>
          <Mail className={empresaCardStyles.icon} />
          <span className="truncate">{empresa.email}</span>
        </div>
      </div>

      <div className={empresaCardStyles.footer}>
        <div className={empresaCardStyles.stat}>
          <span className={empresaCardStyles.statLabel}>Porte</span>
          <span className={empresaCardStyles.statValue}>{empresa.porte}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={empresaCardStyles.verified}>
            <ShieldCheck className="w-5 h-5" />
            <span>Auditado</span>
          </div>
          <div className={empresaCardStyles.nichoBadge}>{empresa.nicho}</div>
        </div>
      </div>

      {/* Block confirmation overlay */}
      <AnimatePresence>
        {showBlockConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={empresaCardStyles.blockOverlay}
            onClick={() => setShowBlockConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={empresaCardStyles.blockDialog}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={empresaCardStyles.blockDialogIcon}>
                <Ban className="w-6 h-6" />
              </div>
              <p className={empresaCardStyles.blockDialogTitle}>
                Bloquear esta empresa?
              </p>
              <p className={empresaCardStyles.blockDialogText}>
                <strong>{empresa.nome}</strong> sera removida dos resultados e nao aparecera mais nesta prospeccao.
              </p>
              <div className={empresaCardStyles.blockDialogActions}>
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className={empresaCardStyles.blockCancelBtn}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBlock}
                  className={empresaCardStyles.blockConfirmBtn}
                >
                  Bloquear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
