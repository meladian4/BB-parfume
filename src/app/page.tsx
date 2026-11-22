'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bb_current_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === 'SUPER_ADMIN') {
          router.replace('/superadmin');
          return;
        } else if (user.role === 'LOGISTICS') {
          router.replace('/logistics');
          return;
        } else if (user.role === 'CASHIER') {
          router.replace('/cashier');
          return;
        }
      }
    } catch {
      // Fallback to login
    }
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#090D16] flex items-center justify-center text-slate-400 text-sm">
      Memuat BB Parfum Premium...
    </div>
  );
}
