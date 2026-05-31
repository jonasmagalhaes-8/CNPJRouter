'use client';

import React, { useState, createContext, useContext } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import toastStyles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'alert';

interface ToastOptions {
  message: string;
  type: ToastType;
  requiresConfirm?: boolean;
  onConfirm?: () => void;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(ToastOptions & { id: number })[]>([]);

  const showToast = (options: ToastOptions) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...options, id }]);
    if (!options.requiresConfirm) {
      setTimeout(() => removeToast(id), 5000);
    }
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={toastStyles.toastContainer}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className={clsx(toastStyles.toast, toastStyles[toast.type])}
            >
              <div className={toastStyles.icon}>
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
                {toast.type === 'alert' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              </div>
              <div className={toastStyles.content}>
                <p className={toastStyles.message}>{toast.message}</p>
                {toast.requiresConfirm && (
                  <button
                    onClick={() => {
                      toast.onConfirm?.();
                      removeToast(toast.id);
                    }}
                    className={toastStyles.confirmBtn}
                  >
                    OK, Entendido
                  </button>
                )}
              </div>
              {!toast.requiresConfirm && (
                <button onClick={() => removeToast(toast.id)} className={toastStyles.closeBtn}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
