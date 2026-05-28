'use client';

import React, { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Plus, ChevronRight, AlertCircle, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { NicheDTO } from '../../dtos/NicheDTO';
import { PLANS } from '../../constants';
import { useAppDispatch } from '../../context/AppContext';
import { useToast } from '../ToastProvider/ToastProvider';
import { loginController, registerController } from '../../controllers/AuthController';
import interestModalStyles from './InterestModal.module.css';
import NicheCard from '../NicheCard/NicheCard';
import LoginForm from '../LoginForm/LoginForm';
import RegisterForm from '../RegisterForm/RegisterForm';

type AuthView = 'login' | 'register' | 'segmentation';

export default function InterestModal() {
  const { confirmConfig } = useAppDispatch();
  const { showToast } = useToast();

  const [authView, setAuthView] = useState<AuthView>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthView('segmentation');
      import('../../controllers/SegmentationController').then(({ getSegmentationController }) => {
        getSegmentationController().then((res) => {
          if (res && res.length > 0) setNiches(res);
        });
      });
    }
  }, []);

  /* Login form */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  /* Register form */
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regPerfil, setRegPerfil] = useState('');
  const [regPerfilOutro, setRegPerfilOutro] = useState('');

  /* Segmentation form */
  const [selectedPlan, setSelectedPlan] = useState(50);
  const [nicheInput, setNicheInput] = useState('');
  const [niches, setNiches] = useState<NicheDTO[]>([]);
  const [segLoading, setSegLoading] = useState(false);

  const totalAllocated = useMemo(() => {
    return niches.reduce((acc, niche) =>
      acc + niche.geographies.reduce((geoAcc, geo) => {
        if (geo.cities.length > 0) {
          return geoAcc + geo.cities.reduce((cityAcc, city) =>
            cityAcc + city.portes.reduce((pAcc, p) => pAcc + p.quantity, 0), 0);
        }
        return geoAcc + geo.portes.reduce((pAcc, p) => pAcc + p.quantity, 0);
      }, 0), 0);
  }, [niches]);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await loginController(loginEmail, loginSenha);
      showToast({ type: 'success', message: `Bem-vindo, ${result.user.nome}!`, requiresConfirm: false });
      localStorage.setItem('user', JSON.stringify(result.user));
      setAuthView('segmentation');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Erro ao fazer login.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await registerController(regNome, regEmail, regSenha, regPerfil, regPerfilOutro);
      showToast({ type: 'success', message: 'Conta criada com sucesso!', requiresConfirm: false });
      localStorage.setItem('user', JSON.stringify(result.user));
      setAuthView('segmentation');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setAuthLoading(false);
    }
  };

  const addNiche = () => {
    if (!nicheInput.trim()) return;
    const newNiche: NicheDTO = {
      id: Math.random().toString(36).substr(2, 9),
      name: nicheInput.trim(),
      scope: 'NACIONAL',
      geographies: [{
        id: Math.random().toString(36).substr(2, 9),
        state: 'SP',
        cities: [],
        portes: [],
      }],
    };
    setNiches([...niches, newNiche]);
    setNicheInput('');
  };

  const handleConfirm = async () => {
    if (totalAllocated === 0) return alert('Defina pelo menos 1 resultado para iniciar.');
    if (totalAllocated > selectedPlan) return alert(`Limite da assinatura excedido (${totalAllocated}/${selectedPlan})`);
    if (totalAllocated < selectedPlan) return alert(`Distribua o total de ${selectedPlan} resultados (Atual: ${totalAllocated})`);

    setSegLoading(true);
    try {
      await confirmConfig({ niches, limit: selectedPlan });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast({
        type: 'success',
        message: 'Alvos configurados! Prospecção ativa por 24h.',
        requiresConfirm: true,
      });
    } catch (err) {
      showToast({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao salvar segmentação.' });
    } finally {
      setSegLoading(false);
    }
  };

  return (
    <div className={interestModalStyles.overlay}>
      <div className={interestModalStyles.modal}>
        {/* Header */}
        <header className={interestModalStyles.header}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
              <Search className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                RADAR CNPJ
              </h1>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {authView === 'login' && 'Faça login para continuar'}
                {authView === 'register' && 'Crie sua conta'}
                {authView === 'segmentation' && 'Configure os alvos estratégicos para sua prospecção'}
              </p>
            </div>
          </div>

          {authView === 'segmentation' && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Plano Ativo
                </span>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  {PLANS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPlan(p)}
                      className={clsx(
                        'px-4 py-1.5 rounded-md text-[10px] font-bold transition-all',
                        selectedPlan === p
                          ? 'bg-white text-emerald-600 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900',
                      )}
                    >
                      {p} resultados
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <div className={interestModalStyles.content}>
          {/* AUTH: LOGIN */}
          {authView === 'login' && (
            <LoginForm
              email={loginEmail}
              setEmail={setLoginEmail}
              senha={loginSenha}
              setSenha={setLoginSenha}
              authError={authError}
              authLoading={authLoading}
              handleLogin={handleLogin}
              setAuthView={setAuthView}
              clearError={() => setAuthError('')}
            />
          )}

          {/* AUTH: REGISTER */}
          {authView === 'register' && (
            <RegisterForm
              nome={regNome}
              setNome={setRegNome}
              email={regEmail}
              setEmail={setRegEmail}
              senha={regSenha}
              setSenha={setRegSenha}
              perfil={regPerfil}
              setPerfil={setRegPerfil}
              perfilOutro={regPerfilOutro}
              setPerfilOutro={setRegPerfilOutro}
              authError={authError}
              authLoading={authLoading}
              handleRegister={handleRegister}
              setAuthView={setAuthView}
              clearError={() => setAuthError('')}
            />
          )}

          {/* SEGMENTATION */}
          {authView === 'segmentation' && (
            <>
              <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm mb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                  <div className="md:col-span-10">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-3 block tracking-widest">
                      O que você deseja prospectar?
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nicheInput}
                        onChange={(e) => setNicheInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addNiche()}
                        placeholder="Ex: Farmácias, Consultórios..."
                        className={interestModalStyles.inputField}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      onClick={addNiche}
                      className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Adicionar
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-8 pb-10">
                <AnimatePresence>
                  {niches.map((niche) => (
                    <motion.div
                      key={niche.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <NicheCard niche={niche} niches={niches} setNiches={setNiches} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {authView === 'segmentation' && (
          <footer className={interestModalStyles.footer}>
            <div className="flex items-center gap-10">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Status da Configuração
                </p>
                <div className="flex items-center gap-4">
                  <span
                    className={clsx(
                      'text-2xl font-black',
                      totalAllocated > selectedPlan ? 'text-red-500' : 'text-slate-900',
                    )}
                  >
                    {totalAllocated} <span className="text-slate-300 text-sm">/</span> {selectedPlan}
                  </span>
                  <div
                    className={clsx(
                      'px-3 py-1 rounded-md text-[10px] font-bold border transition-colors',
                      totalAllocated === selectedPlan
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400',
                    )}
                  >
                    {totalAllocated > selectedPlan
                      ? 'LIMITE EXCEDIDO'
                      : totalAllocated === selectedPlan
                        ? 'PRONTO PARA ATIVAÇÃO'
                        : 'PENDENTE'}
                  </div>
                </div>
              </div>

              {totalAllocated < selectedPlan && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase">
                    Distribua mais {selectedPlan - totalAllocated} resultados
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Esta seleção é válida por 24h e não poderá ser alterada até o dia seguinte
              </div>
              <button
                onClick={handleConfirm}
                disabled={totalAllocated !== selectedPlan || segLoading}
                className={interestModalStyles.primaryBtn}
              >
                {segLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Confirmar Alvos e Iniciar Prospecção
                {!segLoading && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
