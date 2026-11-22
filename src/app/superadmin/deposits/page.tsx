'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatIDR, formatDateTimeJakarta } from '@/lib/formatters';
import { CashDeposit, CashDepositStatus, Store } from '@/types/domain';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Building2,
  Banknote,
  Check,
  X,
  AlertTriangle,
  Store as StoreIcon,
  Filter,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

export default function SuperAdminDepositsPage() {
  const [deposits, setDeposits] = useState<CashDeposit[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeCashMap, setStoreCashMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Modal Reject State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedDepositToReject, setSelectedDepositToReject] = useState<CashDeposit | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [depRes, storeRes] = await Promise.all([
        fetch('/api/pos/deposits').then((r) => r.json()),
        fetch('/api/stores').then((r) => r.json()),
      ]);

      if (depRes.success) {
        setDeposits(depRes.deposits || []);
      }

      const stList: Store[] = (storeRes.stores || storeRes.data || []).filter(
        (s: Store) => s.type === 'STORE'
      );
      setStores(stList);

      // Fetch available cash for each store
      const cashMap: Record<string, number> = {};
      await Promise.all(
        stList.map(async (st) => {
          try {
            const res = await fetch(`/api/pos/deposits?store_id=${st.id}`).then((r) => r.json());
            if (res.success && typeof res.available_cash === 'number') {
              cashMap[st.id] = res.available_cash;
            }
          } catch {
            // ignore
          }
        })
      );
      setStoreCashMap(cashMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (deposit: CashDeposit) => {
    if (
      !confirm(
        `Setujui setoran kas sebesar ${formatIDR(deposit.amount)} dari ${deposit.store_name}?\n\nUang akan otomatis dicatat masuk ke Kas Utama Perusahaan dan memotong cash fisik toko.`
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/pos/deposits/${deposit.id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Setoran kas cabang ${deposit.store_name} berhasil disetujui! Saldo kas pusat telah diperbarui.`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui setoran kas.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (deposit: CashDeposit) => {
    setSelectedDepositToReject(deposit);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepositToReject) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/pos/deposits/${selectedDepositToReject.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Setoran kas berhasil ditolak. Sisa cash toko tidak terpotong.`);
      setIsRejectModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menolak setoran kas.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDeposits = deposits.filter((d) => {
    if (activeFilter === 'ALL') return true;
    return d.status === activeFilter;
  });

  const pendingList = deposits.filter((d) => d.status === 'PENDING');
  const approvedList = deposits.filter((d) => d.status === 'APPROVED');
  const totalPendingRp = pendingList.reduce((sum, d) => sum + d.amount, 0);
  const totalApprovedRp = approvedList.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#D4AF37]" />
            <span>Persetujuan Setor Kas Cabang (Approval)</span>
            {pendingList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {pendingList.length} Menunggu
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verifikasi dan setujui pengajuan setoran tunai &amp; transfer dari kasir toko Kendal Kota, Pegandon, dan Kaliwungu. Saat disetujui, kas fisik toko terpotong dan otomatis masuk ke Kas Utama Perusahaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/superadmin/wallet"
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Kas Utama Perusahaan</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
        </div>
      </div>

      {/* Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Pending Approval */}
        <Card className="bg-[#0A0E1A] border-amber-500/40 shadow-lg">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Total Menunggu Persetujuan</p>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-400 mt-2">
              {formatIDR(totalPendingRp)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {pendingList.length} pengajuan setoran perlu tindakan Anda
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Approved Total */}
        <Card className="bg-[#0A0E1A] border-emerald-500/40 shadow-lg">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Total Setoran Berhasil Diterima</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">
              {formatIDR(totalApprovedRp)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {approvedList.length} setoran telah masuk ke kas utama
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Cash Tersedia di Seluruh Toko */}
        <Card className="bg-[#0A0E1A] border-blue-500/40 shadow-lg">
          <CardContent className="p-4 sm:p-5">
            <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <StoreIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Sisa Cash Fisik di Tiap Cabang</span>
            </p>
            <div className="space-y-1.5 text-xs">
              {stores.map((st) => (
                <div key={st.id} className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-300 truncate max-w-[140px]">{st.name.replace('BB Parfum Toko ', 'Toko ')}</span>
                  <span className="font-bold text-white font-mono">{formatIDR(storeCashMap[st.id] || 0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3 text-xs">
        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
            activeFilter === 'PENDING'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Menunggu Persetujuan ({pendingList.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('APPROVED')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
            activeFilter === 'APPROVED'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Disetujui ({approvedList.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('REJECTED')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
            activeFilter === 'REJECTED'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Ditolak ({deposits.filter((d) => d.status === 'REJECTED').length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition ${
            activeFilter === 'ALL'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Semua ({deposits.length})
        </button>
      </div>

      {/* Table / List Pengajuan */}
      <Card className="bg-[#0A0E1A] border-[#1E293B]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F172A] text-slate-400 border-b border-[#1E293B] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Cabang Toko &amp; Kasir</th>
                  <th className="py-3 px-4">Nominal Disetor</th>
                  <th className="py-3 px-4">Tipe Penyetoran</th>
                  <th className="py-3 px-4">Catatan Kasir</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Tindakan Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60">
                {filteredDeposits.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {formatDateTimeJakarta(d.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white text-xs">{d.store_name}</p>
                      <p className="text-[11px] text-slate-400">Kasir: {d.cashier_name}</p>
                    </td>
                    <td className="py-3 px-4 font-black text-sm text-[#D4AF37] whitespace-nowrap">
                      {formatIDR(d.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/50 text-emerald-300 border border-emerald-500/30">
                        <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                        Setor Tunai Fisik
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs">
                      {d.bank_name && (
                        <p className="text-[11px] text-blue-300 font-semibold">{d.bank_name}</p>
                      )}
                      <p className="text-[11px] text-slate-400 truncate">{d.notes || '-'}</p>
                      {d.rejection_reason && (
                        <p className="text-[11px] text-rose-400 font-semibold mt-0.5">
                          Alasan: {d.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {d.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 animate-pulse">
                          <Clock className="w-3 h-3" />
                          Menunggu
                        </span>
                      )}
                      {d.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          Disetujui
                        </span>
                      )}
                      {d.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40">
                          <XCircle className="w-3 h-3" />
                          Ditolak
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {d.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleApprove(d)}
                            className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleOpenReject(d)}
                            className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 border-rose-800/50"
                          >
                            <X className="w-3.5 h-3.5 mr-1" />
                            Tolak
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          {d.status === 'APPROVED' ? `Oleh ${d.approved_by || 'Admin'}` : 'Telah ditolak'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredDeposits.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      Tidak ada data setoran kas untuk filter ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL TOLAK PENGAJUAN */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !actionLoading && setIsRejectModalOpen(false)}
        title="Tolak Pengajuan Setor Kas"
      >
        <form onSubmit={handleSubmitReject} className="space-y-4 text-xs">
          <p className="text-slate-300">
            Anda akan menolak pengajuan setoran kas sebesar{' '}
            <span className="font-bold text-[#D4AF37]">
              {selectedDepositToReject ? formatIDR(selectedDepositToReject.amount) : ''}
            </span>{' '}
            dari <span className="font-bold text-white">{selectedDepositToReject?.store_name}</span>.
          </p>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Alasan Penolakan:</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              required
              rows={3}
              placeholder="Contoh: Bukti transfer tidak valid / uang fisik belum diterima oleh admin..."
              className="w-full p-2.5 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={actionLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={actionLoading || !rejectReason.trim()}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {actionLoading ? 'Memproses...' : 'Konfirmasi Tolak Setoran'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
