'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatIDR } from '@/lib/formatters';
import { FinancialReportSummary, Store } from '@/types/domain';
import {
  TrendingUp,
  AlertTriangle,
  Building2,
  RefreshCw,
  Info,
  CheckCircle2,
  BarChart3,
  Boxes,
} from 'lucide-react';

export default function SuperAdminReportsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [report, setReport] = useState<FinancialReportSummary | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const sRes = await fetch('/api/stores').then((r) => r.json());
      setStores(sRes.stores || []);
      await fetchReports();
    } catch (err) {
      console.error('Error loading reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStore) params.append('store_id', selectedStore);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [reportRes, alertsRes] = await Promise.all([
        fetch(`/api/reports/financial?${params.toString()}`).then((r) => r.json()),
        fetch(`/api/reports/low-stock${selectedStore ? `?store_id=${selectedStore}` : ''}`).then((r) =>
          r.json()
        ),
      ]);

      if (reportRes.success) {
        setReport(reportRes.report);
      }
      if (alertsRes.success) {
        setLowStockAlerts(alertsRes.alerts || []);
      }
    } catch (err) {
      console.error('Gagal mengambil laporan finansial:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedStore, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Header Action & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#D4AF37]" />
            Laporan Keuangan & Persediaan Retail
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Analisis omzet, snapshot HPP moving average, laba kotor, OPEX & perbandingan 3 cabang toko Kendal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReports()}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-900"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Segarkan Laporan
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-[#12151C] border-neutral-800 p-4 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Filter Cabang</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="">Konsolidasi Semua Cabang (Kendal Kota, Pegandon, Kaliwungu)</option>
              {stores.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.type === 'WAREHOUSE' ? 'Gudang Pusat' : 'Toko Cabang'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </Card>

      {/* Disclaimer Banner Akuntansi Operasional */}
      <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl text-amber-200/90 text-xs flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-300">
            Pemberitahuan Batasan Laporan Operasional Ritel:
          </p>
          <p className="text-amber-200/80 mt-0.5 leading-relaxed">
            Laporan ini adalah laporan laba-rugi operasional ritel internal berbasis transaksi POS (Omzet Bersih, Snapshot HPP Terjual, Biaya Operasional Cabang, dan Nilai Stok Aktual). Laporan ini bukan neraca saldo akuntansi korporat penuh (belum memperhitungkan depresiasi aset tetap, amortisasi, atau pajak badan akhir tahun). Mutasi antar-toko tidak dihitung sebagai omzet penjualan, dan pembelian barang tidak dibebankan sebagai HPP saat pembelian.
          </p>
        </div>
      </div>

      {/* 6 Metric Cards Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-[#12151C] border-neutral-800 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            Penjualan Bersih
          </span>
          <p className="text-lg font-bold text-white mt-1">
            {formatIDR(report?.total_net_sales || 0)}
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Gross: {formatIDR(report?.total_gross_sales || 0)}
          </span>
        </Card>

        <Card className="bg-[#12151C] border-neutral-800 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            Total Diskon/Poin
          </span>
          <p className="text-lg font-bold text-amber-400 mt-1">
            {formatIDR(report?.total_discounts || 0)}
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            {report?.total_transactions || 0} struk POS
          </span>
        </Card>

        <Card className="bg-[#12151C] border-neutral-800 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            HPP Terjual (COGS)
          </span>
          <p className="text-lg font-bold text-neutral-200 mt-1">
            {formatIDR(report?.total_cogs || 0)}
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">Snapshot harga beli</span>
        </Card>

        <Card className="bg-[#12151C] border-[#D4AF37]/30 bg-gradient-to-br from-[#12151C] to-[#1a1710] p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#D4AF37]">
            Laba Kotor (Gross)
          </span>
          <p className="text-lg font-bold text-[#D4AF37] mt-1">
            {formatIDR(report?.gross_profit || 0)}
          </p>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
            Margin: {report?.gross_profit_margin_pct || 0}%
          </span>
        </Card>

        <Card className="bg-[#12151C] border-neutral-800 p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
            Biaya Operasional
          </span>
          <p className="text-lg font-bold text-red-400 mt-1">
            {formatIDR(report?.total_expenses || 0)}
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">OPEX tercatat</span>
        </Card>

        <Card className="bg-[#12151C] border-emerald-900/40 bg-gradient-to-br from-[#12151C] to-[#0c1813] p-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
            Laba Operasional
          </span>
          <p className="text-lg font-bold text-emerald-400 mt-1">
            {formatIDR(report?.net_operating_profit || 0)}
          </p>
          <span className="text-[11px] text-emerald-500/80 mt-1 block">Laba Kotor - OPEX</span>
        </Card>
      </div>

      {/* Nilai Persediaan Ritel Konsolidasian */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="bg-[#12151C] border-neutral-800 p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
              Total Nilai Persediaan Fisik (Moving HPP)
            </span>
            <p className="text-2xl font-bold text-white mt-1">
              {formatIDR(report?.total_inventory_value || 0)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Dihitung dari seluruh saldo stok fisik dikali Moving Average HPP
            </p>
          </div>
          <div className="p-3.5 bg-blue-950/40 border border-blue-800/50 rounded-xl text-blue-400">
            <Boxes className="w-7 h-7" />
          </div>
        </Card>

        <Card className="bg-[#12151C] border-neutral-800 p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
              Peringatan Stok Kritis (Under Minimum)
            </span>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {lowStockAlerts.length} Varian Produk Menipis
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Perlu dibuatkan permintaan mutasi gudang atau order supplier
            </p>
          </div>
          <div className="p-3.5 bg-amber-950/40 border border-amber-800/50 rounded-xl text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
        </Card>
      </div>

      {/* Tabel Perbandingan 3 Toko Cabang (Kendal Kota, Pegandon, Kaliwungu) */}
      <Card className="bg-[#12151C] border-neutral-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#D4AF37]" />
              Komparasi Kinerja Finansial Antar Cabang
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tolak ukur kinerja retail: Kendal Kota, Pegandon, dan Kaliwungu
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-300">
            <thead className="bg-[#181C24] text-xs uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">Nama Toko</th>
                <th className="py-3.5 px-4 text-right">Penjualan Bersih</th>
                <th className="py-3.5 px-4 text-right">HPP (COGS)</th>
                <th className="py-3.5 px-4 text-right">Laba Kotor</th>
                <th className="py-3.5 px-4 text-center">Margin %</th>
                <th className="py-3.5 px-4 text-right">Biaya OPEX</th>
                <th className="py-3.5 px-4 text-right">Laba Operasional</th>
                <th className="py-3.5 px-4 text-right">Nilai Stok</th>
                <th className="py-3.5 px-4 text-center">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono text-xs">
              {report?.store_metrics?.map((m) => {
                const isProfit = m.net_operating_profit >= 0;
                return (
                  <tr key={m.store_id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-medium text-white text-sm">
                      {m.store_name}
                      <span className="block text-xs font-mono text-neutral-400 mt-0.5">
                        {m.store_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-neutral-100">
                      {formatIDR(m.net_sales)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-neutral-300">
                      {formatIDR(m.cogs)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#D4AF37]">
                      {formatIDR(m.gross_profit)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700">
                        {m.gross_profit_margin_pct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-red-400">
                      {formatIDR(m.expenses)}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold text-sm ${
                        isProfit ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {formatIDR(m.net_operating_profit)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-blue-300">
                      {formatIDR(m.inventory_value)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-sans text-neutral-400">
                      {m.transaction_count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Daftar Peringatan Stok Menipis */}
      <Card className="bg-[#12151C] border-neutral-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Rincian Peringatan Stok Menipis (Di Bawah Minimum Buffer)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Diperlukan mutasi stok dari gudang Kendal atau pemesanan ulang ke supplier
            </p>
          </div>
          <span className="text-xs text-neutral-400">{lowStockAlerts.length} produk</span>
        </div>

        {lowStockAlerts.length === 0 ? (
          <div className="p-10 text-center text-emerald-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8" />
            <p className="font-medium">Seluruh stok cabang dalam batas aman di atas buffer minimum.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="bg-[#181C24] text-xs uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Kode SKU</th>
                  <th className="py-3 px-4">Nama Produk Parfum</th>
                  <th className="py-3 px-4">Lokasi Cabang</th>
                  <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                  <th className="py-3 px-4 text-center">Batas Minimum</th>
                  <th className="py-3 px-4 text-center">Defisit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-xs">
                {lowStockAlerts.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3 px-4 text-neutral-400">{item.product.sku}</td>
                    <td className="py-3 px-4 font-sans font-medium text-white">
                      {item.product.name}
                    </td>
                    <td className="py-3 px-4 font-sans text-neutral-300">{item.store.name}</td>
                    <td className="py-3 px-4 text-center font-bold text-red-400">
                      {item.current_stock}
                    </td>
                    <td className="py-3 px-4 text-center text-neutral-300">
                      {item.min_stock_alert}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-400">
                      -{item.deficit}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-300 border border-red-800/50">
                        Kritis
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
