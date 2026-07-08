'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useToastStore } from '../hooks/useToastStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const { toasts, removeToast } = useToastStore();

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* Global premium Toast Notifications Renderer */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 bg-white rounded-xl shadow-premium border-l-4 animate-slide-up ${
              toast.type === 'success'
                ? 'border-l-mint-400 text-text-primary'
                : toast.type === 'error'
                ? 'border-l-rose-500 text-text-primary'
                : 'border-l-amber-500 text-text-primary'
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-mint-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-amber-500" />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-text-secondary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </QueryClientProvider>
  );
}
