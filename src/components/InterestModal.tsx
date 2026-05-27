import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, X, MapPin, Trash2, 
  ChevronRight, Globe, AlertCircle, 
  Search, PlusCircle, Building2,
  ChevronDown, Filter, CheckCircle2,
  Map
} from 'lucide-react';
import styles from './InterestModal.module.css';

interface CityItem { 
  id: string; 
  name: string; 
  quota: number; 
}

interface GeoIntelligence {
  id: string;
  state: string;
  cities: CityItem[];
  baseQuota: number;
}

interface NicheItem { 
  id: string; 
  name: string; 
  scope: 'NACIONAL' | 'REGIONAL';
  period: string;
  geographies: GeoIntelligence[];
}

const PLANS = [25, 50, 100];
const PERIODS = ['Este mês', 'Últimos 3 meses', 'Últimos 6 meses', 'Últimos 12 meses'];
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export const InterestModal: React.FC<{ onConfirm: (config: any) => void }> = ({ onConfirm }) => {
  const [selectedPlan, setSelectedPlan] = useState(50);
  const [nicheInput, setNicheInput] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Últimos 12 meses');
  const [niches, setNiches] = useState<NicheItem[]>([]);

  const totalAllocated = useMemo(() => {
    return niches.reduce((acc, niche) => {
      if (niche.scope === 'NACIONAL') {
        return acc + (niche.geographies[0]?.baseQuota || 0);
      }
      return acc + niche.geographies.reduce((geoAcc, geo) => {
        if (geo.cities.length === 0) return geoAcc + geo.baseQuota;
        return geoAcc + geo.cities.reduce((cityAcc, city) => cityAcc + city.quota, 0);
      }, 0);
    }, 0);
  }, [niches]);

  const addNiche = () => {
    if (!nicheInput.trim()) return;
    const newNiche: NicheItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: nicheInput.trim(),
      scope: 'NACIONAL',
      period: selectedPeriod, // This uses the currently selected period from the top bar for this specific niche
      geographies: [{
        id: Math.random().toString(36).substr(2, 9),
        state: 'SP',
        cities: [],
        baseQuota: 0
      }]
    };
    setNiches([...niches, newNiche]);
    setNicheInput('');
  };

  const addGeo = (nicheId: string) => {
    setNiches(niches.map(n => {
      if (n.id !== nicheId) return n;
      return {
        ...n,
        geographies: [...n.geographies, {
          id: Math.random().toString(36).substr(2, 9),
          state: 'SP',
          cities: [],
          baseQuota: 0
        }]
      };
    }));
  };

  const updateNicheScope = (id: string, scope: 'NACIONAL' | 'REGIONAL') => {
    setNiches(niches.map(n => n.id === id ? { ...n, scope } : n));
  };

  const updateNichePeriod = (id: string, period: string) => {
    setNiches(niches.map(n => n.id === id ? { ...n, period } : n));
  };

  const handleConfirm = () => {
    if (totalAllocated === 0) return alert("Defina pelo menos 1 resultado para iniciar.");
    if (totalAllocated > selectedPlan) return alert(`Limite da assinatura excedido (${totalAllocated}/${selectedPlan})`);
    if (totalAllocated < selectedPlan) return alert(`Distribua o total de ${selectedPlan} resultados (Atual: ${totalAllocated})`);
    onConfirm({ niches, limit: selectedPlan });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
              <Search className="text-white w-5 h-5" />
            </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 leading-tight">Segmentação de Mercado</h1>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Configure os alvos estratégicos para sua prospecção</p>
                </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plano Ativo</span>
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                {PLANS.map(p => (
                  <button 
                    key={p} 
                    onClick={() => setSelectedPlan(p)} 
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${selectedPlan === p ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    {p} resultados
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-6">
                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block tracking-widest">O que você deseja prospectar?</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={nicheInput} 
                    onChange={e => setNicheInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && addNiche()}
                    placeholder="Ex: Farmácias, Consultórios..." 
                    className={styles.inputField} 
                  />
                  <div className="absolute right-3 top-3.5 opacity-20">
                    <Building2 className="w-5 h-5 text-slate-900" />
                  </div>
                </div>
              </div>
              <div className="md:col-span-4">
                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block tracking-widest">Período Alvo</label>
                <select 
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-700 outline-none"
                >
                  {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <button onClick={addNiche} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Adicionar
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-8 pb-10">
            <AnimatePresence>
              {niches.map(niche => (
                <motion.div 
                  key={niche.id} 
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className={styles.nicheCard}
                >
                  <div className={styles.nicheHeader}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-md">
                        <Building2 className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <span className="text-base font-bold text-slate-900">{niche.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <select 
                            value={niche.period}
                            onChange={(e) => updateNichePeriod(niche.id, e.target.value)}
                            className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 outline-none cursor-pointer hover:bg-emerald-100 transition-colors"
                          >
                            {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setNiches(niches.filter(x => x.id !== niche.id))} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className={styles.nicheBody}>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-3">
                        <label 
                          className={styles.radioLabel} 
                          data-active={niche.scope === 'NACIONAL'}
                          onClick={() => updateNicheScope(niche.id, 'NACIONAL')}
                        >
                          <Globe className="w-4 h-4" />
                          <span className="text-xs font-bold">Nacional (Todos)</span>
                        </label>
                        <label 
                          className={styles.radioLabel} 
                          data-active={niche.scope === 'REGIONAL'}
                          onClick={() => updateNicheScope(niche.id, 'REGIONAL')}
                        >
                          <Map className="w-4 h-4" />
                          <span className="text-xs font-bold">Especificar Região</span>
                        </label>
                      </div>

                      {niche.scope === 'NACIONAL' ? (
                        <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-800">Extração em todo território nacional</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Resultados esperados</span>
                            <input 
                              type="number" 
                              min="0"
                              value={niche.geographies[0].baseQuota} 
                              onChange={e => {
                                const newGeos = niche.geographies.map((g, i) => i === 0 ? { ...g, baseQuota: Math.max(0, parseInt(e.target.value) || 0) } : g);
                                setNiches(niches.map(n => n.id === niche.id ? { ...n, geographies: newGeos } : n));
                              }}
                              className={styles.quotaInputSmall}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuração Geográfica</span>
                          </div>
                          
                          <div className={styles.geoGrid}>
                            {niche.geographies.map(geo => (
                              <div key={geo.id} className={styles.geoCard}>
                                <div className="flex flex-col gap-4">
                                  <div className="flex items-center justify-between">
                                    <div className="relative w-48">
                                      <select 
                                        value={geo.state} 
                                        onChange={e => {
                                          const newGeos = niche.geographies.map(g => g.id === geo.id ? { ...g, state: e.target.value } : g);
                                          setNiches(niches.map(n => n.id === niche.id ? { ...n, geographies: newGeos } : n));
                                        }}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-700 outline-none appearance-none"
                                      >
                                        {UFS.map(u => <option key={u} value={u}>Estado: {u}</option>)}
                                      </select>
                                      <ChevronDown className="absolute right-2 top-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
                                    </div>
                                    
                                    {geo.cities.length === 0 && (
                                      <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Estado Inteiro</span>
                                        <input 
                                          type="number" 
                                          min="0"
                                          value={geo.baseQuota} 
                                          onChange={e => {
                                            const newGeos = niche.geographies.map(g => g.id === geo.id ? { ...g, baseQuota: Math.max(0, parseInt(e.target.value) || 0) } : g);
                                            setNiches(niches.map(n => n.id === niche.id ? { ...n, geographies: newGeos } : n));
                                          }}
                                          className={styles.quotaInputSmall}
                                        />
                                      </div>
                                    )}

                                    {niche.geographies.length > 1 && (
                                      <button 
                                        onClick={() => {
                                          const newGeos = niche.geographies.filter(g => g.id !== geo.id);
                                          setNiches(niches.map(n => n.id === niche.id ? { ...n, geographies: newGeos } : n));
                                        }} 
                                        className="text-slate-300 hover:text-red-500"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>

                                  {geo.cities.length > 0 && (
                                    <div className="space-y-2">
                                      {geo.cities.map(city => (
                                        <div key={city.id} className={styles.cityRow}>
                                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                          <span className="text-xs font-bold text-slate-700 flex-1">{city.name}</span>
                                          <input 
                                            type="number" 
                                            min="0"
                                            value={city.quota} 
                                            onChange={e => {
                                              const newCities = geo.cities.map(c => c.id === city.id ? { ...c, quota: Math.max(0, parseInt(e.target.value) || 0) } : c);
                                              const newGeos = niche.geographies.map(g => g.id === geo.id ? { ...g, cities: newCities } : g);
                                              setNiches(niches.map(n => n.id === niche.id ? { ...n, geographies: newGeos } : n));
                                            }}
                                            className={styles.quotaInputSmall}
                                          />
                                          <button 
                                            onClick={() => {
                                              const newCities = geo.cities.filter(c => c.id !== city.id);
                                              const newGeos = niche.geographies.map(g => g.id === geo.id ? { ...g, cities: newCities } : g);
                                              setNiches(niches.map(n => n.id === niche.id ? { ...n, geographies: newGeos } : n));
                                            }}
                                            className="text-slate-300 hover:text-red-500"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="pt-2">
                                    <button 
                                      onClick={() => {
                                        const cityName = prompt("Nome da Cidade:");
                                        if (cityName) {
                                          const newCities = [...geo.cities, { id: Math.random().toString(36).substr(2, 9), name: cityName, quota: 0 }];
                                          const newGeos = niche.geographies.map(g => g.id === geo.id ? { ...g, cities: newCities } : g);
                                          setNiches(niches.map(n => n.id === niche.id ? { ...n, geographies: newGeos } : n));
                                        }
                                      }}
                                      className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-[10px] uppercase tracking-wider"
                                    >
                                      <PlusCircle className="w-3.5 h-3.5" /> Adicionar Cidade Específica
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <button onClick={() => addGeo(niche.id)} className={styles.addGeoBtn}>
                            <MapPin className="w-4 h-4" /> Adicionar Nova Inteligência Geográfica
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <footer className={styles.footer}>
          <div className="flex items-center gap-10">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status da Configuração</p>
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-black ${totalAllocated > selectedPlan ? 'text-red-500' : 'text-slate-900'}`}>
                  {totalAllocated} <span className="text-slate-300 text-sm">/</span> {selectedPlan}
                </span>
                <div className={`px-3 py-1 rounded-md text-[10px] font-bold border transition-colors ${totalAllocated === selectedPlan ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                  {totalAllocated > selectedPlan ? 'LIMITE EXCEDIDO' : totalAllocated === selectedPlan ? 'PRONTO PARA ATIVAÇÃO' : 'PENDENTE'}
                </div>
              </div>
            </div>

            {totalAllocated < selectedPlan && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 animate-pulse">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase">Distribua mais {selectedPlan - totalAllocated} resultados</span>
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
              disabled={totalAllocated !== selectedPlan}
              className={styles.primaryBtn}
            >
              Confirmar Alvos e Iniciar Prospecção
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
