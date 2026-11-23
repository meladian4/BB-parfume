'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StockTransfer, Store, Product, UserRole } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatDateTimeJakarta, formatProductUnit } from '@/lib/formatters';
import { BBLogo } from '@/components/ui/BBLogo';
import {
  Truck,
  Plus,
  CheckCircle,
  Clock,
  ArrowRight,
  Warehouse,
  Store as StoreIcon,
  AlertCircle,
  FileText,
  Info,
  CheckCheck,
  XCircle,
  Calendar,
  ShieldCheck,
  Crown,
  RotateCcw,
} from 'lucide-react';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [userRole, setUserRole] = useState<UserRole>('SUPER_ADMIN');
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Modal Buat Mutasi Baru
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceStoreId, setSourceStoreId] = useState('');
  const [destinationStoreId, setDestinationStoreId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferItems, setTransferItems] = useState<Array<{ product_id: string; quantity: number | '' }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Action Loading
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const now = new Date();
  const currentMonthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const currentYearMonth = now.toISOString().slice(0, 7); // e.g. "2026-10"

  useEffect(() => {
    loadData();
    checkCurrentUser();
  }, []);

  const checkCurrentUser = () => {
    try {
      const stored = localStorage.getItem('bb_current_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.role) setUserRole(u.role);
      }
    } catch (e) {
      console.error(e);
    }
  };

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

      const warehouse = Array.isArray(stData)
        ? stData.find((s: Store) => s.type === 'WAREHOUSE') || stData[0]
        : null;
      const branches = Array.isArray(stData)
        ? stData.filter((s: Store) => s.type === 'STORE')
        : [];
      if (warehouse && branches.length > 0) {
        setSourceStoreId(warehouse.id);
        setDestinationStoreId(branches[0].id);
      }
    } catch (e) {
      console.error('Failed to load transfers:', e);
    } finally {
      setLoading(false);
    }
  };

  const openNewTransfer = () => {
    if (products.length > 0) {
      setTransferItems([{ product_id: products[0].id, quantity: 10 }]);
    }
    setTransferNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    if (products.length > 0) {
      setTransferItems([...transferItems, { product_id: products[0].id, quantity: 5 }]);
    }
  };

  const updateItemRow = (index: number, field: string, val: string | number) => {
    const next = [...transferItems];
    if (field === 'product_id') {
      next[index].product_id = String(val);
    } else if (field === 'quantity') {
      const strVal = String(val);
      if (strVal === '') {
        next[index].quantity = '';
      } else {
        const parsed = parseInt(strVal, 10);
        next[index].quantity = Number.isNaN(parsed) ? '' : Math.max(0, parsed);
      }
    }
    setTransferItems(next);
  };

  const removeItemRow = (index: number) => {
    if (transferItems.length > 1) {
      setTransferItems(transferItems.filter((_, i) => i !== index));
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalidItem = transferItems.find((it) => it.quantity === '' || Number(it.quantity) < 1);
    if (invalidItem) {
      setError('Jumlah setiap item mutasi wajib diisi minimal 1.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_store_id: sourceStoreId,
          destination_store_id: destinationStoreId,
          notes: transferNotes.trim() || undefined,
          user_id: userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Logistik Kendal',
          items: transferItems.map((it) => ({
            product_id: it.product_id,
            quantity: Number(it.quantity),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal membuat mutasi.');
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal membuat mutasi.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1. KONFIRMASI TERIMA DI TOKO CABANG (IN_TRANSIT -> RECEIVED)
  const handleReceive = async (transferId: string, destStoreName?: string) => {
    if (
      !confirm(
        `Konfirmasi penerimaan barang di toko ${destStoreName || 'cabang'}?\nStok toko akan resmi bertambah dan siap diracik/dijual di POS.`
      )
    ) {
      return;
    }
    setActionLoadingId(transferId);
    try {
      const res = await fetch(`/api/transfers/${transferId}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ received_by: 'Kasir / Petugas Toko Cabang' }),
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
  // Dokumen yang ditolak tetap terlihat selama bulan berjalan (currentYearMonth),
  // dan di bulan berikutnya otomatis masuk ke arsip log audit.
  const isRejectedVisibleInCurrentMonth = (t: StockTransfer) => {
    if (t.status !== 'REJECTED') return true;
    if (showAllMonths) return true;
    const dateToCheck = t.rejected_at || t.created_at;
    return dateToCheck.slice(0, 7) === currentYearMonth;
  };

  // Filter Dokumen Aktif
  const visibleTransfers = useMemo(() => {
    return transfers.filter(isRejectedVisibleInCurrentMonth);
  }, [transfers, showAllMonths, currentYearMonth]);

  // Tab Filtering
  const filteredTransfers = useMemo(() => {
    return visibleTransfers.filter((t) => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'PENDING_APPROVAL') {
        return t.status === 'PENDING_APPROVAL' || t.status === 'PENDING_SHIPMENT';
      }
      if (activeTab === 'RETURN') {
        return t.status === 'RETURN_REQUESTED' || t.status === 'RETURNED';
      }
      return t.status === activeTab;
    });
  }, [visibleTransfers, activeTab]);

  // Tab Counts
  const pendingCount = visibleTransfers.filter(
    (t) => t.status === 'PENDING_APPROVAL' || t.status === 'PENDING_SHIPMENT'
  ).length;
  const inTransitCount = visibleTransfers.filter((t) => t.status === 'IN_TRANSIT').length;
  const receivedCount = visibleTransfers.filter((t) => t.status === 'RECEIVED').length;
  const returnCount = visibleTransfers.filter(
    (t) => t.status === 'RETURN_REQUESTED' || t.status === 'RETURNED'
  ).length;
  const rejectedCount = visibleTransfers.filter((t) => t.status === 'REJECTED').length;

  const getStatusBadge = (status: StockTransfer['status']) => {
    switch (status) {
      case 'PENDING_APPROVAL':
      case 'PENDING_SHIPMENT':
        return (
          <Badge variant="blue" size="sm">
            <Clock className="w-3 h-3 inline mr-1" />
            Menunggu Approval Super Admin
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
      case 'RETURN_REQUESTED':
        return (
          <Badge variant="rose" size="sm">
            <RotateCcw className="w-3 h-3 inline mr-1" />
            Ditolak Kasir (Menunggu Approval Retur)
          </Badge>
        );
      case 'RETURNED':
        return (
          <Badge variant="rose" size="sm">
            <RotateCcw className="w-3 h-3 inline mr-1" />
            Dikembalikan ke Gudang
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
              <span>Mutasi Stok & Surat Jalan Antar Cabang</span>
              <Badge variant="gold" size="sm">Approval Terpusat</Badge>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Alur distribusi stok bahan & bibit dari Gudang Pusat ke Cabang Kendal dengan persetujuan Super Admin.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={openNewTransfer} className="shadow-sm shadow-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>+ Buat Surat Jalan Baru</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigasi Mutasi (Sub menu Siap Kirim sudah dihapus) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap text-xs gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-2 px-3 font-medium transition ${
              activeTab === 'ALL'
                ? 'text-[#E5C365] border-b-2 border-[#D4AF37] font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Mutasi ({visibleTransfers.length})
          </button>
          <button
            onClick={() => setActiveTab('PENDING_APPROVAL')}
            className={`pb-2 px-3 font-medium transition flex items-center gap-1.5 ${
              activeTab === 'PENDING_APPROVAL'
                ? 'text-blue-400 border-b-2 border-blue-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Menunggu Approval ({pendingCount})</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            )}
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
            onClick={() => setActiveTab('RETURN')}
            className={`pb-2 px-3 font-medium transition flex items-center gap-1.5 ${
              activeTab === 'RETURN'
                ? 'text-rose-400 border-b-2 border-rose-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Retur / Kembali ({returnCount})</span>
            {returnCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-400" />}
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`pb-2 px-3 font-medium transition ${
              activeTab === 'REJECTED'
                ? 'text-rose-400 border-b-2 border-rose-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ditolak Super Admin ({rejectedCount})
          </button>
        </div>

        {/* Info Retensi Bulanan Dokumen Ditolak */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0">
          <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Periode: <strong className="text-slate-200">{currentMonthName}</strong></span>
          <button
            type="button"
            onClick={() => setShowAllMonths(!showAllMonths)}
            className="text-[#D4AF37] hover:underline font-medium ml-1"
          >
            {showAllMonths ? 'Tampilkan Bulan Ini Saja' : 'Lihat Arsip Bulan Lalu'}
          </button>
        </div>
      </div>

      {/* Transfers Table */}
      <Card bordered className="bg-[#0F172A]/90 overflow-hidden shadow-xl">
        <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-white">Daftar Dokumen Mutasi Cabang</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Dokumen yang ditolak tetap tercatat bulanan dan otomatis tersimpan di Audit Log pada pergantian bulan.
            </CardDescription>
          </div>
          {pendingCount > 0 && (
            <Badge variant="blue" size="sm">
              <Clock className="w-3 h-3 mr-1 inline" />
              {pendingCount} Menunggu Tindakan
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat mutasi stok...</div>
          ) : filteredTransfers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Truck className="w-8 h-8 text-slate-600 mx-auto" />
              <p>Tidak ada mutasi pada filter ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nomor Surat Jalan</th>
                    <th className="py-3 px-4">Asal &rarr; Tujuan</th>
                    <th className="py-3 px-4">Item Parfum Dikirim</th>
                    <th className="py-3 px-4">Status Logistik</th>
                    <th className="py-3 px-4 text-right">Aksi Alur Mutasi</th>
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
                        {tr.status === 'RETURN_REQUESTED' && (
                          <div className="space-y-1 mt-1 text-left">
                            <div className="text-[10px] text-rose-300 font-medium">
                              Ditolak Kasir: {tr.return_requested_by || 'Kasir'} ({formatDateTimeJakarta(tr.return_requested_at)})
                            </div>
                            {tr.return_reason && (
                              <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-200">
                                <span className="font-semibold text-rose-400 block text-[9px] uppercase tracking-wider">Alasan Penolakan Kasir:</span>
                                <span className="italic">"{tr.return_reason}"</span>
                              </div>
                            )}
                          </div>
                        )}
                        {tr.status === 'RETURNED' && (
                          <div className="space-y-1 mt-1 text-left">
                            <div className="text-[10px] text-emerald-300 font-medium">
                              Stok Kembali ke Gudang: {formatDateTimeJakarta(tr.return_approved_at)}
                            </div>
                            {tr.return_reason && (
                              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200">
                                <span className="font-semibold text-rose-400 block text-[9px] uppercase tracking-wider">Alasan Kasir:</span>
                                <span className="italic">"{tr.return_reason}"</span>
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
                        {/* Status PENDING_APPROVAL / PENDING_SHIPMENT: Menunggu Persetujuan Super Admin (Hanya Super Admin yang berwenang) */}
                        {(tr.status === 'PENDING_APPROVAL' || tr.status === 'PENDING_SHIPMENT') && (
                          <div className="text-right space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Menunggu Approval Super Admin</span>
                            </span>
                            <div className="text-[10px] text-slate-400 italic">
                              Hanya Super Admin yang berwenang (Anti-Fraud)
                            </div>
                            {userRole === 'SUPER_ADMIN' && (
                              <a
                                href="/superadmin/transfers"
                                className="inline-flex items-center gap-1 text-[11px] text-[#D4AF37] hover:underline font-bold"
                              >
                                <Crown className="w-3 h-3" />
                                <span>Buka Approval Super Admin &rarr;</span>
                              </a>
                            )}
                          </div>
                        )}

                        {/* Status IN_TRANSIT: Barang Dalam Perjalanan Kurir, Menunggu Diterima Toko */}
                        {tr.status === 'IN_TRANSIT' && (
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              <Truck className="w-3.5 h-3.5 text-amber-400" />
                              <span>Dalam Perjalanan</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Menunggu kasir <strong className="text-slate-300">{tr.destination_store?.name}</strong> klik 'Barang Diterima'
                            </span>
                          </div>
                        )}

                        {/* Status RECEIVED: Selesai */}
                        {tr.status === 'RECEIVED' && (
                          <div className="space-y-1 text-right">
                            <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Selesai Masuk Stok</span>
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Telah diverifikasi kasir toko
                            </div>
                          </div>
                        )}

                        {/* Status RETURN_REQUESTED: Menunggu Approval Retur Super Admin */}
                        {tr.status === 'RETURN_REQUESTED' && (
                          <div className="text-right space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                              <Clock className="w-3.5 h-3.5 text-rose-400" />
                              <span>Menunggu Approval Retur Super Admin</span>
                            </span>
                            <div className="text-[10px] text-slate-400">
                              Stok akan kembali ke gudang setelah disetujui Super Admin
                            </div>
                          </div>
                        )}

                        {/* Status RETURNED: Stok Kembali ke Gudang */}
                        {tr.status === 'RETURNED' && (
                          <div className="text-right space-y-1">
                            <span className="text-[11px] text-rose-300 font-semibold inline-flex items-center gap-1">
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Barang Kembali ke Gudang</span>
                            </span>
                            <div className="text-[10px] text-emerald-400">
                              Stok gudang otomatis dikembalikan
                            </div>
                          </div>
                        )}

                        {/* Status REJECTED: Ditolak dan Tercatat */}
                        {tr.status === 'REJECTED' && (
                          <div className="text-right space-y-0.5">
                            <span className="text-[11px] text-rose-400 font-semibold flex items-center justify-end gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Tercatat Ditolak</span>
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

      {/* Modal Buat Mutasi Baru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Surat Jalan Mutasi Cabang Baru"
        description="Pengajuan mutasi stok dari Gudang Pusat ke Cabang Toko Kendal (memerlukan approval Super Admin)."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Lokasi Asal (Pengirim)</label>
              <select
                value={sourceStoreId}
                onChange={(e) => setSourceStoreId(e.target.value)}
                className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                required
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Lokasi Tujuan (Penerima)</label>
              <select
                value={destinationStoreId}
                onChange={(e) => setDestinationStoreId(e.target.value)}
                className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                required
              >
                {stores
                  .filter((s) => s.id !== sourceStoreId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Daftar Barang Dikirim */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">Item Bahan / Bibit yang Dimutasi</label>
              <Button type="button" variant="ghost" size="sm" onClick={addItemRow} className="text-[#D4AF37]">
                + Tambah Baris
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {transferItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#162036]/60 p-2 rounded-lg border border-slate-800">
                  <div className="flex-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItemRow(idx, 'product_id', e.target.value)}
                      className="w-full bg-[#0F172A] border border-[#1E293B] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) [{p.unit_name || 'ml'}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      required
                    />
                  </div>

                  {transferItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItemRow(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      &times;
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Input
              label="Catatan Pengiriman / Keperluan Toko (Opsional)"
              placeholder="Contoh: Tambahan stok bibit mawar & botol spray untuk toko Kendal Kota"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>SOP Persetujuan Super Admin</span>
            </div>
            <p>
              Surat jalan ini akan masuk ke status <strong>Menunggu Approval</strong>. Barang baru dapat dikirim setelah disetujui resmi oleh Super Admin.
            </p>
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting} className="bg-[#D4AF37] text-[#070A0F] font-bold">
              Ajukan Surat Jalan Mutasi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
