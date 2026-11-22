'use client';

import React, { useState, useEffect } from 'react';
import { InventoryBalance, Store, Product } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatIDR } from '@/lib/formatters';
import Link from 'next/link';
import { BBLogo } from '@/components/ui/BBLogo';
import {
  Boxes,
  Truck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Warehouse,
  Store as StoreIcon,
  CheckCircle,
} from 'lucide-react';

export default function LogisticsDashboard() {
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [balRes, stRes, prodRes] = await Promise.all([
          fetch('/api/inventory').then((r) => r.json()),
          fetch('/api/stores').then((r) => r.json()),
          fetch('/api/products').then((r) => r.json()),
        ]);
        setBalances(balRes?.balances || balRes?.data || []);
        setStores(stRes?.stores || stRes?.data || []);
        setProducts(prodRes?.products || prodRes?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const warehouse = stores.find((s) => s.type === 'WAREHOUSE');
  const warehouseBalances = balances.filter((b) => b.store_id === warehouse?.id);

  // Kuantitas Fisik Persediaan (Tanpa Nominal Rupiah - Khusus Operasional Logistik)
  const totalPhysicalQuantity = balances.reduce((sum, b) => sum + b.quantity, 0);
  const warehouseQty = warehouseBalances.reduce((acc, b) => acc + b.quantity, 0);

  // Low Stock Items (kuantitas <= min_stock_alert)
  const lowStockBalances = balances.filter((b) => {
    const alertThreshold = b.product?.min_stock_alert || 5;
    return b.quantity <= alertThreshold;
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#162036] via-[#0F172A] to-[#090D16] border border-[#1E293B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <BBLogo variant="gold" size="lg" withContainer />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="blue" size="sm">
                <Warehouse className="w-3 h-3 inline mr-1" />
                Pusat Distribusi Kendal
              </Badge>
              <span className="text-xs text-slate-400">WH-KENDAL-01</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              LOGISTIK & PERSEDIAAN <span className="text-[#D4AF37] font-light">KENDAL</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Monitoring fisik stok bibit (ml), botol kemasan, pelarut, mutasi cabang (Kendal Kota, Pegandon, Kaliwungu), buffer stock minimum, dan perencanaan belanja barang.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/logistics/purchases">
            <Button variant="primary" size="sm" className="bg-[#D4AF37] hover:bg-[#E5C365] text-[#070A0F] font-bold">
              <span>+ Rencana Belanja (Restock)</span>
            </Button>
          </Link>
          <Link href="/logistics/inventory">
            <Button variant="outline" size="sm">
              <Boxes className="w-4 h-4 mr-1.5" />
              <span>Kartu Persediaan</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards (Operational Physical Inventory Metrics - No Rupiah) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card bordered className="bg-[#0F172A]/90 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Kuantitas Fisik Stok</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-emerald-400">
            {totalPhysicalQuantity.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">unit/ml</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Total fisik 1 Gudang + 3 Cabang</div>
        </Card>

        <Card bordered className="bg-[#0F172A]/90 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Stok Gudang Pusat</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-white">
            {warehouseQty.toLocaleString('id-ID')} <span className="text-xs text-slate-400 font-normal">unit/ml</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Siap disuplai ke cabang Kendal</div>
        </Card>

        <Card bordered className="bg-[#0F172A]/90 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Peringatan Stok Menipis</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-rose-400">
            {lowStockBalances.length} <span className="text-xs text-slate-400 font-normal">item lokasi</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Perlu restock / mutasi cabang</div>
        </Card>

        <Card bordered className="bg-[#0F172A]/90 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Master SKU Produk Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <StoreIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-xl font-bold text-white">
            {products.length} <span className="text-xs text-slate-400 font-normal">SKU</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Bibit parfum & kemasan resmi</div>
        </Card>
      </div>

      {/* Breakdown per store (Tanpa Rupiah) */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <StoreIcon className="w-4 h-4 text-[#D4AF37]" />
          <span>Ringkasan Saldo Fisik per Cabang & Gudang</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stores.map((st) => {
            const stBalances = balances.filter((b) => b.store_id === st.id);
            const totalQty = stBalances.reduce((acc, b) => acc + b.quantity, 0);
            const lowCount = stBalances.filter(
              (b) => b.quantity <= (b.product?.min_stock_alert || 5)
            ).length;

            return (
              <Card key={st.id} bordered className="bg-[#0F172A]/90 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-white">{st.name}</h3>
                    <div className="text-[10px] font-mono text-[#D4AF37]">{st.code}</div>
                  </div>
                  <Badge variant={st.type === 'WAREHOUSE' ? 'gold' : 'emerald'} size="sm">
                    {st.type === 'WAREHOUSE' ? 'Gudang' : 'Toko'}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Fisik:</span>
                    <span className="font-bold text-white">{totalQty.toLocaleString('id-ID')} unit/ml</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status Buffer:</span>
                    {lowCount === 0 ? (
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Aman</span>
                      </span>
                    ) : (
                      <span className="font-semibold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{lowCount} SKU Menipis</span>
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Varian Ada:</span>
                    <span className="font-mono text-slate-300">{stBalances.length} / {products.length} SKU</span>
                  </div>
                </div>

                <Link
                  href={`/logistics/inventory?storeId=${st.id}`}
                  className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#E5C365] font-medium"
                >
                  <span>Lihat Detail Fisik Stok</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
