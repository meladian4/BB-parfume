'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDateTimeJakarta, formatProductUnit } from '@/lib/formatters';
import { InventoryBalance, Store, StockMovement, UserProfile } from '@/types/domain';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  Store as StoreIcon,
  History,
  RefreshCw,
  Package,
  Sparkles,
} from 'lucide-react';

type StockStatusFilter = 'ALL' | 'ALERT_ALL' | 'LOW' | 'EMPTY' | 'SAFE';
type ProductTypeFilter = 'ALL' | 'BIBIT' | 'BOTOL' | 'PELARUT';
type SortOption = 'STOCK_ASC' | 'STOCK_DESC' | 'NAME_ASC' | 'NAME_DESC';

export default function CashierInventoryPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('STOCK_ASC');

  // Modal Riwayat Kartu Stok
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [activeBalance, setActiveBalance] = useState<InventoryBalance | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (selectedStoreId) {
      loadBalances(selectedStoreId);
    }
  }, [selectedStoreId]);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        fetch('/api/users/me').then((r) => r.json()).catch(() => ({})),
        fetch('/api/stores').then((r) => r.json()).catch(() => ({})),
      ]);

      const curUser: UserProfile | null = uRes?.user || null;
      const storeList: Store[] = sRes?.data || sRes?.stores || [];
      const retailStores = Array.isArray(storeList)
        ? storeList.filter((s) => s.type === 'STORE')
        : [];

      setUser(curUser);
      setStores(retailStores.length > 0 ? retailStores : storeList);

      const defaultStoreId =
        curUser?.assigned_store_id ||
        retailStores[0]?.id ||
        storeList[0]?.id ||
        'a0000000-0000-0000-0000-000000000002';

      setSelectedStoreId(defaultStoreId);
    } catch (err) {
      console.error('Failed to load initial cashier inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async (storeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/inventory?storeId=${storeId}`).then((r) => r.json());
      const data = res?.data || res?.balances || [];
      setBalances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load store inventory balances:', err);
    } finally {
      setLoading(false);
    }
  };

  // Deteksi tipe produk & batas peringatan stok:
  // - Bibit Parfum / Pelarut (satuan ml) -> peringatan jika <= 50 ml
  // - Botol Kemasan / Siap Pakai (satuan pcs) -> peringatan jika <= 5 pcs
  const getProductCategoryGroup = (prod?: any): 'BIBIT' | 'BOTOL' | 'PELARUT' => {
    const pType = prod?.product_type?.toUpperCase() || '';
    const name = (prod?.name || '').toLowerCase();
    const unit = formatProductUnit(prod);

    if (pType === 'BOTOL' || pType === 'READY_TO_WEAR' || unit === 'pcs' || name.includes('botol')) {
      return 'BOTOL';
    }
    if (pType === 'PELARUT' || name.includes('absolut') || name.includes('alkohol') || name.includes('pelarut')) {
      return 'PELARUT';
    }
    return 'BIBIT';
  };

  const getWarningThreshold = (prod?: any): number => {
    const group = getProductCategoryGroup(prod);
    if (group === 'BOTOL') return 5; // 5 pcs untuk botol
    return 50; // 50 ml untuk bibit & pelarut
  };

  const getStockCondition = (item: InventoryBalance): 'EMPTY' | 'LOW' | 'SAFE' => {
    const qty = Number(item.quantity) || 0;
    const threshold = getWarningThreshold(item.product);
    if (qty <= 0) return 'EMPTY';
    if (qty <= threshold) return 'LOW';
    return 'SAFE';
  };

  // Filter dasar (pencarian + tipe produk) sebelum filter status stok
  const baseFiltered = useMemo(() => {
    return balances.filter((b) => {
      if (typeFilter !== 'ALL') {
        const grp = getProductCategoryGroup(b.product);
        if (grp !== typeFilter) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = b.product?.name?.toLowerCase() || '';
        const sku = b.product?.sku?.toLowerCase() || '';
        const barcode = b.product?.barcode?.toLowerCase() || '';
        if (!name.includes(q) && !sku.includes(q) && !barcode.includes(q)) return false;
      }
      return true;
    });
  }, [balances, typeFilter, search]);

  // Hitungan untuk Card Info Rangkuman
  const summaryStats = useMemo(() => {
    let safe = 0;
    let low = 0;
    let empty = 0;
    baseFiltered.forEach((b) => {
      const cond = getStockCondition(b);
      if (cond === 'EMPTY') empty++;
      else if (cond === 'LOW') low++;
      else safe++;
    });
    return {
      total: baseFiltered.length,
      safe,
      low,
      empty,
      alertTotal: low + empty,
    };
  }, [baseFiltered]);

  // Filter status + Sort by Stock
  const displayedBalances = useMemo(() => {
    return baseFiltered
      .filter((b) => {
        const cond = getStockCondition(b);
        if (statusFilter === 'ALERT_ALL') return cond === 'LOW' || cond === 'EMPTY';
        if (statusFilter === 'LOW') return cond === 'LOW';
        if (statusFilter === 'EMPTY') return cond === 'EMPTY';
        if (statusFilter === 'SAFE') return cond === 'SAFE';
        return true;
      })
      .sort((a, b) => {
        const qtyA = Number(a.quantity) || 0;
        const qtyB = Number(b.quantity) || 0;
        const nameA = a.product?.name || '';
        const nameB = b.product?.name || '';

        if (sortBy === 'STOCK_ASC') return qtyA - qtyB;
        if (sortBy === 'STOCK_DESC') return qtyB - qtyA;
        if (sortBy === 'NAME_DESC') return nameB.localeCompare(nameA, 'id-ID');
        return nameA.localeCompare(nameB, 'id-ID');
      });
  }, [baseFiltered, statusFilter, sortBy]);

  const handleOpenMovements = async (item: InventoryBalance) => {
    setActiveBalance(item);
    setIsMovementModalOpen(true);
    setLoadingMovements(true);
    try {
      const res = await fetch(
        `/api/inventory/movements?storeId=${item.store_id}&productId=${item.product_id}`
      ).then((r) => r.json());
      setMovements(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load stock movements:', err);
    } finally {
      setLoadingMovements(false);
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const currentStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans">
      <Topbar user={user || undefined} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar role={user?.role || 'CASHIER'} />

        <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#D4AF37]" />
                Manajemen &amp; Pengecekan Stok Toko
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Pantau ketersediaan stok cabang secara real-time • Standar Peringatan: Bibit &le; 50 ml &amp; Botol &le; 5 pcs
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Lokasi Toko Cabang */}
              <div className="flex items-center gap-2 bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs">
                <StoreIcon className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-slate-400">Lokasi:</span>
                {isSuperAdmin ? (
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0F172A]">
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-semibold text-white">
                    {currentStore?.name || 'Toko Cabang Anda'}{' '}
                    <span className="text-[#D4AF37] font-mono text-[10px]">
                      ({currentStore?.code || 'CABANG'})
                    </span>
                  </span>
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => selectedStoreId && loadBalances(selectedStoreId)}
                className="flex items-center gap-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Stok
              </Button>
            </div>
          </div>

          {/* Alert Banner Peringatan Stok Menipis / Habis */}
          {summaryStats.alertTotal > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-200">
                    Peringatan Stok Toko: Ada {summaryStats.alertTotal} Item Perlu Perhatian ({summaryStats.low} Menipis, {summaryStats.empty} Habis)
                  </p>
                  <p className="text-amber-300/80 mt-0.5">
                    Ambang peringatan otomatis: <strong>Bibit Parfum &le; 50 ml</strong> dan <strong>Botol Kemasan &le; 5 pcs</strong>. Segera koordinasikan mutasi stok dengan Logistik Gudang.
                  </p>
                </div>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() =>
                  setStatusFilter(statusFilter === 'ALERT_ALL' ? 'ALL' : 'ALERT_ALL')
                }
                className="shrink-0 text-xs font-bold"
              >
                {statusFilter === 'ALERT_ALL'
                  ? 'Tampilkan Semua Stok'
                  : `Filter Stok Menipis (${summaryStats.alertTotal})`}
              </Button>
            </div>
          )}

          {/* Card Info Rangkuman Stok Toko */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                Rangkuman Kondisi Stok Toko (Bibit &le; 50 ml • Botol &le; 5 pcs)
              </p>
              {statusFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className="text-[10px] text-[#D4AF37] hover:underline font-medium"
                >
                  Tampilkan Semua Status
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`text-left rounded-xl p-2 transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/60'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Total Semua Item</span>
                </p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">
                  {summaryStats.total} <span className="text-xs font-medium text-slate-400">item</span>
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'SAFE' ? 'ALL' : 'SAFE')}
                className={`text-left rounded-xl p-2 transition-all cursor-pointer sm:border-l sm:border-slate-800 sm:rounded-l-none sm:pl-3 ${
                  statusFilter === 'SAFE'
                    ? 'bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/60'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Stok Aman</span>
                </p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {summaryStats.safe} <span className="text-xs font-medium text-slate-400">item</span>
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'LOW' ? 'ALL' : 'LOW')}
                className={`text-left rounded-xl p-2 transition-all cursor-pointer sm:border-l sm:border-slate-800 sm:rounded-l-none sm:pl-3 ${
                  statusFilter === 'LOW'
                    ? 'bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/60'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Peringatan Menipis (&le;50ml / &le;5pcs)</span>
                </p>
                <p className="text-sm font-bold text-amber-400 mt-0.5">
                  {summaryStats.low} <span className="text-xs font-medium text-slate-400">item</span>
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'EMPTY' ? 'ALL' : 'EMPTY')}
                className={`text-left rounded-xl p-2 transition-all cursor-pointer sm:border-l sm:border-slate-800 sm:rounded-l-none sm:pl-3 ${
                  statusFilter === 'EMPTY'
                    ? 'bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/60'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Stok Habis (0)</span>
                </p>
                <p className="text-sm font-bold text-rose-400 mt-0.5">
                  {summaryStats.empty} <span className="text-xs font-medium text-slate-400">item</span>
                </p>
              </button>
            </div>
          </div>

          {/* Search, Filter Tipe & Sort by Stock Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative max-w-md flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama parfum, botol, SKU, atau barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              {/* Sort by Stock */}
              <div className="flex items-center gap-2 bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="text-slate-400">Urutkan Stok:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="STOCK_ASC" className="bg-[#0F172A]">
                    Stok: Paling Sedikit &rarr; Terbanyak
                  </option>
                  <option value="STOCK_DESC" className="bg-[#0F172A]">
                    Stok: Terbanyak &rarr; Paling Sedikit
                  </option>
                  <option value="NAME_ASC" className="bg-[#0F172A]">
                    Nama Barang: A &rarr; Z
                  </option>
                  <option value="NAME_DESC" className="bg-[#0F172A]">
                    Nama Barang: Z &rarr; A
                  </option>
                </select>
              </div>
            </div>

            {/* Filter Jenis Barang (Bibit / Botol / Pelarut) */}
            <div className="pt-2 border-t border-[#1E293B]/60 flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Jenis Barang:
                </span>
                {(
                  [
                    { id: 'ALL', label: 'Semua Barang' },
                    { id: 'BIBIT', label: 'Bibit Parfum (Peringatan ≤ 50 ml)' },
                    { id: 'BOTOL', label: 'Botol & Kemasan (Peringatan ≤ 5 pcs)' },
                    { id: 'PELARUT', label: 'Pelarut & Campuran (≤ 50 ml)' },
                  ] as { id: ProductTypeFilter; label: string }[]
                ).map((t) => {
                  const isActive = typeFilter === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTypeFilter(t.id)}
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
            </div>
          </div>

          {/* Tabel Daftar Stok Toko */}
          <Card className="overflow-hidden border-[#1E293B] bg-[#0A0E1A]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-slate-400 border-b border-[#1E293B] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">SKU &amp; Nama Barang</th>
                    <th className="py-3 px-4">Jenis &amp; Batas Peringatan</th>
                    <th className="py-3 px-4 text-right">Sisa Stok Fisik</th>
                    <th className="py-3 px-4 text-center">Status Peringatan</th>
                    <th className="py-3 px-4 text-center">Kartu Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        Memuat data stok toko...
                      </td>
                    </tr>
                  ) : displayedBalances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-500">
                        Tidak ada barang yang cocok dengan filter ini.
                      </td>
                    </tr>
                  ) : (
                    displayedBalances.map((item) => {
                      const prod = item.product;
                      const unit = formatProductUnit(prod);
                      const group = getProductCategoryGroup(prod);
                      const threshold = getWarningThreshold(prod);
                      const cond = getStockCondition(item);
                      const qty = Number(item.quantity) || 0;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            cond === 'EMPTY'
                              ? 'bg-rose-950/20 hover:bg-rose-950/30'
                              : cond === 'LOW'
                              ? 'bg-amber-950/15 hover:bg-amber-950/25'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <p className="font-semibold text-white">{prod?.name || 'Produk'}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              SKU: <span className="text-[#E5C365]">{prod?.sku || '-'}</span>
                              {prod?.barcode ? ` • Barcode: ${prod.barcode}` : ''}
                            </p>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                group === 'BOTOL'
                                  ? 'bg-sky-950/60 text-sky-300 border-sky-800/60'
                                  : group === 'PELARUT'
                                  ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                                  : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              }`}
                            >
                              {group === 'BOTOL'
                                ? 'BOTOL & KEMASAN'
                                : group === 'PELARUT'
                                ? 'PELARUT'
                                : 'BIBIT PARFUM'}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Batas Peringatan: <strong className="text-slate-200">&le; {threshold} {unit}</strong>
                            </p>
                          </td>

                          <td className="py-3 px-4 text-right font-mono">
                            <span
                              className={`text-base font-black ${
                                cond === 'EMPTY'
                                  ? 'text-rose-400'
                                  : cond === 'LOW'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {qty.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-1">{unit}</span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {cond === 'EMPTY' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                STOK HABIS (0 {unit})
                              </span>
                            ) : cond === 'LOW' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                PERINGATAN STOK (&le; {threshold} {unit})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                STOK AMAN
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenMovements(item)}
                              className="h-7 px-2.5 text-xs text-slate-300 hover:text-white"
                            >
                              <History className="w-3.5 h-3.5 mr-1 text-[#D4AF37]" />
                              Riwayat
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>

      {/* Modal Riwayat Kartu Stok Produk di Toko */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title={`Riwayat Kartu Stok — ${activeBalance?.product?.name || ''}`}
        description={`Lokasi: ${currentStore?.name || 'Toko Cabang'} • Sisa Stok Saat Ini: ${
          activeBalance?.quantity ?? 0
        } ${formatProductUnit(activeBalance?.product)}`}
      >
        <div className="space-y-4 text-xs">
          <div className="max-h-72 overflow-y-auto space-y-2">
            {loadingMovements ? (
              <p className="text-center py-6 text-slate-400">Memuat riwayat keluar-masuk stok...</p>
            ) : movements.length === 0 ? (
              <p className="text-center py-6 text-slate-500">Belum ada riwayat pergerakan stok untuk barang ini.</p>
            ) : (
              movements.map((mv) => {
                const isIn = mv.quantity_delta > 0;
                const unit = formatProductUnit(activeBalance?.product);
                return (
                  <div
                    key={mv.id}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isIn
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {mv.movement_type}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 ml-2">
                        {mv.reference_id || '-'}
                      </span>
                      <p className="text-[11px] text-slate-300 mt-1">{mv.notes || '-'}</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {formatDateTimeJakarta(mv.created_at)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <p className={`text-sm font-bold ${isIn ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isIn ? `+${mv.quantity_delta}` : mv.quantity_delta} {unit}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Saldo: {mv.balance_after} {unit}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setIsMovementModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
