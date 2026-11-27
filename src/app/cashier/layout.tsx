'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types/domain';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Lock, Unlock, Banknote, RefreshCw, AlertTriangle } from 'lucide-react';

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
  const [userLoaded, setUserLoaded] = useState(false);
  const [shiftChecked, setShiftChecked] = useState(false);
  const [hasOpenShift, setHasOpenShift] = useState(false);
  const [pendingDepositAmount, setPendingDepositAmount] = useState<number | null>(null);
  const [checkingShift, setCheckingShift] = useState(false);

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
    } finally {
      setUserLoaded(true);
    }
  }, []);

  const checkShiftStatus = useCallback(async () => {
    if (!userLoaded) return;
    if (currentUser.role !== 'CASHIER') {
      setHasOpenShift(true);
      setShiftChecked(true);
      return;
    }
    try {
      setCheckingShift(true);
      const res = await fetch('/api/pos/session', { cache: 'no-store' });
      if (!res.ok) {
        setShiftChecked(true);
        return;
      }
      const data = await res.json();
      const isOpen = Boolean(data?.session && data.session.status === 'OPEN');
      setHasOpenShift(isOpen);
      const pendingAmt = data?.lock_status?.pending_deposit?.amount;
      setPendingDepositAmount(typeof pendingAmt === 'number' ? pendingAmt : null);
    } catch {
      // Keep previous shift status on transient network failure
    } finally {
      setCheckingShift(false);
      setShiftChecked(true);
    }
  }, [userLoaded, currentUser.role]);

  useEffect(() => {
    checkShiftStatus();
  }, [checkShiftStatus, pathname]);

  useEffect(() => {
    const onShiftChanged = () => {
      checkShiftStatus();
    };
    window.addEventListener('bb-shift-changed', onShiftChanged);
    return () => window.removeEventListener('bb-shift-changed', onShiftChanged);
  }, [checkShiftStatus]);

  // Halaman cetak struk tampil bersih tanpa Topbar & Sidebar
  const isReceiptPage = pathname?.startsWith('/cashier/receipt');

  if (isReceiptPage) {
    return (
      <RoleGuard allowedRoles={['CASHIER', 'SUPER_ADMIN']}>
        {children}
      </RoleGuard>
    );
  }

  // Halaman yang tetap bebas diakses kasir saat shift belum dibuka:
  // 1. Buka / Tutup Shift (/cashier/session)
  // 2. Setor Kas ke Pusat (/cashier/deposits)
  const isAlwaysAllowedRoute =
    pathname === '/cashier/session' ||
    pathname?.startsWith('/cashier/session/') ||
    pathname === '/cashier/deposits' ||
    pathname?.startsWith('/cashier/deposits/');

  // Halaman baca/monitoring yang tetap bisa dilihat dalam mode baca (aksi tulis tetap dikunci server)
  const isReadOnlyWhenClosedRoute =
    pathname === '/cashier/inventory' ||
    pathname === '/cashier/history' ||
    pathname === '/cashier/members';

  const isShiftLockedCashier =
    currentUser.role === 'CASHIER' && shiftChecked && !hasOpenShift;

  const shouldBlockPage =
    isShiftLockedCashier && !isAlwaysAllowedRoute && !isReadOnlyWhenClosedRoute;

  const shouldShowReadOnlyBanner =
    isShiftLockedCashier && isReadOnlyWhenClosedRoute;

  return (
    <RoleGuard allowedRoles={['CASHIER', 'SUPER_ADMIN']}>
      <div className="h-screen overflow-hidden bg-[#070A11] text-slate-100 flex flex-col font-sans">
        <Topbar currentUser={currentUser} />
        <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
          <Sidebar role={currentUser.role} />
          <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
            {shouldBlockPage ? (
              <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
                <div className="w-full max-w-lg rounded-2xl bg-[#101625] border border-amber-500/40 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                    <Lock className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[11px] font-bold uppercase tracking-wider">
                      Shift Kasir Belum Dibuka
                    </span>
                    <h1 className="text-lg sm:text-xl font-bold text-white">
                      Transaksi Kasir Dikunci Sementara
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Anda wajib <strong>Buka Shift Kasir</strong> terlebih dahulu sebelum melakukan transaksi penjualan, beban operasional, penerimaan barang, maupun retur.
                    </p>
                    <p className="text-xs text-slate-400">
                      Saat shift sedang tertutup, kasir hanya dapat mengakses menu <strong>Setor Kas ke Pusat</strong> atau membuka shift baru.
                    </p>
                  </div>

                  {pendingDepositAmount !== null && (
                    <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-left text-xs text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-300">Setor Kas Menunggu Persetujuan Super Admin</p>
                        <p className="text-amber-200/90 mt-0.5">
                          Pengajuan setor kas sebesar <strong>Rp {pendingDepositAmount.toLocaleString('id-ID')}</strong> berstatus PENDING. Buka shift dapat dilakukan setelah disetujui.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <Link
                      href="/cashier/session"
                      className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C365] hover:brightness-105 text-[#070A0F] font-bold text-xs sm:text-sm shadow-lg shadow-[#D4AF37]/20 transition"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Buka Shift Kasir</span>
                    </Link>

                    <Link
                      href="/cashier/deposits"
                      className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-bold text-xs sm:text-sm transition"
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Setor Kas ke Pusat</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={checkShiftStatus}
                    disabled={checkingShift}
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingShift ? 'animate-spin' : ''}`} />
                    <span>{checkingShift ? 'Memeriksa status shift...' : 'Cek Ulang Status Shift'}</span>
                  </button>
                </div>
              </main>
            ) : (
              <>
                {shouldShowReadOnlyBanner && (
                  <div className="px-4 py-2.5 bg-amber-950/80 border-b border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
                    <div className="flex items-center gap-2 text-amber-200">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>Shift Belum Dibuka (Mode Lihat Saja):</strong> Kasir hanya bisa melihat data atau melakukan <strong>Setor Kas ke Pusat</strong> sebelum buka shift.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href="/cashier/session"
                        className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-[#070A0F] font-bold text-[11px] hover:brightness-105 transition"
                      >
                        Buka Shift
                      </Link>
                      <Link
                        href="/cashier/deposits"
                        className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold text-[11px] hover:bg-emerald-900/80 transition"
                      >
                        Setor Kas
                      </Link>
                    </div>
                  </div>
                )}
                {children}
              </>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
