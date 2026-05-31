'use client';

import { AppProvider } from './context/AppContext';
import { ToastProvider } from './components/ToastProvider/ToastProvider';
import AppContent from './AppContent';

export default function Home() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}
