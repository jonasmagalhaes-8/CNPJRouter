'use client';

import React from 'react';
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
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAppState, useAppDispatch } from './context/AppContext';
import InterestModal from './components/InterestModal/InterestModal';
import SearchFilters from './components/SearchFilters/SearchFilters';
import EmpresaCard from './components/EmpresaCard/EmpresaCard';

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

import appStyles from './AppContent.module.css';

export default function AppContent() {
  const {
    view,
    showInterestModal,
    config,
    loading,
    filteredResults,
    favoriteResults,
    paginatedResults,
    favorites,
    page,
    totalPages,
    activeDashboardNicho,
    dashboardData,
  } = useAppState();

  const { setView, setPage } = useAppDispatch();

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
              CNPJ <span className="text-primary">BI</span>
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
      </header>

      <main className={appStyles.main}>
        {/* Section header + filters */}
        <section className={clsx(appStyles.sectionCard, 'mb-6')}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-black uppercase tracking-tighter">
                {view === 'feed'
                  ? 'Feed de Descobertas'
                  : view === 'favorites'
                    ? 'Empresas Favoritas'
                    : view === 'profile'
                      ? 'Meu Perfil'
                      : 'Inteligência Geográfica'}
              </h1>
            </div>
            {config && view !== 'profile' && (
              <div className="text-sm font-black bg-emerald-500/10 text-emerald-500 px-5 py-2 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                Contrato: {config.limit} Leads
              </div>
            )}
          </div>
          {view !== 'profile' && <SearchFilters />}
        </section>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
                <div className="flex items-center gap-3 px-4">
                  <Hash className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-black uppercase tracking-widest text-slate-500">
                    Resultados exibidos:{' '}
                    <span className="text-white">
                      {view === 'feed' ? filteredResults.length : favoriteResults.length}
                    </span>
                  </span>
                </div>

                <div className={appStyles.resultsGrid}>
                  {(view === 'feed' ? paginatedResults : favoriteResults).map((e) => (
                    <EmpresaCard
                      key={e.id}
                      empresa={e}
                      isFavorite={favorites.includes(e.id)}
                    />
                  ))}
                </div>

                {view === 'feed' && filteredResults.length > 0 && (
                  <div className="space-y-6">
                    <div className={appStyles.pagination}>
                      <button
                        disabled={page === 0}
                        onClick={() => {
                          setPage(page - 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={appStyles.pageBtn}
                      >
                        <ChevronLeft className="w-5 h-5" /> Anterior
                      </button>
                      <div className={appStyles.pageIndicator}>
                        Página{' '}
                        <span className="text-primary font-bold">{page + 1}</span> de{' '}
                        {totalPages}
                      </div>
                      <button
                        disabled={page >= totalPages - 1}
                        onClick={() => {
                          setPage(page + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={appStyles.pageBtn}
                      >
                        Próxima <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {page >= totalPages - 1 && (
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
                <div className={appStyles.dashboardHeader}>
                  <BarChart className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-black uppercase tracking-tight">
                    ANÁLISE: {activeDashboardNicho}{' '}
                    <span className={appStyles.dashboardResultCount}>
                      ({dashboardData.length} Resultados)
                    </span>
                  </h2>
                </div>
                <AnalyticsDashboard data={dashboardData} nicho={activeDashboardNicho} />
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
                      Mapa de Densidade por Cidade
                    </h3>
                  </div>
                  <GridHeatmap data={dashboardData} type="cidade" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
