'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatIDR, formatDateTimeJakarta, formatProductUnit } from '@/lib/formatters';
import { Sale, UserProfile, Store, PaymentMethod, SaleStatus } from '@/types/domain';
import {
  ScrollText,
  Printer,
  Eye,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  ShoppingBag,
  ArrowUpDown,
  Trash2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  RotateCcw,
  Check,
  Building2,
  Wallet,
  Clock,
  Filter,
  Bluetooth,
  Sparkles,
} from 'lucide-react';
import { printReceiptViaBluetooth } from '@/lib/bluetooth-printer';

type DatePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'CUSTOM';

const QUICK_VOID_REASONS = [
  'Pembayaran QRIS Gagal / Saldo Tidak Masuk',
  'Salah Pilih Varian Bibit / Racikan',
  'Salah Ketik Jumlah / Ukuran Botol',
  'Pelanggan Batal Beli / Ganti Pesanan',
  'Transaksi Duplikat / Input Dobel',
  'Lainnya',
];

export default function CashierHistoryPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('TODAY');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'QTY_DESC' | 'QTY_ASC' | 'AMOUNT_DESC' | 'AMOUNT_ASC'>('DATE_DESC');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SaleStatus>('ALL');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('ALL');

  // Modals
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleToVoid, setSaleToVoid] = useState<Sale | null>(null);
  const [voidReasonCategory, setVoidReasonCategory] = useState<string>(QUICK_VOID_REASONS[0]);
  const [voidReasonNotes, setVoidReasonNotes] = useState<string>('');
  const [submittingVoid, setSubmittingVoid] = useState(false);

  // Super Admin Void Approval Modal
  const [saleToReview, setSaleToReview] = useState<Sale | null>(null);
  const [adminDecisionNotes, setAdminDecisionNotes] = useState<string>('');
  const [submittingAdminDecision, setSubmittingAdminDecision] = useState(false);

  // Modal Cetak Struk Thermal & Bluetooth
  const [receiptSaleToPrint, setReceiptSaleToPrint] = useState<Sale | null>(null);
  const [receiptPaperSize, setReceiptPaperSize] = useState<'58mm' | '80mm'>('58mm');
  const [btPrinting, setBtPrinting] = useState(false);
  const [btPrinterName, setBtPrinterName] = useState<string | null>(null);
  const [btStatusMsg, setBtStatusMsg] = useState<string | null>(null);

  const handlePrintBluetooth = async () => {
    if (!receiptSaleToPrint) return;
    try {
      setBtPrinting(true);
      setBtStatusMsg('Sedang menyambungkan ke printer bluetooth...');
      const cashierName = receiptSaleToPrint.cashier?.full_name || user?.full_name || 'Kasir';
      const storeObj =
        receiptSaleToPrint.store ||
        stores.find((s) => s.id === receiptSaleToPrint.store_id) ||
        user?.assigned_store ||
        null;

      const res = await printReceiptViaBluetooth(
        receiptSaleToPrint,
        storeObj,
        cashierName,
        receiptPaperSize
      );
      setBtPrinterName(res.printerName);
      setBtStatusMsg(`✓ Berhasil mencetak ke ${res.printerName}`);
      setTimeout(() => setBtStatusMsg(null), 5000);
    } catch (err: any) {
      console.error('Bluetooth Print Error:', err);
      setBtStatusMsg(`Gagal: ${err.message || 'Printer bluetooth tidak terhubung'}`);
    } finally {
      setBtPrinting(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const userRes = await fetch('/api/users/me').then((r) => r.json());
      const curUser = userRes.user;
      setUser(curUser);

      // Super Admin: Load stores for branch filter
      if (curUser?.role === 'SUPER_ADMIN') {
        const storesRes = await fetch('/api/stores').then((r) => r.json());
        setStores(storesRes.stores || storesRes.data || []);
      }

      const salesRes = await fetch('/api/pos/sales').then((r) => r.json());
      setSales(salesRes.sales || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper date strings
  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };
  const getLast7DaysStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  };
  const getMonthStartStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };

  // Filtered & Sorted Sales
  const salesBeforeTierFilter = useMemo(() => {
    return sales.filter((s) => {
      // 1. Text Search
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.invoice_number.toLowerCase().includes(q) ||
        (s.member?.name && s.member.name.toLowerCase().includes(q)) ||
        (s.cashier?.full_name && s.cashier.full_name.toLowerCase().includes(q)) ||
        (s.store?.name && s.store.name.toLowerCase().includes(q)) ||
        (s.perfume_tier && s.perfume_tier.toLowerCase().includes(q)) ||
        (s.items && s.items.some((it) => it.product?.name?.toLowerCase().includes(q)));

      if (!matchSearch) return false;

      // 2. Store Filter (Super Admin)
      if (selectedStoreId !== 'ALL' && s.store_id !== selectedStoreId) {
        return false;
      }

      // 3. Payment Method Filter
      const paymentMethod = s.payments?.[0]?.payment_method || 'CASH';
      if (paymentMethodFilter !== 'ALL' && paymentMethod !== paymentMethodFilter) {
        return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'ALL' && s.sale_status !== statusFilter) {
        return false;
      }

      // 5. Date Filter
      const dateStr = s.created_at.slice(0, 10);
      if (datePreset === 'TODAY') {
        if (dateStr !== getTodayStr()) return false;
      } else if (datePreset === 'YESTERDAY') {
        if (dateStr !== getYesterdayStr()) return false;
      } else if (datePreset === 'LAST_7') {
        if (dateStr < getLast7DaysStr()) return false;
      } else if (datePreset === 'THIS_MONTH') {
        if (dateStr < getMonthStartStr()) return false;
      } else if (datePreset === 'CUSTOM') {
        if (customStartDate && dateStr < customStartDate) return false;
        if (customEndDate && dateStr > customEndDate) return false;
      }

      return true;
    });
  }, [
    sales,
    search,
    selectedStoreId,
    paymentMethodFilter,
    statusFilter,
    datePreset,
    customStartDate,
    customEndDate,
  ]);

  const filteredSales = useMemo(() => {
    return salesBeforeTierFilter
      .filter((s) => {
        // Tier / Jenis Item Filter
        if (tierFilter !== 'ALL') {
          const saleTier = (s.perfume_tier || 'Standard').toLowerCase();
          if (saleTier !== tierFilter.toLowerCase()) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'QTY_DESC') {
          const qtyA = a.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0;
          const qtyB = b.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0;
          return qtyB - qtyA;
        }
        if (sortBy === 'QTY_ASC') {
          const qtyA = a.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0;
          const qtyB = b.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0;
          return qtyA - qtyB;
        }
        if (sortBy === 'AMOUNT_DESC') {
          return b.final_amount - a.final_amount;
        }
        if (sortBy === 'AMOUNT_ASC') {
          return a.final_amount - b.final_amount;
        }
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortBy === 'DATE_ASC' ? timeA - timeB : timeB - timeA;
      });
  }, [salesBeforeTierFilter, tierFilter, sortBy]);

  // Rangkuman Item / Kualitas (Standard, Premium, Luxury, Primescent) dari transaksi sah sesuai filter periode/cabang/bayar
  const tierSummary = useMemo(() => {
    const validBase = salesBeforeTierFilter.filter((s) => s.sale_status !== 'VOIDED');
    const tiers = [
      { id: 'Standard', label: 'Standard', dotClass: 'bg-slate-400', textClass: 'text-slate-200' },
      { id: 'Premium', label: 'Premium', dotClass: 'bg-amber-400', textClass: 'text-amber-400' },
      { id: 'Luxury', label: 'Luxury', dotClass: 'bg-purple-400', textClass: 'text-purple-400' },
      { id: 'Primescent', label: 'Primescent', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
    ];

    return tiers.map((tier) => {
      const matched = validBase.filter(
        (s) => (s.perfume_tier || 'Standard').toLowerCase() === tier.id.toLowerCase()
      );
      const omzet = matched.reduce((sum, s) => sum + s.final_amount, 0);
      const notaCount = matched.length;
      const itemQty = matched.reduce(
        (sum, s) => sum + (s.items?.reduce((acc, it) => acc + (it.quantity || 0), 0) || 0),
        0
      );
      return { ...tier, omzet, notaCount, itemQty };
    });
  }, [salesBeforeTierFilter]);

  // Aggregate stats from filtered list
  const validSales = filteredSales.filter((s) => s.sale_status !== 'VOIDED');
  const totalOmzet = validSales.reduce((sum, s) => sum + s.final_amount, 0);

  const totalCash = validSales
    .filter((s) => (s.payments?.[0]?.payment_method || 'CASH') === 'CASH')
    .reduce((sum, s) => sum + s.final_amount, 0);

  const totalQris = validSales
    .filter((s) => (s.payments?.[0]?.payment_method || 'CASH') === 'QRIS')
    .reduce((sum, s) => sum + s.final_amount, 0);

  const pendingVoidSales = sales.filter((s) => s.sale_status === 'VOID_PENDING');
  const voidedCount = filteredSales.filter((s) => s.sale_status === 'VOIDED').length;

  // Kasir: Handle submit void request
  const handleSubmitVoidRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToVoid) return;

    const fullReason =
      voidReasonCategory === 'Lainnya'
        ? voidReasonNotes.trim()
        : voidReasonNotes.trim()
        ? `${voidReasonCategory} - ${voidReasonNotes.trim()}`
        : voidReasonCategory;

    if (!fullReason) {
      alert('Mohon cantumkan alasan pembatalan transaksi.');
      return;
    }

    try {
      setSubmittingVoid(true);
      const res = await fetch(`/api/pos/sales/${saleToVoid.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_VOID',
          reason: fullReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengajukan pembatalan transaksi.');

      setFeedback({
        type: 'success',
        text: `Pengajuan pembatalan nota ${saleToVoid.invoice_number} berhasil dikirim ke Super Admin.`,
      });
      setSaleToVoid(null);
      setVoidReasonNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingVoid(false);
    }
  };

  // Super Admin: Handle approve or reject void
  const handleAdminVoidDecision = async (action: 'APPROVE_VOID' | 'REJECT_VOID') => {
    if (!saleToReview) return;

    try {
      setSubmittingAdminDecision(true);
      const res = await fetch(`/api/pos/sales/${saleToReview.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: adminDecisionNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses persetujuan pembatalan.');

      setFeedback({
        type: 'success',
        text:
          action === 'APPROVE_VOID'
            ? `Nota ${saleToReview.invoice_number} resmi DIBATALKAN (VOID). Stok toko & kas laci telah di-rollback.`
            : `Pengajuan pembatalan ${saleToReview.invoice_number} DITOLAK. Transaksi tetap sah.`,
      });
      setSaleToReview(null);
      setAdminDecisionNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingAdminDecision(false);
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans">
      <Topbar user={user || undefined} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar role={user?.role || 'CASHIER'} />

        <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-[#D4AF37]" />
                Riwayat Transaksi Penjualan
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Catatan invoice resmi cabang • Filter & Sortir tanggal • Koreksi & Pengajuan Void dengan Otoritas Super Admin
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-3">
              <div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-[#D4AF37]" />
                  Total Omzet Sah
                </p>
                <p className="text-sm font-bold text-[#D4AF37]">{formatIDR(totalOmzet)}</p>
              </div>
              <div className="sm:border-l border-slate-800 sm:pl-3">
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Tunai (Masuk Laci)
                </p>
                <p className="text-sm font-bold text-emerald-400">{formatIDR(totalCash)}</p>
              </div>
              <div className="sm:border-l border-slate-800 sm:pl-3">
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Non-Tunai (QRIS)
                </p>
                <p className="text-sm font-bold text-sky-400">{formatIDR(totalQris)}</p>
              </div>
              <div className="sm:border-l border-slate-800 sm:pl-3">
                <p className="text-[10px] text-slate-400">Total Nota Tampil</p>
                <p className="text-sm font-bold text-white">
                  {filteredSales.length}{' '}
                  {voidedCount > 0 && (
                    <span className="text-[10px] font-normal text-red-400">({voidedCount} void)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Card Rangkuman Item / Kualitas (Standard, Premium, Luxury, Primescent) */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                Rangkuman Item / Kualitas (Omzet Sah)
              </p>
              {tierFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setTierFilter('ALL')}
                  className="text-[10px] text-[#D4AF37] hover:underline font-medium"
                >
                  Tampilkan Semua Kualitas
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tierSummary.map((item, idx) => {
                const isSelected = tierFilter.toLowerCase() === item.id.toLowerCase();
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTierFilter(isSelected ? 'ALL' : item.id)}
                    title={`Klik untuk filter kualitas ${item.label}`}
                    className={`text-left rounded-xl p-2 transition-all cursor-pointer ${
                      idx > 0 ? 'sm:border-l sm:border-slate-800 sm:rounded-l-none sm:pl-3' : ''
                    } ${
                      isSelected
                        ? 'bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/60'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dotClass}`} />
                      <span>{item.label}</span>
                    </p>
                    <p className={`text-sm font-bold mt-0.5 ${item.textClass}`}>
                      {formatIDR(item.omzet)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      <span className="text-slate-200 font-semibold">{item.notaCount}</span> nota
                      {' · '}
                      <span className="text-slate-200 font-semibold">{item.itemQty}</span> pcs
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/70 border-red-500/40 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-white text-xs underline ml-4"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Super Admin Alert Banner for Pending Voids */}
          {pendingVoidSales.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-amber-200 flex items-center gap-2 flex-wrap">
                    <span>Otoritas Persetujuan: {pendingVoidSales.length} Nota Mengajukan Pembatalan (Void)</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                      POS Kasir Dikunci Sementara
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-300/80">
                    Kasir mengajukan pembatalan nota. Selama menunggu approval Super Admin, POS Kasir cabang terkait dinonaktifkan sementara untuk menjaga akurasi pembukuan dan persediaan.
                  </p>
                </div>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  setStatusFilter('VOID_PENDING');
                  setDatePreset('ALL');
                }}
                className="shrink-0 text-xs py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Tampilkan Nota Void Pending ({pendingVoidSales.length})
              </Button>
            </div>
          )}

          {/* FILTER CONTROL PANEL */}
          <Card className="bg-[#0A0E1A] border-[#1E293B] p-4 space-y-4">
            {/* Row 1: Search & Super Admin Branch Selector & Sort Order */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nomor invoice, member, kasir, cabang..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Branch selector if Super Admin */}
                {isSuperAdmin && stores.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#0F172A] border border-[#1E293B] rounded-xl px-2.5 py-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL" className="bg-[#0F172A] text-slate-200">
                        Semua Toko Cabang
                      </option>
                      {stores.map((st) => (
                        <option key={st.id} value={st.id} className="bg-[#0F172A] text-slate-200">
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sort Order Selector */}
                <div className="flex items-center gap-1.5 bg-[#0F172A] border border-[#1E293B] rounded-xl px-2.5 py-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSortBy(val);
                      setSortOrder(val.includes('ASC') ? 'ASC' : 'DESC');
                    }}
                    className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="DATE_DESC" className="bg-[#0F172A] text-slate-200">
                      Waktu: Terbaru → Terlama
                    </option>
                    <option value="DATE_ASC" className="bg-[#0F172A] text-slate-200">
                      Waktu: Terlama → Terbaru
                    </option>
                    <option value="QTY_DESC" className="bg-[#0F172A] text-slate-200">
                      Item (Qty): Terbanyak → Sedikit
                    </option>
                    <option value="QTY_ASC" className="bg-[#0F172A] text-slate-200">
                      Item (Qty): Tersedikit → Banyak
                    </option>
                    <option value="AMOUNT_DESC" className="bg-[#0F172A] text-slate-200">
                      Nominal: Tertinggi → Terendah
                    </option>
                    <option value="AMOUNT_ASC" className="bg-[#0F172A] text-slate-200">
                      Nominal: Terendah → Tertinggi
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Date Range Filter (Buttons & Custom Pickers) */}
            <div className="pt-2 border-t border-[#1E293B]/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Rentang Waktu:
                </span>
                {(
                  [
                    { id: 'TODAY', label: 'Hari Ini' },
                    { id: 'YESTERDAY', label: 'Kemarin' },
                    { id: 'LAST_7', label: '7 Hari Terakhir' },
                    { id: 'THIS_MONTH', label: 'Bulan Ini' },
                    { id: 'ALL', label: 'Semua Waktu' },
                    { id: 'CUSTOM', label: 'Pilih Tanggal' },
                  ] as { id: DatePreset; label: string }[]
                ).map((preset) => {
                  const isActive = datePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setDatePreset(preset.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-sm'
                          : 'bg-[#0F172A] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Date Pickers when CUSTOM is active */}
              {datePreset === 'CUSTOM' && (
                <div className="flex items-center gap-2 bg-[#0F172A] p-1.5 rounded-xl border border-[#1E293B]">
                  <span className="text-[10px] text-slate-400">Dari:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-[#090D16] border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
                  />
                  <span className="text-[10px] text-slate-400">s/d:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-[#090D16] border border-slate-700 rounded px-2 py-0.5 text-xs text-white"
                  />
                  {(customStartDate || customEndDate) && (
                    <button
                      onClick={() => {
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-red-400 px-1"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Row 3: Payment Method & Status Filter Tabs */}
            <div className="pt-2 border-t border-[#1E293B]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              {/* Payment Method Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Metode:
                </span>
                {(
                  [
                    { id: 'ALL', label: 'Semua Metode' },
                    { id: 'CASH', label: '💵 Tunai (CASH)' },
                    { id: 'QRIS', label: '📱 QRIS' },
                    { id: 'TRANSFER', label: '🏦 Transfer' },
                  ] as { id: 'ALL' | PaymentMethod; label: string }[]
                ).map((m) => {
                  const isActive = paymentMethodFilter === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethodFilter(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-[#0F172A] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Status:
                </span>
                {(
                  [
                    { id: 'ALL', label: 'Semua' },
                    { id: 'COMPLETED', label: '✅ Selesai' },
                    { id: 'VOID_PENDING', label: '⏳ Menunggu Batal' },
                    { id: 'VOIDED', label: '❌ Dibatalkan (Void)' },
                  ] as { id: 'ALL' | SaleStatus; label: string }[]
                ).map((st) => {
                  const isActive = statusFilter === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStatusFilter(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? st.id === 'VOID_PENDING'
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : st.id === 'VOIDED'
                            ? 'bg-red-600 text-white font-bold'
                            : 'bg-emerald-600 text-white font-bold'
                          : 'bg-[#0F172A] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>

              {/* Row 4: Item Quality / Tier Filter (Standard, Premium, Luxury, Primescent) */}
              <div className="w-full pt-2 border-t border-[#1E293B]/60 flex items-center justify-between gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Item / Kualitas:
                  </span>
                  {[
                    { id: 'ALL', label: 'Semua Kualitas' },
                    { id: 'Standard', label: 'Standard' },
                    { id: 'Premium', label: 'Premium' },
                    { id: 'Luxury', label: 'Luxury' },
                    { id: 'Primescent', label: 'Primescent' },
                  ].map((t) => {
                    const isActive = tierFilter.toLowerCase() === t.id.toLowerCase();
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTierFilter(t.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-sm'
                            : 'bg-[#0F172A] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                {tierFilter !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setTierFilter('ALL')}
                    className="text-[11px] text-[#D4AF37] hover:underline"
                  >
                    Reset Filter Kualitas
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Table Transactions */}
          <Card className="overflow-hidden border-[#1E293B] bg-[#0A0E1A]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-slate-400 border-b border-[#1E293B] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Cabang</th>
                    <th className="py-3 px-4">Kasir</th>
                    <th className="py-3 px-4">Member</th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-[#D4AF37] select-none"
                      onClick={() => {
                        setSortBy(sortBy === 'QTY_DESC' ? 'QTY_ASC' : 'QTY_DESC');
                      }}
                      title="Klik untuk mengurutkan berdasarkan jumlah item"
                    >
                      <div className="flex items-center gap-1">
                        <span>Item</span>
                        <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Metode</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Total Akhir</th>
                    <th className="py-3 px-4 text-center">Aksi & Otoritas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60">
                  {filteredSales.map((s) => {
                    const itemCount = s.items?.reduce((a, b) => a + b.quantity, 0) || 0;
                    const paymentMethod = s.payments?.[0]?.payment_method || 'CASH';
                    const isVoided = s.sale_status === 'VOIDED';
                    const isVoidPending = s.sale_status === 'VOID_PENDING';

                    return (
                      <tr
                        key={s.id}
                        className={`transition-colors ${
                          isVoided
                            ? 'bg-red-950/20 opacity-70 hover:opacity-100 hover:bg-red-950/30'
                            : isVoidPending
                            ? 'bg-amber-950/25 hover:bg-amber-950/40'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-semibold">
                          <span
                            className={
                              isVoided
                                ? 'text-red-400 line-through'
                                : isVoidPending
                                ? 'text-amber-400'
                                : 'text-[#D4AF37]'
                            }
                          >
                            {s.invoice_number}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {formatDateTimeJakarta(s.created_at)}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{s.store?.name}</td>
                        <td className="py-3 px-4 text-slate-300">{s.cashier?.full_name}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {s.member ? (
                            <span className="font-medium text-emerald-400">{s.member.name}</span>
                          ) : (
                            <span className="text-slate-500 italic">Non-member</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <div className="font-mono">{itemCount} pcs</div>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setTierFilter(s.perfume_tier || 'Standard');
                            }}
                            title={`Filter transaksi ${s.perfume_tier || 'Standard'}`}
                            className={`inline-block px-1.5 py-0.2 text-[9px] font-bold rounded uppercase mt-0.5 border cursor-pointer hover:scale-105 transition-transform ${
                              s.perfume_tier === 'Primescent'
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                                : s.perfume_tier === 'Luxury'
                                ? 'bg-purple-950/70 text-purple-300 border-purple-800'
                                : s.perfume_tier === 'Premium'
                                ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {s.perfume_tier || 'Standard'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              paymentMethod === 'CASH'
                                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                                : paymentMethod === 'QRIS'
                                ? 'bg-sky-950/50 text-sky-400 border-sky-800/60'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isVoided ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                              <XCircle className="w-3 h-3" />
                              VOIDED
                            </span>
                          ) : isVoidPending ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                              <Clock className="w-3 h-3" />
                              Menunggu Approval
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-800/60">
                              <Check className="w-3 h-3" />
                              Selesai
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white font-mono">
                          <span className={isVoided ? 'text-red-400 line-through' : ''}>
                            {formatIDR(s.final_amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSale(s)}
                              className="h-7 px-2 text-xs text-slate-300 hover:text-white"
                              title="Lihat Rincian Item"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Detail
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setReceiptSaleToPrint(s)}
                              className="h-7 px-2 text-xs text-[#D4AF37] hover:text-[#E5C365]"
                              title="Cetak Struk Thermal & Bluetooth"
                            >
                              <Printer className="w-3.5 h-3.5 mr-1" />
                              Struk
                            </Button>

                            {/* Void Action: Kasir Ajukan Batal (Jika masih COMPLETED) */}
                            {s.sale_status === 'COMPLETED' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSaleToVoid(s);
                                  setVoidReasonCategory(QUICK_VOID_REASONS[0]);
                                  setVoidReasonNotes('');
                                }}
                                className="h-7 px-2 text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-rose-900/40"
                                title="Salah transaksi / transaksi gagal? Klik untuk ajukan batal ke Super Admin"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-400" />
                                Ajukan Batal
                              </Button>
                            )}

                            {/* Void Pending: Super Admin Approval Button */}
                            {isVoidPending && isSuperAdmin && (
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={() => {
                                  setSaleToReview(s);
                                  setAdminDecisionNotes('');
                                }}
                                className="h-7 px-2.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                                Tinjau Void
                              </Button>
                            )}

                            {/* Void Pending: Kasir Indication */}
                            {isVoidPending && !isSuperAdmin && (
                              <span className="text-[10px] text-amber-400 italic px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-900/40">
                                Proses Admin
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredSales.length === 0 && !loading && (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-500">
                        Tidak ada riwayat transaksi yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      {/* MODAL 1: DETAIL TRANSAKSI */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={`Detail Transaksi — ${selectedSale?.invoice_number || ''}`}
      >
        {selectedSale && (
          <div className="space-y-4 text-xs">
            {/* Status Alert if Voided or Void Pending */}
            {selectedSale.sale_status === 'VOIDED' && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-red-300">
                  <XCircle className="w-4 h-4 text-red-400" />
                  NOTA DIBATALKAN (VOID)
                </div>
                <p>
                  <strong>Alasan:</strong> {selectedSale.void_reason || '-'}
                </p>
                {selectedSale.void_approved_admin && (
                  <p className="text-[11px] text-red-300/80">
                    Disetujui oleh: {selectedSale.void_approved_admin.full_name} (
                    {formatDateTimeJakarta(selectedSale.void_approved_at || '')})
                  </p>
                )}
                {selectedSale.void_notes && (
                  <p className="text-[11px] italic">Catatan: {selectedSale.void_notes}</p>
                )}
              </div>
            )}

            {selectedSale.sale_status === 'VOID_PENDING' && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  PENGAJUAN PEMBATALAN MENUNGGU APPROVAL SUPER ADMIN
                </div>
                <p>
                  <strong>Alasan Pengajuan Kasir:</strong> {selectedSale.void_reason || '-'}
                </p>
                {selectedSale.void_requested_cashier && (
                  <p className="text-[11px] text-amber-300/80">
                    Diajukan oleh: {selectedSale.void_requested_cashier.full_name} (
                    {formatDateTimeJakarta(selectedSale.void_requested_at || '')})
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div>
                <p className="text-slate-400">Tanggal:</p>
                <p className="font-semibold text-white">{formatDateTimeJakarta(selectedSale.created_at)}</p>
              </div>
              <div>
                <p className="text-slate-400">Kasir:</p>
                <p className="font-semibold text-white">{selectedSale.cashier?.full_name}</p>
              </div>
              <div>
                <p className="text-slate-400">Cabang:</p>
                <p className="font-semibold text-white">{selectedSale.store?.name}</p>
              </div>
              <div>
                <p className="text-slate-400">Pelanggan:</p>
                <p className="font-semibold text-emerald-400">{selectedSale.member?.name || 'Walk-in'}</p>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Klasifikasi Jenis Parfum:</span>
                <span className="font-bold text-amber-300 uppercase px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60">
                  {selectedSale.perfume_tier || 'Standard'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="font-bold text-slate-300">Rincian Barang Terjual:</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedSale.items?.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.product?.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.quantity} x {formatIDR(item.unit_price)}
                        {item.discount_amount > 0 && ` (Diskon: -${formatIDR(item.discount_amount)})`}
                      </p>
                    </div>
                    <span className="font-bold text-[#D4AF37]">{formatIDR(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-right">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>{formatIDR(selectedSale.subtotal)}</span>
              </div>
              {selectedSale.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Diskon:</span>
                  <span>-{formatIDR(selectedSale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
                <span>Total Akhir:</span>
                <span className={selectedSale.sale_status === 'VOIDED' ? 'text-red-400 line-through' : 'text-[#D4AF37]'}>
                  {formatIDR(selectedSale.final_amount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="gold"
                onClick={() => setReceiptSaleToPrint(selectedSale)}
                className="flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk Thermal / Bluetooth
              </Button>
              <Button variant="ghost" onClick={() => setSelectedSale(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: AJUKAN BATAL (VOID) OLEH KASIR */}
      <Modal
        isOpen={!!saleToVoid}
        onClose={() => setSaleToVoid(null)}
        title={`Pengajuan Pembatalan Nota — ${saleToVoid?.invoice_number || ''}`}
      >
        {saleToVoid && (
          <form onSubmit={handleSubmitVoidRequest} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice:</span>
                <span className="font-mono font-bold text-[#D4AF37]">{saleToVoid.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Transaksi:</span>
                <span className="text-white">{formatDateTimeJakarta(saleToVoid.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Metode Bayar:</span>
                <span className="font-semibold text-white">{saleToVoid.payments?.[0]?.payment_method || 'CASH'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1 text-sm font-bold">
                <span className="text-slate-300">Total Belanja:</span>
                <span className="text-emerald-400">{formatIDR(saleToVoid.final_amount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Alasan Pembatalan / Kesalahan Transaksi <span className="text-red-400">*</span>
              </label>
              <select
                value={voidReasonCategory}
                onChange={(e) => setVoidReasonCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-[#D4AF37]"
              >
                {QUICK_VOID_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Detail Catatan / Keterangan Tambahan:
              </label>
              <textarea
                rows={3}
                required={voidReasonCategory === 'Lainnya'}
                placeholder="Jelaskan detail kesalahan (misal: pembeli ganti bibit dari mawar ke biogreen, atau QRIS tidak kunjung berhasil)..."
                value={voidReasonNotes}
                onChange={(e) => setVoidReasonNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-[#D4AF37]"
              />
            </div>

            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-200 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                SOP Keamanan & Anti-Fraud:
              </p>
              <p>
                Pengajuan ini akan langsung diteruskan ke Super Admin. Setelah disetujui, stok bahan/botol akan otomatis
                dikembalikan dan saldo kas laci dikoreksi, lalu Anda dapat menginput ulang transaksi yang benar di POS.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setSaleToVoid(null)}>
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submittingVoid}
                className="bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                {submittingVoid ? 'Mengirim...' : 'Kirim Pengajuan ke Super Admin'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: TINJAU APPROVAL VOID (KHUSUS SUPER ADMIN) */}
      <Modal
        isOpen={!!saleToReview}
        onClose={() => setSaleToReview(null)}
        title={`Otoritas Persetujuan Void — ${saleToReview?.invoice_number || ''}`}
      >
        {saleToReview && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">Pengajuan Pembatalan Transaksi</span>
                <span className="font-mono text-[11px] text-slate-300">{saleToReview.invoice_number}</span>
              </div>
              <p className="text-white">
                <strong>Cabang:</strong> {saleToReview.store?.name} &bull; <strong>Kasir:</strong>{' '}
                {saleToReview.cashier?.full_name}
              </p>
              <p className="text-white">
                <strong>Alasan Kasir:</strong>{' '}
                <span className="text-amber-200 font-semibold">{saleToReview.void_reason}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Waktu Diajukan: {formatDateTimeJakarta(saleToReview.void_requested_at || saleToReview.created_at)}
              </p>
            </div>

            {/* Rincian rollback impact */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <p className="font-bold text-slate-300">Dampak Otomatis Jika Disetujui:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                <li>
                  <strong className="text-emerald-400">Rollback Stok:</strong>{' '}
                  {saleToReview.items?.map((it) => `${it.product?.name} (${it.quantity})`).join(', ')} akan otomatis
                  dikembalikan ke stok toko cabang {saleToReview.store?.name}.
                </li>
                <li>
                  <strong className="text-sky-400">Koreksi Kas Masuk:</strong> Saldo kas masuk sesi kasir sebesar{' '}
                  <span className="font-mono font-bold text-white">{formatIDR(saleToReview.final_amount)}</span> akan
                  dikurangi agar rekonsiliasi laci kas tetap 100% klop.
                </li>
                <li>
                  <strong className="text-amber-400">Status Nota:</strong> Diubah resmi menjadi{' '}
                  <span className="font-bold text-red-400">VOIDED</span> dan tercatat di Audit Trail.
                </li>
              </ul>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Catatan Super Admin (Opsional):
              </label>
              <input
                type="text"
                placeholder="Contoh: Disetujui setelah konfirmasi dengan kasir"
                value={adminDecisionNotes}
                onChange={(e) => setAdminDecisionNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <Button
                variant="ghost"
                disabled={submittingAdminDecision}
                onClick={() => setSaleToReview(null)}
              >
                Batal
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={submittingAdminDecision}
                  onClick={() => handleAdminVoidDecision('REJECT_VOID')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs"
                >
                  Tolak Pengajuan
                </Button>
                <Button
                  variant="gold"
                  disabled={submittingAdminDecision}
                  onClick={() => handleAdminVoidDecision('APPROVE_VOID')}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                >
                  {submittingAdminDecision ? 'Memproses...' : 'Setujui & Rollback Stok/Kas'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: CETAK STRUK THERMAL & BLUETOOTH */}
      <Modal
        isOpen={!!receiptSaleToPrint}
        onClose={() => setReceiptSaleToPrint(null)}
        title="Cetak Ulang Struk Thermal (Reprint)"
      >
        {receiptSaleToPrint && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Ukuran Printer Thermal:</span>
              <div className="flex gap-1">
                {(['58mm', '80mm'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setReceiptPaperSize(size)}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                      receiptPaperSize === size
                        ? 'bg-[#D4AF37] text-black font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* RECEIPT PAPER CONTAINER */}
            <div className="flex justify-center bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
              <div
                id="thermal-receipt"
                style={{ width: receiptPaperSize === '58mm' ? '280px' : '380px' }}
                className="bg-white text-black p-4 rounded shadow-2xl font-mono text-[11px] leading-tight select-none"
              >
                {/* Header Struk */}
                <div className="text-center pb-2 border-b border-dashed border-gray-400">
                  <div className="flex justify-center mb-1">
                    <img src="/logo-black.png" alt="BB Parfum" className="w-9 h-9 object-contain" />
                  </div>
                  <p className="font-bold text-sm tracking-wider">BB PARFUM PREMIUM</p>
                  <p className="text-[10px] text-gray-700">
                    {receiptSaleToPrint.store?.name || user?.assigned_store?.name || 'Cabang Kendal'}
                  </p>
                  <p className="text-[9px] text-gray-600">
                    {receiptSaleToPrint.store?.address || user?.assigned_store?.address || 'Kendal, Jawa Tengah'}
                  </p>
                  <p className="text-[9px] text-gray-600">
                    Telp: {receiptSaleToPrint.store?.phone || user?.assigned_store?.phone || '-'}
                  </p>
                </div>

                {/* Meta Struk */}
                <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>No: {receiptSaleToPrint.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wkt: {formatDateTimeJakarta(receiptSaleToPrint.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kasir: {receiptSaleToPrint.cashier?.full_name || user?.full_name || 'Kasir'}</span>
                  </div>
                  {receiptSaleToPrint.member && (
                    <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-dotted border-gray-300">
                      <span>Member: {receiptSaleToPrint.member.name}</span>
                    </div>
                  )}
                </div>

                {/* Item List */}
                <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-gray-700 pb-1 border-b border-dotted border-gray-300 uppercase tracking-wider">
                    <span>Ingredients</span>
                    <span>Takaran</span>
                  </div>
                  {receiptSaleToPrint.items?.map((it) => {
                    const unit = formatProductUnit(it.product);
                    return (
                      <div key={it.id} className="flex justify-between text-[10px]">
                        <span className="font-semibold truncate max-w-[70%]">{it.product?.name}</span>
                        <span className="text-gray-800 font-medium">
                          {it.quantity} {unit}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Struk */}
                <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
                  {(receiptSaleToPrint.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Diskon:</span>
                      <span>-{formatIDR(receiptSaleToPrint.discount_amount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-0.5">
                    <span>TOTAL PEMBAYARAN:</span>
                    <span>{formatIDR(receiptSaleToPrint.final_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span>Bayar ({receiptSaleToPrint.payments?.[0]?.payment_method || 'CASH'}):</span>
                    <span>
                      {formatIDR(
                        receiptSaleToPrint.payments?.[0]?.amount || receiptSaleToPrint.final_amount || 0
                      )}
                    </span>
                  </div>
                  {receiptSaleToPrint.payments?.[0]?.payment_method === 'CASH' && (
                    <div className="flex justify-between">
                      <span>Kembali:</span>
                      <span>{formatIDR(receiptSaleToPrint.payments?.[0]?.change_amount || 0)}</span>
                    </div>
                  )}
                  {receiptSaleToPrint.points_earned !== undefined && receiptSaleToPrint.points_earned > 0 && (
                    <div className="flex justify-between font-bold text-emerald-700 pt-1 border-t border-dashed border-gray-300">
                      <span>Reward Poin Didapat:</span>
                      <span>+{receiptSaleToPrint.points_earned.toLocaleString('id-ID')} Poin</span>
                    </div>
                  )}
                </div>

                {/* Footer Struk */}
                <div className="text-center pt-3 text-[9px] text-gray-600 space-y-0.5">
                  <p className="font-bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
                  <p>Barang yang sudah dibeli tidak dapat ditukar</p>
                  <p>kecuali ada perjanjian retur resmi.</p>
                  <p className="pt-1 text-[8px] text-gray-400">BB Parfum Management System</p>
                </div>
              </div>
            </div>

            {/* Status Bluetooth Notification */}
            {btStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                  btStatusMsg.startsWith('✓')
                    ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bluetooth className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{btStatusMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBtStatusMsg(null)}
                  className="text-xs opacity-60 hover:opacity-100"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Action Buttons for Printing */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handlePrintBluetooth}
                disabled={btPrinting}
                className="w-full h-12 min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 active:scale-[0.98] transition touch-manipulation disabled:opacity-50"
              >
                <Bluetooth className={`w-5 h-5 ${btPrinting ? 'animate-spin' : ''}`} />
                <span>
                  {btPrinting
                    ? 'Sedang Mengirim ke Printer Bluetooth...'
                    : btPrinterName
                    ? `Cetak Ulang ke ${btPrinterName} (Bluetooth)`
                    : 'Hubungkan & Cetak Thermal Bluetooth'}
                </span>
              </button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    window.open(`/cashier/receipt/${receiptSaleToPrint.id}?size=${receiptPaperSize}`, '_blank');
                  }}
                  className="w-full sm:w-auto text-xs"
                >
                  Buka Tab Cetak Baru
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Browser</span>
                  </Button>

                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => setReceiptSaleToPrint(null)}
                    className="flex-1 sm:flex-initial text-xs font-bold"
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
