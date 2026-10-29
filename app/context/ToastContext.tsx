import React, { createContext, useCallback, useContext, useState } from 'react';
import { ToastBanner, ToastMessage, ToastType } from '@/components/ToastBanner';

interface ToastContextValue {
  showToast: (title: string, message: string, type?: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback(
    (title: string, message: string, type: ToastType = 'error') => {
      setToast({
        id: String(Date.now()),
        title,
        message,
        type,
      });
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastBanner toast={toast} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
