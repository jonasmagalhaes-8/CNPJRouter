import { create } from 'zustand';
import { serviceGetUser, serviceUpdateUser, serviceGetUsage, serviceRecordUsage } from '../services/UserService';

interface UserData {
  id: string;
  nome: string;
  email: string;
  plano: number;
  planInfo: { leads: number; preco: number; nome: string };
}

interface UsageData {
  viewsCount: number;
  planLimit: number;
  usageDate: string;
  percentage: number;
  isLimitReached?: boolean;
}

interface AuthState {
  user: UserData | null;
  usage: UsageData | null;
  showInterestModal: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  loadUser: () => Promise<void>;
  loadUsage: () => Promise<void>;
  recordUsage: () => Promise<boolean>;
  updateUser: (data: { nome?: string; email?: string; senhaAtual?: string; novaSenha?: string }) => Promise<boolean>;
  setShowInterestModal: (show: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  usage: null,
  showInterestModal: false,
  isAuthenticated: false,
  loading: true,

  loadUser: async () => {
    try {
      const resp = await serviceGetUser();
      if (resp.sucesso) {
        set({ user: resp.response, isAuthenticated: true, loading: false });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false, loading: false, showInterestModal: true });
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, loading: false, showInterestModal: true });
    }
  },

  loadUsage: async () => {
    try {
      const resp = await serviceGetUsage();
      if (resp.sucesso) {
        set({ usage: resp.response });
      }
    } catch {
      // silently fail
    }
  },

  recordUsage: async () => {
    try {
      const resp = await serviceRecordUsage();
      if (resp.sucesso) {
        const usage = get().usage;
        set({
          usage: {
            viewsCount: resp.response.viewsCount,
            planLimit: resp.response.planLimit,
            usageDate: usage?.usageDate || new Date().toISOString().slice(0, 10),
            percentage: Math.min(100, Math.round((resp.response.viewsCount / resp.response.planLimit) * 100)),
            isLimitReached: resp.response.isLimitReached,
          },
        });
        return resp.response.isLimitReached;
      }
      return false;
    } catch {
      return false;
    }
  },

  updateUser: async (data) => {
    try {
      const resp = await serviceUpdateUser(data);
      if (resp.sucesso) {
        if (resp.response.token) {
          localStorage.setItem('token', resp.response.token);
        }
        if (resp.response.user) {
          localStorage.setItem('user', JSON.stringify(resp.response.user));
        }
        await get().loadUser();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  setShowInterestModal: (show) => set({ showInterestModal: show }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, usage: null, showInterestModal: true });
  },
}));
