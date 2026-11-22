'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { InventoryBalance, Store, Product, StockMovement, StockMovementType } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatIDR, formatDateTimeJakarta, formatProductUnit } from '@/lib/formatters';
import {
  Boxes,
  Search,
  Filter,
  History,
  Edit3,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Barcode,
  CheckCircle,
} from 'lucide-react';

function InventoryPageContent() {
  const searchParams = useSearchParams();
  const initialStoreId = searchParams.get('storeId') || '';

  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal Kartu Stok (Movement Ledger)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [activeItemForMovement, setActiveItemForMovement] = useState<InventoryBalance | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Modal Penyesuaian Stok (Adjustment)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [activeItemForAdjust, setActiveItemForAdjust] = useState<InventoryBalance | null>(null);
  const [physicalCount, setPhysicalCount] = useState<string>('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedStoreId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const storeParam = selectedStoreId ? `?storeId=${selectedStoreId}` : '';
      const [balRes, storeRes] = await Promise.all([
        fetch(`/api/inventory${storeParam}`).then((r) => r.json()),
        fetch('/api/stores').then((r) => r.json()),
      ]);
      const balData = balRes?.data || balRes?.balances || [];
      const storeData = storeRes?.data || storeRes?.stores || [];
      setBalances(Array.isArray(balData) ? balData : []);
      setStores(Array.isArray(storeData) ? storeData : []);
    } catch (e) {
      console.error('Failed to load inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  const getUnit = (prod?: any) => {
    return formatProductUnit(prod);
  };

  const filteredBalances = balances.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const prodName = b.product?.name.toLowerCase() || '';
    const sku = b.product?.sku.toLowerCase() || '';
    const barcode = b.product?.barcode?.toLowerCase() || '';
    return prodName.includes(q) || sku.includes(q) || barcode.includes(q);
  });

  // Buka Kartu Stok Modal
  const openMovements = async (item: InventoryBalance) => {
    setActiveItemForMovement(item);
    setIsMovementModalOpen(true);
    setLoadingMovements(true);
    try {
      const res = await fetch(`/api/inventory/movements?storeId=${item.store_id}&productId=${item.product_id}`).then((r) => r.json());
      setMovements(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load movements:', e);
    } finally {
      setLoadingMovements(false);
    }
  };

  // Buka Modal Penyesuaian Stok
  const openAdjust = (item: InventoryBalance) => {
    setActiveItemForAdjust(item);
    setPhysicalCount(String(item.quantity));
    setAdjustNotes('');
    setAdjustError('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItemForAdjust) return;

    setAdjustSubmitting(true);
    setAdjustError('');

    try {
      const targetQty = parseFloat(physicalCount);
      if (isNaN(targetQty) || targetQty < 0) {
        throw new Error('Kuantitas fisik harus berupa angka valid >= 0.');
      }

      if (!adjustNotes.trim()) {
        throw new Error('Alasan penyesuaian wajib diisi.');
      }

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: activeItemForAdjust.store_id,
          product_id: activeItemForAdjust.product_id,
          physical_quantity: targetQty,
          notes: adjustNotes.trim(),
          user_id: 'Kepala Logistik Kendal',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyesuaikan stok.');
      }

      setIsAdjustModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setAdjustError(err instanceof Error ? err.message : 'Gagal menyesuaikan stok.');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case 'PURCHASE_RECEIPT':
        return <Badge variant="emerald" size="sm">Penerimaan Supplier</Badge>;
      case 'TRANSFER_IN':
        return <Badge variant="blue" size="sm">Mutasi Masuk</Badge>;
      case 'TRANSFER_OUT':
        return <Badge variant="amber" size="sm">Mutasi Keluar</Badge>;
      case 'SALE':
        return <Badge variant="rose" size="sm">Penjualan Kasir</Badge>;
      case 'SALE_RETURN':
        return <Badge variant="emerald" size="sm">Retur Penjualan</Badge>;
      case 'ADJUSTMENT':
        return <Badge variant="gold" size="sm">Penyesuaian Fisik</Badge>;
      case 'STOCK_OPNAME':
        return <Badge variant="slate" size="sm">Stock Opname</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#D4AF37]" />
            <span>Kartu Saldo Persediaan & HPP Bergerak</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Data persediaan terintegrasi 1 Gudang Pusat dan 3 Cabang (Kendal Kota, Pegandon, Kaliwungu) dengan pencegahan stok negatif.
          </p>
        </div>
        <Button variant="secondary" onClick={loadData} className="border-slate-800">
          <RefreshCw className="w-4 h-4 mr-1.5" />
          <span>Muat Ulang Saldo</span>
        </Button>
      </div>

      {/* Filter and Store Selector */}
      <Card bordered className="bg-[#0F172A]/80 p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="w-full md:w-80">
            <Input
              placeholder="Cari parfum, SKU, atau barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#D4AF37] w-full md:w-72"
            >
              <option value="">Semua Lokasi (Gudang & 3 Cabang)</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - {s.type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Balances Table */}
      <Card bordered className="bg-[#0F172A]/90 overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-sm font-semibold">Tabel Saldo Persediaan Aktif</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Menampilkan {filteredBalances.length} catatan saldo produk per lokasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat saldo persediaan...</div>
          ) : filteredBalances.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Boxes className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-white">Stok Barang Kosong (0 Catatan)</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Stok barang saat ini kosong. Silakan tambahkan produk parfum di Master Produk Super Admin atau catat Pembelian Masuk dari Supplier untuk mengisi stok.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Produk Parfum</th>
                    <th className="py-3 px-4">Lokasi Cabang / Gudang</th>
                    <th className="py-3 px-4">SKU & Barcode</th>
                    <th className="py-3 px-4">Saldo Stok</th>
                    <th className="py-3 px-4">Batas Min. Buffer</th>
                    <th className="py-3 px-4">Kondisi Buffer</th>
                    <th className="py-3 px-4 text-right">Aksi Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredBalances.map((item) => {
                    const minAlert = item.product?.min_stock_alert || 5;
                    const isLow = item.quantity <= minAlert && item.quantity > 0;
                    const isOut = item.quantity === 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>{item.product?.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.product?.scent_type} ({item.product?.size_ml} ml)
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-200">{item.store?.name}</div>
                          <div className="text-[10px] font-mono text-[#D4AF37]">
                            {item.store?.code}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-[#E5C365] font-medium">{item.product?.sku}</div>
                          {item.product?.barcode && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Barcode className="w-3 h-3" />
                              <span>{item.product?.barcode}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-sm text-white">
                          <span>{item.quantity}</span> <span className="text-xs text-slate-500 font-normal">{getUnit(item.product)}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {minAlert} {getUnit(item.product)}
                        </td>

                        <td className="py-3.5 px-4">
                          {isOut ? (
                            <Badge variant="rose" size="sm">
                              Stok Habis (0)
                            </Badge>
                          ) : isLow ? (
                            <Badge variant="amber" size="sm">
                              Menipis (Perlu Restock)
                            </Badge>
                          ) : (
                            <Badge variant="emerald" size="sm">
                              Aman / Surplus
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openMovements(item)}
                              title="Lihat Buku Besar Kartu Stok"
                            >
                              <History className="w-3.5 h-3.5 mr-1" />
                              <span>Kartu Stok</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openAdjust(item)}
                              title="Penyesuaian Fisik Stok"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              <span>Sesuaikan</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Kartu Stok Bergerak (Stock Movements History) */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title="Buku Besar Kartu Stok Bergerak"
        description={`${activeItemForMovement?.product?.name || ''} — ${activeItemForMovement?.store?.name || ''}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Saldo Fisik Saat Ini:</span>
              <span className="text-base font-bold text-white">
                {activeItemForMovement?.quantity} {getUnit(activeItemForMovement?.product)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Batas Min. Buffer:</span>
              <span className="text-base font-bold text-amber-400">
                {activeItemForMovement?.product?.min_stock_alert || 5} {getUnit(activeItemForMovement?.product)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Kondisi Stok:</span>
              <span className="text-base font-bold text-emerald-400">
                {(activeItemForMovement?.quantity || 0) <= (activeItemForMovement?.product?.min_stock_alert || 5)
                  ? 'Perlu Restock'
                  : 'Stok Aman'}
              </span>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden">
            {loadingMovements ? (
              <div className="p-8 text-center text-xs text-slate-400">Memuat riwayat pergerakan stok...</div>
            ) : movements.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">Belum ada mutasi stok tercatat.</div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal (WIB)</th>
                      <th className="py-2.5 px-3">Jenis Mutasi</th>
                      <th className="py-2.5 px-3">Perubahan (+/-)</th>
                      <th className="py-2.5 px-3">Saldo Fisik Akhir</th>
                      <th className="py-2.5 px-3">Referensi & Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {movements.map((mov) => {
                      const isPositive = mov.quantity_delta > 0;
                      return (
                        <tr key={mov.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {formatDateTimeJakarta(mov.created_at)}
                          </td>
                          <td className="py-2.5 px-3">{getMovementBadge(mov.movement_type)}</td>
                          <td
                            className={`py-2.5 px-3 font-bold font-mono text-sm ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? `+${mov.quantity_delta}` : mov.quantity_delta}
                          </td>
                          <td className="py-2.5 px-3 font-bold font-mono text-white">
                            {mov.balance_after} {getUnit(activeItemForMovement?.product)}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-400">
                            {mov.reference_id && (
                              <div className="font-mono text-[#D4AF37]">{mov.reference_id}</div>
                            )}
                            <div>{mov.notes || '-'}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => setIsMovementModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Penyesuaian Stok (Adjustment) */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Penyesuaian Stok Fisik (Adjustment)"
        description={`Penyesuaian stok untuk ${activeItemForAdjust?.product?.name || ''} di ${activeItemForAdjust?.store?.name || ''}.`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Saldo Tercatat Sistem:</span>
              <span className="font-bold text-white">{activeItemForAdjust?.quantity} {getUnit(activeItemForAdjust?.product)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>HPP Rata-rata Tertimbang:</span>
              <span className="font-mono text-[#E5C365]">
                {formatIDR(activeItemForAdjust?.moving_avg_cost)}
              </span>
            </div>
          </div>

          <Input
            label={`Kuantitas Fisik Aktual Hasil Cek (${getUnit(activeItemForAdjust?.product)})`}
            type="number"
            min="0"
            step="1"
            value={physicalCount}
            onChange={(e) => setPhysicalCount(e.target.value)}
            required
          />

          {activeItemForAdjust && physicalCount !== '' && (
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Selisih Penyesuaian: </span>
              <span
                className={`font-bold font-mono ${
                  Number(physicalCount) - activeItemForAdjust.quantity >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {Number(physicalCount) - activeItemForAdjust.quantity >= 0 ? '+' : ''}
                {Number(physicalCount) - activeItemForAdjust.quantity} {getUnit(activeItemForAdjust?.product)}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Alasan Penyesuaian Stok (Wajib)
            </label>
            <textarea
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              placeholder="Contoh: Selisih sampling fisik mingguan, botol tester rusak di etalase, atau barang pecah..."
              rows={3}
              className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              required
            />
          </div>

          {adjustError && (
            <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50">
              {adjustError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAdjustModalOpen(false)}
              disabled={adjustSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={adjustSubmitting}>
              Terapkan Penyesuaian
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat modul persediaan...</div>}>
      <InventoryPageContent />
    </Suspense>
  );
}
