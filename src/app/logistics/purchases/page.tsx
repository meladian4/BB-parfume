'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Purchase, Product, Supplier, Store, InventoryBalance } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatDateTimeJakarta } from '@/lib/formatters';
import { BBLogo } from '@/components/ui/BBLogo';
import {
  PackagePlus,
  Boxes,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  FileText,
  Search,
  ShieldCheck,
  Send,
  XCircle,
  Eye,
  CheckSquare,
  Square,
  ListChecks,
} from 'lucide-react';

export default function LogisticsPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'PROCESSED'>('ALL');
  const [search, setSearch] = useState('');

  // Fitur Ceklist & Pencarian Rekomendasi Restock
  const [recSearch, setRecSearch] = useState('');
  const [selectedRecIds, setSelectedRecIds] = useState<string[]>([]);

  // Modal Buat Permintaan Pembelanjaan ke Super Admin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [requestItems, setRequestItems] = useState<Array<{ product_id: string; quantity: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [poRes, prodRes, supRes, storeRes, balRes] = await Promise.all([
        fetch('/api/purchases').then((r) => r.json()).catch(() => ({})),
        fetch('/api/products').then((r) => r.json()).catch(() => ({})),
        fetch('/api/suppliers').then((r) => r.json()).catch(() => ({})),
        fetch('/api/stores').then((r) => r.json()).catch(() => ({})),
        fetch('/api/inventory').then((r) => r.json()).catch(() => ({})),
      ]);

      const poList = poRes?.data || poRes?.purchases || [];
      const prodList = prodRes?.data || prodRes?.products || [];
      const supList = supRes?.data || supRes?.suppliers || [];
      const storeList = storeRes?.data || storeRes?.stores || [];
      const balList = balRes?.data || balRes?.balances || [];

      setPurchases(Array.isArray(poList) ? poList : []);
      setProducts(Array.isArray(prodList) ? prodList : []);
      setSuppliers(Array.isArray(supList) ? supList : []);
      setStores(Array.isArray(storeList) ? storeList : []);
      setBalances(Array.isArray(balList) ? balList : []);

      // Default store ke Gudang Pusat
      const wh = Array.isArray(storeList) ? storeList.find((s: Store) => s.type === 'WAREHOUSE') || storeList[0] : null;
      if (wh) setSelectedStoreId(wh.id);
      if (Array.isArray(supList) && supList.length > 0) setSelectedSupplierId(supList[0].id);
    } catch (e) {
      console.error('Failed to load purchases data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Helper stok gudang saat ini per produk
  const getWarehouseStock = (productId: string) => {
    const wh = stores.find((s) => s.type === 'WAREHOUSE');
    if (!wh) return 0;
    const b = balances.find((bal) => bal.store_id === wh.id && bal.product_id === productId);
    return b ? b.quantity : 0;
  };

  // Rekomendasi Restock Otomatis (stok gudang <= min_stock_alert)
  const lowStockRecommendations = useMemo(() => {
    return products.filter((p) => {
      const stock = getWarehouseStock(p.id);
      const min = p.min_stock_alert || 5;
      return stock <= min;
    });
  }, [products, balances, stores]);

  // Filter Rekomendasi Restock Berdasarkan Pencarian (SKU / Nama Produk)
  const filteredRecommendations = useMemo(() => {
    if (!recSearch.trim()) return lowStockRecommendations;
    const q = recSearch.toLowerCase();
    return lowStockRecommendations.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [lowStockRecommendations, recSearch]);

  const isAllFilteredSelected =
    filteredRecommendations.length > 0 &&
    filteredRecommendations.every((p) => selectedRecIds.includes(p.id));

  const handleToggleSelectRec = (productId: string) => {
    setSelectedRecIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredIds = new Set(filteredRecommendations.map((p) => p.id));
      setSelectedRecIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      const currentSet = new Set(selectedRecIds);
      filteredRecommendations.forEach((p) => currentSet.add(p.id));
      setSelectedRecIds(Array.from(currentSet));
    }
  };

  const handleClearSelectedRecs = () => {
    setSelectedRecIds([]);
  };

  const openBatchRequestModal = () => {
    if (selectedRecIds.length === 0) return;
    const items = selectedRecIds.map((id) => {
      const prod = products.find((p) => p.id === id);
      const isLiquid = prod?.product_type === 'BIBIT' || prod?.product_type === 'PELARUT';
      const defaultQty = isLiquid ? 50 : 10;
      return {
        product_id: id,
        quantity: defaultQty,
      };
    });
    setRequestItems(items);
    setPurchaseNotes(`Pengajuan restock bersama ${items.length} SKU kebutuhan persediaan gudang.`);
    setFormError('');
    setIsModalOpen(true);
  };

  const openNewRequestModal = (initialProduct?: Product) => {
    if (initialProduct) {
      setRequestItems([{ product_id: initialProduct.id, quantity: 10 }]);
    } else if (products.length > 0) {
      setRequestItems([{ product_id: products[0].id, quantity: 10 }]);
    } else {
      setRequestItems([]);
    }
    setPurchaseNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    if (products.length > 0) {
      setRequestItems([...requestItems, { product_id: products[0].id, quantity: 5 }]);
    }
  };

  const updateItemRow = (index: number, field: string, val: string | number) => {
    const next = [...requestItems];
    if (field === 'product_id') {
      next[index].product_id = String(val);
    } else if (field === 'quantity') {
      next[index].quantity = Math.max(1, parseInt(String(val)) || 1);
    }
    setRequestItems(next);
  };

  const removeItemRow = (index: number) => {
    if (requestItems.length > 1) {
      setRequestItems(requestItems.filter((_, i) => i !== index));
    }
  };

  const handleSetAllQuantities = (qty: number) => {
    setRequestItems((prev) => prev.map((item) => ({ ...item, quantity: qty })));
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestItems.length === 0) {
      setFormError('Tambahkan minimal 1 item barang yang akan diajukan ke Super Admin.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: selectedSupplierId || undefined,
          destination_store_id: selectedStoreId || undefined,
          notes: purchaseNotes.trim() || undefined,
          user_id: 'Staf Logistik Kendal',
          status: 'PENDING_APPROVAL',
          items: requestItems,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim permintaan pembelanjaan ke Super Admin.');
      }

      setIsModalOpen(false);
      setSelectedRecIds([]);
      setSuccessMessage(`Permintaan pembelanjaan untuk ${requestItems.length} item berhasil dikirim ke Super Admin sebagai bahan acuan belanja!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengirim permintaan pembelanjaan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter List
  const filteredPurchases = useMemo(() => {
    return purchases.filter((po) => {
      if (activeTab === 'PENDING' && po.status !== 'PENDING_APPROVAL') return false;
      if (activeTab === 'PROCESSED' && po.status === 'PENDING_APPROVAL') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNumber = po.po_number.toLowerCase().includes(q);
        const matchSup = po.supplier?.name?.toLowerCase().includes(q);
        const matchItems = po.items?.some((it) => it.product?.name?.toLowerCase().includes(q));
        if (!matchNumber && !matchSup && !matchItems) return false;
      }
      return true;
    });
  }, [purchases, activeTab, search]);

  const pendingCount = purchases.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const processedCount = purchases.filter((p) => p.status !== 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BBLogo variant="gold" size="md" withContainer />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Permintaan Pembelanjaan Barang ke Super Admin</span>
              <Badge variant="blue" size="sm">Bahan Acuan Belanja</Badge>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ajukan kebutuhan pengadaan bibit parfum & kemasan dari master persediaan ke Super Admin sebagai bahan acuan resmi pembelanjaan barang.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => openNewRequestModal()}
          className="shadow-md bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold"
        >
          <Send className="w-4 h-4 mr-1.5" />
          <span>+ Buat Permintaan ke Super Admin</span>
        </Button>
      </div>

      {/* Success Alert Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Rekomendasi Restock Berdasarkan Buffer Persediaan Master dengan Checklist & Pencarian */}
      {lowStockRecommendations.length > 0 && (
        <Card bordered className="bg-[#0F172A]/90 border-amber-500/30 shadow-lg">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <CardTitle className="text-xs font-bold text-amber-300">
                    Rekomendasi Restock: {lowStockRecommendations.length} SKU Master di Bawah Batas Buffer
                  </CardTitle>
                  <Badge variant="amber" size="sm">Perlu Diajukan</Badge>
                </div>
                <CardDescription className="text-[11px] text-slate-400 mt-0.5">
                  Centang item produk yang ingin diajukan, lalu klik tombol <strong>"Ajukan Bersama ke Super Admin"</strong> untuk mengirim semuanya dalam 1 dokumen pengajuan acuan belanja.
                </CardDescription>
              </div>

              {/* Action Toolbar ketika ada item yang diceklis */}
              {selectedRecIds.length > 0 && (
                <div className="flex items-center gap-2 shrink-0 animate-in fade-in">
                  <span className="text-xs font-bold text-[#E5C365] bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-lg">
                    {selectedRecIds.length} SKU Terpilih
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openBatchRequestModal}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold text-xs shadow-md shadow-amber-500/20 hover:brightness-110"
                  >
                    <ListChecks className="w-4 h-4 mr-1.5" />
                    <span>Ajukan {selectedRecIds.length} Item Bersama &rarr;</span>
                  </Button>
                  <button
                    type="button"
                    onClick={handleClearSelectedRecs}
                    className="text-[11px] text-slate-400 hover:text-rose-400 underline px-1"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>

            {/* Kolom Pencarian & Tombol Pilih Semua */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 mt-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari SKU atau nama produk di rekomendasi (misal: Ameer, Botol, BBK-0010)..."
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 bg-[#090D16] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
                {recSearch && (
                  <button
                    onClick={() => setRecSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    &times;
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAllFiltered}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
                >
                  {isAllFilteredSelected ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Batal Pilih Semua ({filteredRecommendations.length})</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pilih Semua Hasil ({filteredRecommendations.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-3">
            {filteredRecommendations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada produk rekomendasi yang cocok dengan pencarian "{recSearch}".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredRecommendations.map((prod) => {
                  const stock = getWarehouseStock(prod.id);
                  const isChecked = selectedRecIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleToggleSelectRec(prod.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between space-y-2 ${
                        isChecked
                          ? 'bg-amber-500/10 border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[10px] font-mono text-[#D4AF37]">{prod.sku}</div>
                          <div className="shrink-0 text-[#D4AF37]">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 fill-amber-500/20" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                            )}
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-white truncate mt-0.5" title={prod.name}>
                          {prod.name}
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                          <span>Stok Gudang:</span>
                          <strong className="text-rose-400 font-mono">
                            {stock} {prod.unit_name || (prod.product_type === 'BIBIT' || prod.product_type === 'PELARUT' ? 'ml' : 'botol')}
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Batas Buffer:</span>
                          <span className="font-mono text-slate-300">
                            {prod.min_stock_alert} {prod.unit_name || (prod.product_type === 'BIBIT' || prod.product_type === 'PELARUT' ? 'ml' : 'botol')}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[11px]">
                        <span className={`text-[10px] font-semibold ${isChecked ? 'text-amber-300' : 'text-slate-500'}`}>
                          {isChecked ? '✓ Terpilih' : 'Klik untuk pilih'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openNewRequestModal(prod);
                          }}
                          className="text-[10px] text-slate-400 hover:text-white hover:underline"
                        >
                          Ajukan sendiri &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs & Search */}
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
            Semua Permintaan ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-2 px-3 font-medium transition flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'text-amber-400 border-b-2 border-amber-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Menunggu Review Super Admin ({pendingCount})</span>
            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
          </button>
          <button
            onClick={() => setActiveTab('PROCESSED')}
            className={`pb-2 px-3 font-medium transition ${
              activeTab === 'PROCESSED'
                ? 'text-emerald-400 border-b-2 border-emerald-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Telah Diproses / Selesai ({processedCount})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor tiket / supplier / item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0F172A] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Table Daftar Permintaan Pembelanjaan */}
      <Card bordered className="bg-[#0F172A]/90 overflow-hidden shadow-xl">
        <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-white">Daftar Permintaan Pembelanjaan yang Diajukan</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Dokumen pengajuan restock logistik yang menjadi bahan acuan resmi bagi Super Admin/Owner.
            </CardDescription>
          </div>
          {pendingCount > 0 && (
            <Badge variant="amber" size="sm">
              <Clock className="w-3 h-3 mr-1 inline" />
              {pendingCount} Menunggu Tindak Lanjut Super Admin
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">Memuat data permintaan belanja...</div>
          ) : filteredPurchases.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Boxes className="w-8 h-8 text-slate-600 mx-auto" />
              <p>Belum ada pengajuan permintaan belanja pada filter ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">No. Pengajuan</th>
                    <th className="py-3 px-4">Tujuan & Alasan Permintaan</th>
                    <th className="py-3 px-4">Item & Jumlah yang Diminta</th>
                    <th className="py-3 px-4">Status Acuan Super Admin</th>
                    <th className="py-3 px-4 text-right">Keterangan Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredPurchases.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#E5C365]">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{po.po_number}</span>
                        </div>
                        <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                          Diajukan: {formatDateTimeJakarta(po.created_at)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{po.destination_store?.name || 'Gudang Pusat Distribusi Kendal'}</span>
                        </div>
                        {po.notes ? (
                          <div className="text-[11px] text-slate-300 italic mt-1 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                            &ldquo;{po.notes}&rdquo;
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            (Tanpa catatan khusus)
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {po.items?.map((it) => (
                            <div key={it.id} className="text-[11px] text-slate-300 flex items-center justify-between gap-3">
                              <span>{it.product?.name}</span>
                              <span className="font-bold font-mono text-white">
                                {it.quantity} {it.product?.unit_name || (it.product?.product_type === 'BIBIT' || it.product?.product_type === 'PELARUT' ? 'ml' : 'botol')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {po.status === 'PENDING_APPROVAL' && (
                          <div>
                            <Badge variant="amber" size="sm">
                              <Clock className="w-3 h-3 inline mr-1" />
                              Menunggu Review Super Admin
                            </Badge>
                            <div className="text-[10px] text-amber-300/80 mt-1">
                              Tersedia di Acuan Belanja Super Admin
                            </div>
                          </div>
                        )}

                        {po.status === 'ORDERED' && (
                          <div>
                            <Badge variant="blue" size="sm">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Disetujui Super Admin
                            </Badge>
                            <div className="text-[10px] text-slate-400 mt-1">
                              Owner sedang memproses belanja ke supplier
                            </div>
                          </div>
                        )}

                        {po.status === 'RECEIVED' && (
                          <div>
                            <Badge variant="emerald" size="sm">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Selesai Masuk Gudang
                            </Badge>
                            <div className="text-[10px] text-emerald-400/80 mt-1">
                              Diterima: {formatDateTimeJakarta(po.received_at)}
                            </div>
                          </div>
                        )}

                        {po.status === 'REJECTED' && (
                          <div>
                            <Badge variant="rose" size="sm">
                              <XCircle className="w-3 h-3 inline mr-1" />
                              Ditolak Super Admin
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
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-amber-400 block">
                              Menunggu Keputusan Owner
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Sebagai acuan belanja barang
                            </span>
                          </div>
                        )}

                        {po.status === 'ORDERED' && (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-blue-400 block">
                              Dalam Proses Belanja
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Oleh Super Admin / Owner
                            </span>
                          </div>
                        )}

                        {po.status === 'RECEIVED' && (
                          <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Stok Gudang Bertambah</span>
                          </span>
                        )}

                        {po.status === 'REJECTED' && (
                          <span className="text-[11px] text-rose-400 font-medium">
                            Permintaan Tidak Disetujui
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

      {/* Modal Formulir Permintaan Pembelanjaan Barang ke Super Admin */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title="Formulir Permintaan Pembelanjaan Barang (Restock)"
        description="Pilih item produk dari master persediaan untuk diajukan ke Super Admin sebagai bahan acuan pembelanjaan."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          {/* Dynamic Item Rows from Master Data */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-400" />
                <span>Daftar {requestItems.length} Item yang Diajukan:</span>
              </label>
              <div className="flex items-center gap-2">
                {requestItems.length > 1 && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span>Set Semua:</span>
                    <button
                      type="button"
                      onClick={() => handleSetAllQuantities(10)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                      title="Set semua kuantitas ke 10"
                    >
                      10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllQuantities(50)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[#D4AF37] text-[10px] font-mono font-bold"
                      title="Set semua kuantitas ke 50"
                    >
                      50
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAllQuantities(100)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                      title="Set semua kuantitas ke 100"
                    >
                      100
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-[11px] text-[#D4AF37] hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah Baris</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {requestItems.map((row, idx) => {
                const currentStock = getWarehouseStock(row.product_id);
                const selectedProd = products.find((p) => p.id === row.product_id);
                const minBuffer = selectedProd?.min_stock_alert || 5;

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        value={row.product_id}
                        onChange={(e) => updateItemRow(idx, 'product_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#0F172A] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.sku}] {p.name} ({p.size_ml} ml)
                          </option>
                        ))}
                      </select>
                      <div className="text-[10px] text-slate-400 mt-1">
                        <span>Total Stok Gudang: <strong className="text-emerald-400 font-semibold">{currentStock} {selectedProd?.unit_name || (selectedProd?.product_type === 'BIBIT' || selectedProd?.product_type === 'PELARUT' ? 'ml' : 'botol')}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[11px]">Jumlah:</span>
                        <input
                          type="number"
                          min={1}
                          required
                          value={row.quantity}
                          onChange={(e) => updateItemRow(idx, 'quantity', e.target.value)}
                          className="w-20 px-2 py-1 bg-[#0F172A] border border-slate-700 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-[#D4AF37]"
                        />
                        <span className="text-slate-400 text-[11px]">{selectedProd?.unit_name || (selectedProd?.product_type === 'BIBIT' || selectedProd?.product_type === 'PELARUT' ? 'ml' : 'botol')}</span>
                      </div>

                      {requestItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Catatan Kebutuhan */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Alasan / Catatan Kebutuhan Pembelanjaan
            </label>
            <textarea
              rows={2}
              value={purchaseNotes}
              onChange={(e) => setPurchaseNotes(e.target.value)}
              placeholder="Contoh: Stok bibit parfum menipis di gudang pusat untuk persiapan suplai cabang Kendal Kota..."
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="sticky -bottom-3.5 sm:-bottom-6 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 py-3 bg-[#0F172A] border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shadow-2xl z-20">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={submitting}
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto h-11 sm:h-10 text-xs sm:text-sm font-semibold order-2 sm:order-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto h-12 sm:h-10 text-sm font-bold bg-[#D4AF37] hover:bg-[#E5C365] text-[#070A0F] shadow-lg shadow-amber-500/20 order-1 sm:order-2 active:scale-[0.98]"
              isLoading={submitting}
            >
              <Send className="w-4 h-4 mr-1.5" />
              <span>Kirim Permintaan ke Super Admin</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Floating Sticky Action Bar di Mobile saat ada rekomendasi yang diceklis */}
      {selectedRecIds.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#090D16]/95 backdrop-blur-md border-t border-[#1E293B] z-40 flex items-center justify-between gap-3 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-[#E5C365] font-black text-xs flex items-center justify-center border border-amber-500/40 font-mono">
              {selectedRecIds.length}
            </span>
            <div>
              <p className="text-[10px] text-slate-400">SKU Terpilih</p>
              <button
                type="button"
                onClick={handleClearSelectedRecs}
                className="text-[10px] text-rose-400 hover:underline"
              >
                Batalkan Pilihan
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={openBatchRequestModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition touch-manipulation min-h-[44px]"
          >
            <ListChecks className="w-4 h-4" />
            <span>Ajukan {selectedRecIds.length} Item &rarr;</span>
          </button>
        </div>
      )}
    </div>
  );
}
