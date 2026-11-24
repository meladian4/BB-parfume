'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDateTimeJakarta, formatProductUnit } from '@/lib/formatters';
import { BBLogo } from '@/components/ui/BBLogo';
import { StockTransfer, Store, UserProfile } from '@/types/domain';
import {
  Truck,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  Package,
  ShieldCheck,
  CheckCheck,
  Store as StoreIcon,
  Search,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';

export default function CashierTransfersPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'IN_TRANSIT' | 'RECEIVED' | 'RETURN' | 'ALL'>('IN_TRANSIT');
  const [search, setSearch] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');

  // Modal Konfirmasi Terima
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);
  const [cashierName, setCashierName] = useState('');
  const [receivingRemark, setReceivingRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal Penolakan Penerimaan Barang (Retur ke Logistik Gudang)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [transferToReturn, setTransferToReturn] = useState<StockTransfer | null>(null);
  const [returnCashierName, setReturnCashierName] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnErrorMsg, setReturnErrorMsg] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [uRes, trRes, stRes] = await Promise.all([
        fetch('/api/users/me').then((r) => r.json()).catch(() => ({})),
        fetch('/api/transfers').then((r) => r.json()).catch(() => ({})),
        fetch('/api/stores').then((r) => r.json()).catch(() => ({})),
      ]);

      const currentUser = uRes?.user || null;
      setUser(currentUser);

      const trData = trRes?.data || trRes?.transfers || [];
      const stData = stRes?.data || stRes?.stores || [];

      setTransfers(Array.isArray(trData) ? trData : []);

      if (currentUser?.role === 'CASHIER') {
        const assignedId = currentUser.assigned_store_id || currentUser.store_id || '';
        const myStore = Array.isArray(stData) ? stData.filter((s: Store) => s.id === assignedId) : [];
        setStores(myStore.length > 0 ? myStore : stData);
        setSelectedStoreId(assignedId);
      } else {
        setStores(Array.isArray(stData) ? stData : []);
        setSelectedStoreId('ALL');
      }
    } catch (err) {
      console.error('Failed to load transfers for cashier:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceiveModal = (transfer: StockTransfer) => {
    setSelectedTransfer(transfer);
    const defaultName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Kasir Toko');
    setCashierName(defaultName);
    setReceivingRemark('');
    setErrorMsg('');
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransfer) return;

    if (!receivingRemark.trim()) {
      setErrorMsg('Mohon isi keterangan remark manual mengenai kondisi barang yang diterima.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/transfers/${selectedTransfer.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          received_by: cashierName.trim() || 'Kasir Toko Cabang',
          receiving_notes: receivingRemark.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses konfirmasi penerimaan barang.');
      }

      setIsReceiveModalOpen(false);
      setActionSuccess(`Barang mutasi ${selectedTransfer.transfer_number} berhasil diterima! Stok toko otomatis bertambah.`);
      setTimeout(() => setActionSuccess(null), 6000);

      // Reload data
      const trRes = await fetch('/api/transfers').then((r) => r.json());
      const trData = trRes?.data || trRes?.transfers || [];
      setTransfers(Array.isArray(trData) ? trData : []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menerima barang.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReturnModal = (transfer: StockTransfer) => {
    setTransferToReturn(transfer);
    const defaultName = user?.full_name || (user?.email ? user.email.split('@')[0] : 'Kasir Toko');
    setReturnCashierName(defaultName);
    setReturnReason('');
    setReturnErrorMsg('');
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferToReturn) return;

    if (!returnReason.trim()) {
      setReturnErrorMsg('Mohon isi alasan penolakan / ketidaksesuaian barang.');
      return;
    }

    setReturnSubmitting(true);
    setReturnErrorMsg('');

    try {
      const res = await fetch(`/api/transfers/${transferToReturn.id}/return-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requested_by: returnCashierName.trim() || 'Kasir Toko Cabang',
          reason: returnReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengajukan penolakan penerimaan barang.');
      }

      setIsReturnModalOpen(false);
      setActionSuccess(
        `Penolakan barang ${transferToReturn.transfer_number} terkirim! Menunggu approval Super Admin untuk dikembalikan ke Logistik Gudang.`
      );
      setTimeout(() => setActionSuccess(null), 7000);

      const trRes = await fetch('/api/transfers').then((r) => r.json());
      const trData = trRes?.data || trRes?.transfers || [];
      setTransfers(Array.isArray(trData) ? trData : []);
    } catch (err: unknown) {
      setReturnErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menolak barang.');
    } finally {
      setReturnSubmitting(false);
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const cashierStoreId = !isSuperAdmin ? (user?.assigned_store_id || selectedStoreId) : null;

  // Filter transfers based on store, tab, and search
  const filteredTransfers = useMemo(() => {
    return transfers.filter((t) => {
      // Kasir HANYA boleh melihat mutasi masuk toko cabangnya sendiri
      if (cashierStoreId && t.destination_store_id !== cashierStoreId) {
        return false;
      }

      // Super Admin filter toko
      if (isSuperAdmin && selectedStoreId !== 'ALL' && t.destination_store_id !== selectedStoreId) {
        return false;
      }

      // Tab filter
      if (activeTab === 'IN_TRANSIT' && t.status !== 'IN_TRANSIT') return false;
      if (activeTab === 'RECEIVED' && t.status !== 'RECEIVED') return false;
      if (activeTab === 'RETURN' && t.status !== 'RETURN_REQUESTED' && t.status !== 'RETURNED') return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNumber = t.transfer_number.toLowerCase().includes(q);
        const matchStore = t.destination_store?.name?.toLowerCase().includes(q);
        const matchItems = t.items?.some((it) => it.product?.name?.toLowerCase().includes(q));
        const matchRemark = t.receiving_notes?.toLowerCase().includes(q);
        if (!matchNumber && !matchStore && !matchItems && !matchRemark) return false;
      }

      return true;
    });
  }, [transfers, selectedStoreId, activeTab, search, cashierStoreId, isSuperAdmin]);

  const inTransitCount = useMemo(() => {
    return transfers.filter((t) => {
      if (cashierStoreId && t.destination_store_id !== cashierStoreId) return false;
      if (isSuperAdmin && selectedStoreId !== 'ALL' && t.destination_store_id !== selectedStoreId) return false;
      return t.status === 'IN_TRANSIT';
    }).length;
  }, [transfers, selectedStoreId, cashierStoreId, isSuperAdmin]);

  const receivedCount = useMemo(() => {
    return transfers.filter((t) => {
      if (cashierStoreId && t.destination_store_id !== cashierStoreId) return false;
      if (isSuperAdmin && selectedStoreId !== 'ALL' && t.destination_store_id !== selectedStoreId) return false;
      return t.status === 'RECEIVED';
    }).length;
  }, [transfers, selectedStoreId, cashierStoreId, isSuperAdmin]);

  const returnCount = useMemo(() => {
    return transfers.filter((t) => {
      if (cashierStoreId && t.destination_store_id !== cashierStoreId) return false;
      if (isSuperAdmin && selectedStoreId !== 'ALL' && t.destination_store_id !== selectedStoreId) return false;
      return t.status === 'RETURN_REQUESTED' || t.status === 'RETURNED';
    }).length;
  }, [transfers, selectedStoreId, cashierStoreId, isSuperAdmin]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <BBLogo variant="gold" size="md" withContainer />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Penerimaan Barang Masuk (Mutasi Cabang)</span>
                  <Badge variant="emerald" size="sm">
                    <CheckCircle className="w-3 h-3 mr-1 inline" />
                    Kasir Toko
                  </Badge>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Konfirmasi fisik barang kiriman dari Gudang Pusat yang telah disetujui Super Admin &amp; input keterangan remark kondisi barang.
                </p>
              </div>
            </div>

            {/* Lokasi Cabang: Terkunci khusus Kasir (tanpa dropdown), Dropdown HANYA untuk Super Admin */}
            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-1.5 self-start sm:self-auto">
              <StoreIcon className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs text-slate-400">Lokasi:</span>
              {isSuperAdmin ? (
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0F172A] text-white">Semua Cabang Kendal</option>
                  {stores
                    .filter((s) => s.type === 'STORE')
                    .map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0F172A] text-white">
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                  <span>
                    {stores.find((s) => s.id === (user?.assigned_store_id || selectedStoreId))?.name || 'Cabang Toko Anda'}
                  </span>
                  <span className="text-[10px] font-mono text-[#D4AF37]">
                    ({stores.find((s) => s.id === (user?.assigned_store_id || selectedStoreId))?.code || 'CABANG'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Alert Success Notification */}
          {actionSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{actionSuccess}</span>
            </div>
          )}

          {/* Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-2">
            <div className="flex flex-wrap text-xs gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('IN_TRANSIT')}
                className={`pb-2 px-3 font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'IN_TRANSIT'
                    ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Menunggu Diterima ({inTransitCount})</span>
                {inTransitCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              </button>
              <button
                onClick={() => setActiveTab('RECEIVED')}
                className={`pb-2 px-3 font-medium transition ${
                  activeTab === 'RECEIVED'
                    ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Riwayat Selesai Diterima ({receivedCount})
              </button>
              <button
                onClick={() => setActiveTab('RETURN')}
                className={`pb-2 px-3 font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'RETURN'
                    ? 'text-rose-400 border-b-2 border-rose-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Ditolak / Retur ({returnCount})</span>
              </button>
              <button
                onClick={() => setActiveTab('ALL')}
                className={`pb-2 px-3 font-medium transition ${
                  activeTab === 'ALL'
                    ? 'text-[#E5C365] border-b-2 border-[#D4AF37] font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua Status
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari surat jalan / item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0F172A] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Transfers Table / Cards */}
          <Card bordered className="bg-[#0F172A]/90 overflow-hidden shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-white">
                  {activeTab === 'IN_TRANSIT'
                    ? 'Kiriman Masuk Menunggu Penerimaan Kasir'
                    : activeTab === 'RECEIVED'
                    ? 'Riwayat Kiriman yang Telah Diterima di Toko'
                    : 'Daftar Semua Mutasi Kiriman'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {activeTab === 'IN_TRANSIT'
                    ? 'Periksa barang fisik yang diantar kurir lalu klik tombol Barang Diterima untuk memasukkan stok ke sistem POS.'
                    : 'Catatan seluruh penerimaan stok beserta remark manual kasir pemeriksa.'}
                </CardDescription>
              </div>
              {inTransitCount > 0 && activeTab === 'IN_TRANSIT' && (
                <Badge variant="amber" size="sm">
                  <Clock className="w-3 h-3 mr-1 inline" />
                  {inTransitCount} Kiriman Siap Diterima
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-10 text-center text-xs text-slate-400">Memuat data penerimaan barang...</div>
              ) : filteredTransfers.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto" />
                  <p>Tidak ada data kiriman pada filter ini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Surat Jalan</th>
                        <th className="py-3 px-4">Rute Distribusi</th>
                        <th className="py-3 px-4">Daftar Item Parfum</th>
                        <th className="py-3 px-4">Status & Waktu</th>
                        <th className="py-3 px-4 text-right">Aksi Kasir</th>
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
                            {tr.notes && (
                              <div className="text-[10px] text-slate-400 italic mt-0.5">
                                Catatan Logistik: {tr.notes}
                              </div>
                            )}
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
                            {tr.status === 'IN_TRANSIT' && (
                              <div>
                                <Badge variant="amber" size="sm">
                                  <Truck className="w-3 h-3 inline mr-1" />
                                  Dalam Perjalanan
                                </Badge>
                                <div className="text-[10px] text-amber-300/80 mt-1 font-medium">
                                  Disetujui Super Admin: {formatDateTimeJakarta(tr.approved_at || tr.shipped_at)}
                                </div>
                                {tr.return_admin_notes && (
                                  <div className="mt-1 p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-200">
                                    Catatan Super Admin: {tr.return_admin_notes}
                                  </div>
                                )}
                              </div>
                            )}

                            {tr.status === 'RETURN_REQUESTED' && (
                              <div className="space-y-1">
                                <Badge variant="rose" size="sm">
                                  <RotateCcw className="w-3 h-3 inline mr-1" />
                                  Menunggu Approval Retur Super Admin
                                </Badge>
                                <div className="text-[10px] text-rose-300/90">
                                  Ditolak Kasir: {tr.return_requested_by || 'Kasir'} ({formatDateTimeJakarta(tr.return_requested_at)})
                                </div>
                                {tr.return_reason && (
                                  <div className="p-2 rounded-lg bg-rose-950/50 border border-rose-500/30 text-[11px] text-rose-200">
                                    <span className="font-semibold text-rose-400 block text-[9px] uppercase tracking-wider">Alasan Penolakan:</span>
                                    <span className="italic">"{tr.return_reason}"</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {tr.status === 'RETURNED' && (
                              <div className="space-y-1">
                                <Badge variant="rose" size="sm">
                                  <RotateCcw className="w-3 h-3 inline mr-1" />
                                  Dikembalikan ke Logistik Gudang
                                </Badge>
                                <div className="text-[10px] text-slate-400">
                                  Disetujui Super Admin: {formatDateTimeJakarta(tr.return_approved_at)}
                                </div>
                                {tr.return_reason && (
                                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/25 text-[11px] text-rose-200">
                                    <span className="font-semibold text-rose-400 block text-[9px] uppercase tracking-wider">Alasan Retur:</span>
                                    <span className="italic">"{tr.return_reason}"</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {tr.status === 'RECEIVED' && (
                              <div className="space-y-1">
                                <Badge variant="emerald" size="sm">
                                  <CheckCircle className="w-3 h-3 inline mr-1" />
                                  Telah Diterima
                                </Badge>
                                <div className="text-[10px] text-emerald-400/90 font-medium">
                                  {formatDateTimeJakarta(tr.received_at)}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Penerima: <span className="text-slate-200 font-semibold">{tr.received_by || 'Kasir'}</span>
                                </div>
                                {tr.receiving_notes && (
                                  <div className="mt-1 p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-[11px] text-emerald-200">
                                    <span className="font-semibold text-emerald-400 block text-[9px] uppercase tracking-wider">Remark Kasir:</span>
                                    <span className="italic">"{tr.receiving_notes}"</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {tr.status === 'PENDING_APPROVAL' && (
                              <Badge variant="blue" size="sm">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Menunggu Approval Super Admin
                              </Badge>
                            )}

                            {tr.status === 'REJECTED' && (
                              <div>
                                <Badge variant="rose" size="sm">Ditolak Super Admin</Badge>
                                {tr.rejection_reason && (
                                  <div className="text-[10px] text-rose-300 mt-1">
                                    Alasan: {tr.rejection_reason}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {tr.status === 'IN_TRANSIT' && (
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-900/30"
                                  onClick={() => handleOpenReceiveModal(tr)}
                                >
                                  <CheckCheck className="w-4 h-4 mr-1.5" />
                                  <span>Barang Diterima</span>
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="bg-rose-950/60 text-rose-300 border-rose-700/70 hover:bg-rose-900/70 font-semibold"
                                  onClick={() => handleOpenReturnModal(tr)}
                                >
                                  <XCircle className="w-4 h-4 mr-1.5" />
                                  <span>Tolak Barang</span>
                                </Button>
                              </div>
                            )}

                            {tr.status === 'RETURN_REQUESTED' && (
                              <span className="text-[11px] text-amber-400 font-semibold inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Menunggu Approval Super Admin</span>
                              </span>
                            )}

                            {tr.status === 'RETURNED' && (
                              <span className="text-[11px] text-rose-400 font-semibold inline-flex items-center gap-1">
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Stok Kembali ke Gudang</span>
                              </span>
                            )}

                            {tr.status === 'RECEIVED' && (
                              <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Stok Selesai Masuk</span>
                              </span>
                            )}

                            {tr.status === 'PENDING_APPROVAL' && (
                              <span className="text-[11px] text-slate-400 italic">
                                Belum diberangkatkan
                              </span>
                            )}

                            {tr.status === 'REJECTED' && (
                              <span className="text-[11px] text-rose-400 font-medium">
                                Pengiriman Dibatalkan
                              </span>
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
        </main>
      </div>

      {/* Modal Konfirmasi Penerimaan Barang & Input Manual Remark */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => !submitting && setIsReceiveModalOpen(false)}
        title="Konfirmasi Penerimaan Barang Mutasi"
        description="Pastikan fisik barang sesuai dengan surat jalan sebelum konfirmasi."
        maxWidth="lg"
      >
        {selectedTransfer && (
          <form onSubmit={handleConfirmReceive} className="space-y-4">
            {/* Surat Jalan Info Header */}
            <div className="p-3 rounded-xl bg-[#162036] border border-slate-700/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Nomor Surat Jalan</span>
                <span className="font-mono font-bold text-white text-sm">{selectedTransfer.transfer_number}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Toko Tujuan</span>
                <span className="font-bold text-[#E5C365]">{selectedTransfer.destination_store?.name}</span>
              </div>
            </div>

            {/* Rincian Barang yang Diterima */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <span>Rincian Barang & Jumlah Fisik:</span>
              </label>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Nama Produk Parfum</th>
                      <th className="py-2 px-3 text-right">Kuantitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {selectedTransfer.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-medium">{it.product?.name}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-white">
                          {it.quantity} {formatProductUnit(it.product)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Input Nama Petugas Kasir */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Nama Petugas Kasir Penerima <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                placeholder="Contoh: Siti - Kasir Kendal Kota"
                className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Input Manual Keterangan / Remark Kasir */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Keterangan Remark Kondisi Barang (Diisi Manual oleh Kasir)</span>
                  <span className="text-rose-400">*</span>
                </span>
                <span className="text-[10px] text-amber-400 font-normal">Wajib diisi kasir</span>
              </label>
              <textarea
                required
                rows={3}
                value={receivingRemark}
                onChange={(e) => setReceivingRemark(e.target.value)}
                placeholder="Tuliskan kondisi fisik barang saat diterima. Contoh: Barang diterima lengkap 10 botol, segel utuh rapi, botol aman tanpa cacat/bocor."
                className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400">
                Catatan ini akan tersimpan permanen di sistem dan dapat dilihat langsung oleh Super Admin & Logistik.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={submitting}
                onClick={() => setIsReceiveModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                isLoading={submitting}
              >
                <CheckCheck className="w-4 h-4 mr-1.5" />
                <span>Simpan & Konfirmasi Diterima</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Penolakan Penerimaan Barang (Retur ke Logistik Gudang) */}
      <Modal
        isOpen={isReturnModalOpen}
        onClose={() => !returnSubmitting && setIsReturnModalOpen(false)}
        title="Tolak Penerimaan Barang (Retur ke Gudang)"
        description="Gunakan fitur ini jika barang fisik tidak sesuai surat jalan, rusak, atau bocor. Penolakan akan diteruskan ke Super Admin untuk persetujuan pengembalian stok ke Logistik Gudang."
        maxWidth="lg"
      >
        {transferToReturn && (
          <form onSubmit={handleConfirmReturn} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#162036] border border-rose-900/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Nomor Surat Jalan</span>
                <span className="font-mono font-bold text-white text-sm">{transferToReturn.transfer_number}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Dikembalikan ke</span>
                <span className="font-bold text-rose-300">{transferToReturn.source_store?.name}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-rose-400" />
                <span>Barang yang Ditolak:</span>
              </label>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Nama Produk</th>
                      <th className="py-2 px-3 text-right">Kuantitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {transferToReturn.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2 px-3 font-medium">{it.product?.name}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-white">
                          {it.quantity} {formatProductUnit(it.product)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Nama Petugas Kasir Pemeriksa <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={returnCashierName}
                onChange={(e) => setReturnCashierName(e.target.value)}
                placeholder="Contoh: Siti - Kasir Kendal Kota"
                className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Alasan Ketidaksesuaian / Penolakan <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-rose-400 font-normal">Wajib diisi</span>
              </label>
              <textarea
                required
                rows={3}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Contoh: Varian tidak sesuai surat jalan / jumlah fisik kurang / botol bocor saat diterima."
                className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300">
              Stok cabang <strong>tidak akan bertambah</strong>. Pengajuan retur akan muncul di menu <strong>Approval Mutasi Super Admin</strong> untuk mengembalikan stok ke Logistik Gudang.
            </div>

            {returnErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{returnErrorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={returnSubmitting}
                onClick={() => setIsReturnModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                isLoading={returnSubmitting}
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                <span>Konfirmasi Tolak &amp; Ajukan Retur</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
