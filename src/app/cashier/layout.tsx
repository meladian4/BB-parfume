'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['CASHIER', 'SUPER_ADMIN']}>
      {children}
    </RoleGuard>
  );
}
