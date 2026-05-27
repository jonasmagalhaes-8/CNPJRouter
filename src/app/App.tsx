import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, BarChart3, Zap, Sparkles, 
  ChevronLeft, ChevronRight, Hash, Filter,
  Clock, TrendingUp, Target, Users, BarChart,
  Star, Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmpresaCard } from '../views/EmpresaCard';
import { AnalyticsDashboard } from '../views/AnalyticsDashboard';
import { GridHeatmap } from '../views/GridHeatmap';
import { InterestModal } from '../components/InterestModal';
import { SearchFilters } from '../components/SearchFilters';
import { SearchController, EmpresaModel, NicheItem } from '../models/Empresa.model';
import { ToastProvider, useToast } from '../components/Toast';
import styles from './App.module.css';

const ITEMS_PER_PAGE = 8;

const QuickStats: React.FC<{ results: EmpresaModel[] }> = ({ results }) => {
  const stats = [
    { label: "CNPJs Descobertos", value: results.length, icon: Target, color: "text-emerald-500" },
    { label: "Nichos Ativos", value: new Set(results.map(r => r.nicho)).size, icon: Zap, color: "text-amber-500" },
    { label: "Cidades Mapeadas", value: new Set(results.map(r => r.cidade)).size, icon: Users, color: "text-blue-500" },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((s, i) => (
        <div key={i} className="bg-secondary/50 border border-border p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <s.icon className={`w-4 h-4 ${s.color}`} />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
          </div>
          <div className="text-xl font-black text-white">{s.value}</div>
        </div>
      ))}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { showToast } = useToast();
  const [view, setView] = useState<'feed' | 'dashboard' | 'favorites'>('feed');
  const [allResults, setAllResults] = useState<EmpresaModel[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [config, setConfig] = useState<{ niches: NicheItem[], limit: number } | null>(null);
  const [showInterestModal, setShowInterestModal] = useState(true);
  const [filterBairros, setFilterBairros] = useState<string[]>([]);
  const [filterNichos, setFilterNichos] = useState<string[]>([]);
  const [filterEstados, setFilterEstados] = useState<string[]>([]);
  const [filterCidades, setFilterCidades] = useState<string[]>([]);
  const [filterPeriodo, setFilterPeriodo] = useState('');
  const [consultationDate, setConsultationDate] = useState('2024-05-20');

  const consultationDates = ['2024-05-20', '2024-05-19', '2024-05-18', '2024-05-17', '2024-05-16'];

  useEffect(() => {
    if (config) {
      setAllResults(SearchController.generateMockData(config.niches, config.limit));
    }
  }, [config, consultationDate]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  const blockEmpresa = (id: string) => {
    setBlocked(prev => [...prev, id]);
    showToast({ type: 'alert', message: "CNPJ bloqueado e removido da listagem." });
  };

  const visibleResults = useMemo(() => allResults.filter(r => !blocked.includes(r.id)), [allResults, blocked]);

  const availableNichos = useMemo(() => Array.from(new Set(visibleResults.map(r => r.nicho))).sort(), [visibleResults]);
  const filteredByNicho = useMemo(() => filterNichos.length === 0 ? visibleResults : visibleResults.filter(r => filterNichos.includes(r.nicho)), [visibleResults, filterNichos]);
  
  const availablePeriods = useMemo(() => Array.from(new Set(filteredByNicho.map(r => r.dataAbertura))).sort(), [filteredByNicho]);
  const availableEstados = useMemo(() => Array.from(new Set(filteredByNicho.map(r => r.estado))).sort(), [filteredByNicho]);
  const availableCidades = useMemo(() => {
    const res = filterEstados.length > 0 ? filteredByNicho.filter(r => filterEstados.includes(r.estado)) : filteredByNicho;
    return Array.from(new Set(res.map(r => r.cidade))).sort();
  }, [filteredByNicho, filterEstados]);
  const availableBairros = useMemo(() => {
    const res = filterCidades.length > 0 ? filteredByNicho.filter(r => filterCidades.includes(r.cidade)) : filteredByNicho;
    return Array.from(new Set(res.map(r => `${r.bairro} - ${r.cidade}`))).sort();
  }, [filteredByNicho, filterCidades]);

  const filteredResults = useMemo(() => visibleResults.filter(r => (
    (filterNichos.length === 0 || filterNichos.includes(r.nicho)) &&
    (!filterPeriodo || r.dataAbertura === filterPeriodo) &&
    (filterEstados.length === 0 || filterEstados.includes(r.estado)) &&
    (filterCidades.length === 0 || filterCidades.includes(r.cidade)) &&
    (filterBairros.length === 0 || filterBairros.includes(`${r.bairro} - ${r.cidade}`))
  )), [visibleResults, filterNichos, filterPeriodo, filterEstados, filterCidades, filterBairros]);

  const favoriteResults = useMemo(() => visibleResults.filter(r => favorites.includes(r.id)), [visibleResults, favorites]);

  const activeDashboardNicho = filterNichos.length > 0 ? filterNichos[0] : (availableNichos[0] || '');
  const dashboardData = useMemo(() => allResults.filter(r => (
    r.nicho === activeDashboardNicho &&
    (filterEstados.length === 0 || filterEstados.includes(r.estado)) &&
    (filterCidades.length === 0 || filterCidades.includes(r.cidade)) &&
    (!filterPeriodo || r.dataAbertura === filterPeriodo)
  )), [allResults, activeDashboardNicho, filterEstados, filterCidades, filterPeriodo]);

  useEffect(() => {
    if (view === 'dashboard' && filterNichos.length !== 1 && availableNichos.length > 0) {
      setFilterNichos([filterNichos[0] || availableNichos[0]]);
    }
  }, [view, filterNichos, availableNichos]);

  const paginatedResults = useMemo(() => filteredResults.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE), [filteredResults, page]);
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);

  if (showInterestModal) return (
    <div className={styles.appContainer}>
      <InterestModal onConfirm={(c) => { 
        setConfig(c); setShowInterestModal(false); 
        showToast({ 
          type: 'success', 
          message: "Alvos configurados! Prospecção ativa por 24h.",
          requiresConfirm: true 
        });
      }} />
    </div>
  );

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logoContainer}><div className={styles.logoIcon}><Zap className="w-6 h-6 text-white" /></div><span className="text-2xl font-black text-white">CNPJ <span className="text-primary">BI</span></span></div>
          <nav className={styles.nav}>
            <button onClick={() => setView('feed')} className={`${styles.navBtn} ${view === 'feed' ? styles.navBtnActive : ''}`}><Search className="w-4 h-4" /> Feed</button>
            {/* <button onClick={() => setView('favorites')} className={`${styles.navBtn} ${view === 'favorites' ? styles.navBtnActive : ''}`}><Star className="w-4 h-4" /> Favoritos</button> */}
            <button onClick={() => setView('dashboard')} className={`${styles.navBtn} ${view === 'dashboard' ? styles.navBtnActive : ''}`}><BarChart3 className="w-4 h-4" /> Dashboard</button>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <section className={`${styles.sectionCard} mb-6`}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3"><Sparkles className="w-8 h-8 text-primary" /><h1 className="text-3xl font-black uppercase tracking-tighter">{view === 'feed' ? 'Feed de Descobertas' : view === 'favorites' ? 'Empresas Favoritas' : 'Inteligência Geográfica'}</h1></div>
            {config && <div className="text-sm font-black bg-emerald-500/10 text-emerald-500 px-5 py-2 rounded-full border border-emerald-500/20 uppercase tracking-widest">Contrato: {config.limit} Leads</div>}
          </div>
          <SearchFilters 
            view={view}
            filterNichos={filterNichos} filterPeriodo={filterPeriodo} filterEstados={filterEstados} filterCidades={filterCidades} filterBairros={filterBairros}
            availableNichos={availableNichos} availablePeriods={availablePeriods} availableEstados={availableEstados} availableCidades={availableCidades} availableBairros={availableBairros}
            consultationDate={consultationDate} consultationDates={consultationDates}
            onConsultationDateChange={setConsultationDate}
            onNichoChange={(vals) => { setFilterNichos(vals); setFilterPeriodo(''); setFilterEstados([]); setFilterCidades([]); setFilterBairros([]); setPage(0); }}
            onPeriodoChange={(val) => { setFilterPeriodo(val); setPage(0); }}
            onEstadoChange={(vals) => { setFilterEstados(vals); setFilterCidades([]); setFilterBairros([]); setPage(0); }}
            onCidadeChange={(vals) => { setFilterCidades(vals); setFilterBairros([]); setPage(0); }}
            onBairroChange={(vals) => { setFilterBairros(vals); setPage(0); }}
          />
        </section>
        {/* {view === 'dashboard' && <QuickStats results={filteredResults} />} */}
        <AnimatePresence mode="wait">
          {view === 'feed' || view === 'favorites' ? (
            <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 px-4"><Hash className="w-5 h-5 text-emerald-500" /><span className="text-sm font-black uppercase tracking-widest text-slate-500">Resultados exibidos: <span className="text-white">{view === 'feed' ? filteredResults.length : favoriteResults.length}</span></span></div>
              <div className={styles.resultsGrid}>
                {(view === 'feed' ? paginatedResults : favoriteResults).map((e) => (
                  <EmpresaCard 
                    key={e.id} 
                    empresa={e} 
                    isFavorite={favorites.includes(e.id)}
                    onFavorite={() => toggleFavorite(e.id)}
                    onBlock={() => blockEmpresa(e.id)}
                  />
                ))}
              </div>
              {view === 'feed' && filteredResults.length > 0 && (
                <div className="space-y-6">
                  <div className={styles.pagination}>
                    <button disabled={page === 0} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={styles.pageBtn}><ChevronLeft className="w-5 h-5" /> Anterior</button>
                    <div className={styles.pageIndicator}>Página <span className="text-primary font-bold">{page + 1}</span> de {totalPages}</div>
                    <button disabled={page >= totalPages - 1} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={styles.pageBtn}>Próxima <ChevronRight className="w-5 h-5" /></button>
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
                        <p className="text-lg font-black text-white uppercase tracking-tighter">Fim das descobertas de hoje</p>
                        <p className="text-sm text-slate-500 font-medium">Volte amanhã para mais descobertas!</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <div className={styles.dashboardHeader}><BarChart className="w-6 h-6 text-primary" /><h2 className="text-2xl font-black uppercase tracking-tight">ANÁLISE: {activeDashboardNicho}</h2></div>
              <AnalyticsDashboard data={dashboardData} nicho={activeDashboardNicho} />
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-l-4 border-primary pl-4"><h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Mapa de Densidade por Bairro</h3></div>
                <GridHeatmap data={dashboardData} type="bairro" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-l-4 border-primary pl-4"><h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Mapa de Densidade por Cidade</h3></div>
                <GridHeatmap data={dashboardData} type="cidade" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
