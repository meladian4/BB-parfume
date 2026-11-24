'use client';

import React, { useEffect, useState } from 'react';
import { UserRole } from '@/types/domain';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function LogisticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    fullName: string;
    role: UserRole;
    storeName: string;
  }>({
    email: 'logistik@bbparfum.id',
    fullName: 'Bpk. Hendra (Kepala Logistik)',
    role: 'LOGISTICS',
    storeName: 'Gudang Pusat Distribusi Kendal',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bb_current_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'LOGISTICS' || u.role === 'SUPER_ADMIN') {
          setCurrentUser({
            email: u.email,
            fullName: u.full_name || (u.role === 'SUPER_ADMIN' ? 'Super Admin Utama' : 'Bpk. Hendra (Kepala Logistik)'),
            role: u.role,
            storeName: u.role === 'SUPER_ADMIN' ? 'Semua Cabang Kendal & Gudang' : 'Gudang Pusat Distribusi Kendal',
          });
        }
      }
    } catch {
      // Keep default
    }
  }, []);

  return (
    <RoleGuard allowedRoles={['LOGISTICS', 'SUPER_ADMIN']}>
      <div className="h-screen overflow-hidden bg-[#090D16] flex flex-col">
        <Topbar currentUser={currentUser} />
        <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
          <Sidebar role={currentUser.role === 'SUPER_ADMIN' ? 'LOGISTICS' : currentUser.role} />
          <main className="flex-1 p-3 sm:p-5 md:p-8 w-full min-w-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
