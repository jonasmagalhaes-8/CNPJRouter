import { create } from 'zustand';
import { type EmpresaDTO } from '../dtos/EmpresaDTO';
import { toggleFavoriteController, getFavoriteIdsController } from '../controllers/EmpresaController';

interface FavoritesState {
  favorites: string[];
  favoriteResults: EmpresaDTO[];
  loadFavorites: () => Promise<void>;
  setFavoriteResults: (results: EmpresaDTO[]) => void;
  toggleFavorite: (id: string) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  favoriteResults: [],

  loadFavorites: async () => {
    try {
      const ids = await getFavoriteIdsController();
      set({ favorites: ids });
    } catch {
      set({ favorites: [] });
    }
  },

  setFavoriteResults: (results) => set({ favoriteResults: results }),

  toggleFavorite: async (id: string) => {
    try {
      const favorited = await toggleFavoriteController(id);
      set((state) => ({
        favorites: favorited ? [...state.favorites, id] : state.favorites.filter((fid) => fid !== id),
      }));
    } catch {
      // silently fail
    }
  },
}));
