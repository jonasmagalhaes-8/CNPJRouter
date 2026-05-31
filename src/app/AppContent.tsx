'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  BarChart3,
  Sparkles,
  Hash,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  BarChart,
  Loader2,
  User,
  BrainCircuit,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from './stores/useAuthStore';
import { useFeedStore } from './stores/useFeedStore';
import { useFavoritesStore } from './stores/useFavoritesStore';
import { useConfigStore } from './stores/useConfigStore';
import { useToast } from './components/ToastProvider/ToastProvider';
import InterestModal from './components/InterestModal/InterestModal';
import SearchFilters from './components/SearchFilters/SearchFilters';
import EmpresaCard from './components/EmpresaCard/EmpresaCard';
import UsageProgressBar from './components/UsageProgressBar/UsageProgressBar';

const AnalyticsDashboard = dynamic(() => import('./views/AnalyticsDashboard/AnalyticsDashboard'), {
  loading: () => <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>,
  ssr: false,
});
const ProfileView = dynamic(() => import('./views/Profile/Profile'), {
  loading: () => <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>,
  ssr: false,
});
const GridHeatmap = dynamic(() => import('./views/GridHeatmap/GridHeatmap'), {
  loading: () => <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>,
  ssr: false,
});
const PorteDistribution = dynamic(() => import('./views/PorteDistribution/PorteDistribution'), {
  loading: () => <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>,
  ssr: false,
});

import appStyles from './AppContent.module.css';

