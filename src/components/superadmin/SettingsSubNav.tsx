'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, Store, Users } from 'lucide-react';

interface SettingsSubNavProps {
  activeTab: 'settings' | 'stores' | 'users';
}

export function SettingsSubNav({ activeTab }: SettingsSubNavProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-[#162036] via-[#0F172A] to-[#0D1322] border border-[#1E293B] shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center shrink-0">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-white tracking-wide uppercase">
              Sub Menu Pengaturan Sistem
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#E5C365] border border-[#D4AF37]/30 font-semibold">
              Super Admin
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Pusat konfigurasi kebijakan loyalitas poin, master cabang toko & gudang, serta hak akses pengguna.
          </p>
        </div>
      </div>

      {/* 3 Sub-Menu Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#090D16] p-1.5 rounded-xl border border-slate-800 shrink-0">
        <Link
          href="/superadmin/settings"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Poin & Kebijakan</span>
        </Link>

        <Link
          href="/superadmin/stores"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'stores'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Toko & Cabang Kendal</span>
        </Link>

        <Link
          href="/superadmin/users"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Pengguna & Hak Akses</span>
        </Link>
      </div>
    </div>
  );
}
