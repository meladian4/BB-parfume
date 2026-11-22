'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Calendar,
  Filter,
  X,
} from 'lucide-react';

type FilterMode = 'MANUAL_DMY' | 'CUSTOM_RANGE' | 'ALL';

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const computeDateRangeFromManual = (day: string, month: string, year: string) => {
  const y = year || String(new Date().getFullYear());
  if (month === 'ALL') {
    return {
      start: `${y}-01-01`,
      end: `${y}-12-31`,
    };
  }
  const m = month || String(new Date().getMonth() + 1);
  const paddedM = String(m).padStart(2, '0');

  if (day === 'ALL') {
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    return {
      start: `${y}-${paddedM}-01`,
      end: `${y}-${paddedM}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  const paddedD = String(day).padStart(2, '0');
  return {
    start: `${y}-${paddedM}-${paddedD}`,
    end: `${y}-${paddedM}-${paddedD}`,
  };
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch {
    return dateStr;
  }
};

export default function SuperAdminReportsPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [report, setReport] = useState<FinancialReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [filterMode, setFilterMode] = useState<FilterMode>('MANUAL_DMY');

  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1);

  const [manualDay, setManualDay] = useState<string>('ALL'); // 'ALL' or '1'..'31'
  const [manualMonth, setManualMonth] = useState<string>(currentMonth);
  const [manualYear, setManualYear] = useState<string>(currentYear);

  const initialRange = computeDateRangeFromManual('ALL', currentMonth, currentYear);
  const [startDate, setStartDate] = useState<string>(initialRange.start);
  const [endDate, setEndDate] = useState<string>(initialRange.end);

  const maxDaysInMonth = useMemo(() => {
    if (manualMonth === 'ALL') return 31;
    const y = parseInt(manualYear, 10) || new Date().getFullYear();
    const m = parseInt(manualMonth, 10) || 1;
    return new Date(y, m, 0).getDate();
  }, [manualYear, manualMonth]);

  const handleManualChange = (newDay: string, newMonth: string, newYear: string) => {
    setManualDay(newDay);
    setManualMonth(newMonth);
    setManualYear(newYear);
    setFilterMode('MANUAL_DMY');
    const { start, end } = computeDateRangeFromManual(newDay, newMonth, newYear);
    setStartDate(start);
    setEndDate(end);
  };

  const handleSetAllTime = () => {
    setFilterMode('ALL');
    setStartDate('');
    setEndDate('');
  };

  const activePeriodLabel = useMemo(() => {
    if (filterMode === 'ALL' || (!startDate && !endDate)) {
      return 'Semua Waktu (Sepanjang Masa)';
    }
    if (filterMode === 'MANUAL_DMY') {
      const yearStr = manualYear;
      if (manualMonth === 'ALL') {
        return `Tahun ${yearStr} (1 Tahun Penuh)`;
      }
      const monthName = MONTHS[Number(manualMonth) - 1] || '';
      if (manualDay === 'ALL') {
        return `${monthName} ${yearStr} (1 Bulan Penuh)`;
      }
      return `${manualDay} ${monthName} ${yearStr}`;
    }
    // CUSTOM_RANGE
    if (startDate && endDate) {
      if (startDate === endDate) return formatDisplayDate(startDate);
      return `${formatDisplayDate(startDate)} — ${formatDisplayDate(endDate)}`;
    }
    if (startDate) return `Sejak ${formatDisplayDate(startDate)}`;
    if (endDate) return `Hingga ${formatDisplayDate(endDate)}`;
    return 'Semua Waktu';
  }, [filterMode, startDate, endDate, manualDay, manualMonth, manualYear]);

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

      const reportRes = await fetch(`/api/reports/financial?${params.toString()}`).then((r) => r.json());

      if (reportRes.success) {
        setReport(reportRes.report);
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
      <Card className="bg-[#12151C] border-neutral-800 p-4 shadow-lg space-y-4">
        {/* Row 1: Filter Cabang & Current Active Date Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              Filter Cabang Toko
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full bg-[#181C24] border border-neutral-700 rounded-xl px-3 py-2 text-xs md:text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="">Konsolidasi Semua Cabang (Kendal Kota, Pegandon, Kaliwungu)</option>
              {stores.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.type === 'WAREHOUSE' ? 'Gudang Pusat' : 'Toko Cabang'})
                </option>
              ))}
            </select>
          </div>

          {/* Active Period Indicator Badge */}
          <div className="flex items-center gap-2.5 bg-[#181C24] border border-neutral-800 rounded-xl px-3.5 py-2.5 self-start md:self-end">
            <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div className="text-xs">
              <span className="text-neutral-400 block text-[10px] uppercase tracking-wider font-semibold">
                Periode Laporan Aktif:
              </span>
              <span className="font-semibold text-white">
                {activePeriodLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: Manual Customize (Tanggal, Bulan & Tahun) */}
        <div className="pt-3 border-t border-neutral-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              Pilihan Waktu (Pilih Manual):
            </span>

            {/* Toggle Modes: Manual DMY / Rentang Bebas / Semua */}
            <div className="flex items-center gap-1.5 bg-[#181C24] p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setFilterMode('MANUAL_DMY');
                  handleManualChange(manualDay, manualMonth, manualYear);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'MANUAL_DMY'
                    ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                🗓️ Pilih Tanggal / Bulan / Tahun
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('CUSTOM_RANGE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'CUSTOM_RANGE'
                    ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                📅 Rentang Tanggal Bebas
              </button>
              <button
                type="button"
                onClick={handleSetAllTime}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'ALL'
                    ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                🌐 Semua Waktu
              </button>
            </div>
          </div>

          {/* Mode 1: MANUAL_DMY (Dropdown Tanggal, Bulan, Tahun secara Manual) */}
          {filterMode === 'MANUAL_DMY' && (
            <div className="bg-[#181C24] p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Tanggal */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                    Pilih Tanggal:
                  </label>
                  <select
                    value={manualDay}
                    onChange={(e) => handleManualChange(e.target.value, manualMonth, manualYear)}
                    className="w-full bg-[#12151C] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="ALL">Semua Tanggal (1 Bulan Penuh)</option>
                    {Array.from({ length: maxDaysInMonth }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d)}>
                        Tanggal {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Bulan */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                    Pilih Bulan:
                  </label>
                  <select
                    value={manualMonth}
                    onChange={(e) => handleManualChange(manualDay, e.target.value, manualYear)}
                    className="w-full bg-[#12151C] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="ALL">Semua Bulan (1 Tahun Penuh)</option>
                    {MONTHS.map((m, idx) => (
                      <option key={idx + 1} value={String(idx + 1)}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Tahun */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                    Pilih Tahun:
                  </label>
                  <select
                    value={manualYear}
                    onChange={(e) => handleManualChange(manualDay, manualMonth, e.target.value)}
                    className="w-full bg-[#12151C] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <option key={y} value={String(y)}>
                        Tahun {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick helper shortcuts */}
              <div className="flex items-center gap-2 pt-2.5 border-t border-neutral-800/80 text-xs flex-wrap">
                <span className="text-[11px] text-neutral-400">Pintasan Cepat:</span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    handleManualChange(String(d.getDate()), String(d.getMonth() + 1), String(d.getFullYear()));
                  }}
                  className="px-2.5 py-1 rounded bg-[#12151C] hover:bg-[#222734] border border-neutral-700 text-neutral-200 text-xs"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    handleManualChange('ALL', String(d.getMonth() + 1), String(d.getFullYear()));
                  }}
                  className="px-2.5 py-1 rounded bg-[#12151C] hover:bg-[#222734] border border-neutral-700 text-neutral-200 text-xs"
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    const lastM = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                    handleManualChange('ALL', String(lastM.getMonth() + 1), String(lastM.getFullYear()));
                  }}
                  className="px-2.5 py-1 rounded bg-[#12151C] hover:bg-[#222734] border border-neutral-700 text-neutral-200 text-xs"
                >
                  Bulan Lalu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    handleManualChange('ALL', 'ALL', String(d.getFullYear()));
                  }}
                  className="px-2.5 py-1 rounded bg-[#12151C] hover:bg-[#222734] border border-neutral-700 text-neutral-200 text-xs"
                >
                  Tahun Ini
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: CUSTOM_RANGE (Dari Tanggal s/d Sampai Tanggal Bebas) */}
          {filterMode === 'CUSTOM_RANGE' && (
            <div className="bg-[#181C24] p-4 rounded-xl border border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                  Dari Tanggal:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#12151C] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                  Sampai Tanggal:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#12151C] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          )}
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
      <Card className="bg-[#12151C] border-neutral-800 p-5 shadow-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Total Nilai Persediaan Fisik (Moving HPP)
          </span>
          <p className="text-2xl font-bold text-white mt-1">
            {formatIDR(report?.total_inventory_value || 0)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            Dihitung dari seluruh saldo stok fisik dikali Moving Average HPP di seluruh cabang toko & gudang Kendal
          </p>
        </div>
        <div className="p-3.5 bg-blue-950/40 border border-blue-800/50 rounded-xl text-blue-400">
          <Boxes className="w-7 h-7" />
        </div>
      </Card>

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
    </div>
  );
}
