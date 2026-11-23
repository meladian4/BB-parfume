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
  AlertTriangle,
  Lock,
  Unlock,
  Receipt,
  Calendar,
  FileText,
  Download,
  History,
} from 'lucide-react';

function getWibDateKey(dateInput?: string | Date | null): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  }
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date);
}

export default function CashierSessionPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [session, setSession] = useState<CashSession | null>(null);
  const [recentClosedSessions, setRecentClosedSessions] = useState<CashSession[]>([]);
  const [justClosedSession, setJustClosedSession] = useState<CashSession | null>(null);
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
  const [posLockStatus, setPosLockStatus] = useState<any>(null);

  const buildDailyPdfUrl = (
    targetStoreId: string,
    targetSession?: CashSession | null,
    forceDownload = false
  ) => {
    const dateKey = getWibDateKey(targetSession?.closed_at || targetSession?.opened_at);
    const params = new URLSearchParams({
      startDate: dateKey,
      endDate: dateKey,
    });
    if (targetSession?.id) {
      params.set('sessionId', targetSession.id);
    }
    if (forceDownload) {
      params.set('download', '1');
    }
    return `/api/reports/stores/${targetStoreId}/pdf?${params.toString()}`;
  };

  const triggerPdfDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, sessRes] = await Promise.all([
        fetch('/api/users/me').then((r) => r.json()),
        fetch('/api/pos/session').then((r) => r.json()),
      ]);

      setUser(uRes.user);
      const resolvedStoreId = sessRes.store_id || uRes.user?.assigned_store_id || null;
      setStoreId(resolvedStoreId);

      if (sessRes.lock_status) {
        setPosLockStatus(sessRes.lock_status);
      }
      if (Array.isArray(sessRes.recent_closed_sessions)) {
        setRecentClosedSessions(sessRes.recent_closed_sessions);
      }
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

  const hasPendingDeposit = Boolean(
    posLockStatus?.pending_deposit ||
    posLockStatus?.lock_type === 'PENDING_DEPOSIT' ||
    posLockStatus?.lock_type === 'BOTH'
  );

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPendingDeposit) {
      const depositAmount = posLockStatus?.pending_deposit?.amount
        ? ` sebesar Rp ${posLockStatus.pending_deposit.amount.toLocaleString('id-ID')}`
        : '';
      setErrorMsg(
        `BUKA SHIFT DITOLAK: Masih terdapat pengajuan setor kas${depositAmount} yang sedang menunggu persetujuan (approval) Super Admin. Kasir belum dapat membuka shift baru.`
      );
      return;
    }
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
      setJustClosedSession(null);
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

      const closedSession: CashSession | null = data.session || null;
      const targetStoreId = closedSession?.store_id || session.store_id || storeId;
      setJustClosedSession(closedSession);
      setClosingNotes('');

      if (targetStoreId && closedSession) {
        const autoDownloadUrl = buildDailyPdfUrl(targetStoreId, closedSession, true);
        triggerPdfDownload(autoDownloadUrl);
      }

      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menutup shift kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  const diff = session ? (Number(actualCashInput) || 0) - session.expected_cash : 0;
  const activeStoreId = storeId || session?.store_id || user?.assigned_store_id || null;

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans">
      <Topbar user={user || undefined} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar role="CASHIER" />

        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                Manajemen Shift Kasir &amp; Laci Uang Tunai
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Rekonsiliasi modal awal, penjualan tunai, perhitungan selisih fisik laci kas, dan output laporan harian PDF.
              </p>
            </div>

            {activeStoreId && (
              <a
                href={buildDailyPdfUrl(activeStoreId, null, false)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#E5C365] text-xs font-bold transition shrink-0"
              >
                <FileText className="w-4 h-4" />
                <span>Output PDF Harian (Hari Ini)</span>
              </a>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {justClosedSession && activeStoreId && (
            <Card className="bg-gradient-to-br from-emerald-950/50 via-[#101625] to-[#17130a] border border-emerald-500/40 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Shift Berhasil Ditutup &amp; Direkonsiliasi
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                      Laporan Harian Transaksi PDF Siap Dicetak / Dibagikan
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sesi <span className="font-mono text-slate-300">{justClosedSession.id}</span> ditutup pada{' '}
                      {formatDateTimeJakarta(justClosedSession.closed_at)}. File PDF otomatis mulai diunduh.
                    </p>
                  </div>
                </div>
                <Badge variant="emerald" size="sm">
                  CLOSED
                </Badge>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Modal Kas Awal</span>
                  <p className="text-sm sm:text-base font-bold text-white font-mono mt-0.5">
                    {formatIDR(justClosedSession.opening_cash)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Kas Sistem (Expected)</span>
                  <p className="text-sm sm:text-base font-bold text-[#E5C365] font-mono mt-0.5">
                    {formatIDR(justClosedSession.expected_cash)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Uang Fisik Laci</span>
                  <p className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {formatIDR(justClosedSession.actual_cash ?? justClosedSession.closing_cash ?? 0)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[11px] text-slate-400">Selisih Kas</span>
                  <p
                    className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${
                      (justClosedSession.difference ?? 0) === 0
                        ? 'text-emerald-400'
                        : (justClosedSession.difference ?? 0) > 0
                        ? 'text-blue-400'
                        : 'text-red-400'
                    }`}
                  >
                    {(justClosedSession.difference ?? 0) === 0
                      ? 'Rp 0 (Cocok)'
                      : formatIDR(justClosedSession.difference ?? 0)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <a
                  href={buildDailyPdfUrl(activeStoreId, justClosedSession, false)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C365] hover:brightness-105 text-[#070A0F] font-bold text-xs sm:text-sm shadow-lg shadow-[#D4AF37]/20 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Lihat Output Report PDF Harian</span>
                </a>
                <a
                  href={buildDailyPdfUrl(activeStoreId, justClosedSession, true)}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-xs sm:text-sm transition"
                >
                  <Download className="w-4 h-4 text-[#D4AF37]" />
                  <span>Unduh File PDF (.pdf)</span>
                </a>
              </div>
            </Card>
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

              {hasPendingDeposit && (
                <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs text-left space-y-2 max-w-md mx-auto">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Buka Shift Dikunci Sementara</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Masih terdapat pengajuan setor kas ke Super Admin yang sedang menunggu persetujuan (status: PENDING).
                    {posLockStatus?.pending_deposit?.amount && (
                      <span> Nominal: <strong className="text-white">Rp {posLockStatus.pending_deposit.amount.toLocaleString('id-ID')}</strong>.</span>
                    )}
                  </p>
                  <p className="text-[10px] text-amber-400 font-medium">
                    Harap menunggu persetujuan Super Admin sebelum membuka shift kasir baru.
                  </p>
                </div>
              )}

              <form onSubmit={handleOpenSession} className="space-y-4 max-w-md mx-auto text-left">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Modal Kas Awal di Laci (IDR) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    disabled={hasPendingDeposit}
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    disabled={hasPendingDeposit}
                    value={openingNotes}
                    onChange={(e) => setOpeningNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting || hasPendingDeposit}
                  className={`w-full h-12 min-h-[44px] font-bold py-2.5 rounded-xl text-sm transition touch-manipulation ${
                    hasPendingDeposit
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#D4AF37] to-[#E5C365] hover:brightness-105 text-[#070A0F] shadow-lg shadow-amber-500/20 active:scale-[0.98]'
                  }`}
                >
                  {hasPendingDeposit ? '🔒 Buka Shift Dikunci (Setor Kas Pending)' : submitting ? 'Membuka...' : 'Buka Shift Kasir Baru'}
                </Button>
              </form>
            </Card>
          )}

          {/* Riwayat Tutup Shift & Output PDF Harian */}
          {activeStoreId && recentClosedSessions.length > 0 && (
            <Card className="bg-[#101625] border-slate-800 p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-[#D4AF37]" />
                    Riwayat Tutup Shift &amp; Output Laporan PDF Harian
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cetak ulang atau unduh laporan transaksi harian PDF dari shift yang sudah ditutup.
                  </p>
                </div>
                <Badge variant="slate" size="sm">
                  {recentClosedSessions.length} Shift Terakhir
                </Badge>
              </div>

              <div className="space-y-3">
                {recentClosedSessions.map((closed) => {
                  const closedActual = closed.actual_cash ?? closed.closing_cash ?? 0;
                  const closedDiff = closed.difference ?? closed.cash_difference ?? 0;
                  const viewUrl = buildDailyPdfUrl(activeStoreId, closed, false);
                  const downloadUrl = buildDailyPdfUrl(activeStoreId, closed, true);

                  return (
                    <div
                      key={closed.id}
                      className="p-4 rounded-xl bg-slate-900/75 border border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#E5C365] break-all">
                            {closed.id}
                          </span>
                          <Badge variant="emerald" size="sm">
                            CLOSED
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            Ditutup: {formatDateTimeJakarta(closed.closed_at || closed.opened_at)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                          <span>
                            Kas Sistem: <strong className="font-mono text-white">{formatIDR(closed.expected_cash)}</strong>
                          </span>
                          <span>
                            Fisik Laci: <strong className="font-mono text-emerald-400">{formatIDR(closedActual)}</strong>
                          </span>
                          <span>
                            Selisih:{' '}
                            <strong
                              className={`font-mono ${
                                closedDiff === 0
                                  ? 'text-emerald-400'
                                  : closedDiff > 0
                                  ? 'text-blue-400'
                                  : 'text-red-400'
                              }`}
                            >
                              {closedDiff === 0 ? 'Rp 0 (Cocok)' : formatIDR(closedDiff)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                        <a
                          href={viewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C365] hover:brightness-105 text-[#070A0F] font-bold text-xs transition"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Output PDF Harian</span>
                        </a>
                        <a
                          href={downloadUrl}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition"
                        >
                          <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Unduh</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
