import { create } from 'zustand';
import { saveSegmentationController, getSegmentationController } from '../controllers/SegmentationController';
import type { NicheDTO } from '../dtos/NicheDTO';

interface ConfigState {
  config: { limit: number } | null;
  setConfig: (config: { limit: number }) => void;
  resetConfig: () => void;
  confirmConfig: (data: { niches: NicheDTO[]; limit: number }) => Promise<void>;
  loadConfig: () => Promise<NicheDTO[] | null>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,

  setConfig: (newConfig) => {
    set({ config: newConfig });
  },

  resetConfig: () => set({ config: null }),

  confirmConfig: async (data) => {
    await saveSegmentationController(data.niches, data.limit);
    set({ config: { limit: data.limit } });
  },

  loadConfig: async () => {
    try {
      const res = await getSegmentationController();
      if (res && res.niches && res.niches.length > 0) {
        set({ config: { limit: res.limit } });
        return res.niches;
      }
      return null;
    } catch {
      return null;
    }
  }
}));
