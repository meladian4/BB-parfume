'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatIDR } from '@/lib/formatters';
import { Product, InventoryBalance } from '@/types/domain';
import {
  Package,
  Search,
  Barcode,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function LogisticsProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryBalances, setInventoryBalances] = useState<InventoryBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, invRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/inventory').then((r) => r.json()),
      ]);
      if (prodRes.success) {
        setProducts(prodRes.data || prodRes.products || []);
      }
      if (invRes.success) {
        setInventoryBalances(invRes.data || []);
      }
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
            Katalog Produk & Spesifikasi SKU Logistik
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Daftar master produk parfum resmi Kendal, spesifikasi volume ml, tipe aroma, dan kode barcode/SKU
          </p>
        </div>

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

      {/* Search */}
      <Card className="bg-[#12151C] border-neutral-800 p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari SKU, nama parfum, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181C24] border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </Card>

      {/* Grid Cards */}
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
                <span className="font-mono text-neutral-200">{prod.barcode}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Spesifikasi Kategori:</span>
                <span className="font-semibold text-[#D4AF37]">{prod.scent_type || 'Bibit / Kemasan'}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Total Stok Tersedia:</span>
                <span className="text-emerald-400 font-bold">{getTotalStock(prod.id).toLocaleString('id-ID')} {prod.unit_name || 'botol'}</span>
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
    </div>
  );
}
