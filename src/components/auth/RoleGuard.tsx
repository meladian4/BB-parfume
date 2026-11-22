'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@/types/domain';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bb_current_user');
      if (!stored) {
        setAuthorized(false);
        router.replace('/login');
        return;
      }

      const parsed = JSON.parse(stored);
      setCurrentRole(parsed.role);
      setUserEmail(parsed.email || '');

      // Super Admin memiliki hak akses universal untuk mengawasi seluruh dashboard
      if (parsed.role === 'SUPER_ADMIN') {
        setAuthorized(true);
      } else if (!allowedRoles.includes(parsed.role)) {
        setAuthorized(false);
      } else {
        setAuthorized(true);
      }
    } catch {
      setAuthorized(false);
      router.replace('/login');
    }
  }, [allowedRoles, router, pathname]);

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex items-center justify-center text-slate-400 text-xs font-mono">
        Memverifikasi otorisasi pos akun...
      </div>
    );
  }

  if (!authorized) {
    const roleRedirectMap: Record<UserRole, string> = {
      CASHIER: '/cashier',
      LOGISTICS: '/logistics',
      SUPER_ADMIN: '/superadmin',
    };
    const returnUrl = currentRole ? roleRedirectMap[currentRole] || '/login' : '/login';

    return (
      <div className="min-h-screen bg-[#070A0F] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0E1420] border border-rose-500/40 rounded-2xl p-6 text-center shadow-2xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-wide">AKSES DITOLAK: PEMBATASAN POS AKUN</h2>
            <p className="text-xs text-rose-400 font-semibold">
              Pos akun Anda dilarang membuka modul ini.
            </p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Anda saat ini terdaftar sebagai pos <span className="font-bold text-[#D4AF37]">{currentRole || 'Pengguna'}</span> ({userEmail}).
            Sistem BB Parfum menegakkan batas tegas antar-pos akun (Kasir, Logistik, dan Super Admin) tanpa izin saling tembus.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold"
              onClick={() => router.push(returnUrl)}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Kembali ke Pos Akun Anda ({currentRole})</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
