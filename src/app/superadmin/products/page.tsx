'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductCategory, ProductType, Store, InventoryBalance } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { formatIDR, formatProductUnit } from '@/lib/formatters';
import Link from 'next/link';
import { BBLogo } from '@/components/ui/BBLogo';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Sparkles,
  Filter,
  Trash2,
  AlertTriangle,
  Beaker,
  Droplet,
  Wine,
  CheckCircle2,
  Boxes,
  Truck,
  ArrowRight,
  Info,
  Wand2,
  Pencil,
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [productType, setProductType] = useState<ProductType>('BIBIT');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [unitName, setUnitName] = useState('ml');
  const [scentType, setScentType] = useState('Bibit Murni Konsentrat');
  const [topNotes, setTopNotes] = useState('');
  const [middleNotes, setMiddleNotes] = useState('');
  const [baseNotes, setBaseNotes] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [isBlendable, setIsBlendable] = useState(true);
  const [initialStock, setInitialStock] = useState('');
  const [initialStoreId, setInitialStoreId] = useState('');
  const [initialCost, setInitialCost] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editProductType, setEditProductType] = useState<ProductType>('BIBIT');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editUnitName, setEditUnitName] = useState('ml');
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editMinStockAlert, setEditMinStockAlert] = useState('0');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const searchParam = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const [prodRes, catRes, storeRes, invRes] = await Promise.all([
        fetch(`/api/products${searchParam}`).then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
        fetch('/api/stores').then((r) => r.json()),
        fetch('/api/inventory').then((r) => r.json()),
      ]);
      const prodList = prodRes?.data || prodRes?.products || [];
      const catList = catRes?.data || catRes?.categories || [];
      const storeList = storeRes?.data || storeRes?.stores || [];
      const invList = invRes?.data || [];
      setProducts(Array.isArray(prodList) ? prodList : []);
      setCategories(Array.isArray(catList) ? catList : []);
      setStores(Array.isArray(storeList) ? storeList : []);
      setInventoryBalances(Array.isArray(invList) ? invList : []);
      if (Array.isArray(storeList) && storeList.length > 0 && !initialStoreId) {
        setInitialStoreId(storeList[0].id);
      }
    } catch (e) {
      console.error('Failed to load products:', e);
    } finally {
      setLoading(false);
    }
  };

  const getTotalStock = (productId: string) => {
    return inventoryBalances
      .filter((b) => b.product_id === productId)
      .reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedType !== 'ALL' && p.product_type !== selectedType) return false;
      return true;
    });
  }, [products, selectedType]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!name.trim()) {
        throw new Error('Nama produk atau bibit parfum wajib diisi.');
      }

      const cleanPrice = basePrice.replace(/[^0-9]/g, '');
      const priceNum = cleanPrice ? parseFloat(cleanPrice) : 0;

      // Auto-generate SKU jika dikosongkan oleh user
      let finalSku = sku.trim().toUpperCase();
      if (!finalSku) {
        const prefix = productType === 'BIBIT' ? 'BBT' : productType === 'PELARUT' ? 'PLR' : productType === 'BOTOL' ? 'BTL' : 'BBP';
        const cleanName = name.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'ITEM';
        const rand = Math.floor(100 + Math.random() * 900);
        finalSku = `${prefix}-${cleanName}-${rand}`;
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: finalSku,
          barcode: barcode.trim() || undefined,
          name: name.trim(),
          category_id: categories.length > 0 ? categories[0].id : undefined,
          size_ml: productType === 'BIBIT' ? 1 : 50,
          scent_type: scentType,
          top_notes: topNotes.trim() || undefined,
          middle_notes: middleNotes.trim() || undefined,
          base_notes: baseNotes.trim() || undefined,
          base_price: priceNum,
          min_stock_alert: 0,
          product_type: productType,
          unit_name: unitName,
          is_blendable: isBlendable,
          initial_stock: initialStock ? parseFloat(initialStock) : undefined,
          initial_cost: initialCost ? parseFloat(initialCost) : undefined,
          initial_store_id: initialStoreId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menambahkan produk parfum.');
      }

      setIsModalOpen(false);
      resetForm();
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan produk parfum.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name || '');
    setEditSku(p.sku || '');
    setEditBarcode(p.barcode || '');
    setEditProductType(p.product_type || 'BIBIT');
    setEditCategoryId(p.category_id || '');
    setEditUnitName(p.unit_name || formatProductUnit(p));
    setEditBasePrice(String(p.base_price ?? 0));
    setEditMinStockAlert(String(p.min_stock_alert ?? 0));
    setEditError('');
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditSubmitting(true);
    setEditError('');

    try {
      if (!editName.trim()) {
        throw new Error('Nama produk wajib diisi.');
      }
      const cleanPrice = editBasePrice.replace(/[^0-9]/g, '');
      const priceNum = cleanPrice !== '' ? Number(cleanPrice) : 0;
      const minStockNum = editMinStockAlert.trim() !== '' ? Number(editMinStockAlert) : 0;

      if (isNaN(priceNum) || priceNum < 0) {
        throw new Error('Harga jual harus berupa angka 0 atau lebih.');
      }
      if (isNaN(minStockNum) || minStockNum < 0) {
        throw new Error('Minimum stok harus berupa angka 0 atau lebih.');
      }

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          sku: editSku.trim().toUpperCase(),
          barcode: editBarcode.trim() || null,
          product_type: editProductType,
          category_id: editCategoryId || null,
          unit_name: editUnitName.trim() || (editProductType === 'BIBIT' || editProductType === 'PELARUT' ? 'ml' : 'pcs'),
          base_price: priceNum,
          min_stock_alert: minStockNum,
          is_blendable: editProductType === 'BIBIT' || editProductType === 'PELARUT',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan perubahan produk.');
      }

      const updatedName = data.data?.name || editName.trim();
      setEditingProduct(null);
      setSuccessMsg(`Produk "${updatedName}" berhasil diperbarui (Harga Jual: ${formatIDR(priceNum)}).`);
      setTimeout(() => setSuccessMsg(''), 4500);
      await loadData();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Gagal memperbarui produk.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const generateRandomSku = () => {
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
    setSku(`${prefix}-${cleanName}-${rand}`);
  };

  const resetForm = () => {
    setSku('');
    setBarcode('');
    setName('');
    setProductType('BIBIT');
    setUnitName('ml');
    setScentType('Bibit Murni Konsentrat');
    setTopNotes('');
    setMiddleNotes('');
    setBaseNotes('');
    setBasePrice('');
    setIsBlendable(true);
    setInitialStock('');
    setInitialCost('');
    setError('');
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus produk "${product.name}" (${product.sku}) dari sistem?\nSemua saldo stok produk ini di gudang & toko akan ikut terhapus.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/products?id=${product.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal menghapus produk.');
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus produk.');
    }
  };

  const handleClearAllProducts = async () => {
    const confirmed = window.confirm(
      'PERINGATAN RESMI SUPERADMIN:\nApakah Anda yakin ingin MENGOSONGKAN SELURUH DAFTAR BARANG (PRODUK) & STOKNYA?\n\nKatalog akan menjadi 0 item sehingga Anda dapat menginput barang & persediaan baru secara manual melalui form web.'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/products?all=true', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Gagal mengosongkan produk.');
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mengosongkan produk.');
    }
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BBLogo variant="gold" size="md" withContainer />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Master Bahan Baku & Bibit Parfum</span>
              <Badge variant="gold" size="sm">Super Admin</Badge>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Input manual bibit murni, pelarut absolute, dan botol kemasan untuk racikan kasir multi-cabang.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {products.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAllProducts}
              className="bg-rose-900/40 hover:bg-rose-800 text-rose-200 border border-rose-700/50"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              <span>Kosongkan Semua (0 Item)</span>
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="shadow-sm shadow-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>+ Tambah Bibit / Produk Baru</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar with Interactive Category Pills */}
      <Card bordered className="bg-[#0F172A]/80 p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="w-full md:w-96">
            <Input
              placeholder="Cari nama parfum, bibit, SKU, atau barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="text-xs text-slate-400">
            Total terdaftar: <span className="font-bold text-white">{products.length}</span> item
          </div>
        </div>

        {/* Filter Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-400 mr-1 font-medium">Filter Kategori:</span>
          {[
            { id: 'ALL', label: 'Semua Item', count: products.length },
            { id: 'BIBIT', label: '🌿 Bibit Parfum', count: products.filter((p) => p.product_type === 'BIBIT').length },
            { id: 'PELARUT', label: '💧 Pelarut / Absolute', count: products.filter((p) => p.product_type === 'PELARUT').length },
            { id: 'BOTOL', label: '🍾 Botol Kemasan', count: products.filter((p) => p.product_type === 'BOTOL').length },
            { id: 'READY_TO_WEAR', label: '✨ Siap Pakai', count: products.filter((p) => p.product_type === 'READY_TO_WEAR').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                selectedType === tab.id
                  ? 'bg-[#D4AF37] text-[#070A0F] font-bold shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedType === tab.id
                    ? 'bg-[#070A0F]/20 text-[#070A0F] font-bold'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Products Table */}
      <Card bordered className="bg-[#0F172A]/90 overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-sm font-semibold">Daftar Produk Parfum Terdaftar</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Menampilkan {filteredProducts.length} item parfum yang siap diperdagangkan di cabang Kendal.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat katalog parfum...</div>
          ) : products.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-white">Katalog Barang Masih Kosong (0 Item)</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Seluruh produk barang dan saldo persediaan saat ini kosong. Anda dapat mulai menginput daftar parfum, SKU, dan harga resmi secara manual melalui form di bawah ini.
              </p>
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Input Barang Baru Manual</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nama Bibit / Parfum</th>
                    <th className="py-3 px-4">Tipe Item</th>
                    <th className="py-3 px-4">SKU / Barcode</th>
                    <th className="py-3 px-4">Satuan Stok</th>
                    <th className="py-3 px-4">Harga Retail (IDR)</th>
                    <th className="py-3 px-4">Total Stok</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {p.product_type === 'BIBIT' ? (
                            <Beaker className="w-3.5 h-3.5 text-[#D4AF37]" />
                          ) : p.product_type === 'PELARUT' ? (
                            <Droplet className="w-3.5 h-3.5 text-blue-400" />
                          ) : p.product_type === 'BOTOL' ? (
                            <Wine className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>{p.name}</span>
                        </div>
                        {p.top_notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            Aroma: {p.top_notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.product_type === 'BIBIT' ? (
                          <Badge variant="gold" size="sm">
                            🌿 Bibit Racik
                          </Badge>
                        ) : p.product_type === 'PELARUT' ? (
                          <Badge variant="blue" size="sm">
                            💧 Pelarut
                          </Badge>
                        ) : p.product_type === 'BOTOL' ? (
                          <Badge variant="amber" size="sm">
                            🍾 Botol
                          </Badge>
                        ) : (
                          <Badge variant="emerald" size="sm">
                            ✨ Botol Jadi
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-[#E5C365] font-medium">{p.sku}</div>
                        {p.barcode && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            <span>{p.barcode}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 uppercase">
                          {formatProductUnit(p)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-400 text-sm">
                        {p.base_price > 0 ? (
                          <span>
                            {formatIDR(p.base_price)}
                            <span className="text-[10px] text-slate-400 font-normal"> /{formatProductUnit(p)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal text-xs">Paket Racik</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-white flex items-baseline gap-1">
                          <span className="text-emerald-400 font-bold text-sm">
                            {getTotalStock(p.id).toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs text-slate-400 font-normal">
                            {formatProductUnit(p)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#E5C365] bg-[#D4AF37]/10 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 transition-colors inline-flex items-center gap-1"
                            title="Edit Produk & Harga Jual"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors inline-flex items-center"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Add Product / Bibit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Produk / Bibit Parfum Racikan"
        description="Kelola stok bibit parfum murni, bahan pelarut, botol kemasan, atau parfum jadi."
        maxWidth="xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          {/* Pilihan Jenis Item */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Jenis / Tipe Item Stok
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setProductType('BIBIT');
                  setUnitName('ml');
                  setScentType('Bibit Murni Konsentrat');
                  setIsBlendable(true);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  productType === 'BIBIT'
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Beaker className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Bibit Parfum</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">Murni & Bisa Dicampur (ml)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProductType('PELARUT');
                  setUnitName('ml');
                  setScentType('Pelarut Campuran');
                  setIsBlendable(true);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  productType === 'PELARUT'
                    ? 'bg-blue-500/15 border-blue-400 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Droplet className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pelarut</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">Alkohol / Absolute (ml)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProductType('BOTOL');
                  setUnitName('pcs');
                  setScentType('Kemasan Botol');
                  setIsBlendable(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  productType === 'BOTOL'
                    ? 'bg-purple-500/15 border-purple-400 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Wine className="w-3.5 h-3.5 text-purple-400" />
                  <span>Botol Kosong</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">Spray / Roll On (pcs)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProductType('READY_TO_WEAR');
                  setUnitName('pcs');
                  setScentType('Extrait de Parfum');
                  setIsBlendable(false);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  productType === 'READY_TO_WEAR'
                    ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Parfum Jadi</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">Kemasan Box Siap Pakai</span>
              </button>
            </div>

            {productType === 'BIBIT' && (
              <p className="text-[11px] text-[#E5C365] bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Stok bibit ini dihitung dalam satuan mililiter (ml) dan otomatis bisa dicampurkan (blending racikan) di kasir POS.</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <Input
              label="Nama Bibit / Parfum (Wajib)"
              placeholder="Contoh: Mawar, Vanilla, Baccarat 540, dll."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">Kode SKU (Opsional)</label>
                <button
                  type="button"
                  onClick={generateRandomSku}
                  className="text-[10px] text-[#D4AF37] hover:text-[#E5C365] font-bold flex items-center gap-1 transition-colors"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Generate Otomatis</span>
                </button>
              </div>
              <Input
                placeholder="Contoh: BBT-MAWAR-123 (otomatis bila kosong)"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          {/* Harga Jual dan Satuan Stok */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Input
                label="Harga Jual Retail (IDR)"
                placeholder={productType === 'BIBIT' ? 'Contoh: 1500 per ml' : 'Contoh: 50000'}
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {productType === 'BIBIT'
                  ? 'Harga jual per ml (bisa 0 jika hanya paket racik).'
                  : 'Harga jual satuan item.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Satuan Stok</label>
              <select
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="pcs">pcs (Botol Kemasan / Siap Pakai)</option>
                <option value="ml">ml (Mililiter - Bibit / Pelarut)</option>
                <option value="gram">gram</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Satuan penghitungan stok fisik.
              </p>
            </div>
          </div>

          {/* Stok Awal & Lokasi Gudang */}
          <div className="p-3.5 rounded-xl bg-[#162036]/60 border border-[#1E293B] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-[#D4AF37]" />
                <span>Input Saldo Stok Awal (Opsional)</span>
              </span>
              <span className="text-[10px] text-slate-400">Langsung isi stok saat produk disimpan</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label={`Jumlah Stok Awal (${unitName})`}
                type="number"
                placeholder={productType === 'BIBIT' ? 'Contoh: 1000' : 'Contoh: 50'}
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Lokasi Toko / Gudang</label>
                <select
                  value={initialStoreId}
                  onChange={(e) => setInitialStoreId(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-[#D4AF37]"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Modal / HPP Satuan (IDR)"
                type="number"
                placeholder="Otomatis jika kosong"
                value={initialCost}
                onChange={(e) => setInitialCost(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Input
              label="Catatan Aroma / Karakter Formula (Opsional)"
              placeholder="Contoh: Mawar Damask segar manis, aroma bunga tahan lama, cocok dicampur Vanilla"
              value={topNotes}
              onChange={(e) => setTopNotes(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Simpan Data Produk
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Product & Harga Jual */}
      <Modal
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title="Edit Produk & Harga Jual"
        description="Ubah nama produk, harga jual per satuan, jenis/kategori, atau batas minimum stok. Perubahan langsung tersimpan permanen ke server."
        maxWidth="xl"
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          {/* Pilihan Jenis Item */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Jenis / Tipe Item Stok
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { type: 'BIBIT', label: 'Bibit Parfum', sub: 'ml', activeCls: 'bg-[#D4AF37]/15 border-[#D4AF37] text-white' },
                  { type: 'PELARUT', label: 'Pelarut / Lux', sub: 'ml', activeCls: 'bg-blue-500/15 border-blue-400 text-white' },
                  { type: 'BOTOL', label: 'Botol Kosong', sub: 'pcs', activeCls: 'bg-purple-500/15 border-purple-400 text-white' },
                  { type: 'READY_TO_WEAR', label: 'Parfum Jadi', sub: 'pcs', activeCls: 'bg-emerald-500/15 border-emerald-400 text-white' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    setEditProductType(opt.type);
                    setEditUnitName(opt.sub);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    editProductType === opt.type
                      ? `${opt.activeCls} shadow-sm`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-400">Satuan: {opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Nama Produk *"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Contoh: Alpha x / botol Hermes 55ml"
              required
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Kategori Produk
              </label>
              <select
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
                className="w-full h-10 bg-[#0F172A] border border-[#1E293B] rounded-lg px-3 text-xs text-slate-100 focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Harga Jual (Highlight Utama) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37]/10 to-slate-900/90 border border-[#D4AF37]/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#E5C365]">
                Harga Jual per {editUnitName || 'unit'} (IDR) *
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {formatIDR(Number(editBasePrice.replace(/[^0-9]/g, '')) || 0)} /{editUnitName || 'unit'}
              </span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={editBasePrice}
              onChange={(e) => setEditBasePrice(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Contoh: 1800 atau 3500 atau 9000"
              className="w-full h-11 bg-[#070A11] border border-[#D4AF37]/50 rounded-lg px-3 text-base font-mono font-bold text-white focus:outline-none focus:border-[#E5C365]"
            />
            <p className="text-[11px] text-slate-400">
              Ketik angka tanpa titik/koma (contoh: <span className="font-mono text-slate-200">1800</span> untuk Rp 1.800, <span className="font-mono text-slate-200">3500</span> untuk seri PS, <span className="font-mono text-slate-200">9000</span> untuk botol 55ml).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Kode SKU"
              value={editSku}
              onChange={(e) => setEditSku(e.target.value)}
              placeholder="BBK-0001"
            />
            <Input
              label="Barcode (Opsional)"
              value={editBarcode}
              onChange={(e) => setEditBarcode(e.target.value)}
              placeholder="Opsional"
            />
            <Input
              label="Satuan"
              value={editUnitName}
              onChange={(e) => setEditUnitName(e.target.value)}
              placeholder="ml / pcs"
            />
            <Input
              label="Min. Stok Alert"
              type="text"
              inputMode="numeric"
              value={editMinStockAlert}
              onChange={(e) => setEditMinStockAlert(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="50 / 5"
            />
          </div>

          {editError && (
            <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50">
              {editError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingProduct(null)}
              disabled={editSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={editSubmitting}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
