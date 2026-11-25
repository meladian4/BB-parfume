'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ArrowRight,
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { BBLogo } from '@/components/ui/BBLogo';

interface LoginAccountOption {
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'LOGISTICS' | 'CASHIER';
  store_name?: string | null;
}

const DEFAULT_ACCOUNTS: LoginAccountOption[] = [
  { email: 'admin@bbparfum.id', full_name: 'Super Admin Utama', role: 'SUPER_ADMIN', store_name: null },
  { email: 'logistik@bbparfum.id', full_name: 'Logistik Gudang Pusat', role: 'LOGISTICS', store_name: null },
  { email: 'kasir.kendal@bbparfum.id', full_name: 'Kasir Toko Kendal Kota', role: 'CASHIER', store_name: 'Toko 1 - Kendal Kota' },
  { email: 'kasir.pegandon@bbparfum.id', full_name: 'Kasir Toko Pegandon', role: 'CASHIER', store_name: 'Toko 2 - Pegandon' },
  { email: 'kasir.kaliwungu@bbparfum.id', full_name: 'Kasir Toko Kaliwungu', role: 'CASHIER', store_name: 'Toko 3 - Kaliwungu' },
];

const CUSTOM_ACCOUNT_VALUE = '__CUSTOM__';

export default function LoginPage() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [accounts, setAccounts] = useState<LoginAccountOption[]>(DEFAULT_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState<string>(DEFAULT_ACCOUNTS[0].email);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/accounts')
      .then((r) => r.json())
      .then((data) => {
        if (active && data?.success && Array.isArray(data.accounts) && data.accounts.length > 0) {
          setAccounts(data.accounts);
          setSelectedAccount((prev) => {
            if (prev === CUSTOM_ACCOUNT_VALUE) return prev;
            const exists = data.accounts.some((a: LoginAccountOption) => a.email === prev);
            return exists ? prev : data.accounts[0].email;
          });
        }
      })
      .catch(() => {
        // Keep fallback DEFAULT_ACCOUNTS
      });
    return () => {
      active = false;
    };
  }, []);

  // Tutup dropdown saat klik di luar atau tekan Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const roleBadgeStyle = (role: string) => {
    if (role === 'SUPER_ADMIN') {
      return {
        label: 'Super Admin',
        cls: 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30',
      };
    }
    if (role === 'LOGISTICS') {
      return {
        label: 'Logistik',
        cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      };
    }
    return {
      label: 'Kasir',
      cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    };
  };

  const activeAccountObj = accounts.find((a) => a.email === selectedAccount) || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail =
      selectedAccount === CUSTOM_ACCOUNT_VALUE ? customEmail.trim() : selectedAccount.trim();

    if (!targetEmail) {
      setError('Silakan pilih atau masukkan username/email akun.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Username atau kata sandi tidak valid.');
      }

      localStorage.setItem('bb_current_user', JSON.stringify(data.user));
      router.push(data.redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali username dan kata sandi Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A0F] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6 my-auto">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-gradient-to-b from-[#1E293B] to-[#0A0F1D] border border-[#D4AF37]/40 shadow-2xl shadow-[#D4AF37]/20">
            <BBLogo variant="gold" size="xl" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider">
              BB PARFUM <span className="text-[#D4AF37] font-light">PREMIUM</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1.5">
              Sistem Operasional &amp; POS Manajemen Multi-Cabang
            </p>
          </div>
        </div>

        {/* Normal Login Card */}
        <Card bordered className="border-slate-800 bg-[#0F172A]/95 shadow-2xl overflow-visible">
          <CardContent className="p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-white">Masuk ke Sistem</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pilih akun pengguna lalu masukkan kata sandi Anda
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
                <Shield className="w-4 h-4" />
              </div>
            </div>

            {error && (
              <div
                className={`text-xs p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  error.includes('TERKUNCI')
                    ? 'bg-rose-950 text-rose-200 border-rose-700 animate-pulse'
                    : 'bg-rose-950/70 text-rose-300 border-rose-800/80'
                }`}
              >
                <span className="text-sm shrink-0">{error.includes('TERKUNCI') ? '🔒' : '⚠️'}</span>
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Custom Single-Line Username / Account Selector */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label
                  htmlFor="login-account-trigger"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Username / Akun
                </label>

                <div className="relative">
                  <button
                    id="login-account-trigger"
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                    className={`w-full h-11 bg-[#090D16] border rounded-xl pl-3.5 pr-3 flex items-center justify-between gap-2 text-left transition-colors focus:outline-none ${
                      dropdownOpen
                        ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/50'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      {selectedAccount === CUSTOM_ACCOUNT_VALUE ? (
                        <span className="text-sm text-[#D4AF37] font-medium truncate">
                          Lainnya (Ketik Email Manual)
                        </span>
                      ) : activeAccountObj ? (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-sm text-slate-100 font-medium truncate">
                            {activeAccountObj.full_name}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                              roleBadgeStyle(activeAccountObj.role).cls
                            }`}
                          >
                            {roleBadgeStyle(activeAccountObj.role).label}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 truncate">Pilih akun...</span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        dropdownOpen ? 'rotate-180 text-[#D4AF37]' : ''
                      }`}
                    />
                  </button>

                  {/* Floating Dropdown Menu */}
                  {dropdownOpen && (
                    <div
                      role="listbox"
                      className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl border border-slate-700/90 bg-[#0B1120] shadow-2xl shadow-black/60 py-1 max-h-80 overflow-y-auto"
                    >
                      {accounts.map((acc) => {
                        const isSelected = selectedAccount === acc.email;
                        const badge = roleBadgeStyle(acc.role);
                        return (
                          <button
                            key={acc.email}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedAccount(acc.email);
                              setDropdownOpen(false);
                              setError('');
                            }}
                            className={`w-full px-3.5 py-2 flex items-center justify-between gap-2 text-left transition-colors ${
                              isSelected
                                ? 'bg-[#D4AF37]/10 text-white'
                                : 'text-slate-200 hover:bg-slate-800/70'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold truncate">
                                  {acc.full_name}
                                </span>
                                <span
                                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${badge.cls}`}
                                >
                                  {badge.label}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                                {acc.email}
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      <div className="border-t border-slate-800 my-1" />

                      <button
                        type="button"
                        role="option"
                        aria-selected={selectedAccount === CUSTOM_ACCOUNT_VALUE}
                        onClick={() => {
                          setSelectedAccount(CUSTOM_ACCOUNT_VALUE);
                          setDropdownOpen(false);
                          setError('');
                        }}
                        className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left transition-colors ${
                          selectedAccount === CUSTOM_ACCOUNT_VALUE
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-[#D4AF37]'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>Lainnya (Ketik Email Manual)...</span>
                        </div>
                        {selectedAccount === CUSTOM_ACCOUNT_VALUE && (
                          <Check className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Custom Email Input when 'Lainnya' is chosen */}
              {selectedAccount === CUSTOM_ACCOUNT_VALUE && (
                <Input
                  label="Email Akun Kustom"
                  type="email"
                  placeholder="nama@bbparfum.id"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  required
                  autoFocus
                />
              )}

              {/* Password Input with Show/Hide Toggle */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-300"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan kata sandi akun"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full h-11 bg-[#090D16] border border-slate-700 hover:border-slate-600 focus:border-[#D4AF37] rounded-xl pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full h-11 bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 mt-2"
                isLoading={loading}
              >
                <span>Masuk</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>BB Parfum Premium Kendal • Asia/Jakarta (WIB) • IDR</span>
        </div>
      </div>
    </div>
  );
}
