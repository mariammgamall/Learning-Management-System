'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../hooks/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Attempt session restoration check
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Direct to role-based landing dashboard
        const role = user.role.toLowerCase();
        router.replace(`/dashboard/${role}`);
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-beige-50">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white shadow-premium animate-fade-in">
        <Loader2 className="w-12 h-12 text-mint-500 animate-spin" />
        <p className="text-sm font-semibold text-text-primary">Loading LMS...</p>
        <p className="text-xs text-text-secondary">Restoring active session</p>
      </div>
    </div>
  );
}
