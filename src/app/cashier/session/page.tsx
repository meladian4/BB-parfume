'use client';

import React, { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatIDR, formatDateTimeJakarta } from '@/lib/formatters';
import { CashSession, UserProfile, Store } from '@/types/domain';
import {
  DollarSign,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Receipt,
  Calendar,
} from 'lucide-react';

export default function CashierSessionPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<CashSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal buka session
  const [availableCash, setAvailableCash] = useState<number>(0);
  const [openingCashInput, setOpeningCashInput] = useState('0');
  const [openingNotes, setOpeningNotes] = useState('Sisa kas fisik belum disetor');

  // Modal tutup session
  const [actualCashInput, setActualCashInput] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, sessRes] = await Promise.all([
        fetch('/api/users/me').then((r) => r.json()),
        fetch('/api/pos/session').then((r) => r.json()),
      ]);

      setUser(uRes.user);
      if (sessRes.session) {
        setSession(sessRes.session);
        setActualCashInput(String(sessRes.session.expected_cash || ''));
      } else {
        setSession(null);
        if (typeof sessRes.available_cash === 'number') {
          setAvailableCash(sessRes.available_cash);
          setOpeningCashInput(String(sessRes.available_cash));
          setOpeningNotes(`Sisa kas fisik belum disetor (${formatIDR(sessRes.available_cash)})`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/pos/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'OPEN',
          opening_cash: Number(openingCashInput) || 0,
          notes: openingNotes,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuka shift kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      setErrorMsg('Tidak ada shift aktif yang ditemukan untuk ditutup.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/pos/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE',
          session_id: session.id,
          actual_cash: Number(actualCashInput) || 0,
          notes: closingNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menutup shift kasir.');
      alert('Sesi kasir berhasil ditutup dan direkonsiliasi.');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menutup shift kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  const diff = session ? (Number(actualCashInput) || 0) - session.expected_cash : 0;

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans">
      <Topbar user={user || undefined} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar role="CASHIER" />

        <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#D4AF37]" />
              Manajemen Shift Kasir & Laci Uang Tunai
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Rekonsiliasi modal awal, penjualan tunai, dan perhitungan selisih fisik laci kas (*Cash Drawer Balancing*)
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {session && session.status === 'OPEN' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Sesi Aktif */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-[#101625] border-slate-800 p-6 shadow-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Shift Kasir Aktif
                      </span>
                      <h2 className="text-lg font-bold text-white mt-1">
                        Sesi ID: {session.id}
                      </h2>
                    </div>
                    <Badge variant="emerald" size="sm">
                      OPEN (TERBUKA)
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-xs text-slate-400">Modal Kas Awal</span>
                      <p className="text-lg font-bold text-white mt-1">
                        {formatIDR(session.opening_cash)}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span className="text-xs text-slate-400">Penjualan Tunai Shift Ini</span>
                      <p className="text-lg font-bold text-emerald-400 mt-1">
                        {formatIDR(session.total_sales_cash)}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-[#D4AF37]/30 bg-gradient-to-br from-slate-900 to-[#1e1910]">
                      <span className="text-xs text-[#D4AF37]">Saldo Kas Sistem (Expected)</span>
                      <p className="text-lg font-bold text-[#E5C365] mt-1">
                        {formatIDR(session.expected_cash)}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1">
                    <p>
                      <strong>Waktu Dibuka:</strong> {formatDateTimeJakarta(session.opened_at)}
                    </p>
                    {session.notes && (
                      <p>
                        <strong>Catatan Pembukaan:</strong> {session.notes}
                      </p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Form Tutup Shift */}
              <div>
                <Card className="bg-[#101625] border-slate-800 p-6 shadow-xl">
                  <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-[#D4AF37]" />
                    Tutup Shift & Rekonsiliasi Kas
                  </h3>

                  <form onSubmit={handleCloseSession} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Total Fisik Uang di Laci (IDR) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        value={actualCashInput}
                        onChange={(e) => setActualCashInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-[#D4AF37]"
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex justify-between">
                      <span className="text-slate-400">Selisih Kas (Fisik - Sistem):</span>
                      <span
                        className={`font-mono font-bold ${
                          diff === 0
                            ? 'text-emerald-400'
                            : diff > 0
                            ? 'text-blue-400'
                            : 'text-red-400'
                        }`}
                      >
                        {diff === 0 ? 'Rp 0 (Cocok)' : formatIDR(diff)}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Catatan Penutupan Shift (Opsional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Contoh: Uang fisik pas, laci diserahterimakan ke kasir shift berikutnya"
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-[#D4AF37]"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 min-h-[44px] bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-red-950/40 text-sm active:scale-[0.98] transition touch-manipulation"
                    >
                      {submitting ? 'Memproses...' : 'Tutup Shift Sekarang'}
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          ) : (
            /* Jika Belum Ada Sesi Aktif */
            <Card className="max-w-xl mx-auto bg-[#101625] border-slate-800 p-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto">
                <Unlock className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">Shift Kasir Sedang Tertutup</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Sebelum melayani transaksi penjualan di POS terminal, masukkan modal awal kembalian untuk membuka laci kas.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-xs space-y-1 max-w-md mx-auto text-left">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium">Sisa Cash Tersedia di Toko:</span>
                  <span className="text-base font-black text-emerald-400 font-mono">{formatIDR(availableCash)}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Otomatis diambil dari sisa Cash fisik yang belum disetor ke Super Admin.
                </p>
              </div>

              <form onSubmit={handleOpenSession} className="space-y-4 max-w-md mx-auto text-left">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Modal Kas Awal di Laci (IDR) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={openingNotes}
                    onChange={(e) => setOpeningNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-[#D4AF37]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 min-h-[44px] bg-gradient-to-r from-[#D4AF37] to-[#E5C365] hover:brightness-105 text-[#070A0F] font-bold py-2.5 rounded-xl shadow-lg shadow-amber-500/20 text-sm active:scale-[0.98] transition touch-manipulation"
                >
                  {submitting ? 'Membuka...' : 'Buka Shift Kasir Baru'}
                </Button>
              </form>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
