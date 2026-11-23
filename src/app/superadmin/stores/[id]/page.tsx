'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StoreTransactionSummary } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatIDR, formatDateTimeJakarta } from '@/lib/formatters';
import {
  Store as StoreIcon,
  Banknote,
  QrCode,
  FileText,
  Printer,
  ArrowLeft,
  Calendar,
  Search,
  CheckCircle2,
  Receipt,
  Download,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params?.id as string;

  const [summary, setSummary] = useState<StoreTransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'MONTH'>('ALL');
  const [searchInvoice, setSearchInvoice] = useState('');

  const fetchStoreData = async (period = periodFilter) => {
    try {
      setLoading(true);
      setError(null);

      const urlParams = new URLSearchParams();
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

      if (period === 'TODAY') {
        urlParams.append('startDate', today);
        urlParams.append('endDate', today);
      } else if (period === 'MONTH') {
        const firstDayOfMonth = today.slice(0, 8) + '01';
        urlParams.append('startDate', firstDayOfMonth);
        urlParams.append('endDate', today);
      }

      const res = await fetch(`/api/reports/stores/${storeId}?${urlParams.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memuat data toko.');
      }
      const data = await res.json();
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchStoreData(periodFilter);
    }
  }, [storeId, periodFilter]);

  const filteredSales = (summary?.recent_sales || []).filter((s) => {
    if (!searchInvoice.trim()) return true;
    const q = searchInvoice.toLowerCase();
    const matchInv = s.invoice_number?.toLowerCase().includes(q);
    const matchCashier = s.cashier?.full_name?.toLowerCase().includes(q);
    const matchMember = s.member?.name?.toLowerCase().includes(q);
    return matchInv || matchCashier || matchMember;
  });

  const todayWib = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  const pdfDownloadUrl = `/api/reports/stores/${storeId}/pdf${
    periodFilter === 'TODAY'
      ? `?startDate=${todayWib}&endDate=${todayWib}`
      : periodFilter === 'MONTH'
      ? `?startDate=${todayWib.slice(0, 8)}01&endDate=${todayWib}`
      : ''
  }`;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/superadmin"
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard (Layar 1)</span>
          </Link>
          <Badge variant="blue" size="sm">
            Layar 2: Detail Transaksi &amp; Kategori
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold text-xs shadow-lg shadow-[#D4AF37]/20 hover:brightness-110 transition flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Output Report PDF Toko</span>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStoreData()}
            className="border-slate-800 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Store Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#162036] to-[#0A0E1A] border border-[#1E293B] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center shrink-0">
            <StoreIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{summary?.store_name || 'Detail Cabang Toko'}</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#E5C365] border border-[#D4AF37]/30">
                {summary?.store_code}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {summary?.store_address || 'Kendal, Jawa Tengah'} • Kontak: {summary?.store_phone || '-'}
            </p>
          </div>
        </div>

        {/* Period Filter Selector */}
        <div className="flex items-center gap-1 bg-[#090D16] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setPeriodFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              periodFilter === 'ALL'
                ? 'bg-[#D4AF37] text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua Waktu
          </button>
          <button
            onClick={() => setPeriodFilter('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              periodFilter === 'TODAY'
                ? 'bg-[#D4AF37] text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriodFilter('MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              periodFilter === 'MONTH'
                ? 'bg-[#D4AF37] text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* SECTION 1: RANGKUMAN JENIS TRANSAKSI (CASH VS QRIS) */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#D4AF37]" />
          <span>1. Rangkuman Jenis Transaksi Pembayaran</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: CASH */}
          <Card bordered className="bg-[#0A0E1A] border-emerald-500/30 shadow-lg">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4" />
                  Transaksi CASH (Tunai)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                  {summary?.cash_summary.count || 0} Trx
                </span>
              </div>
              <p className="text-2xl font-black text-white mt-2 font-mono">
                {formatIDR(summary?.cash_summary.amount || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Total uang masuk via pembayaran fisik kasir
              </p>
            </CardContent>
          </Card>

          {/* Card 2: QRIS */}
          <Card bordered className="bg-[#0A0E1A] border-blue-500/30 shadow-lg">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  Transaksi QRIS
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/60">
                  {summary?.qris_summary.count || 0} Trx
                </span>
              </div>
              <p className="text-2xl font-black text-white mt-2 font-mono">
                {formatIDR(summary?.qris_summary.amount || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Total pembayaran digital via barcode QRIS
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Total Omset Toko */}
          <Card bordered className="bg-[#0A0E1A] border-[#D4AF37]/40 shadow-lg">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E5C365] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Total Omset Toko
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#E5C365] border border-[#D4AF37]/30">
                  {summary?.total_transactions || 0} Trx
                </span>
              </div>
              <p className="text-2xl font-black text-[#D4AF37] mt-2 font-mono">
                {formatIDR(summary?.total_net_sales || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Gabungan omset Cash + QRIS cabang ini
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Sisa Cash Fisik di Laci */}
          <Card bordered className="bg-[#0A0E1A] border-amber-500/30 shadow-lg">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  Cash Fisik di Laci
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Belum Disetor
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                {formatIDR(summary?.available_cash || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Saldo fisik aktual yang siap disetor ke pusat
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 2: RANGKUMAN KATEGORI PRODUK TERJUAL */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>2. Rangkuman Kategori Produk Terjual</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(summary?.category_summary || []).map((cat) => {
            const totalOmset = summary?.total_net_sales || 1;
            const pct = (cat.total_amount / totalOmset) * 100;

            return (
              <div
                key={cat.category}
                className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 space-y-2 hover:border-slate-700 transition shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{cat.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {cat.transaction_count} trx
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Total Volume / Terjual:</p>
                  <p className="text-lg font-black text-white font-mono">
                    {cat.total_quantity.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">{cat.unit}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500">Nominal Omset:</p>
                    <p className="text-sm font-bold text-[#D4AF37] font-mono">
                      {formatIDR(cat.total_amount)}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: TABEL RINCIAN TRANSAKSI */}
      <Card bordered className="bg-[#0F172A]/90 border-slate-800">
        <CardHeader className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#D4AF37]" />
              <span>3. Rincian Seluruh Transaksi Toko ({filteredSales.length} Transaksi)</span>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Setiap transaksi dapat dicetak struk thermal atau dikeluarkan output PDF.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no invoice, kasir, member..."
              value={searchInvoice}
              onChange={(e) => setSearchInvoice(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#090D16] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090D16] text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Invoice</th>
                  <th className="py-3 px-4">Waktu Transaksi</th>
                  <th className="py-3 px-4">Petugas Kasir</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4 text-center">Metode Bayar</th>
                  <th className="py-3 px-4">Keterangan Item Produk</th>
                  <th className="py-3 px-4 text-right">Total Bayar</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSales.map((sale) => {
                  const paymentMethod = sale.payments?.[0]?.payment_method || 'CASH';

                  return (
                    <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {sale.invoice_number}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {formatDateTimeJakarta(sale.created_at)}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {sale.cashier?.full_name || 'Kasir Standby'}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {sale.member ? (
                          <span className="text-emerald-400 font-semibold">{sale.member.name}</span>
                        ) : (
                          <span className="text-slate-500">Non-Member</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {paymentMethod === 'CASH' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
                            <Banknote className="w-3 h-3" />
                            CASH
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/70 text-blue-300 border border-blue-500/30">
                            <QrCode className="w-3 h-3" />
                            QRIS
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="space-y-0.5">
                          {(sale.items || []).slice(0, 2).map((it) => (
                            <div key={it.id} className="text-[11px] truncate max-w-xs">
                              • {it.product?.name} ({it.quantity} {it.product?.unit_name || 'ml'})
                            </div>
                          ))}
                          {(sale.items?.length || 0) > 2 && (
                            <div className="text-[10px] text-slate-500">
                              + {(sale.items?.length || 0) - 2} item lainnya
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#D4AF37]">
                        {formatIDR(sale.final_amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a
                          href={`/cashier/receipt/${sale.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 hover:text-white transition"
                          title="Cetak Struk / PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Struk</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}

                {filteredSales.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-500">
                      Tidak ada riwayat transaksi pada filter periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
