'use client';

import React, { useEffect, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState({
    email: 'admin@bbparfum.id',
    fullName: 'Bpk. Ahmad (Super Admin)',
    role: 'SUPER_ADMIN' as const,
    storeName: 'Semua Cabang Kendal & Gudang',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bb_current_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'SUPER_ADMIN') {
          setCurrentUser({
            email: u.email,
            fullName: u.full_name || 'Bpk. Ahmad (Super Admin)',
            role: 'SUPER_ADMIN',
            storeName: 'Semua Cabang Kendal & Gudang',
          });
        }
      }
    } catch {
      // Keep default
    }
  }, []);

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN']}>
      <div className="h-screen overflow-hidden bg-[#090D16] flex flex-col">
        <Topbar currentUser={currentUser} />
        <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
          <Sidebar role="SUPER_ADMIN" />
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
