'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types/domain';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    fullName: string;
    role: UserRole;
    storeName?: string;
  }>({
    email: 'kasir@bbparfum.id',
    fullName: 'Kasir Toko',
    role: 'CASHIER',
    storeName: undefined,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bb_current_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'CASHIER' || u.role === 'SUPER_ADMIN') {
          setCurrentUser({
            email: u.email || 'kasir@bbparfum.id',
            fullName: u.full_name || 'Kasir Toko',
            role: u.role,
            storeName:
              u.assigned_store?.name ||
              (u.role === 'SUPER_ADMIN' ? 'Semua Cabang Kendal & Gudang' : undefined),
          });
        }
      }
    } catch {
      // Keep default
    }
  }, []);

  // Halaman cetak struk tampil bersih tanpa Topbar & Sidebar
  const isReceiptPage = pathname?.startsWith('/cashier/receipt');

  if (isReceiptPage) {
    return (
      <RoleGuard allowedRoles={['CASHIER', 'SUPER_ADMIN']}>
        {children}
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['CASHIER', 'SUPER_ADMIN']}>
      <div className="h-screen overflow-hidden bg-[#070A11] text-slate-100 flex flex-col font-sans">
        <Topbar currentUser={currentUser} />
        <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
          <Sidebar role={currentUser.role} />
          <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
