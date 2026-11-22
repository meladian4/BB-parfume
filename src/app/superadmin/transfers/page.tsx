'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StockTransfer, Store, Product } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDateTimeJakarta, formatProductUnit } from '@/lib/formatters';
import { BBLogo } from '@/components/ui/BBLogo';
import {
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  Info,
  CheckCheck,
  XCircle,
  Calendar,
  ShieldCheck,
  Crown,
  AlertTriangle,
} from 'lucide-react';

export default function SuperAdminTransfersApprovalPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('PENDING_APPROVAL');
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Modal Penolakan Mutasi
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedTransferToReject, setSelectedTransferToReject] = useState<StockTransfer | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Action Loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const now = new Date();
  const currentMonthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const currentYearMonth = now.toISOString().slice(0, 7);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [trRes, stRes, prodRes] = await Promise.all([
        fetch('/api/transfers').then((r) => r.json()),
        fetch('/api/stores').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
      ]);
      const trData = trRes?.data || trRes?.transfers || [];
      const stData = stRes?.data || stRes?.stores || [];
      const prodData = prodRes?.data || prodRes?.products || [];
      setTransfers(Array.isArray(trData) ? trData : []);
      setStores(Array.isArray(stData) ? stData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (e) {
      console.error('Failed to load transfers:', e);
    } finally {
      setLoading(false);
    }
  };

  // 1. APPROVAL OLEH SUPER ADMIN (Stok Gudang Terpotong -> IN_TRANSIT)
  const handleApprove = async (transfer: StockTransfer) => {
    if (
      !confirm(
        `OTORISASI SUPER ADMIN:\nSetujui pengiriman mutasi ${transfer.transfer_number} ke ${transfer.destination_store?.name}?\n\nStok Gudang Pusat akan dipotong dan kurir diberangkatkan.`
      )
    ) {
      return;
    }

    setActionLoadingId(transfer.id);
    try {
      const res = await fetch(`/api/transfers/${transfer.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_role: 'SUPER_ADMIN',
          approved_by: 'Super Admin Kendal (Owner)',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menyetujui mutasi.');
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyetujui mutasi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. PENOLAKAN OLEH SUPER ADMIN
  const handleOpenReject = (transfer: StockTransfer) => {
    setSelectedTransferToReject(transfer);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransferToReject) return;

    setRejectSubmitting(true);
    try {
      const res = await fetch(`/api/transfers/${selectedTransferToReject.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_role: 'SUPER_ADMIN',
          reason: rejectionReason.trim() || 'Ditolak oleh Super Admin',
          rejected_by: 'Super Admin Kendal (Owner)',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menolak mutasi.');

      setIsRejectModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menolak mutasi.');
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Konfirmasi Terima di Toko Cabang (IN_TRANSIT -> RECEIVED)
  const handleReceive = async (transferId: string, destStoreName?: string) => {
    const remark = prompt(
      `[OVERRIDE SUPER ADMIN]\nKonfirmasi penerimaan barang di toko ${destStoreName || 'cabang'}?\n\nMasukkan keterangan / remark manual (opsional):`,
      'Dikonfirmasi langsung oleh Super Admin (Override)'
    );
    if (remark === null) return;

    setActionLoadingId(transferId);
    try {
      const res = await fetch(`/api/transfers/${transferId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          received_by: 'Super Admin Kendal (Owner)',
          receiving_notes: remark.trim() || 'Dikonfirmasi langsung oleh Super Admin (Override)',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menerima mutasi.');
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menerima mutasi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Perhitungan Dokumen Bulanan:
  const isRejectedVisibleInCurrentMonth = (t: StockTransfer) => {
    if (t.status !== 'REJECTED') return true;
    if (showAllMonths) return true;
    const dateToCheck = t.rejected_at || t.created_at;
    return dateToCheck.slice(0, 7) === currentYearMonth;
  };

  const visibleTransfers = useMemo(() => {
    return transfers.filter(isRejectedVisibleInCurrentMonth);
  }, [transfers, showAllMonths, currentYearMonth]);

  const filteredTransfers = useMemo(() => {
    return visibleTransfers.filter((t) => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'PENDING_APPROVAL') {
        return t.status === 'PENDING_APPROVAL' || t.status === 'PENDING_SHIPMENT';
      }
      return t.status === activeTab;
    });
  }, [visibleTransfers, activeTab]);

  const pendingCount = visibleTransfers.filter(
    (t) => t.status === 'PENDING_APPROVAL' || t.status === 'PENDING_SHIPMENT'
  ).length;
  const inTransitCount = visibleTransfers.filter((t) => t.status === 'IN_TRANSIT').length;
  const receivedCount = visibleTransfers.filter((t) => t.status === 'RECEIVED').length;
  const rejectedCount = visibleTransfers.filter((t) => t.status === 'REJECTED').length;

  const getStatusBadge = (status: StockTransfer['status']) => {
    switch (status) {
      case 'PENDING_APPROVAL':
      case 'PENDING_SHIPMENT':
        return (
          <Badge variant="blue" size="sm">
            <Clock className="w-3 h-3 inline mr-1" />
            Menunggu Persetujuan Anda
          </Badge>
        );
      case 'IN_TRANSIT':
        return (
          <Badge variant="amber" size="sm">
            <Truck className="w-3 h-3 inline mr-1" />
            Dalam Perjalanan (In-Transit)
          </Badge>
        );
      case 'RECEIVED':
        return (
          <Badge variant="emerald" size="sm">
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Diterima di Toko (Selesai)
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="rose" size="sm">
            <XCircle className="w-3 h-3 inline mr-1" />
            Ditolak Super Admin
          </Badge>
        );
      case 'CANCELLED':
        return <Badge variant="rose" size="sm">Dibatalkan</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BBLogo variant="gold" size="md" withContainer />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Persetujuan Mutasi Stok Antar Cabang</span>
              <Badge variant="gold" size="sm">
                <Crown className="w-3 h-3 mr-1 inline" />
                Super Admin Only
              </Badge>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Otorisasi resmi pengeluaran persediaan dari Gudang Pusat ke Toko Cabang untuk menjamin transparansi & anti-fraud.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap text-xs gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('PENDING_APPROVAL')}
            className={`pb-2 px-3 font-medium transition flex items-center gap-1.5 ${
              activeTab === 'PENDING_APPROVAL'
                ? 'text-blue-400 border-b-2 border-blue-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Menunggu Approval ({pendingCount})</span>
            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-2 px-3 font-medium transition ${
              activeTab === 'ALL'
                ? 'text-[#E5C365] border-b-2 border-[#D4AF37] font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Dokumen ({visibleTransfers.length})
          </button>
          <button
            onClick={() => setActiveTab('IN_TRANSIT')}
            className={`pb-2 px-3 font-medium transition ${
              activeTab === 'IN_TRANSIT'
                ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dalam Perjalanan ({inTransitCount})
          </button>
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`pb-2 px-3 font-medium transition ${
              activeTab === 'RECEIVED'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Selesai Diterima ({receivedCount})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`pb-2 px-3 font-medium transition ${
              activeTab === 'REJECTED'
                ? 'text-rose-400 border-b-2 border-rose-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ditolak ({rejectedCount})
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Periode: <strong className="text-slate-200">{currentMonthName}</strong></span>
          <button
            type="button"
            onClick={() => setShowAllMonths(!showAllMonths)}
            className="text-[#D4AF37] hover:underline font-medium ml-1"
          >
            {showAllMonths ? 'Bulan Berjalan Saja' : 'Lihat Arsip Bulan Lalu'}
          </button>
        </div>
      </div>

      {/* Transfers Table with Super Admin Approval Buttons */}
      <Card bordered className="bg-[#0F172A]/90 overflow-hidden shadow-xl">
        <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-white">Daftar Pengajuan Mutasi Cabang</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Setujui untuk memberangkatkan barang dan memotong saldo stok gudang secara otomatis.
            </CardDescription>
          </div>
          {pendingCount > 0 && (
            <Badge variant="blue" size="sm">
              <Clock className="w-3 h-3 mr-1 inline" />
              {pendingCount} Menunggu Keputusan Anda
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat data pengajuan mutasi...</div>
          ) : filteredTransfers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto" />
              <p>Tidak ada pengajuan mutasi pada filter ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Surat Jalan</th>
                    <th className="py-3 px-4">Asal &rarr; Tujuan</th>
                    <th className="py-3 px-4">Item Parfum Dikirim</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Otorisasi Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredTransfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#E5C365]">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{tr.transfer_number}</span>
                        </div>
                        <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                          {formatDateTimeJakarta(tr.created_at)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{tr.source_store?.name}</span>
                          <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                          <span className="font-semibold text-white">{tr.destination_store?.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#D4AF37]">
                          {tr.source_store?.code} &rarr; {tr.destination_store?.code}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {tr.items?.map((it) => (
                            <div key={it.id} className="text-[11px] text-slate-300 flex items-center justify-between gap-3">
                              <span>{it.product?.name}</span>
                              <span className="font-bold font-mono text-white">
                                {it.quantity} {formatProductUnit(it.product)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(tr.status)}
                        {tr.status === 'IN_TRANSIT' && (
                          <div className="text-[10px] text-amber-400/80 mt-1">
                            Disetujui: {formatDateTimeJakarta(tr.approved_at || tr.shipped_at)}
                          </div>
                        )}
                        {tr.status === 'RECEIVED' && (
                          <div className="space-y-1 mt-1 text-left">
                            <div className="text-[10px] text-emerald-400/90 font-medium">
                              Diterima: {formatDateTimeJakarta(tr.received_at)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Penerima: <span className="text-slate-200 font-semibold">{tr.received_by || 'Kasir Cabang'}</span>
                            </div>
                            {tr.receiving_notes && (
                              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-200">
                                <span className="font-semibold text-emerald-400 block text-[9px] uppercase tracking-wider">Remark Kasir:</span>
                                <span className="italic">"{tr.receiving_notes}"</span>
                              </div>
                            )}
                          </div>
                        )}
                        {tr.status === 'REJECTED' && (
                          <div className="text-[10px] text-rose-400/90 mt-1">
                            Ditolak: {formatDateTimeJakarta(tr.rejected_at)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {(tr.status === 'PENDING_APPROVAL' || tr.status === 'PENDING_SHIPMENT') && (
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                              isLoading={actionLoadingId === tr.id}
                              onClick={() => handleApprove(tr)}
                            >
                              <CheckCheck className="w-3.5 h-3.5 mr-1" />
                              <span>Setujui & Kirim</span>
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50"
                              isLoading={actionLoadingId === tr.id}
                              onClick={() => handleOpenReject(tr)}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              <span>Tolak</span>
                            </Button>
                          </div>
                        )}

                        {tr.status === 'IN_TRANSIT' && (
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Menunggu Kasir Cabang Terima</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Toko: <strong className="text-slate-300">{tr.destination_store?.name}</strong>
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-[10px] h-6 px-2 py-0 bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500 mt-1"
                              isLoading={actionLoadingId === tr.id}
                              onClick={() => handleReceive(tr.id, tr.destination_store?.name)}
                              title="Gunakan hanya jika kasir cabang berhalangan"
                            >
                              <span>Override Terima (Darurat)</span>
                            </Button>
                          </div>
                        )}

                        {tr.status === 'RECEIVED' && (
                          <div className="space-y-1 text-right">
                            <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Selesai Masuk Stok</span>
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Terverifikasi di {tr.destination_store?.name}
                            </div>
                          </div>
                        )}

                        {tr.status === 'REJECTED' && (
                          <div className="text-right space-y-0.5">
                            <span className="text-[11px] text-rose-400 font-semibold flex items-center justify-end gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Ditolak Super Admin</span>
                            </span>
                            {tr.rejection_reason && (
                              <div
                                className="text-[10px] text-slate-400 max-w-[220px] ml-auto truncate"
                                title={tr.rejection_reason}
                              >
                                Ket: {tr.rejection_reason}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Tolak Mutasi */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Tolak Pengajuan Mutasi Cabang"
        description="Dokumen mutasi yang ditolak akan tetap tampil pada rekap bulanan dan tercatat di Log Audit."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Nomor Dokumen:</span>
              <span className="font-mono font-bold text-white">{selectedTransferToReject?.transfer_number}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tujuan Toko:</span>
              <span className="font-semibold text-white">{selectedTransferToReject?.destination_store?.name}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Alasan Penolakan (Wajib Diisi):
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Stok di gudang pusat sedang dialokasikan untuk pesanan lain / batas kuota cabang penuh."
              className="w-full bg-[#162036] border border-[#1E293B] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-rose-500 placeholder-slate-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300">
            ℹ️ Dokumen ini akan berstatus <strong>Ditolak</strong>, stok gudang tidak dipotong, dan tersimpan dalam Log Audit resmi.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={rejectSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={rejectSubmitting}
              className="bg-rose-700 hover:bg-rose-600 text-white font-semibold"
            >
              Konfirmasi Tolak Mutasi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
