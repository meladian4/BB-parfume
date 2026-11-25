'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatIDR, formatProductUnit } from '@/lib/formatters';
import { Product, InventoryBalance, ProductCategory, Store } from '@/types/domain';
import {
  Package,
  Search,
  RefreshCw,
  Plus,
  Droplets,
  FlaskConical,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type ProductTypeChoice = 'BIBIT' | 'PELARUT' | 'BOTOL' | 'FINISHED_GOOD';

export default function LogisticsProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal Tambah Produk Baru
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [productType, setProductType] = useState<ProductTypeChoice>('BIBIT');
  const [unitName, setUnitName] = useState('ml');
  const [scentType, setScentType] = useState('Bibit Murni Konsentrat');
  const [isBlendable, setIsBlendable] = useState(true);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sizeMl, setSizeMl] = useState('1');
  const [basePrice, setBasePrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, invRes, catRes, storeRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()).catch(() => ({})),
        fetch('/api/inventory').then((r) => r.json()).catch(() => ({})),
        fetch('/api/categories').then((r) => r.json()).catch(() => ({})),
        fetch('/api/stores').then((r) => r.json()).catch(() => ({})),
      ]);
      if (prodRes.success) {
        setProducts(prodRes.data || prodRes.products || []);
      }
      if (invRes.success) {
        setInventoryBalances(invRes.data || []);
      }
      if (catRes.success) {
        setCategories(catRes.data || catRes.categories || []);
      }
      const storeList: Store[] = storeRes.data || storeRes.stores || [];
      const wh = storeList.find((s) => s.type === 'WAREHOUSE') || storeList[0];
      if (wh) setWarehouseId(wh.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalStock = (productId: string) => {
    return inventoryBalances
      .filter((b) => b.product_id === productId)
      .reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetAddForm = () => {
    setProductType('BIBIT');
    setUnitName('ml');
    setScentType('Bibit Murni Konsentrat');
    setIsBlendable(true);
    setName('');
    setSku('');
    setBarcode('');
    setSizeMl('1');
    setBasePrice('');
    setInitialStock('');
    setFormError('');
  };

  const handleSelectType = (type: ProductTypeChoice) => {
    setProductType(type);
    if (type === 'BIBIT') {
      setUnitName('ml');
      setScentType('Bibit Murni Konsentrat');
      setSizeMl('1');
      setIsBlendable(true);
    } else if (type === 'PELARUT') {
      setUnitName('ml');
      setScentType('Pelarut & Campuran');
      setSizeMl('1');
      setIsBlendable(true);
    } else if (type === 'BOTOL') {
      setUnitName('pcs');
      setScentType('Botol Kemasan');
      setSizeMl('30');
      setIsBlendable(false);
    } else {
      setUnitName('pcs');
      setScentType('Eau de Parfum');
      setSizeMl('50');
      setIsBlendable(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Nama produk / barang wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanPrice = basePrice.replace(/[^0-9]/g, '');
      const priceNum = cleanPrice ? parseFloat(cleanPrice) : 0;

      let finalSku = sku.trim().toUpperCase();
      if (!finalSku) {
        const prefix =
          productType === 'BIBIT'
            ? 'BBT'
            : productType === 'PELARUT'
            ? 'PLR'
            : productType === 'BOTOL'
            ? 'BTL'
            : 'BBP';
        const cleanName =
          name
            .trim()
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 6)
            .toUpperCase() || 'ITEM';
        const rand = Math.floor(100 + Math.random() * 900);
        finalSku = `${prefix}-${cleanName}-${rand}`;
      }

      // Cari kategori yang paling cocok
      const matchedCat =
        categories.find((c) => {
          const slug = (c.slug || c.name || '').toLowerCase();
          if (productType === 'BIBIT') return slug.includes('bibit');
          if (productType === 'PELARUT') return slug.includes('pelarut');
          if (productType === 'BOTOL') return slug.includes('botol');
          return slug.includes('signature') || slug.includes('parfum');
        }) || categories[0];

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: finalSku,
          barcode: barcode.trim() || undefined,
          name: name.trim(),
          category_id: matchedCat?.id || undefined,
          size_ml: Number(sizeMl) || (productType === 'BIBIT' || productType === 'PELARUT' ? 1 : 50),
          scent_type: scentType,
          base_price: priceNum,
          min_stock_alert: 5,
          product_type: productType,
          unit_name: unitName,
          is_blendable: isBlendable,
          initial_stock: initialStock ? parseFloat(initialStock) : undefined,
          initial_store_id: warehouseId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menambahkan produk baru.');
      }

      setSuccessMsg(`Produk "${data.data?.name || name.trim()}" (${data.data?.sku || finalSku}) berhasil ditambahkan ke Katalog Master!`);
      setTimeout(() => setSuccessMsg(null), 5000);
      setIsAddOpen(false);
      resetAddForm();
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menambahkan produk baru.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode ? p.barcode.includes(search) : false)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-[#D4AF37]" />
            Katalog Produk &amp; Spesifikasi SKU Logistik
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Daftar master produk parfum resmi Kendal, spesifikasi volume ml, tipe aroma, dan kode barcode/SKU
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetAddForm();
              setIsAddOpen(true);
            }}
            className="bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-slate-950 font-bold shadow-md shadow-[#D4AF37]/20 hover:brightness-110"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Produk
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-900"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Segarkan
          </Button>
        </div>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/70 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Search */}
      <Card className="bg-[#12151C] border-neutral-800 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SKU, nama parfum, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#181C24] border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <span className="text-xs text-neutral-400">
            Menampilkan <strong className="text-white">{filtered.length}</strong> dari {products.length} item
          </span>
        </div>
      </Card>

      {/* Grid Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-[#12151C] border border-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prod) => (
            <Card key={prod.id} className="bg-[#12151C] border-neutral-800 p-5 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-[#D4AF37] block">{prod.sku}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{prod.name}</h3>
                  <span className="text-xs text-neutral-400 mt-0.5 block">{prod.scent_type}</span>
                </div>
                <Badge variant="gold" size="sm">
                  {prod.size_ml} ml
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-1 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Barcode POS:</span>
                  <span className="font-mono text-neutral-200">{prod.barcode || '-'}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Spesifikasi Kategori:</span>
                  <span className="font-semibold text-[#D4AF37]">{prod.scent_type || 'Bibit / Kemasan'}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Total Stok Tersedia:</span>
                  <span className="text-emerald-400 font-bold">
                    {getTotalStock(prod.id).toLocaleString('id-ID')} {formatProductUnit(prod)}
                  </span>
                </div>
              </div>

              {(prod.top_notes || prod.middle_notes || prod.base_notes) && (
                <div className="text-[11px] text-neutral-400 space-y-1 pt-2 border-t border-neutral-800/60">
                  {prod.top_notes && <p><strong>Top:</strong> {prod.top_notes}</p>}
                  {prod.middle_notes && <p><strong>Mid:</strong> {prod.middle_notes}</p>}
                  {prod.base_notes && <p><strong>Base:</strong> {prod.base_notes}</p>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Tambah Produk Baru oleh Logistik */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => !submitting && setIsAddOpen(false)}
        title="Tambah Produk / Barang Baru (Logistik)"
        description="Tambahkan bibit parfum, pelarut, botol kemasan, atau produk siap pakai baru ke katalog master."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Pilihan Jenis Item */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Jenis / Tipe Barang
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectType('BIBIT')}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 ${
                  productType === 'BIBIT'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span>Bibit Parfum</span>
                <span className="text-[10px] font-normal opacity-75">Satuan: ml</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType('PELARUT')}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 ${
                  productType === 'PELARUT'
                    ? 'bg-sky-950/60 border-sky-500 text-sky-300 font-bold'
                    : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Droplets className="w-4 h-4" />
                <span>Pelarut</span>
                <span className="text-[10px] font-normal opacity-75">Satuan: ml</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType('BOTOL')}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 ${
                  productType === 'BOTOL'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Botol Kemasan</span>
                <span className="text-[10px] font-normal opacity-75">Satuan: pcs</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType('FINISHED_GOOD')}
                className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 ${
                  productType === 'FINISHED_GOOD'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 font-bold'
                    : 'bg-[#0F172A] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Siap Pakai</span>
                <span className="text-[10px] font-normal opacity-75">Satuan: pcs</span>
              </button>
            </div>
          </div>

          {/* Nama Produk */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Nama Produk / Barang <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                productType === 'BIBIT'
                  ? 'Contoh: Baccarat Rouge 540'
                  : productType === 'BOTOL'
                  ? 'Contoh: Botol Spray Kotak 30ml'
                  : productType === 'PELARUT'
                  ? 'Contoh: Absolute Prima Food Grade'
                  : 'Contoh: BB Signature Oud 50ml'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#090D16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Kode SKU <span className="text-slate-500 font-normal">(opsional, otomatis jika kosong)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: BBK-0150"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-[#090D16] border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Barcode POS <span className="text-slate-500 font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Scan atau ketik barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full bg-[#090D16] border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Ukuran, Harga Dasar & Stok Awal Gudang */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Ukuran (ml)
              </label>
              <input
                type="number"
                min={0}
                value={sizeMl}
                onChange={(e) => setSizeMl(e.target.value)}
                className="w-full bg-[#090D16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Harga Jual (Rp / {unitName})
              </label>
              <input
                type="number"
                min={0}
                placeholder="Contoh: 1800"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full bg-[#090D16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Stok Awal Gudang ({unitName})
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                className="w-full bg-[#090D16] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              className="bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-slate-950 font-bold"
            >
              <Plus className="w-4 h-4 mr-1" />
              Simpan Produk Baru
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
