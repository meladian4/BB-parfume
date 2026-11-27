'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole, UserProfile } from '@/types/domain';
import { Badge } from '@/components/ui/Badge';
import {
  Store,
  ShieldCheck,
  LogOut,
  Menu,
  Bell,
  Banknote,
  Truck,
  PackagePlus,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { formatTimeJakarta, formatDateTimeJakarta } from '@/lib/formatters';
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

interface NotificationItem {
  id: string;
  type: 'DEPOSIT' | 'TRANSFER' | 'PURCHASE' | 'VOID';
  title: string;
  subtitle: string;
  href: string;
  created_at: string;
}

export function Topbar({
  currentUser,
  user,
  onLogout,
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobileOpen, toggleMobile, toggleDesktop } = useNavigation();
  const notifRef = useRef<HTMLDivElement | null>(null);

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
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTotal, setNotifTotal] = useState(0);
  const [notifItems, setNotifItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
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

  const loadNotifications = useCallback(async () => {
    if (activeUser.role !== 'SUPER_ADMIN') return;
    if (typeof document !== 'undefined' && document.hidden) return;
    try {
      const res = await fetch('/api/superadmin/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success) {
        setNotifTotal(Number(data.counts?.total) || 0);
        setNotifItems(Array.isArray(data.items) ? data.items : []);
      }
    } catch {
      // ignore transient errors
    }
  }, [activeUser.role]);

  useEffect(() => {
    if (activeUser.role !== 'SUPER_ADMIN') return;
    loadNotifications();
    const timer = setInterval(loadNotifications, 15000);
    const onRefresh = () => loadNotifications();
    window.addEventListener('bb-notifications-refresh', onRefresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('bb-notifications-refresh', onRefresh);
    };
  }, [activeUser.role, pathname, loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

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

  const homeLink =
    activeUser.role === 'CASHIER'
      ? '/cashier'
      : activeUser.role === 'LOGISTICS'
      ? '/logistics'
      : '/superadmin';

  const getNotifIcon = (type: NotificationItem['type']) => {
    if (type === 'DEPOSIT') return <Banknote className="w-4 h-4 text-emerald-400" />;
    if (type === 'TRANSFER') return <Truck className="w-4 h-4 text-sky-400" />;
    if (type === 'PURCHASE') return <PackagePlus className="w-4 h-4 text-amber-400" />;
    return <Receipt className="w-4 h-4 text-rose-400" />;
  };

  return (
    <div className="sticky top-0 z-40 bg-[#070A0F]">
      {/* Top Header */}
      <header className="h-16 border-b border-[#1E293B] bg-[#090D16]/95 backdrop-blur px-3 sm:px-6 flex items-center justify-between gap-2">
        {/* Brand & Hamburger & Store context */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleHamburgerToggle}
            className="relative p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
            title={isMobileOpen ? 'Tutup Navigasi' : 'Menu Navigasi (Hamburger)'}
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5 text-slate-300 hover:text-[#D4AF37] transition-colors" />
            {activeUser.role === 'SUPER_ADMIN' && notifTotal > 0 && (
              <span className="md:hidden absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#090D16] animate-pulse" />
            )}
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

        {/* Clock, Notifications, User info, Role & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentTime && (
            <div className="hidden xl:block text-xs font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800">
              {currentTime}
            </div>
          )}

          {/* Bell Notifikasi Approval Khusus Super Admin */}
          {activeUser.role === 'SUPER_ADMIN' && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((prev) => !prev);
                  loadNotifications();
                }}
                title={
                  notifTotal > 0
                    ? `${notifTotal} permintaan persetujuan menunggu tindakan`
                    : 'Notifikasi Persetujuan Cabang'
                }
                className={`relative p-2 rounded-lg border transition flex items-center justify-center ${
                  notifTotal > 0
                    ? 'border-rose-500/50 bg-rose-950/35 text-rose-300 hover:bg-rose-950/60'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Bell className={`w-4 h-4 ${notifTotal > 0 ? 'animate-pulse text-rose-400' : ''}`} />
                {notifTotal > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md shadow-rose-500/40">
                    {notifTotal > 99 ? '99+' : notifTotal}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl bg-[#0D1322] border border-slate-700/80 shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-800 bg-[#090D16] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Notifikasi Approval Cabang</p>
                      <p className="text-[10px] text-slate-400">
                        Setor kas, mutasi, acuan belanja &amp; void
                      </p>
                    </div>
                    {notifTotal > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                        {notifTotal} Pending
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/70">
                    {notifItems.length === 0 ? (
                      <div className="p-6 text-center space-y-2">
                        <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-200">
                          Semua persetujuan sudah beres
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Belum ada permintaan approval baru dari cabang atau logistik.
                        </p>
                      </div>
                    ) : (
                      notifItems.map((item) => (
                        <Link
                          key={`${item.type}-${item.id}`}
                          href={item.href}
                          onClick={() => setNotifOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/60 transition"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                            {getNotifIcon(item.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {formatDateTimeJakarta(item.created_at)}
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
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
