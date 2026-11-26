'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatIDR, formatDateTimeJakarta } from '@/lib/formatters';
import { BBLogo } from '@/components/ui/BBLogo';
import { CashDeposit, CashDepositMethod } from '@/types/domain';
import {
  Wallet,
  Plus,
  Building2,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Banknote,
  Send,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function CashierDepositsPage() {
  const [user, setUser] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [deposits, setDeposits] = useState<CashDeposit[]>([]);
  const [availableCash, setAvailableCash] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [userRes, depRes] = await Promise.all([
        fetch('/api/users/me').then((r) => r.json()),
        fetch('/api/pos/deposits').then((r) => r.json()),
      ]);

      if (userRes.user) {
        setUser(userRes.user);
        setStore(userRes.user.store || null);
      }

      if (depRes.success) {
        setDeposits(depRes.deposits || []);
        setAvailableCash(depRes.available_cash || 0);
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

  const handleOpenModal = () => {
    setAmountInput('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amountInput);
    if (!val || val <= 0) {
      setFormError('Nominal setoran harus lebih besar dari Rp 0.');
      return;
    }
    if (val > availableCash) {
      setFormError(
        `Nominal setoran (${formatIDR(val)}) melebihi Cash fisik yang tersedia di toko saat ini (${formatIDR(availableCash)}).`
      );
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      const res = await fetch('/api/pos/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: val,
          deposit_method: 'CASH_HANDOVER',
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Pengajuan setor tunai berhasil dikirim! Menunggu persetujuan (approval) dari Super Admin.');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengajukan setoran kas.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingDeposits = deposits.filter((d) => d.status === 'PENDING');
  const approvedDeposits = deposits.filter((d) => d.status === 'APPROVED');
  const totalPendingAmount = pendingDeposits.reduce((sum, d) => sum + d.amount, 0);
  const totalApprovedAmount = approvedDeposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-20 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
              <div className="hidden sm:block">
                <BBLogo variant="gold" size="md" withContainer />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-white tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span>Setor Kas Cabang ke Super Admin</span>
                  <Badge variant="blue" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                    {store?.name || 'Cabang Kendal'}
                  </Badge>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Setorkan sisa uang Cash di laci kasir ke Kantor Pusat / Rekening Super Admin.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/cashier"
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Kasir POS</span>
              </Link>
              <Button
                variant="gold"
                size="sm"
                onClick={handleOpenModal}
                className="shadow-lg shadow-[#D4AF37]/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Ajukan Setor Kas</span>
              </Button>
            </div>
          </div>

          {/* Warning Banner: POS Locked while deposit is pending */}
          {pendingDeposits.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs flex items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
              <div className="flex items-start sm:items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <strong className="text-amber-300 font-bold">POS Kasir Sedang Dikunci Sementara:</strong>{' '}
                  <span>
                    Terdapat {pendingDeposits.length} pengajuan setor kas (Total: {formatIDR(totalPendingAmount)}) yang sedang menunggu persetujuan Super Admin. Kasir belum dapat melayani transaksi penjualan baru demi keakuratan pembukuan uang fisik kasir.
                  </span>
                </div>
              </div>
              <Link
                href="/cashier"
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold shrink-0 transition"
              >
                Cek POS
              </Link>
            </div>
          )}

          {/* Cards Ringkasan Kas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Available Cash in Store */}
            <Card className="bg-[#0A0E1A] border-emerald-500/30 shadow-lg">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400">Cash Fisik Tersedia di Toko</p>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-400 mt-2">
                  {formatIDR(availableCash)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                  Sisa cash yang siap disetor / modal shift
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Menunggu Approval */}
            <Card className="bg-[#0A0E1A] border-amber-500/30 shadow-lg">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400">Menunggu Approval Pusat</p>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-400 mt-2">
                  {formatIDR(totalPendingAmount)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {pendingDeposits.length} pengajuan belum disetujui
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Total Approved */}
            <Card className="bg-[#0A0E1A] border-blue-500/30 shadow-lg">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-400">Total Setoran Disetujui</p>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-blue-400 mt-2">
                  {formatIDR(totalApprovedAmount)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {approvedDeposits.length} setoran berhasil masuk kas pusat
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabel Riwayat Pengajuan Setoran */}
          <Card className="bg-[#0A0E1A] border-[#1E293B]">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-5 border-b border-[#1E293B]">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#D4AF37]" />
                  Riwayat Pengajuan Setor Kas Cabang
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar transaksi setoran tunai & transfer bank yang diajukan ke Super Admin
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadData}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Segarkan
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F172A] text-slate-400 border-b border-[#1E293B] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Waktu Pengajuan</th>
                      <th className="py-3 px-4">ID Setoran</th>
                      <th className="py-3 px-4">Nominal Disetor</th>
                      <th className="py-3 px-4">Tipe Penyetoran</th>
                      <th className="py-3 px-4">Catatan Kasir</th>
                      <th className="py-3 px-4 text-center">Status Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]/60">
                    {deposits.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-slate-300">
                          {formatDateTimeJakarta(d.created_at)}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {d.id}
                        </td>
                        <td className="py-3 px-4 font-bold text-base text-white">
                          {formatIDR(d.amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-500/30">
                            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                            Setor Tunai Fisik
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <p className="text-[11px] text-slate-300">{d.notes || '-'}</p>
                          {d.rejection_reason && (
                            <p className="text-[11px] text-rose-400 font-semibold mt-0.5">
                              Alasan Tolak: {d.rejection_reason}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {d.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 animate-pulse">
                              <Clock className="w-3 h-3" />
                              Menunggu Approval
                            </span>
                          )}
                          {d.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3" />
                              Disetujui ({d.approved_by || 'Super Admin'})
                            </span>
                          )}
                          {d.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40">
                              <XCircle className="w-3 h-3" />
                              Ditolak
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {deposits.length === 0 && !loading && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-500">
                          Belum ada riwayat pengajuan setor kas dari cabang ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* MODAL PENGAJUAN SETOR CASH */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title="Ajukan Setor Kas Toko ke Super Admin"
      >
        <form onSubmit={handleSubmitDeposit} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Saldo Cash Tersedia Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/40 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Total Cash Fisik Tersedia di Toko:</p>
              <p className="text-xl font-black text-emerald-400">{formatIDR(availableCash)}</p>
            </div>
            <button
              type="button"
              onClick={() => setAmountInput(availableCash.toString())}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-[11px] hover:bg-emerald-500/30 transition"
            >
              Setor Semua Sisa Cash
            </button>
          </div>

          {/* Input Nominal Setoran */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Nominal Cash yang Disetor (IDR):</label>
            <Input
              type="number"
              placeholder="Contoh: 1000000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              required
              className="text-base font-bold text-white bg-[#0F172A] border-[#1E293B]"
            />
            {/* Quick Amount Buttons */}
            <div className="flex gap-1.5 flex-wrap pt-1">
              {[200000, 500000, 1000000, 2000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountInput(val.toString())}
                  disabled={val > availableCash}
                  className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-[11px] font-mono"
                >
                  {formatIDR(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Info Metode Penyetoran */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Penyetoran: Serah Terima Uang Fisik Tunai (Cash)</p>
              <p className="text-[11px] text-slate-400">Uang tunai diserahkan langsung ke Super Admin</p>
            </div>
          </div>

          {/* Catatan / Keterangan */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Catatan / Keterangan Penyetoran:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Setoran omzet penjualan hari Jumat shift pagi cabang Kendal Kota"
              rows={2}
              className="w-full p-2.5 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="gold"
              disabled={submitting || !Number(amountInput) || Number(amountInput) > availableCash}
              className="flex items-center gap-1.5 font-bold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Mengirim...' : 'Kirim Pengajuan Setoran'}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
