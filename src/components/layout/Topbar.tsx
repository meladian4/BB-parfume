'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole, UserProfile } from '@/types/domain';
import { Badge } from '@/components/ui/Badge';
import {
  Store,
  ShieldCheck,
  LogOut,
  Menu,
} from 'lucide-react';
import { formatTimeJakarta } from '@/lib/formatters';
import { BBLogo } from '@/components/ui/BBLogo';
import { useNavigation } from '@/context/NavigationContext';

export interface TopbarProps {
  currentUser?: {
    email: string;
    fullName: string;
    role: UserRole;
    storeName?: string;
  };
  user?: UserProfile | null;
  onLogout?: () => void;
}

export function Topbar({
  currentUser,
  user,
  onLogout,
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileOpen, toggleMobile, isDesktopCollapsed, toggleDesktop } = useNavigation();

  const handleHamburgerToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      toggleMobile();
    } else {
      toggleDesktop();
    }
  };

  // Ambil user dari props atau localStorage
  const [activeUser, setActiveUser] = useState(() => {
    if (user) {
      return {
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        storeName: user.assigned_store?.name,
      };
    }
    if (currentUser) {
      return currentUser;
    }
    return {
      email: 'admin@bbparfum.id',
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN' as UserRole,
      storeName: 'Semua Cabang & Gudang Kendal',
    };
  });

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Sinkronisasi dengan localStorage jika ada
    try {
      const stored = localStorage.getItem('bb_current_user');
      if (stored) {
        const u = JSON.parse(stored);
        setActiveUser((prev) => ({
          ...prev,
          email: u.email || prev.email,
          fullName: u.full_name || prev.fullName,
          role: u.role || prev.role,
          storeName: u.assigned_store?.name || prev.storeName,
        }));
      }
    } catch {
      // Keep default
    }

    setCurrentTime(formatTimeJakarta(new Date()));
    const timer = setInterval(() => {
      setCurrentTime(formatTimeJakarta(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('bb_current_user');
    } catch {
      // ignore
    }
    router.push('/login');
  };

  const roleLabelMap: Record<UserRole, { label: string; variant: 'gold' | 'blue' | 'emerald' }> = {
    SUPER_ADMIN: { label: 'SUPER ADMIN', variant: 'gold' },
    LOGISTICS: { label: 'LOGISTIK GUDANG', variant: 'blue' },
    CASHIER: { label: 'KASIR RITEL', variant: 'emerald' },
  };

  const roleMeta = roleLabelMap[activeUser.role] || { label: activeUser.role, variant: 'slate' };

  // Tentukan Brand Home Link sesuai Pos Akun Resmi
  const homeLink =
    activeUser.role === 'CASHIER'
      ? '/cashier'
      : activeUser.role === 'LOGISTICS'
      ? '/logistics'
      : '/superadmin';

  return (
    <div className="sticky top-0 z-40 bg-[#070A0F]">
      {/* Top Header */}
      <header className="h-16 border-b border-[#1E293B] bg-[#090D16]/95 backdrop-blur px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Brand & Hamburger & Store context */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleHamburgerToggle}
            className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            title={isMobileOpen ? 'Tutup Navigasi' : 'Menu Navigasi (Hamburger)'}
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5 text-slate-300 hover:text-[#D4AF37] transition-colors" />
          </button>

          <Link href={homeLink} className="group flex items-center">
            <div className="sm:hidden">
              <BBLogo size="xs" withContainer />
            </div>
            <div className="hidden sm:block">
              <BBLogo showText size="sm" withContainer />
            </div>
          </Link>

          {activeUser.storeName && (
            <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-xs text-slate-300">
              <Store className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="font-medium text-slate-200 truncate max-w-[180px]">
                {activeUser.storeName}
              </span>
            </div>
          )}
        </div>

        {/* Clock, User info, Role & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          {currentTime && (
            <div className="hidden xl:block text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800">
              {currentTime}
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-white">{activeUser.fullName}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                {activeUser.email}
              </div>
            </div>

            <Badge variant={roleMeta.variant} size="sm" className="hidden sm:inline-flex">
              <ShieldCheck className="w-3 h-3 inline mr-1" />
              {roleMeta.label}
            </Badge>

            <button
              onClick={handleLogout}
              title="Keluar dari Sistem (Logout)"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-800 hover:bg-rose-950/20 transition text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Keluar</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
