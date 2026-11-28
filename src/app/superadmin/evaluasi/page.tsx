'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatIDR } from '@/lib/formatters';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Receipt,
  ArrowUpDown,
  RefreshCw,
  Store,
} from 'lucide-react';

type PresetMode = 'MONTH_VS_PREV' | 'SAME_DAY_MOM' | 'TODAY_VS_PREV_END' | 'CUSTOM';
type SortOption = 'PROFIT_GROWTH_DESC' | 'PROFIT_GROWTH_ASC' | 'TRX_GROWTH_DESC';

interface GrowthMetric {
  primary: number;
  compare: number;
  diff: number;
  pct: number;
  status: 'TUMBUH' | 'MINUS' | 'STABIL';
}

interface BranchEval {
  store_id: string;
  store_name: string;
  store_code: string;
  transactions: GrowthMetric;
  net_sales: GrowthMetric;
  gross_profit: GrowthMetric;
  expenses: GrowthMetric;
  net_profit: GrowthMetric;
}

interface EvaluationData {
  periods: {
    primary_start: string;
    primary_end: string;
    compare_start: string;
    compare_end: string;
  };
  totals: {
    transactions: GrowthMetric;
    net_sales: GrowthMetric;
    gross_profit: GrowthMetric;
    expenses: GrowthMetric;
    net_profit: GrowthMetric;
    central_expenses: GrowthMetric;
  };
  branches: BranchEval[];
}

function getWibTodayParts() {
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
    new Date()
  );
  const [y, m, d] = todayStr.split('-').map(Number);
  const prevYear = m === 1 ? y - 1 : y;
  const prevMonth = m === 1 ? 12 : m - 1;
  const prevLastDay = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    todayStr,
    year: y,
    month: m,
    day: d,
    monthStart: `${y}-${pad(m)}-01`,
    prevMonthStart: `${prevYear}-${pad(prevMonth)}-01`,
    prevMonthEnd: `${prevYear}-${pad(prevMonth)}-${pad(prevLastDay)}`,
    prevSameDay: `${prevYear}-${pad(prevMonth)}-${pad(Math.min(d, prevLastDay))}`,
    prevSameDayNum: Math.min(d, prevLastDay),
  };
}

function formatDateId(ymd: string) {
  if (!ymd) return '-';
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return ymd;
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dt);
}

function formatSignedIDR(val: number) {
  if (val > 0) return `+${formatIDR(val)}`;
  if (val < 0) return `-${formatIDR(Math.abs(val))}`;
  return 'Rp 0';
}

function GrowthBadge({ metric }: { metric: GrowthMetric }) {
  if (metric.status === 'TUMBUH' || metric.pct > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
        <TrendingUp className="w-3 h-3" />
        TUMBUH +{metric.pct.toFixed(1)}%
      </span>
    );
  }
  if (metric.status === 'MINUS' || metric.pct < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 whitespace-nowrap">
        <TrendingDown className="w-3 h-3" />
        MINUS {metric.pct.toFixed(1)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
      <Minus className="w-3 h-3" />
      STABIL 0%
    </span>
  );
}

