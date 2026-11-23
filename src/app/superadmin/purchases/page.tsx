'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Purchase, Product, Supplier, Store, InventoryBalance } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatIDR, formatDateTimeJakarta, formatProductUnit } from '@/lib/formatters';
import { BBLogo } from '@/components/ui/BBLogo';
import {
  PackagePlus,
  Boxes,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  FileText,
  Search,
  ShieldCheck,
  Crown,
  CheckCheck,
  XCircle,
  PackageCheck,
  DollarSign,
  Info,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';

interface EditablePurchaseItem {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  unit_name: string;
  quantity: number; // Kuantitas riil belanja aktual
  quantityInput: string;
  requested_quantity: number; // Kuantitas awal yang diminta logistik
  initial_cost: number;
  unit_cost: number; // Harga beli per unit / per ml
  unitCostInput: string;
  subtotal: number; // Total nota belanja (quantity * unit_cost)
  subtotalInput: string;
  base_price: number;
}

export default function SuperAdminPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ORDERED' | 'RECEIVED'>('PENDING');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal Setujui & Masuk Stok Langsung (dengan opsi penyesuaian harga jika naik)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedPurchaseToApprove, setSelectedPurchaseToApprove] = useState<Purchase | null>(null);
  const [editableItems, setEditableItems] = useState<EditablePurchaseItem[]>([]);
  const [approveSubmitting, setApproveSubmitting] = useState(false);

  // Modal Penolakan
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedPurchaseToReject, setSelectedPurchaseToReject] = useState<Purchase | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Action Loading & Toast
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases').then((r) => r.json()).catch(() => ({}));
      const list = res?.data || res?.purchases || [];
      setPurchases(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load purchases for Super Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Buka Modal Konfirmasi Belanja & Penyesuaian Harga / Kuantitas Riil
  const handleOpenApproveModal = (purchase: Purchase) => {
    setSelectedPurchaseToApprove(purchase);
    const items: EditablePurchaseItem[] = (purchase.items || []).map((it) => {
      const p = it.product;
      const unitName = formatProductUnit(p);
      const qty = it.quantity || 1;
      const cost = it.unit_cost || 0;
      const sub = Math.round(qty * cost);
      return {
        id: it.id,
        product_id: it.product_id,
        product_name: p?.name || 'Produk',
        product_type: p?.product_type || 'BIBIT',
        unit_name: unitName,
        quantity: qty,
        quantityInput: String(qty),
        requested_quantity: qty,
        initial_cost: cost,
        unit_cost: cost,
        unitCostInput: String(cost),
        subtotal: sub,
        subtotalInput: String(sub),
        base_price: p?.base_price || 0,
      };
    });
    setEditableItems(items);
    setIsApproveModalOpen(true);
  };

  // 1. Ubah Kuantitas Riil Belanja (boleh dikosongkan / diisi 0 saat mengetik)
  const handleItemQuantityChange = (productId: string, rawVal: string) => {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item;
        if (rawVal === '') {
          return {
            ...item,
            quantityInput: '',
            quantity: 0,
            subtotal: 0,
            subtotalInput: '',
          };
        }
        const parsed = parseFloat(rawVal);
        const q = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
        const sub = Math.round(q * item.unit_cost);
        return {
          ...item,
          quantityInput: rawVal,
          quantity: q,
          subtotal: sub,
          subtotalInput: String(sub),
        };
      })
    );
  };

  // 2. Ubah Harga Satuan Riil -> Subtotal nota otomatis terhitung (Qty * Harga Satuan)
  const handleItemCostChange = (productId: string, rawVal: string) => {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item;
        if (rawVal === '') {
          return {
            ...item,
            unitCostInput: '',
            unit_cost: 0,
            subtotal: 0,
            subtotalInput: '',
          };
        }
        const parsed = parseFloat(rawVal);
        const uc = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
        const sub = Math.round(item.quantity * uc);
        return {
          ...item,
          unitCostInput: rawVal,
          unit_cost: uc,
          subtotal: sub,
          subtotalInput: String(sub),
        };
      })
    );
  };

  // 3. Ubah Subtotal Riil (Total Nota) -> Otomatis dibagi ke per ml/botol!
  const handleItemSubtotalChange = (productId: string, rawVal: string) => {
    setEditableItems((prev) =>
      prev.map((item) => {
        if (item.product_id !== productId) return item;
        if (rawVal === '') {
          return {
            ...item,
            subtotalInput: '',
            subtotal: 0,
            unit_cost: 0,
            unitCostInput: '',
          };
        }
        const parsed = parseFloat(rawVal);
        const sub = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
        const uc = item.quantity > 0 ? Math.round(sub / item.quantity) : 0;
        return {
          ...item,
          subtotalInput: rawVal,
          subtotal: sub,
          unit_cost: uc,
          unitCostInput: String(uc),
        };
      })
    );
  };

  // 2. Eksekusi Setujui & Langsung Masuk ke Stok Gudang Pusat
  const handleConfirmApproveAndReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchaseToApprove) return;

    const invalidItem = editableItems.find((it) => !it.quantity || it.quantity <= 0);
    if (invalidItem) {
      alert(`Kuantitas belanja untuk "${invalidItem.product_name}" harus minimal 1.`);
      return;
    }

    setApproveSubmitting(true);
    try {
      const payload = {
        approved_by: 'Super Admin Kendal (Owner)',
        direct_receive: true,
        items: editableItems.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
        })),
      };

      const endpoint =
        selectedPurchaseToApprove.status === 'ORDERED'
          ? `/api/purchases/${selectedPurchaseToApprove.id}/receive`
          : `/api/purchases/${selectedPurchaseToApprove.id}/approve`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal memproses persetujuan belanja.');

      setIsApproveModalOpen(false);
      setToastMessage(
        `Sukses! Permintaan ${selectedPurchaseToApprove.po_number} disetujui & ${editableItems.length} item langsung masuk ke stok Gudang Pusat sesuai realisasi belanja.`
      );
      setTimeout(() => setToastMessage(null), 5000);
      await loadData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Gagal memproses persetujuan.');
    } finally {
      setApproveSubmitting(false);
    }
  };

  // 3. Super Admin Menolak Permintaan
  const handleOpenReject = (purchase: Purchase) => {
    setSelectedPurchaseToReject(purchase);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchaseToReject) return;

    setRejectSubmitting(true);
    try {
      const res = await fetch(`/api/purchases/${selectedPurchaseToReject.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectionReason.trim() || 'Ditolak oleh Super Admin',
          rejected_by: 'Super Admin Kendal (Owner)',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menolak permintaan belanja.');

      setIsRejectModalOpen(false);
      setToastMessage(`Permintaan ${selectedPurchaseToReject.po_number} telah ditolak.`);
      setTimeout(() => setToastMessage(null), 5000);
      await loadData();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Gagal menolak permintaan.');
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Filter Data & Urutkan Berdasarkan Tanggal Pengajuan Terbaru
  const filteredPurchases = useMemo(() => {
    return purchases
      .filter((po) => {
        if (activeTab === 'PENDING' && po.status !== 'PENDING_APPROVAL') return false;
        if (activeTab === 'ORDERED' && po.status !== 'ORDERED') return false;
        if (activeTab === 'RECEIVED' && po.status !== 'RECEIVED') return false;

        // Filter Tanggal Pengajuan (YYYY-MM-DD)
        if (dateFilter) {
          const poDate = new Date(po.created_at).toISOString().split('T')[0];
          if (poDate !== dateFilter) return false;
        }

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchNumber = po.po_number.toLowerCase().includes(q);
          const matchSup = po.supplier?.name?.toLowerCase().includes(q);
          const matchNotes = po.notes?.toLowerCase().includes(q);
          const matchItems = po.items?.some(
            (it) => it.product?.name?.toLowerCase().includes(q) || it.product?.sku?.toLowerCase().includes(q)
          );
          if (!matchNumber && !matchSup && !matchNotes && !matchItems) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [purchases, activeTab, search, dateFilter]);

  const pendingCount = purchases.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const orderedCount = purchases.filter((p) => p.status === 'ORDERED').length;
  const receivedCount = purchases.filter((p) => p.status === 'RECEIVED').length;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BBLogo variant="gold" size="md" withContainer />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Bahan Acuan Pembelanjaan Barang (Permintaan Logistik)</span>
              <Badge variant="gold" size="sm">
                <Crown className="w-3 h-3 mr-1 inline" />
                Super Admin Only
              </Badge>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Daftar usulan pengadaan bibit parfum & kemasan dari Tim Logistik sebagai bahan acuan resmi Owner/Super Admin untuk belanja barang ke supplier.
            </p>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Tabs & Search & Filter Tanggal */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-2.5 px-3 font-medium transition flex items-center gap-1.5 shrink-0 min-h-[40px] touch-manipulation ${
              activeTab === 'PENDING'
                ? 'text-blue-400 border-b-2 border-blue-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Menunggu Review Acuan ({pendingCount})</span>
            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-2.5 px-3 font-medium transition shrink-0 min-h-[40px] touch-manipulation ${
              activeTab === 'ALL'
                ? 'text-[#E5C365] border-b-2 border-[#D4AF37] font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Dokumen ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('ORDERED')}
            className={`pb-2.5 px-3 font-medium transition shrink-0 min-h-[40px] touch-manipulation ${
              activeTab === 'ORDERED'
                ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sedang Dibelanjakan ({orderedCount})
          </button>
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`pb-2.5 px-3 font-medium transition shrink-0 min-h-[40px] touch-manipulation ${
              activeTab === 'RECEIVED'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Selesai Masuk Gudang ({receivedCount})
          </button>
        </div>

        {/* Filter Tanggal & Search Bar (Mobile-Friendly Stack) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          {/* Filter Tanggal */}
          <div className="flex items-center justify-between sm:justify-start gap-2 bg-[#0F172A] border border-slate-800 rounded-xl px-3 py-2 sm:py-1.5 text-xs min-h-[44px] sm:min-h-0">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span className="text-[11px] text-slate-400 font-medium">Tanggal:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none [color-scheme:dark]"
              />
              {dateFilter ? (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="text-slate-400 hover:text-rose-400 text-xs px-2 py-1 rounded bg-slate-800 touch-manipulation"
                  title="Reset tanggal (tampilkan semua)"
                >
                  &times;
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setDateFilter(todayStr)}
                  className="text-[11px] text-slate-300 hover:text-[#D4AF37] px-2 py-1 bg-slate-800 rounded font-semibold touch-manipulation"
                >
                  Hari Ini
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. PO / barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 sm:py-1.5 bg-[#0F172A] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37] min-h-[44px] sm:min-h-0 touch-manipulation"
            />
          </div>
        </div>
      </div>

      {/* Table Dokumen Permintaan Belanja */}
      <Card bordered className="bg-[#0F172A]/90 overflow-hidden shadow-xl">
        <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-white">Daftar Usulan Pembelanjaan dari Logistik</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {dateFilter ? (
                <span>Menampilkan pengajuan tanggal <strong>{dateFilter}</strong> ({filteredPurchases.length} dokumen ditemukan)</span>
              ) : (
                <span>Diurutkan berdasarkan tanggal pengajuan terbaru dari staf logistik.</span>
              )}
            </CardDescription>
          </div>
          {pendingCount > 0 && (
            <Badge variant="blue" size="sm">
              <Clock className="w-3 h-3 mr-1 inline" />
              {pendingCount} Permintaan Belanja Baru
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">Memuat data permintaan belanja...</div>
          ) : filteredPurchases.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto" />
              <p>Tidak ada dokumen pengajuan yang sesuai kriteria pencarian / tanggal.</p>
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-xs text-[#D4AF37] hover:underline"
                >
                  Tampilkan Semua Tanggal
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 1. MOBILE CARD VIEW (Tampil di Layar HP < md: Presisi & Mudah Dijangkau Jempol) */}
              <div className="md:hidden divide-y divide-slate-800">
                {filteredPurchases.map((po) => {
                  const isToday = new Date(po.created_at).toISOString().split('T')[0] === todayStr;
                  return (
                    <div key={po.id} className="p-4 space-y-3 bg-[#0F172A]/70 hover:bg-slate-800/30 transition">
                      {/* Header Card: PO Number, Status, & Tanggal */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 font-mono font-bold text-[#E5C365] text-sm">
                            <FileText className="w-4 h-4 text-[#D4AF37] shrink-0" />
                            <span>{po.po_number}</span>
                            {isToday && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-sans font-bold">
                                Hari Ini
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{formatDateTimeJakarta(po.created_at)}</span>
                          </div>
                        </div>

                        <div>
                          {po.status === 'PENDING_APPROVAL' && (
                            <Badge variant="blue" size="sm">Menunggu Review</Badge>
                          )}
                          {po.status === 'ORDERED' && (
                            <Badge variant="amber" size="sm">Disetujui Owner</Badge>
                          )}
                          {po.status === 'RECEIVED' && (
                            <Badge variant="emerald" size="sm">Selesai Masuk</Badge>
                          )}
                          {po.status === 'REJECTED' && (
                            <Badge variant="rose" size="sm">Ditolak</Badge>
                          )}
                        </div>
                      </div>

                      {/* Catatan jika ada */}
                      {po.notes && (
                        <div className="text-[11px] text-slate-400 italic bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                          Catatan: {po.notes}
                        </div>
                      )}

                      {/* List Item & Estimasi Anggaran */}
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
                          <span className="text-slate-400 font-medium">{po.items?.length || 0} SKU Diajukan:</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {formatIDR(po.total_amount)}
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {po.items?.map((it) => (
                            <div key={it.id} className="text-xs text-slate-300 flex items-center justify-between gap-2 bg-slate-900/90 px-2.5 py-1.5 rounded-lg">
                              <span className="truncate text-slate-200 font-medium">{it.product?.name}</span>
                              <span className="font-mono font-bold text-white shrink-0 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                                {it.quantity} {formatProductUnit(it.product)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TOMBOL AKSI MOBILE (Besar, min-h-[44px], mudah dijangkau jempol!) */}
                      {po.status === 'PENDING_APPROVAL' && (
                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(po)}
                            disabled={actionLoadingId === po.id}
                            className="w-full h-12 min-h-[44px] bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-[0.98] transition touch-manipulation"
                          >
                            <CheckCheck className="w-4 h-4" />
                            <span>Setujui &amp; Masuk Stok</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenReject(po)}
                            disabled={actionLoadingId === po.id}
                            className="w-full h-10 min-h-[40px] bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition touch-manipulation"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak Pengajuan</span>
                          </button>
                        </div>
                      )}

                      {po.status === 'ORDERED' && (
                        <button
                          type="button"
                          onClick={() => handleOpenApproveModal(po)}
                          disabled={actionLoadingId === po.id}
                          className="w-full h-12 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition touch-manipulation"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>Konfirmasi Masuk Stok</span>
                        </button>
                      )}

                      {po.status === 'RECEIVED' && (
                        <div className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1 pt-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Stok Gudang Resmi Bertambah ({formatDateTimeJakarta(po.received_at)})</span>
                        </div>
                      )}

                      {po.status === 'REJECTED' && (
                        <div className="text-[11px] text-rose-400 font-medium pt-1">
                          Permintaan Ditolak Owner {po.rejection_reason && `(Ket: ${po.rejection_reason})`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 2. DESKTOP TABLE VIEW (Tampil di Layar Komputer / Laptop >= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Tanggal &amp; No. Pengajuan</th>
                      <th className="py-3 px-4">Daftar Item &amp; Kuantitas Diminta</th>
                      <th className="py-3 px-4">Estimasi Anggaran HPP</th>
                      <th className="py-3 px-4">Status Acuan</th>
                      <th className="py-3 px-4 text-right">Otorisasi Super Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredPurchases.map((po) => {
                      const isToday = new Date(po.created_at).toISOString().split('T')[0] === todayStr;
                      return (
                        <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-[#E5C365]">
                              <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span>{po.po_number}</span>
                              {isToday && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-sans font-bold">
                                  Hari Ini
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium mt-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDateTimeJakarta(po.created_at)}</span>
                            </div>
                            {po.notes && (
                              <div className="text-[10px] text-slate-400 italic mt-1 font-sans font-normal bg-slate-900/60 px-2 py-1 rounded border border-slate-800/80">
                                Catatan: {po.notes}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="mb-1.5 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                                {po.items?.length || 0} SKU Diajukan Bersama
                              </span>
                            </div>
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {po.items?.map((it) => (
                                <div key={it.id} className="text-[11px] text-slate-300 flex items-center justify-between gap-3 bg-slate-900/50 px-2 py-0.5 rounded">
                                  <span className="truncate max-w-[200px]" title={it.product?.name}>
                                    {it.product?.name}
                                  </span>
                                  <span className="font-bold font-mono text-white shrink-0">
                                    {it.quantity} {formatProductUnit(it.product)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-bold text-emerald-400 text-sm">
                              {formatIDR(po.total_amount)}
                            </div>
                            <div className="text-[9px] text-slate-500">Estimasi Biaya Modal</div>
                          </td>

                          <td className="py-3.5 px-4">
                            {po.status === 'PENDING_APPROVAL' && (
                              <Badge variant="blue" size="sm">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Menunggu Review
                              </Badge>
                            )}

                            {po.status === 'ORDERED' && (
                              <div>
                                <Badge variant="amber" size="sm">
                                  <CheckCircle className="w-3 h-3 inline mr-1" />
                                  Disetujui Owner
                                </Badge>
                                <div className="text-[10px] text-amber-300 mt-1">
                                  Sedang diproses belanja
                                </div>
                              </div>
                            )}

                            {po.status === 'RECEIVED' && (
                              <div>
                                <Badge variant="emerald" size="sm">
                                  <CheckCircle className="w-3 h-3 inline mr-1" />
                                  Selesai Masuk Stok
                                </Badge>
                                <div className="text-[10px] text-emerald-400/80 mt-1">
                                  {formatDateTimeJakarta(po.received_at)}
                                </div>
                              </div>
                            )}

                            {po.status === 'REJECTED' && (
                              <div>
                                <Badge variant="rose" size="sm">
                                  <XCircle className="w-3 h-3 inline mr-1" />
                                  Ditolak
                                </Badge>
                                {po.rejection_reason && (
                                  <div className="text-[10px] text-rose-300 mt-1">
                                    Ket: {po.rejection_reason}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {po.status === 'PENDING_APPROVAL' && (
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                                  isLoading={actionLoadingId === po.id}
                                  onClick={() => handleOpenApproveModal(po)}
                                >
                                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                                  <span>Setujui &amp; Masuk Stok</span>
                                </Button>

                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/50"
                                  isLoading={actionLoadingId === po.id}
                                  onClick={() => handleOpenReject(po)}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-1" />
                                  <span>Tolak</span>
                                </Button>
                              </div>
                            )}

                            {po.status === 'ORDERED' && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm"
                                isLoading={actionLoadingId === po.id}
                                onClick={() => handleOpenApproveModal(po)}
                              >
                                <PackageCheck className="w-3.5 h-3.5 mr-1" />
                                <span>Konfirmasi Masuk Stok</span>
                              </Button>
                            )}

                            {po.status === 'RECEIVED' && (
                              <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Stok Gudang Resmi Bertambah</span>
                              </span>
                            )}

                            {po.status === 'REJECTED' && (
                              <span className="text-[11px] text-rose-400 font-medium">
                                Permintaan Ditolak Owner
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Persetujuan Belanja & Penyesuaian Harga Riil (Direct Receive) */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => !approveSubmitting && setIsApproveModalOpen(false)}
        title="Persetujuan Belanja & Masuk Stok Gudang"
        description="Periksa dan sesuaikan harga beli aktual supplier jika terjadi kenaikan harga. Stok Gudang Pusat langsung otomatis bertambah dengan HPP rata-rata terhitung."
        maxWidth="2xl"
      >
        {selectedPurchaseToApprove && (
          <form onSubmit={handleConfirmApproveAndReceive} className="space-y-5">
            {/* Informasi PO Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">No. Pengajuan:</span>
                <span className="font-mono font-bold text-[#E5C365] text-sm">
                  {selectedPurchaseToApprove.po_number}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tujuan Penyimpanan:</span>
                <span className="font-semibold text-slate-200">Gudang Pusat Logistik</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tanggal Diajukan:</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {formatDateTimeJakarta(selectedPurchaseToApprove.created_at)}
                </span>
              </div>
            </div>

            {/* List Item & Input Harga Aktual */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Daftar Barang & Harga Beli Faktur Supplier:</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Ketik harga baru jika harga supplier naik/turun
                </span>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {editableItems.map((item) => {
                  const itemInitialSubtotal = item.requested_quantity * item.initial_cost;
                  const itemCurrentSubtotal = item.subtotal;
                  const costDiff = item.unit_cost - item.initial_cost;
                  const percentDiff =
                    item.initial_cost > 0 ? ((costDiff / item.initial_cost) * 100).toFixed(1) : '0';
                  const isPriceUp = costDiff > 0;
                  const isPriceDown = costDiff < 0;
                  const isQtyChanged = item.quantity !== item.requested_quantity;

                  return (
                    <div
                      key={item.product_id}
                      className="p-3.5 rounded-xl bg-[#0F172A] border border-slate-800/80 hover:border-slate-700 transition space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                            <span>{item.product_name}</span>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                              {item.product_type}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Permintaan Logistik: <strong className="text-slate-300 font-mono">{item.requested_quantity} {item.unit_name}</strong></span>
                            {isQtyChanged && (
                              <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                                Penyesuaian Realisasi: {item.quantity} {item.unit_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Perubahan Harga */}
                        <div>
                          {isPriceUp && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>
                                Naik +{formatIDR(costDiff)} (+{percentDiff}%)
                              </span>
                            </span>
                          )}
                          {isPriceDown && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                              <TrendingDown className="w-3.5 h-3.5" />
                              <span>
                                Turun {formatIDR(costDiff)} ({percentDiff}%)
                              </span>
                            </span>
                          )}
                          {!isPriceUp && !isPriceDown && (
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                              Sesuai Estimasi Awal
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3 Kolom Interaktif: Kuantitas Riil Belanja, Subtotal Nota (Auto Divide), Harga Satuan */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-800/80 text-xs">
                        {/* 1. Kuantitas Riil Belanja (Masuk Stok Gudang) */}
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1 font-semibold flex items-center justify-between">
                            <span>Kuantitas Belanja:</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              Diminta: {item.requested_quantity}
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.quantityInput}
                              onChange={(e) =>
                                handleItemQuantityChange(item.product_id, e.target.value)
                              }
                              className="w-full px-3 py-2 sm:py-1.5 bg-[#0A0E1A] border border-slate-700 rounded-lg text-sm sm:text-xs font-mono font-bold text-white focus:outline-none focus:border-[#D4AF37] min-h-[42px] sm:min-h-0 touch-manipulation"
                              placeholder="0"
                              required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                              {item.unit_name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {item.quantity !== item.requested_quantity ? (
                              <span className="text-amber-300 font-medium">
                                ➔ {item.quantity} {item.unit_name} masuk stok
                              </span>
                            ) : (
                              <span>Sesuai permintaan logistik</span>
                            )}
                          </div>
                        </div>

                        {/* 2. Subtotal Belanja Riil (Bisa Diisi Manual -> Otomatis Bagi ke ml/botol) */}
                        <div>
                          <label className="block text-[11px] text-[#E5C365] mb-1 font-semibold flex items-center justify-between">
                            <span>Total Nota Belanja:</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-normal">
                              Bagi Otomatis
                            </span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                              Rp
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.subtotalInput}
                              onChange={(e) =>
                                handleItemSubtotalChange(item.product_id, e.target.value)
                              }
                              className="w-full pl-9 pr-3 py-2 sm:py-1.5 bg-[#0A0E1A] border border-amber-500/50 rounded-lg text-sm sm:text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-[#D4AF37] min-h-[42px] sm:min-h-0 touch-manipulation"
                              placeholder="0"
                            />
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Otomatis dibagi ke {item.quantity} {item.unit_name}
                          </div>
                        </div>

                        {/* 3. Harga Beli Riil Satuan (per ml / per botol) */}
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1 font-semibold">
                            Harga Satuan ({item.unit_name}):
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                              Rp
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.unitCostInput}
                              onChange={(e) =>
                                handleItemCostChange(item.product_id, e.target.value)
                              }
                              className="w-full pl-9 pr-3 py-2 sm:py-1.5 bg-[#0A0E1A] border border-slate-700 rounded-lg text-sm sm:text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37] min-h-[42px] sm:min-h-0 touch-manipulation"
                              placeholder="0"
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Estimasi Awal: {formatIDR(item.initial_cost)} / {item.unit_name}
                          </div>
                        </div>
                      </div>

                      {/* Rangkuman Hitungan Per Baris */}
                      <div className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          Realisasi: <strong className="text-white font-mono">{item.quantity} {item.unit_name}</strong> × <strong className="text-emerald-400 font-mono">{formatIDR(item.unit_cost)}</strong>
                        </span>
                        <span className="text-white font-mono font-bold">
                          Subtotal: <span className="text-[#E5C365]">{formatIDR(item.subtotal)}</span>
                        </span>
                      </div>

                      {/* Margin Protection Alert */}
                      {item.base_price > 0 && item.unit_cost >= item.base_price && (
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-300 bg-rose-950/40 border border-rose-800/50 p-2 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>
                            <strong>Peringatan Margin:</strong> Harga beli ({formatIDR(item.unit_cost)}) telah menyamai / melebihi harga retail ({formatIDR(item.base_price)}). Pertimbangkan sesuaikan harga jual di Master Produk.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rekapitulasi Total & Selisih Anggaran */}
            {(() => {
              const initialTotal = editableItems.reduce(
                (acc, it) => acc + it.requested_quantity * it.initial_cost,
                0
              );
              const currentTotal = editableItems.reduce(
                (acc, it) => acc + it.subtotal,
                0
              );
              const diffTotal = currentTotal - initialTotal;

              return (
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#162036] to-[#0d1527] border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Total Estimasi Awal:</span>
                    <span className="font-mono">{formatIDR(initialTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white font-bold">
                    <span>Total Realisasi Belanja:</span>
                    <span className="font-mono text-emerald-400 text-lg">{formatIDR(currentTotal)}</span>
                  </div>
                  {diffTotal !== 0 && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Selisih Anggaran:</span>
                      <span
                        className={`font-mono font-bold ${
                          diffTotal > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {diffTotal > 0
                          ? `+${formatIDR(diffTotal)} (Biaya Naik)`
                          : `-${formatIDR(Math.abs(diffTotal))} (Lebih Hemat)`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-300/90 pt-1">
                    <Info className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                    <span>
                      Stok Gudang Pusat langsung resmi bertambah & HPP Moving Average dihitung otomatis oleh sistem.
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons Sticky di Bawah Modal (Sangat Pas & Mudah Dijangkau Jempol di HP) */}
            <div className="sticky -bottom-3.5 sm:-bottom-6 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 py-3 bg-[#0F172A] border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shadow-2xl z-20">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={approveSubmitting}
                onClick={() => setIsApproveModalOpen(false)}
                className="w-full sm:w-auto h-11 sm:h-10 text-xs sm:text-sm font-semibold order-2 sm:order-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto h-12 sm:h-10 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 px-5 order-1 sm:order-2 active:scale-[0.98]"
                isLoading={approveSubmitting}
              >
                <PackageCheck className="w-4 h-4 mr-1.5" />
                <span>Setujui &amp; Tambah ke Stok Sekarang</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Penolakan Permintaan Belanja */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !rejectSubmitting && setIsRejectModalOpen(false)}
        title="Tolak Usulan Pembelanjaan Barang"
        description="Masukkan alasan penolakan permintaan belanja dari Tim Logistik."
        maxWidth="md"
      >
        {selectedPurchaseToReject && (
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px]">Dokumen Permintaan:</span>
              <span className="font-mono font-bold text-[#E5C365] text-sm">
                {selectedPurchaseToReject.po_number}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Alasan Penolakan <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Saldo stok di cabang masih mencukupi, alokasi anggaran dialihkan ke item lain..."
                className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 min-h-[44px] touch-manipulation"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={rejectSubmitting}
                onClick={() => setIsRejectModalOpen(false)}
                className="w-full sm:w-auto h-11 sm:h-10 text-xs sm:text-sm font-semibold order-2 sm:order-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto h-12 sm:h-10 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white order-1 sm:order-2 active:scale-[0.98]"
                isLoading={rejectSubmitting}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                <span>Konfirmasi Tolak Permintaan</span>
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

