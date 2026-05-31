'use client';
import React, { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useFeedStore } from '../stores/useFeedStore';
import { useFavoritesStore } from '../stores/useFavoritesStore';
import { useContactsStore } from '../stores/useContactsStore';

// Re-export stores for backward compatibility
export { useAuthStore, useFeedStore, useFavoritesStore, useContactsStore };

// Wrapper provider that orchestrates the stores
export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading, showInterestModal, loadUser, loadUsage, setShowInterestModal } = useAuthStore();
  const { loadEmpresas, loadFilterOptions, reset } = useFeedStore();
  const { loadFavorites } = useFavoritesStore();
  const { loadContacts } = useContactsStore();

  // Initial auth check
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      loadUser().then(() => {
        loadUsage();
        setShowInterestModal(true);
      });
    } else {
      useAuthStore.setState({ loading: false });
      setShowInterestModal(true);
    }
  }, [loadUser, loadUsage, setShowInterestModal]);

  // Load empresas and filters on mount (no longer depends on segmentation config)
  useEffect(() => {
    if (user && !showInterestModal) {
      reset();
      loadEmpresas();
      loadFilterOptions();
      loadFavorites();
      loadContacts();
    }
  }, [user, showInterestModal, loadEmpresas, loadFilterOptions, loadFavorites, loadContacts, reset]);

  return <>{children}</>;
}