export default function SuperAdminEvaluationPage() {
  const wib = useMemo(() => getWibTodayParts(), []);

  const [preset, setPreset] = useState<PresetMode>('MONTH_VS_PREV');
  const [sortBy, setSortBy] = useState<SortOption>('PROFIT_GROWTH_DESC');
  const [customPrimaryStart, setCustomPrimaryStart] = useState(wib.monthStart);
  const [customPrimaryEnd, setCustomPrimaryEnd] = useState(wib.todayStr);
  const [customCompareStart, setCustomCompareStart] = useState(wib.prevMonthStart);
  const [customCompareEnd, setCustomCompareEnd] = useState(wib.prevMonthEnd);

  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeRange = useMemo(() => {
    if (preset === 'MONTH_VS_PREV') {
      return {
        title: 'Bulan Ini vs Akhir Bulan Lalu',
        primaryStart: wib.monthStart,
        primaryEnd: wib.todayStr,
        compareStart: wib.prevMonthStart,
        compareEnd: wib.prevMonthEnd,
      };
    }
    if (preset === 'SAME_DAY_MOM') {
      return {
        title: `Tgl ${wib.day} Ini vs Tgl ${wib.prevSameDayNum} Lalu`,
        primaryStart: wib.todayStr,
        primaryEnd: wib.todayStr,
        compareStart: wib.prevSameDay,
        compareEnd: wib.prevSameDay,
      };
    }
    if (preset === 'TODAY_VS_PREV_END') {
      return {
        title: 'Hari Ini vs Akhir Bulan Kemarin',
        primaryStart: wib.todayStr,
        primaryEnd: wib.todayStr,
        compareStart: wib.prevMonthEnd,
        compareEnd: wib.prevMonthEnd,
      };
    }
    return {
      title: 'Custom Tanggal',
      primaryStart: customPrimaryStart,
      primaryEnd: customPrimaryEnd,
      compareStart: customCompareStart,
      compareEnd: customCompareEnd,
    };
  }, [preset, wib, customPrimaryStart, customPrimaryEnd, customCompareStart, customCompareEnd]);

  const primaryLabel =
    activeRange.primaryStart === activeRange.primaryEnd
      ? formatDateId(activeRange.primaryStart)
      : `${formatDateId(activeRange.primaryStart)} - ${formatDateId(activeRange.primaryEnd)}`;

  const compareLabel =
    activeRange.compareStart === activeRange.compareEnd
      ? formatDateId(activeRange.compareStart)
      : `${formatDateId(activeRange.compareStart)} - ${formatDateId(activeRange.compareEnd)}`;

  const loadEvaluation = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        primaryStart: activeRange.primaryStart,
        primaryEnd: activeRange.primaryEnd,
        compareStart: activeRange.compareStart,
        compareEnd: activeRange.compareEnd,
      });
      const res = await fetch(`/api/reports/evaluation?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memuat data evaluasi.');
      }
      setEvaluation(data.evaluation);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data evaluasi.');
    } finally {
      setLoading(false);
    }
  }, [activeRange]);

  useEffect(() => {
    loadEvaluation();
  }, [loadEvaluation]);

  const sortedBranches = useMemo(() => {
    const list = [...(evaluation?.branches || [])];
    list.sort((a, b) => {
      if (sortBy === 'PROFIT_GROWTH_ASC') {
        return a.net_profit.pct - b.net_profit.pct || a.net_profit.diff - b.net_profit.diff;
      }
      if (sortBy === 'TRX_GROWTH_DESC') {
        return b.transactions.pct - a.transactions.pct || b.transactions.diff - a.transactions.diff;
      }
      return b.net_profit.pct - a.net_profit.pct || b.net_profit.diff - a.net_profit.diff;
    });
    return list;
  }, [evaluation, sortBy]);

  const maxChartSales = useMemo(() => {
    let maxVal = 1;
    for (const b of sortedBranches) {
      maxVal = Math.max(maxVal, b.net_sales.primary, b.net_sales.compare);
    }
    return maxVal;
  }, [sortedBranches]);

  const pdfExportUrl = useMemo(() => {
    const params = new URLSearchParams({
      primaryStart: activeRange.primaryStart,
      primaryEnd: activeRange.primaryEnd,
      compareStart: activeRange.compareStart,
      compareEnd: activeRange.compareEnd,
      primaryLabel,
      compareLabel,
      presetTitle: activeRange.title,
      sortBy,
    });
    return `/api/reports/evaluation/pdf?${params.toString()}`;
  }, [activeRange, primaryLabel, compareLabel, sortBy]);

  const totals = evaluation?.totals;

  return (
    <div className="space-y-6">
      {/* Header Kontrol */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#162036] via-[#0F172A] to-[#090D16] border border-[#1E293B] shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
              <span>Evaluasi Pertumbuhan Penjualan (MoM)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Periode Aktif:{' '}
              <strong className="text-[#E5C365]">{primaryLabel}</strong>{' '}
              <span className="text-slate-500">vs</span>{' '}
              <strong className="text-slate-200">{compareLabel}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-[#090D16] border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer"
              >
                <option value="PROFIT_GROWTH_DESC" className="bg-[#0F172A]">
                  Pertumbuhan Laba Tertinggi
                </option>
                <option value="PROFIT_GROWTH_ASC" className="bg-[#0F172A]">
                  Paling Minus
                </option>
                <option value="TRX_GROWTH_DESC" className="bg-[#0F172A]">
                  Pertumbuhan Transaksi Tertinggi
                </option>
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadEvaluation}
              disabled={loading}
              className="border-slate-700 text-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            <a
              href={pdfExportUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold text-xs shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </a>
          </div>
        </div>

        {/* 4 Tombol Preset + Custom */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          {(
            [
              { id: 'MONTH_VS_PREV', label: 'Bulan Ini vs Akhir Bulan Lalu' },
              {
                id: 'SAME_DAY_MOM',
                label: `Tgl ${wib.day} Ini vs Tgl ${wib.prevSameDayNum} Lalu`,
              },
              { id: 'TODAY_VS_PREV_END', label: 'Hari Ini vs Akhir Bulan Kemarin' },
              { id: 'CUSTOM', label: 'Custom Tanggal' },
            ] as { id: PresetMode; label: string }[]
          ).map((btn) => {
            const active = preset === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setPreset(btn.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#D4AF37] text-[#070A0F] font-bold shadow-sm'
                    : 'bg-[#090D16] text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {btn.id === 'CUSTOM' && <Calendar className="w-3.5 h-3.5" />}
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Date Inputs */}
        {preset === 'CUSTOM' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-[#090D16] border border-[#D4AF37]/30 space-y-2">
              <p className="text-[11px] font-bold text-[#E5C365] uppercase tracking-wider">
                Periode Utama
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Dari</label>
                  <input
                    type="date"
                    value={customPrimaryStart}
                    onChange={(e) => setCustomPrimaryStart(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Sampai</label>
                  <input
                    type="date"
                    value={customPrimaryEnd}
                    onChange={(e) => setCustomPrimaryEnd(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Periode Pembanding
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Dari</label>
                  <input
                    type="date"
                    value={customCompareStart}
                    onChange={(e) => setCustomCompareStart(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Sampai</label>
                  <input
                    type="date"
                    value={customCompareEnd}
                    onChange={(e) => setCustomCompareEnd(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-700 text-rose-200 text-xs">
          {error}
        </div>
      )}

      {/* 2 Kartu Ringkasan Konsolidasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card bordered className="bg-[#0F172A]/95 p-5 border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#D4AF37]" />
              <span>Total Transaksi Konsolidasi (3 Cabang)</span>
            </span>
            {totals && <GrowthBadge metric={totals.transactions} />}
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {totals?.transactions.primary ?? 0} Trx
            </span>
            <span className="text-xs text-slate-400">
              vs {totals?.transactions.compare ?? 0} Trx pembanding
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Selisih:{' '}
            <strong
              className={
                (totals?.transactions.diff ?? 0) > 0
                  ? 'text-emerald-400'
                  : (totals?.transactions.diff ?? 0) < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }
            >
              {(totals?.transactions.diff ?? 0) > 0
                ? `+${totals?.transactions.diff}`
                : totals?.transactions.diff ?? 0}{' '}
              Transaksi
            </strong>
          </p>
        </Card>

        <Card bordered className="bg-[#0F172A]/95 p-5 border-[#D4AF37]/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
              <span>Total Omzet &amp; Laba Bersih Konsolidasi</span>
            </span>
            {totals && <GrowthBadge metric={totals.net_profit} />}
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div>
              <span className="text-[11px] text-slate-400 block">Omzet Penjualan</span>
              <span className="text-xl sm:text-2xl font-black text-[#E5C365] font-mono">
                {formatIDR(totals?.net_sales.primary ?? 0)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Laba Bersih Cabang</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {formatIDR(totals?.net_profit.primary ?? 0)}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Pembanding Laba: {formatIDR(totals?.net_profit.compare ?? 0)} • Selisih:{' '}
            <strong
              className={
                (totals?.net_profit.diff ?? 0) > 0
                  ? 'text-emerald-400'
                  : (totals?.net_profit.diff ?? 0) < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }
            >
              {formatSignedIDR(totals?.net_profit.diff ?? 0)}
            </strong>
            {totals && (totals.central_expenses.primary > 0 || totals.central_expenses.compare > 0) && (
              <span className="text-slate-500">
                {' '}
                • OPEX Pusat: {formatIDR(totals.central_expenses.primary)}
              </span>
            )}
          </p>
        </Card>
      </div>

      {/* Grafik Batang Horizontal Perbandingan Antar Cabang */}
      <Card bordered className="bg-[#0F172A]/95 p-5 border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white">
              Grafik Perbandingan Omzet Per Cabang
            </h2>
            <p className="text-xs text-slate-400">
              Membandingkan performa periode utama dengan periode pembanding di setiap outlet.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-200">
              <span className="w-3 h-3 rounded bg-[#D4AF37]" />
              Periode Utama
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded bg-slate-500" />
              Pembanding
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {sortedBranches.map((b) => {
            const pWidth = Math.max(2, Math.round((b.net_sales.primary / maxChartSales) * 100));
            const cWidth = Math.max(2, Math.round((b.net_sales.compare / maxChartSales) * 100));
            return (
              <div
                key={b.store_id}
                className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800/80 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {b.store_name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{b.store_code}</span>
                  </div>
                  <GrowthBadge metric={b.net_profit} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-20 shrink-0 text-[11px] text-[#E5C365] font-medium">
                      Utama
                    </span>
                    <div className="flex-1 h-3 rounded-full bg-slate-800/90 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C365] transition-all duration-500"
                        style={{ width: `${b.net_sales.primary > 0 ? pWidth : 0}%` }}
                      />
                    </div>
                    <span className="w-28 text-right font-mono font-bold text-white shrink-0">
                      {formatIDR(b.net_sales.primary)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-20 shrink-0 text-[11px] text-slate-400">
                      Pembanding
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-slate-800/90 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-500 transition-all duration-500"
                        style={{ width: `${b.net_sales.compare > 0 ? cWidth : 0}%` }}
                      />
                    </div>
                    <span className="w-28 text-right font-mono text-slate-400 shrink-0">
                      {formatIDR(b.net_sales.compare)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tabel Rincian Per Cabang (Responsif & Scrollable di Mobile) */}
      <Card bordered className="bg-[#0F172A]/95 border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Rincian Pertumbuhan Per Cabang</h2>
            <p className="text-xs text-slate-400">
              Laba Bersih = Omzet Penjualan - HPP Produk - Beban Operasional Cabang.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-[#090D16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Cabang / Outlet</th>
                <th className="py-3 px-4 text-center">Transaksi (Utama vs Bnd)</th>
                <th className="py-3 px-4 text-right">Omzet (Utama vs Bnd)</th>
                <th className="py-3 px-4 text-right">Laba Bersih (Utama vs Bnd)</th>
                <th className="py-3 px-4 text-right">Selisih Laba</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Menghitung evaluasi pertumbuhan cabang...
                  </td>
                </tr>
              ) : (
                <>
                  {sortedBranches.map((b) => (
                    <tr key={b.store_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{b.store_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {b.store_code} • OPEX: {formatIDR(b.expenses.primary)}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="font-bold text-white">{b.transactions.primary}</span>{' '}
                        <span className="text-slate-500">vs {b.transactions.compare}</span>
                        <div className="text-[10px] text-slate-400">
                          ({b.transactions.diff > 0 ? `+${b.transactions.diff}` : b.transactions.diff} Trx)
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-[#E5C365]">
                          {formatIDR(b.net_sales.primary)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          vs {formatIDR(b.net_sales.compare)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-emerald-400">
                          {formatIDR(b.net_profit.primary)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          vs {formatIDR(b.net_profit.compare)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            b.net_profit.diff > 0
                              ? 'text-emerald-400'
                              : b.net_profit.diff < 0
                              ? 'text-rose-400'
                              : 'text-slate-300'
                          }
                        >
                          {formatSignedIDR(b.net_profit.diff)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <GrowthBadge metric={b.net_profit} />
                      </td>
                    </tr>
                  ))}

                  {totals && (
                    <tr className="bg-[#090D16] font-bold border-t-2 border-slate-700">
                      <td className="py-3.5 px-4 text-white">TOTAL KONSOLIDASI</td>
                      <td className="py-3.5 px-4 text-center font-mono text-white">
                        {totals.transactions.primary} vs {totals.transactions.compare}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-[#E5C365]">
                        <div>{formatIDR(totals.net_sales.primary)}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          vs {formatIDR(totals.net_sales.compare)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                        <div>{formatIDR(totals.net_profit.primary)}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          vs {formatIDR(totals.net_profit.compare)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white">
                        {formatSignedIDR(totals.net_profit.diff)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <GrowthBadge metric={totals.net_profit} />
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