export default function AppContent() {
  const { showInterestModal, usage, user, loading: authLoading } = useAuthStore();
  const { config } = useConfigStore();
  const { showToast } = useToast();
  const [pageInputValue, setPageInputValue] = React.useState('6');
  const {
    view, setView, loading,
    filteredResults, paginatedResults,
    page, hasMore,
    batchSize, setBatchSize,
    activeDashboardCategoria, dashboardData, allResults,
    semanticQuery, setSemanticQuery,
  } = useFeedStore();
  const { favoriteResults: favResults } = useFavoritesStore();

  // Keep input in sync with store batchSize (e.g. if it was capped by plan limit)
  React.useEffect(() => {
    setPageInputValue(String(batchSize));
  }, [batchSize]);

  const isLimitReached = usage?.isLimitReached || false;
  const limitPercentage = usage?.percentage || 0;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (showInterestModal) {
    return (
      <div className={appStyles.appContainer}>
        <InterestModal />
      </div>
    );
  }

  return (
    <div className={appStyles.appContainer}>
      <header className={appStyles.header}>
        <div className={appStyles.headerInner}>
          <div className={appStyles.logoContainer}>
            <div className={appStyles.logoIcon}>
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">
              RADAR <span className="text-primary">CNPJ</span>
            </span>
          </div>
          <nav className={appStyles.nav}>
            <button
              onClick={() => setView('feed')}
              className={clsx(appStyles.navBtn, view === 'feed' && appStyles.navBtnActive)}
            >
              <Search className="w-4 h-4" /> Feed
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={clsx(appStyles.navBtn, view === 'dashboard' && appStyles.navBtnActive)}
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setView('profile')}
              className={clsx(appStyles.navBtn, view === 'profile' && appStyles.navBtnActive)}
            >
              <User className="w-4 h-4" /> Meu Perfil
            </button>
          </nav>
        </div>
        {/* Usage progress bar in header */}
        {usage && config && view !== 'profile' && (
          <UsageProgressBar
            viewsCount={usage.viewsCount}
            planLimit={usage.planLimit}
            percentage={usage.percentage}
          />
        )}
      </header>

      <main className={appStyles.main}>
        {/* Section header + semantic search + filters */}
        <section className={clsx(appStyles.sectionCard, 'mb-6')}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              {view === 'profile' ? (
                <User className="w-8 h-8 text-primary" />
              ) : (
                <Sparkles className="w-8 h-8 text-primary" />
              )}
              <h1 className="text-3xl font-black uppercase tracking-tighter">
                {view === 'feed'
                  ? 'Filtros para seleção atual :'
                  : view === 'favorites'
                    ? 'Empresas Favoritas'
                    : view === 'profile'
                      ? 'Meu Perfil'
                      : 'Inteligência Geográfica'}
              </h1>
            </div>
          </div>

          {view !== 'profile' && <SearchFilters />}
        </section>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="text-slate-400 font-medium animate-pulse text-center">
              A inteligência artificial está processando suas segmentações...<br />
              <span className="text-xs text-slate-500">Consultando similaridade vetorial e bases externas, aguarde.</span>
            </div>
          </div>
        )}

        {/* View content */}
        {!loading && (
          <AnimatePresence mode="wait">
            {view === 'profile' ? (
              <motion.div
                key="profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ProfileView />
              </motion.div>
            ) : view === 'feed' || view === 'favorites' ? (
              <motion.div
                key={view}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">

                    {/*
                    <Hash className="w-5 h-5 text-emerald-500" />
<span className="text-sm font-black uppercase tracking-widest text-slate-500">
                      Resultados encontrados:{' '}
                      <span className="text-white">
                        {view === 'feed' ? filteredResults.length : favResults.length}
                      </span>
                    </span>*/
                    }
                  </div>

                  {/* Items per page input */}
                  {view === 'feed' && (
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="page-size-input"
                        className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap"
                      >
                        Resultados por página:
                      </label>
                      <input
                        id="page-size-input"
                        type="number"
                        min={1}
                        value={pageInputValue}
                        onChange={(e) => setPageInputValue(e.target.value)}
                        onBlur={() => {
                          const n = parseInt(pageInputValue, 10);
                          if (isNaN(n) || n < 1) {
                            setPageInputValue(String(batchSize));
                            return;
                          }
                          setBatchSize(n, usage?.planLimit ?? 100, (msg) => {
                            showToast({ type: 'alert', message: msg });
                          });
                          setPageInputValue(String(Math.min(n, usage?.planLimit ?? 100)));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className="w-16 px-2 py-1.5 text-xs font-bold text-center bg-slate-800/60 border border-slate-700/60 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Blur overlay when limit is reached */}
                <div className={isLimitReached ? 'relative' : ''}>
                  <div className={isLimitReached ? 'blur-sm select-none pointer-events-none' : ''}>
                    <div className={appStyles.resultsGrid}>
                      {(view === 'feed' ? paginatedResults : favResults).map((e: any) => (
                        <EmpresaCard
                          key={e.id}
                          empresa={e}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Upsell overlay */}
                  {isLimitReached && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute inset-0 flex items-center justify-center z-10 rounded-xl"
                    >
                      <div className="bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-8 text-center max-w-md mx-auto shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
                          Limite de Hoje Atingido!
                        </h3>
                        <p className="text-slate-400 text-sm mb-6">
                          Você utilizou todos os seus <span className="text-primary font-bold">{usage?.planLimit || 100} resultados</span> diários.
                          Volte amanhã para liberar mais descobertas.
                        </p>
                        <div className="text-xs text-slate-500 font-medium">
                          Precisa de mais? Faça upgrade para o plano Pro e libere +500 CNPJs.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {view === 'feed' && !isLimitReached && (
                  <div className="space-y-4">
                    <div className={appStyles.pagination}>
                      {/* Anterior */}
                      <button
                        disabled={page === 0}
                        onClick={() => {
                          useFeedStore.getState().setPage(page - 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={appStyles.pageBtn}
                      >
                        <ChevronLeft className="w-5 h-5" /> Anterior
                      </button>

                      {/* Page indicator */}
                      <div className={appStyles.pageIndicator}>
                        Página{' '}
                        <span className="text-primary font-bold">{page + 1}</span>
                      </div>

                      {/* Próxima — always shown; disabled only when there’s truly nothing more */}
                      {(() => {
                        const nextCached = (page + 1) * batchSize < allResults.length;
                        const canAdvance = nextCached || hasMore;
                        return (
                          <button
                            disabled={!canAdvance || loading}
                            onClick={() => {
                              useFeedStore.getState().setPage(page + 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={appStyles.pageBtn}
                          >
                            Próxima <ChevronRight className="w-5 h-5" />
                          </button>
                        );
                      })()}
                    </div>

                    {/* End of results message — only when there’s truly no more */}
                    {!hasMore && (page + 1) * batchSize >= allResults.length && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12 border-t border-border/30"
                      >
                        <div className="inline-flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-lg font-black text-white uppercase tracking-tighter">
                            Fim das descobertas de hoje
                          </p>
                          <p className="text-sm text-slate-500 font-medium">
                            Volte amanhã para mais descobertas!
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className={appStyles.dashboardHeader}>
                    <BarChart className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                      ANÁLISE: {activeDashboardCategoria}{' '}
                      <span className={appStyles.dashboardResultCount}>
                        ({dashboardData.length} Resultados)
                      </span>
                    </h2>
                  </div>
                </div>
                <AnalyticsDashboard data={dashboardData} categoria={activeDashboardCategoria} />
                <PorteDistribution data={dashboardData} />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                      Mapa de Densidade por Bairro
                    </h3>
                  </div>
                  <GridHeatmap data={dashboardData} type="bairro" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-l-4 border-primary pl-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                      Mapa de Densidade por Município
                    </h3>
                  </div>
                  <GridHeatmap data={dashboardData} type="municipio" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
