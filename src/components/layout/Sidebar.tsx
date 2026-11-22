'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types/domain';
import {
  LayoutDashboard,
  Store,
  Users,
  Package,
  TrendingUp,
  Receipt,
  RotateCcw,
  Boxes,
  ScrollText,
  DollarSign,
  Truck,
  Settings,
  Award,
  PackagePlus,
  Wallet,
  Banknote,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { BBLogo } from '@/components/ui/BBLogo';
import { useNavigation } from '@/context/NavigationContext';

export interface SidebarProps {
  role: UserRole;
}

export interface NavItem {
  href: string;
  label: string;
  icon: any;
  subItems?: { href: string; label: string; icon: any }[];
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const { isMobileOpen, closeMobile, isDesktopCollapsed } = useNavigation();

  const superAdminLinks: NavItem[] = [
    { href: '/superadmin', label: 'Ringkasan Utama', icon: LayoutDashboard },
    { href: '/superadmin/deposits', label: 'Persetujuan Setor Kas (Approval)', icon: Banknote },
    { href: '/superadmin/transfers', label: 'Persetujuan Mutasi (Approval)', icon: Truck },
    { href: '/superadmin/purchases', label: 'Acuan Belanja (Permintaan)', icon: PackagePlus },
    { href: '/superadmin/products', label: 'Master Produk Parfum', icon: Package },
    { href: '/superadmin/members', label: 'Member & Loyalitas', icon: Award },
    { href: '/cashier/history', label: 'Riwayat Transaksi & Void', icon: Receipt },
    { href: '/superadmin/reports', label: 'Laporan & Keuangan', icon: TrendingUp },
    { href: '/superadmin/expenses', label: 'Biaya Operasional', icon: DollarSign },
    { href: '/superadmin/audit-log', label: 'Audit Trail', icon: ScrollText },
    {
      href: '/superadmin/settings',
      label: 'Pengaturan Sistem',
      icon: Settings,
      subItems: [
        { href: '/superadmin/settings', label: 'Poin & Kebijakan', icon: Settings },
        { href: '/superadmin/stores', label: 'Toko & Cabang Kendal', icon: Store },
        { href: '/superadmin/users', label: 'Pengguna & Hak Akses', icon: Users },
      ],
    },
  ];

  const logisticsLinks: NavItem[] = [
    { href: '/logistics', label: 'Dashboard Logistik', icon: LayoutDashboard },
    { href: '/logistics/inventory', label: 'Persediaan & Stok', icon: Boxes },
    { href: '/logistics/purchases', label: 'Permintaan Belanja (Restock)', icon: PackagePlus },
    { href: '/logistics/transfers', label: 'Mutasi Cabang', icon: Truck },
    { href: '/logistics/products', label: 'Katalog Produk', icon: Package },
  ];

  const cashierLinks: NavItem[] = [
    { href: '/cashier', label: 'Kasir POS Terminal', icon: Receipt },
    { href: '/cashier/deposits', label: 'Setor Kas ke Pusat', icon: Banknote },
    { href: '/cashier/transfers', label: 'Penerimaan Barang', icon: Truck },
    { href: '/cashier/expenses', label: 'Beban Operasional Cabang', icon: DollarSign },
    { href: '/cashier/session', label: 'Shift Kasir (Kas)', icon: Wallet },
    { href: '/cashier/history', label: 'Riwayat Transaksi', icon: ScrollText },
    { href: '/cashier/members', label: 'Member & Loyalty', icon: Users },
    { href: '/cashier/returns', label: 'Retur Penjualan', icon: RotateCcw },
  ];

  const links =
    role === 'SUPER_ADMIN'
      ? superAdminLinks
      : role === 'LOGISTICS'
      ? logisticsLinks
      : cashierLinks;

  // Konten navigasi yang dipakai baik di desktop maupun mobile drawer
  const renderNavItems = (isMobile = false) => (
    <div className={clsx(isMobile ? 'p-4 space-y-1' : 'p-3 space-y-1 overflow-y-auto flex-1')}>
      <div className={clsx('text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-2', isMobile ? 'px-3' : isDesktopCollapsed ? 'text-center' : 'px-3')}>
        {isDesktopCollapsed && !isMobile ? '•••' : 'Navigasi Modul'}
      </div>

      {links.map((item) => {
        const Icon = item.icon;
        const isParentActive =
          pathname === item.href ||
          (item.subItems && item.subItems.some((s) => pathname === s.href));
        const isExactActive = pathname === item.href;

        return (
          <div key={item.href} className="space-y-0.5">
            <Link
              href={item.href}
              onClick={() => {
                if (isMobile) closeMobile();
              }}
              title={item.label}
              className={clsx(
                'flex items-center rounded-lg text-xs font-medium transition-all group',
                isMobile
                  ? 'px-3.5 py-3 text-sm justify-between'
                  : isDesktopCollapsed
                  ? 'justify-center p-2.5'
                  : 'px-3 py-2.5 justify-between',
                isExactActive || (isParentActive && !item.subItems)
                  ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent text-[#E5C365] border-l-2 border-[#D4AF37] font-semibold'
                  : isParentActive
                  ? 'text-white bg-slate-800/40 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={clsx(
                    'transition-colors shrink-0',
                    isMobile ? 'w-5 h-5' : 'w-4 h-4',
                    isParentActive ? 'text-[#D4AF37]' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />
                {(!isDesktopCollapsed || isMobile) && <span>{item.label}</span>}
              </div>

              {(!isDesktopCollapsed || isMobile) && item.subItems && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {item.subItems.length}
                </span>
              )}
            </Link>

            {/* Sub-menu rendering untuk grup Pengaturan */}
            {item.subItems && isParentActive && (!isDesktopCollapsed || isMobile) && (
              <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-slate-800 ml-4 my-1">
                {item.subItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = pathname === sub.href;
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      onClick={() => {
                        if (isMobile) closeMobile();
                      }}
                      className={clsx(
                        'flex items-center gap-2 rounded-md transition-all',
                        isMobile ? 'px-3 py-2 text-xs' : 'px-2.5 py-1.5 text-[11px]',
                        isSubActive
                          ? 'text-[#D4AF37] font-bold bg-[#D4AF37]/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      )}
                    >
                      <SubIcon className={clsx('w-3.5 h-3.5', isSubActive ? 'text-[#D4AF37]' : 'text-slate-500')} />
                      <span>{sub.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (Tampil di md ke atas) */}
      <aside
        className={clsx(
          'border-r border-[#1E293B] bg-[#090D16] flex-col justify-between shrink-0 h-[calc(100vh-4rem)] sticky top-16 transition-all duration-300 hidden md:flex',
          isDesktopCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className={clsx('border-b border-[#1E293B]/60 bg-[#0B101D]/50', isDesktopCollapsed ? 'p-2 flex justify-center' : 'px-4 pt-4 pb-3')}>
          <BBLogo showText={!isDesktopCollapsed} size="sm" subtitle={isDesktopCollapsed ? undefined : 'SISTEM OPERASIONAL'} />
        </div>

        {renderNavItems(false)}

        {/* Footer Sidebar Desktop */}
        <div className="p-3 border-t border-[#1E293B]">
          <div className={clsx('flex items-center text-[11px] text-slate-500', isDesktopCollapsed ? 'justify-center' : 'justify-between')}>
            {!isDesktopCollapsed && <span>Kendal, Jateng</span>}
            <span className="text-[#D4AF37] font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER NAVIGATION (Handphone UI/UX) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop Blur Gelap */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative w-80 max-w-[85vw] bg-[#090D16] border-r border-[#1E293B] shadow-2xl flex flex-col justify-between h-full z-10 animate-in slide-in-from-left duration-250">
            {/* Header Drawer dengan Tombol Close (X) */}
            <div className="px-4 py-3.5 border-b border-[#1E293B] bg-[#0B101D] flex items-center justify-between">
              <BBLogo showText size="sm" subtitle="SISTEM OPERASIONAL" />
              <button
                type="button"
                onClick={closeMobile}
                className="p-2 -mr-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Tutup navigasi"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Navigasi Links Scrollable */}
            <div className="overflow-y-auto flex-1">
              {renderNavItems(true)}
            </div>

            {/* Footer Drawer */}
            <div className="p-4 border-t border-[#1E293B] bg-[#0B101D]/70">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Kendal, Jawa Tengah</span>
                <span className="text-[#D4AF37] font-mono font-medium">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
