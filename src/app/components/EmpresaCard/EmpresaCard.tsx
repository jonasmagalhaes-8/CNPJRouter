'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, User, Ban, Copy, Check, MessageCircle, Calendar } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { clsx } from 'clsx';
import type { EmpresaDTO } from '../../dtos/EmpresaDTO';
import { useFeedStore } from '../../stores/useFeedStore';
import { useContactsStore } from '../../stores/useContactsStore';
import empresaCardStyles from './EmpresaCard.module.css';

interface EmpresaCardProps {
  empresa: EmpresaDTO;
  isFavorite?: boolean;
}

export default function EmpresaCard({ empresa }: Omit<EmpresaCardProps, 'isFavorite'>) {
  const { blockEmpresa } = useFeedStore();
  const { contactedIds, toggleContact } = useContactsStore();
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTogglingContact, setIsTogglingContact] = useState(false);

  const isContacted = contactedIds.has(empresa.id);

  const displayName = empresa.nomeFantasia || empresa.razaoSocial;

  // Format YYYY-MM-DD → DD/MM/YYYY
  const formatDate = (raw: string | undefined) => {
    if (!raw) return null;
    const [y, m, d] = raw.split('-');
    if (!y || !m || !d) return raw;
    return `${d}/${m}/${y}`;
  };

  const dataAberturaFormatada = formatDate(empresa.dataAbertura);

  const handleBlock = () => {
    blockEmpresa(empresa.id);
    setShowBlockConfirm(false);
  };

  const handleToggleContact = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingContact) return;
    setIsTogglingContact(true);
    await toggleContact(empresa.id);
    setIsTogglingContact(false);
  };

  const handleCopy = async () => {
    const text = `${displayName}\nCNPJ: ${empresa.cnpj}\n${empresa.municipio} — ${empresa.estado}\nTel: ${empresa.telefone}\nEmail: ${empresa.email}\nPorte: ${empresa.porte}\nCategoria: ${empresa.categoriaIA}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={clsx(empresaCardStyles.card, isContacted && 'ring-2 ring-red-500 bg-red-500/10')}>
      <div className={empresaCardStyles.header}>
        <div className={empresaCardStyles.titleGroup}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <div>
              <h3 className={empresaCardStyles.nome}>{displayName}</h3>
              {dataAberturaFormatada && (
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Aberta em {dataAberturaFormatada}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleCopy}
                className="p-2 rounded-md text-slate-500 hover:text-primary hover:bg-slate-800 transition-colors"
                title="Copiar dados"
              >
                {copied ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBlockConfirm(true);
                }}
                className="p-2 rounded-md text-slate-500 hover:text-rose-500 hover:bg-slate-800 transition-colors"
                title="Bloquear empresa"
              >
                <Ban className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <span className={empresaCardStyles.cnpj}>{empresa.cnpj}</span>
            {empresa.categoriaIA && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest w-fit">
                {empresa.categoriaIA}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={empresaCardStyles.grid}>
        <div className={empresaCardStyles.infoItem}>
          <MapPin className={empresaCardStyles.icon} />
          <span className="truncate">
            {empresa.endereco || `${empresa.bairro} — ${empresa.municipio}/${empresa.estado}`}
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

      <div className={clsx(empresaCardStyles.footer, "items-end")}>
        <div className="flex gap-4">
          <div className={empresaCardStyles.stat}>
            <span className={empresaCardStyles.statLabel}>Porte</span>
            <span className={empresaCardStyles.statValue}>{empresa.porte}</span>
          </div>
          {empresa.receitaAnual && (
            <div className={empresaCardStyles.stat}>
              <span className={empresaCardStyles.statLabel}>Receita</span>
              <span className={empresaCardStyles.statValue}>{empresa.receitaAnual}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleToggleContact}
          disabled={isTogglingContact}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
            isContacted
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
          )}
        >
          <MessageCircle className="w-4 h-4" />
          {isContacted ? "Não entrei em contato" : "Já entrei em contato"}
        </button>
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
                <strong>{displayName}</strong> sera removida dos resultados e nao aparecera mais nesta prospeccao.
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
