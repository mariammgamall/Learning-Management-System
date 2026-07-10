'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SupportDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/mailbox');
  }, [router]);

  return null;
}
