'use client';

import React, { useEffect, useState } from 'react';
import {
  LogOut, User as UserIcon, Mail, ShieldCheck, Edit3, Save, X,
  Lock, Eye, EyeOff, CreditCard, Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useConfigStore } from '../../stores/useConfigStore';
import styles from './Profile.module.css';

const PLANS = [
  { leads: 25, preco: 19, nome: 'Básico', cor: '#3b82f6' },
  { leads: 50, preco: 35, nome: 'Profissional', cor: '#f59e0b' },
  { leads: 100, preco: 65, nome: 'Empresarial', cor: '#10b981' },
];

export default function Profile() {
  const { user, usage, loadUser, updateUser, logout } = useAuthStore();
  const { config } = useConfigStore();

  const [editing, setEditing] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSenhaAtual, setEditSenhaAtual] = useState('');
  const [editNovaSenha, setEditNovaSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'plan'>('profile');

  useEffect(() => {
    if (user) {
      setEditNome(user.nome);
      setEditEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const data: any = {};
      if (editNome && editNome !== user?.nome) data.nome = editNome;
      if (editEmail && editEmail !== user?.email) data.email = editEmail;
      if (editNovaSenha) {
        data.senhaAtual = editSenhaAtual;
        data.novaSenha = editNovaSenha;
      }
      if (editNovaSenha && !editSenhaAtual) {
        setSaveMsg({ type: 'error', text: 'Informe a senha atual para alterar.' });
        setSaving(false);
        return;
      }
      const ok = await updateUser(data);
      if (ok) {
        setSaveMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        setEditing(false);
        setEditSenhaAtual('');
        setEditNovaSenha('');
      } else {
        setSaveMsg({ type: 'error', text: 'Erro ao atualizar perfil.' });
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Erro ao atualizar perfil.' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className={styles.loading}>Carregando perfil...</div>;
  }

  const currentPlan = PLANS.find((p) => p.leads === user.plano) || PLANS[2];

  return (
    <div className={styles.profileContainer}>
      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.avatar}>
          <UserIcon className={styles.avatarIcon} />
        </div>
        <div className={styles.userInfo}>
          <h2 className={styles.userName}>
            {editing ? (
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                className={styles.editInput}
                placeholder="Seu nome"
              />
            ) : (
              user.nome
            )}
          </h2>
          <div className={styles.userEmailRow}>
            <Mail className={styles.emailIcon} />
            {editing ? (
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className={styles.editInput}
                placeholder="Seu email"
              />
            ) : (
              <span className={styles.emailText}>{user.email}</span>
            )}
          </div>
        </div>
        <div className={styles.planContainer}>
          <div className={styles.planBadge} style={{ borderColor: `${currentPlan.cor}33`, backgroundColor: `${currentPlan.cor}15` }}>
            <ShieldCheck className={styles.planIcon} style={{ color: currentPlan.cor }} />
            <span className={styles.planText} style={{ color: currentPlan.cor }}>
              {currentPlan.nome}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('profile')}
          className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
        >
          <UserIcon className="w-4 h-4" /> Dados
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`${styles.tab} ${activeTab === 'plan' ? styles.tabActive : ''}`}
        >
          <CreditCard className="w-4 h-4" /> Assinatura
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={styles.optionsCard}
          >
            <h3 className={styles.optionsTitle}>Editar Perfil</h3>
            {saveMsg && (
              <div className={`${styles.saveMsg} ${saveMsg.type === 'success' ? styles.saveMsgSuccess : styles.saveMsgError}`}>
                {saveMsg.text}
              </div>
            )}
            <div className={styles.actionsContainer}>
              {!editing ? (
                <button onClick={() => { setEditing(true); setSaveMsg(null); }} className={styles.editBtn}>
                  <Edit3 className="w-4 h-4" /> Editar Dados
                </button>
              ) : (
                <div className="space-y-4 w-full">
                  {editNovaSenha && (
                    <div className={styles.passwordField}>
                      <label className={styles.fieldLabel}>Senha Atual</label>
                      <div className={styles.passwordInput}>
                        <Lock className="w-4 h-4 text-slate-500" />
                        <input
                          type={showSenhaAtual ? 'text' : 'password'}
                          value={editSenhaAtual}
                          onChange={(e) => setEditSenhaAtual(e.target.value)}
                          className={styles.editInput}
                          placeholder="Senha atual"
                        />
                        <button onClick={() => setShowSenhaAtual(!showSenhaAtual)} className="p-1">
                          {showSenhaAtual ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className={styles.passwordField}>
                    <label className={styles.fieldLabel}>Nova Senha (opcional)</label>
                    <div className={styles.passwordInput}>
                      <Lock className="w-4 h-4 text-slate-500" />
                      <input
                        type={showNovaSenha ? 'text' : 'password'}
                        value={editNovaSenha}
                        onChange={(e) => setEditNovaSenha(e.target.value)}
                        className={styles.editInput}
                        placeholder="Deixe em branco para manter"
                      />
                      <button onClick={() => setShowNovaSenha(!showNovaSenha)} className="p-1">
                        {showNovaSenha ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleSave} disabled={saving} className={styles.saveBtn}>
                      <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button onClick={() => { setEditing(false); setEditNovaSenha(''); setEditSenhaAtual(''); setSaveMsg(null); }} className={styles.cancelBtn}>
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.divider} />
            <div className={styles.actionsContainer}>
              <p className={styles.optionsDesc}>
                Sua assinatura atual permite descobrir até <span className={styles.optionsBold}>{user.plano || 100} resultados</span> por dia!
              </p>
              <button onClick={logout} className={styles.logoutBtn}>
                <LogOut className="w-5 h-5" />
                Encerrar Sessao (Logout)
              </button>
            </div>
          </motion.div>
        )}

        {/* Plan Tab */}
        {activeTab === 'plan' && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={styles.optionsCard}
          >
            <h3 className={styles.optionsTitle}>Sua Assinatura</h3>
            <div className={styles.planGrid}>
              {PLANS.map((plan) => {
                const isActive = plan.leads === user.plano;
                return (
                  <div
                    key={plan.leads}
                    className={`${styles.planCard} ${isActive ? styles.planCardActive : ''}`}
                    style={isActive ? { borderColor: plan.cor, boxShadow: `0 0 30px ${plan.cor}20` } : {}}
                  >
                    {isActive && (
                      <div className={styles.activeTag}>
                        <Award className="w-3 h-3" /> PLANO ATUAL
                      </div>
                    )}
                    <div className={styles.planName} style={{ color: isActive ? plan.cor : 'var(--muted-foreground)' }}>
                      {plan.nome}
                    </div>
                    <div className={styles.planLeads}>
                      {plan.leads} <span className={styles.planLeadsUnit}>leads/dia</span>
                    </div>
                    <div className={styles.planPrice}>
                      <span className={styles.planPriceCurrency}>R$</span>
                      {plan.preco}
                    </div>
                    {isActive && (
                      <div className={styles.planCheckmark}>
                        <ShieldCheck className="w-5 h-5" style={{ color: plan.cor }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {usage && (
              <div className={styles.usageSection}>
                <h4 className={styles.usageTitle}>Uso de Hoje</h4>
                <div className={styles.usageBar}>
                  <div
                    className={styles.usageBarFill}
                    style={{
                      width: `${Math.min(usage.percentage, 100)}%`,
                      backgroundColor: usage.percentage >= 80 ? '#f59e0b' : 'var(--primary)',
                    }}
                  />
                </div>
                <div className={styles.usageStats}>
                  <span>{usage.viewsCount} de {usage.planLimit} leads utilizados</span>
                  <span>{usage.percentage}%</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
