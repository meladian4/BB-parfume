'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  Crown,
  Boxes,
  Receipt,
  CheckCircle2,
  ChevronDown,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BBLogo } from '@/components/ui/BBLogo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedCashierEmail, setSelectedCashierEmail] = useState('kasir.kendal@bbparfum.id');
  const [error, setError] = useState('');

  // 1-Click Direct Login Handler
  const handleQuickLogin = async (targetEmail: string, redirectTarget: string) => {
    setLoadingRole(targetEmail);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: 'password123' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal masuk ke pos akun.');
      }

      localStorage.setItem('bb_current_user', JSON.stringify(data.user));
      router.push(redirectTarget || data.redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Silakan coba lagi.');
      setLoadingRole(null);
    }
  };

  // Manual Form Login Handler
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingRole('manual');
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Email atau kata sandi tidak valid.');
      }

      localStorage.setItem('bb_current_user', JSON.stringify(data.user));
      router.push(data.redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10 space-y-8 my-auto">
        {/* Header Branding */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-gradient-to-b from-[#1E293B] to-[#0A0F1D] border border-[#D4AF37]/40 shadow-2xl shadow-[#D4AF37]/20 hover:scale-105 transition-transform duration-300">
            <BBLogo variant="gold" size="xl" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wider">
              BB PARFUM <span className="text-[#D4AF37] font-light">PREMIUM</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto mt-2">
              Sistem Manajemen Terpadu: 1 Gudang Pusat Distribusi & 3 Toko Cabang (Kendal Kota, Pegandon, Kaliwungu)
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-[#D4AF37] shadow-sm">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Semua Dashboard Aktif • Akses Cepat Langsung di Bawah</span>
          </div>
        </div>

        {error && (
          <div className={`max-w-xl mx-auto text-xs p-4 rounded-xl border flex items-start gap-3 shadow-xl ${
            error.includes('TERKUNCI')
              ? 'bg-rose-950 text-rose-200 border-rose-700 animate-pulse'
              : 'bg-rose-950/70 text-rose-300 border-rose-800/80'
          }`}>
            <span className="text-base shrink-0">{error.includes('TERKUNCI') ? '🔒' : '⚠️'}</span>
            <div className="space-y-1">
              <span className="font-semibold block">{error}</span>
              {error.includes('Kata sandi') && !showManualForm && (
                <button
                  type="button"
                  onClick={() => setShowManualForm(true)}
                  className="text-[11px] text-[#D4AF37] hover:underline block pt-1"
                >
                  &rarr; Buka form login manual dengan email & kata sandi kustom
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3 Active Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Super Admin */}
          <Card
            bordered
            className="border-slate-800 bg-[#0F172A]/90 hover:border-[#D4AF37]/60 transition-all duration-200 flex flex-col justify-between shadow-xl group"
          >
            <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Crown className="w-6 h-6" />
                  </div>
                  <Badge variant="gold" size="sm">
                    Owner & Pimpinan
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                    Dashboard Super Admin
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">admin@bbparfum.id</p>
                </div>

                <ul className="text-xs text-slate-300 space-y-1.5 pt-1 border-t border-slate-800/80">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span>Laba Rugi, Omzet & Margin HPP</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span>Master Produk, Bibit & Satuan ml</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span>Biaya OPEX & Pengguna Multi-Cabang</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span>Audit Trail Logistik & Finansial</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold shadow-md shadow-[#D4AF37]/20 hover:brightness-110"
                  isLoading={loadingRole === 'admin@bbparfum.id'}
                  onClick={() => handleQuickLogin('admin@bbparfum.id', '/superadmin')}
                >
                  <span>Buka Super Admin</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Logistik & Gudang */}
          <Card
            bordered
            className="border-slate-800 bg-[#0F172A]/90 hover:border-blue-500/60 transition-all duration-200 flex flex-col justify-between shadow-xl group"
          >
            <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <Badge variant="blue" size="sm">
                    Gudang Distribusi
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    Dashboard Logistik
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">logistik@bbparfum.id</p>
                </div>

                <ul className="text-xs text-slate-300 space-y-1.5 pt-1 border-t border-slate-800/80">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Saldo Stok Persediaan Bahan & Bibit</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Penyesuaian Fisik & Stock Opname</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Mutasi Stok ke 3 Cabang Retail</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Buku Besar Mutasi & Kartu Stok</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/20"
                  isLoading={loadingRole === 'logistik@bbparfum.id'}
                  onClick={() => handleQuickLogin('logistik@bbparfum.id', '/logistics')}
                >
                  <span>Buka Logistik Gudang</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Kasir POS Terminal */}
          <Card
            bordered
            className="border-slate-800 bg-[#0F172A]/90 hover:border-emerald-500/60 transition-all duration-200 flex flex-col justify-between shadow-xl group"
          >
            <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <Badge variant="emerald" size="sm">
                    Kasir Retail Kendal
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Terminal Kasir POS
                  </h3>
                  <div className="mt-1">
                    <select
                      value={selectedCashierEmail}
                      onChange={(e) => setSelectedCashierEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="kasir.kendal@bbparfum.id">Toko Kendal Kota (kasir.kendal)</option>
                      <option value="kasir.pegandon@bbparfum.id">Toko Pegandon (kasir.pegandon)</option>
                      <option value="kasir.kaliwungu@bbparfum.id">Toko Kaliwungu (kasir.kaliwungu)</option>
                    </select>
                  </div>
                </div>

                <ul className="text-xs text-slate-300 space-y-1.5 pt-1 border-t border-slate-800/80">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Penjualan Ritel & Barcode Scanner</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>🧪 Racik & Campur Bibit (Custom Blend)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Buka/Tutup Kas (Shift Laci Kasir)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Cetak Struk Thermal 58mm/80mm & Loyalty</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                  isLoading={loadingRole === selectedCashierEmail}
                  onClick={() => handleQuickLogin(selectedCashierEmail, '/cashier')}
                >
                  <span>Buka Kasir POS</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collapsible Manual Login */}
        <div className="max-w-md mx-auto pt-2">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 transition"
          >
            <span>Masuk menggunakan email & kata sandi kustom</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showManualForm ? 'rotate-180' : ''}`}
            />
          </button>

          {showManualForm && (
            <Card bordered className="mt-4 border-slate-800 bg-[#0F172A]/90 p-5 shadow-2xl">
              <form onSubmit={handleManualLogin} className="space-y-4">
                <Input
                  label="Email Akun"
                  type="email"
                  placeholder="admin@bbparfum.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  required
                />
                <Input
                  label="Kata Sandi"
                  type="password"
                  placeholder="Kata sandi akun"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full bg-[#D4AF37] text-black font-bold"
                  isLoading={loadingRole === 'manual'}
                >
                  Masuk Manual
                </Button>
              </form>
            </Card>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>BB Parfum Premium Kendal • Zona Waktu Asia/Jakarta (WIB) • Mata Uang IDR</span>
        </div>
      </div>
    </div>
  );
}
