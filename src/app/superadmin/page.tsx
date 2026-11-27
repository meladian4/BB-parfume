'use client';

import React, { useState, useEffect } from 'react';
import { Store, Product, UserProfile, FinancialReportSummary, StoreTransactionSummary, CashDeposit } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatIDR, formatDateTimeJakarta } from '@/lib/formatters';
import Link from 'next/link';
import { BBLogo } from '@/components/ui/BBLogo';
import {
  Store as StoreIcon,
  Package,
  Users,
  ShieldCheck,
  TrendingUp,
  Boxes,
  Receipt,
  DollarSign,
  Award,
  ArrowRight,
  BarChart3,
  Truck,
  PackagePlus,
  Banknote,
  QrCode,
  FileText,
  Printer,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [report, setReport] = useState<FinancialReportSummary | null>(null);
  const [storeSummaries, setStoreSummaries] = useState<StoreTransactionSummary[]>([]);
  const [deposits, setDeposits] = useState<CashDeposit[]>([]);
  const [pendingTransfersCount, setPendingTransfersCount] = useState<number>(0);
  const [pendingPurchasesCount, setPendingPurchasesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Layar 2: Modal Detail Toko
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storeDetail, setStoreDetail] = useState<StoreTransactionSummary | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState<'ALL' | 'TODAY' | 'MONTH'>('ALL');
  const [detailSearch, setDetailSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, pRes, uRes, repRes, trRes, poRes, stSumRes, depRes] = await Promise.all([
        fetch('/api/stores').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/users').then((r) => r.json()),
        fetch('/api/reports/financial').then((r) => r.json()),
        fetch('/api/transfers').then((r) => r.json()),
        fetch('/api/purchases').then((r) => r.json()).catch(() => ({})),
        fetch('/api/reports/stores').then((r) => r.json()).catch(() => ({})),
        fetch('/api/pos/deposits').then((r) => r.json()).catch(() => ({})),
      ]);
      setStores(sRes?.stores || sRes?.data || []);
      setProducts(pRes?.products || pRes?.data || []);
      setUsers(uRes?.users || uRes?.data || []);
      setReport(repRes?.report || null);
      setStoreSummaries(stSumRes?.summaries || []);
      setDeposits(Array.isArray(depRes?.deposits) ? depRes.deposits : []);

      const trList = trRes?.data || trRes?.transfers || [];
      const pendingTr = Array.isArray(trList)
        ? trList.filter((t: any) => t.status === 'PENDING_APPROVAL' || t.status === 'PENDING_SHIPMENT').length
        : 0;
      setPendingTransfersCount(pendingTr);

      const poList = poRes?.data || poRes?.purchases || [];
      const pendingPo = Array.isArray(poList)
        ? poList.filter((p: any) => p.status === 'PENDING_APPROVAL').length
        : 0;
      setPendingPurchasesCount(pendingPo);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fetchStoreDetail = async (storeId: string, period = detailPeriod) => {
    try {
      setDetailLoading(true);
      const urlParams = new URLSearchParams();
      const today = new Date().toISOString().slice(0, 10);
      if (period === 'TODAY') {
        urlParams.append('startDate', today);
        urlParams.append('endDate', today);
      } else if (period === 'MONTH') {
        urlParams.append('startDate', today.slice(0, 8) + '01');
        urlParams.append('endDate', today);
      }
      const res = await fetch(`/api/reports/stores/${storeId}?${urlParams.toString()}`);
      const data = await res.json();
      if (data.success && data.summary) {
        setStoreDetail(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenStoreDetail = async (storeId: string) => {
    setSelectedStoreId(storeId);
    setIsDetailModalOpen(true);
    setDetailSearch('');
    await fetchStoreDetail(storeId, detailPeriod);
  };

  const handleSwitchPeriod = async (period: 'ALL' | 'TODAY' | 'MONTH') => {
    setDetailPeriod(period);
    if (selectedStoreId) {
      await fetchStoreDetail(selectedStoreId, period);
    }
  };

  const retailStores = stores.filter((s) => s.type === 'STORE');
  const approvedDeposits = deposits.filter((d) => d.status === 'APPROVED');
  const pendingDepositsCount = deposits.filter((d) => d.status === 'PENDING').length;
  const totalApprovedDeposits = approvedDeposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#162036] via-[#0F172A] to-[#090D16] border border-[#1E293B] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <BBLogo variant="gold" size="lg" withContainer />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="gold" size="sm">
                <ShieldCheck className="w-3 h-3 inline mr-1" />
                Sistem Aktif
              </Badge>
              <span className="text-xs text-slate-400">Kendal, Jawa Tengah</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              BB PARFUM PREMIUM <span className="text-[#D4AF37] font-light">EXECUTIVE</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Pusat komando dan kendali multi-cabang: 1 Gudang Pusat Distribusi dan 3 Toko Cabang Kendal Kota, Pegandon, dan Kaliwungu.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/superadmin/reports">
            <Button variant="primary" size="sm" className="bg-[#D4AF37] text-black font-semibold">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              <span>Laporan Finansial</span>
            </Button>
          </Link>
          <Link href="/superadmin/expenses">
            <Button variant="outline" size="sm">
              <DollarSign className="w-4 h-4 mr-1.5 text-red-400" />
              <span>Biaya OPEX</span>
            </Button>
          </Link>
          <Link href="/superadmin/members">
            <Button variant="outline" size="sm">
              <Award className="w-4 h-4 mr-1.5 text-amber-400" />
              <span>Member Poin</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert Pengajuan Mutasi Menunggu Persetujuan */}
      {pendingTransfersCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/80 to-[#0F172A] border border-blue-600/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Persetujuan Mutasi Menunggu Tindakan</span>
                <Badge variant="blue" size="sm">
                  {pendingTransfersCount} Surat Jalan
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Ada pengajuan mutasi stok barang dari Gudang Pusat ke Cabang Toko yang membutuhkan persetujuan Super Admin.
              </p>
            </div>
          </div>
          <Link href="/superadmin/transfers">
            <Button
              variant="primary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold whitespace-nowrap shadow-sm"
            >
              <span>Tinjau & Setujui di Menu Mutasi</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Alert Permintaan Pembelanjaan dari Logistik (Acuan Belanja) */}
      {pendingPurchasesCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-[#0F172A] to-[#162036] border border-amber-600/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <PackagePlus className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Permintaan Pembelanjaan Logistik Menunggu Review</span>
                <Badge variant="amber" size="sm">
                  {pendingPurchasesCount} Pengajuan
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tim Logistik telah mengirimkan daftar usulan kebutuhan barang sebagai bahan acuan pembelanjaan Super Admin.
              </p>
            </div>
          </div>
          <Link href="/superadmin/purchases">
            <Button
              variant="primary"
              size="sm"
              className="bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold whitespace-nowrap shadow-sm"
            >
              <span>Buka Acuan Pembelanjaan</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card bordered className="bg-[#0F172A]/90 p-5 border-emerald-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Penjualan Bersih (Net)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">{formatIDR(report?.total_net_sales || 0)}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {report?.total_transactions || 0} transaksi kasir
          </div>
        </Card>

        <Card bordered className="bg-[#0F172A]/90 p-5 border-[#D4AF37]/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Laba Kotor (Gross Profit)</span>
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#D4AF37]">{formatIDR(report?.gross_profit || 0)}</span>
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">
            Margin: {report?.gross_profit_margin_pct || 0}%
          </div>
        </Card>

        <Card bordered className="bg-[#0F172A]/90 p-5 border-red-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Biaya Operasional (OPEX)</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-red-400">{formatIDR(report?.total_expenses || 0)}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Gaji, sewa, listrik, kemasan</div>
        </Card>

        <Card bordered className="bg-[#0F172A]/90 p-5 border-blue-900/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Nilai Persediaan Fisik</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold text-blue-300">{formatIDR(report?.total_inventory_value || 0)}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Gudang & 3 Cabang Kendal</div>
        </Card>
      </div>

      {/* Setoran Kas & Katalog Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/superadmin/deposits" className="block group">
          <Card bordered className="bg-[#0F172A]/90 p-5 border-emerald-500/35 hover:border-emerald-400/60 transition h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold flex items-center gap-2">
                <span>Total Setoran Berhasil Diterima</span>
                {pendingDepositsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {pendingDepositsCount} Menunggu
                  </span>
                )}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {formatIDR(totalApprovedDeposits)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{approvedDeposits.length} setoran telah masuk ke kas utama</span>
              <span className="text-emerald-400 group-hover:translate-x-0.5 transition inline-flex items-center gap-1 font-medium">
                Lihat Setoran <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Card>
        </Link>

        <Link href="/superadmin/products" className="block group">
          <Card bordered className="bg-[#0F172A]/90 p-5 hover:border-blue-400/50 transition h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Katalog Parfum Resmi</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{products.length}</span>
              <span className="text-xs text-blue-400">SKU Unik</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Bibit Parfum, Botol &amp; Booster Lux</span>
              <span className="text-blue-400 group-hover:translate-x-0.5 transition inline-flex items-center gap-1 font-medium">
                Kelola Produk <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Card>
        </Link>
      </div>

      {/* 3 Branches Status Breakdown (Rangkuman Setiap Toko Sesuai Jenis Transaksi & Kategori - Layar 1) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <StoreIcon className="w-4 h-4 text-[#D4AF37]" />
              <span>Rangkuman Transaksi Setiap Cabang Toko (Layar 1)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Rangkuman penjualan per cabang: total transaksi CASH, total QRIS, dan sisa uang kas fisik. Klik cabang untuk melihat detail transaksi &amp; rangkuman kategori.
            </p>
          </div>
          <Badge variant="gold" size="sm">
            {retailStores.length} Cabang Aktif
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {retailStores.map((st) => {
            const sum = storeSummaries.find((s) => s.store_id === st.id);
            const cashierUser = users.find((u) => u.assigned_store_id === st.id);

            return (
              <Card
                key={st.id}
                bordered
                className="bg-[#0F172A]/90 hover:border-[#D4AF37]/50 transition-all shadow-xl flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="pb-3 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{st.name}</span>
                      </CardTitle>
                      <CardDescription className="font-mono text-[#D4AF37] text-[11px] font-semibold">
                        {st.code}
                      </CardDescription>
                    </div>
                    <Badge variant="emerald" size="sm">
                      Buka
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs pt-0">
                    <p className="text-slate-400 text-[11px] line-clamp-1">{st.address}</p>

                    {/* Total Penjualan Toko */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-slate-900 to-[#162036] border border-slate-800 space-y-0.5">
                      <div className="flex justify-between items-center text-slate-400 text-[11px]">
                        <span>Total Penjualan Toko:</span>
                        <span className="font-medium text-slate-300">
                          {sum?.total_transactions || 0} Transaksi
                        </span>
                      </div>
                      <div className="text-xl font-black text-[#D4AF37] font-mono">
                        {formatIDR(sum?.total_net_sales || 0)}
                      </div>
                    </div>

                    {/* Rangkuman 2 Jenis Transaksi: CASH & QRIS */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Box 1: CASH */}
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                        <div className="flex items-center justify-between text-emerald-400 text-[10px] font-bold">
                          <span className="flex items-center gap-1">
                            <Banknote className="w-3 h-3" />
                            CASH (Tunai)
                          </span>
                          <span>{sum?.cash_summary?.count || 0} Trx</span>
                        </div>
                        <p className="text-sm font-bold font-mono text-white mt-1">
                          {formatIDR(sum?.cash_summary?.amount || 0)}
                        </p>
                      </div>

                      {/* Box 2: QRIS */}
                      <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30">
                        <div className="flex items-center justify-between text-blue-400 text-[10px] font-bold">
                          <span className="flex items-center gap-1">
                            <QrCode className="w-3 h-3" />
                            QRIS
                          </span>
                          <span>{sum?.qris_summary?.count || 0} Trx</span>
                        </div>
                        <p className="text-sm font-bold font-mono text-white mt-1">
                          {formatIDR(sum?.qris_summary?.amount || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Sisa Cash Fisik di Toko */}
                    <div className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Cash Fisik di Laci:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {formatIDR(sum?.available_cash || 0)}
                      </span>
                    </div>

                    {/* Kasir Bertugas */}
                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                      <span>Kasir Bertugas:</span>
                      <span className="text-slate-200 font-medium">
                        {cashierUser?.full_name || 'Kasir Standby'}
                      </span>
                    </div>
                  </CardContent>
                </div>

                {/* Actions: Buka Detail & Unduh PDF */}
                <div className="p-4 pt-0 border-t border-slate-800/80 mt-3 flex items-center gap-2">
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => handleOpenStoreDetail(st.id)}
                    className="flex-1 text-xs font-bold shadow-md shadow-[#D4AF37]/15 flex items-center justify-center gap-1.5"
                  >
                    <span>Detail &amp; Kategori</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>

                  <a
                    href={`/api/reports/stores/${st.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center"
                    title="Unduh / Cetak Laporan PDF Toko"
                  >
                    <FileText className="w-4 h-4 text-[#D4AF37]" />
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* MODAL LAYAR 2: DETAIL TRANSAKSI & RANGKUMAN KATEGORI TOKO */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={storeDetail?.store_name || 'Detail Transaksi Toko'}
        description={`Kode Cabang: ${storeDetail?.store_code || '-'} • ${storeDetail?.store_address || '-'}`}
        maxWidth="2xl"
      >
        <div className="space-y-5 text-slate-200">
          {/* Top Controls: Filter Periode & Tombol Output PDF */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400 mr-1">Filter:</span>
              {(['ALL', 'TODAY', 'MONTH'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSwitchPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    detailPeriod === p
                      ? 'bg-[#D4AF37] text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p === 'ALL' ? 'Semua Waktu' : p === 'TODAY' ? 'Hari Ini' : 'Bulan Ini'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {selectedStoreId && (
                <>
                  <a
                    href={`/api/reports/stores/${selectedStoreId}/pdf${
                      detailPeriod === 'TODAY'
                        ? `?startDate=${new Date().toISOString().slice(0, 10)}&endDate=${new Date().toISOString().slice(0, 10)}`
                        : detailPeriod === 'MONTH'
                        ? `?startDate=${new Date().toISOString().slice(0, 8)}01&endDate=${new Date().toISOString().slice(0, 10)}`
                        : ''
                    }`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold text-xs shadow-md shadow-[#D4AF37]/20 hover:brightness-110 transition flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Output Report PDF Toko</span>
                  </a>

                  <Link
                    href={`/superadmin/stores/${selectedStoreId}`}
                    className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1"
                    title="Buka Layar Penuh"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {detailLoading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-[#D4AF37]" />
              <span className="text-xs">Memuat rincian transaksi &amp; kategori toko...</span>
            </div>
          ) : (
            <>
              {/* BAGIAN 1: RANGKUMAN JENIS TRANSAKSI (CASH & QRIS) */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" />
                  1. Rangkuman Jenis Transaksi Pembayaran
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* CASH */}
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <div className="flex items-center justify-between text-emerald-400 text-[10px] font-bold">
                      <span>CASH (Tunai)</span>
                      <span>{storeDetail?.cash_summary?.count || 0} Trx</span>
                    </div>
                    <p className="text-base font-black font-mono text-white mt-1">
                      {formatIDR(storeDetail?.cash_summary?.amount || 0)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Uang tunai kasir</p>
                  </div>

                  {/* QRIS */}
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30">
                    <div className="flex items-center justify-between text-blue-400 text-[10px] font-bold">
                      <span>QRIS (Digital)</span>
                      <span>{storeDetail?.qris_summary?.count || 0} Trx</span>
                    </div>
                    <p className="text-base font-black font-mono text-white mt-1">
                      {formatIDR(storeDetail?.qris_summary?.amount || 0)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Pembayaran barcode</p>
                  </div>

                  {/* TOTAL OMSET */}
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-[#D4AF37]/40">
                    <div className="flex items-center justify-between text-[#E5C365] text-[10px] font-bold">
                      <span>Total Omset</span>
                      <span>{storeDetail?.total_transactions || 0} Trx</span>
                    </div>
                    <p className="text-base font-black font-mono text-[#D4AF37] mt-1">
                      {formatIDR(storeDetail?.total_net_sales || 0)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Total pendapatan toko</p>
                  </div>

                  {/* CASH FISIK LACI */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                      <span>Cash di Laci</span>
                      <span className="text-emerald-400">Aktual</span>
                    </div>
                    <p className="text-base font-black font-mono text-emerald-400 mt-1">
                      {formatIDR(storeDetail?.available_cash || 0)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Belum disetor ke pusat</p>
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: RANGKUMAN KATEGORI PRODUK TERJUAL */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  2. Rangkuman Kategori Produk Terjual (Kategori Total)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(storeDetail?.category_summary || []).map((cat) => {
                    const totalOmset = storeDetail?.total_net_sales || 1;
                    const pct = (cat.total_amount / totalOmset) * 100;

                    return (
                      <div
                        key={cat.category}
                        className="p-3 rounded-xl bg-[#090D16] border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[70%]">{cat.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {cat.transaction_count} trx
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Volume Terjual:</p>
                          <p className="text-sm font-bold text-white font-mono">
                            {cat.total_quantity.toLocaleString('id-ID')} {cat.unit}
                          </p>
                        </div>
                        <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#D4AF37] font-mono">
                            {formatIDR(cat.total_amount)}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BAGIAN 3: TABEL RINCIAN SELURUH TRANSAKSI TOKO */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    3. Rincian Seluruh Transaksi Toko ({storeDetail?.recent_sales?.length || 0} Transaksi)
                  </h3>

                  <div className="relative w-48 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari invoice/kasir..."
                      value={detailSearch}
                      onChange={(e) => setDetailSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 bg-[#090D16] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#090D16] text-slate-400 sticky top-0 border-b border-slate-800 text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">No. Invoice</th>
                        <th className="py-2.5 px-3">Waktu</th>
                        <th className="py-2.5 px-3">Metode</th>
                        <th className="py-2.5 px-3">Item Produk</th>
                        <th className="py-2.5 px-3 text-right">Total (Rp)</th>
                        <th className="py-2.5 px-3 text-center">Struk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-[#0B101D]">
                      {(storeDetail?.recent_sales || [])
                        .filter((s) => {
                          if (!detailSearch.trim()) return true;
                          const q = detailSearch.toLowerCase();
                          return (
                            s.invoice_number?.toLowerCase().includes(q) ||
                            s.cashier?.full_name?.toLowerCase().includes(q)
                          );
                        })
                        .map((sale) => {
                          const paymentMethod = sale.payments?.[0]?.payment_method || 'CASH';

                          return (
                            <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-2 px-3 font-mono font-bold text-white text-[11px]">
                                {sale.invoice_number}
                              </td>
                              <td className="py-2 px-3 text-slate-400 text-[11px]">
                                {formatDateTimeJakarta(sale.created_at)}
                              </td>
                              <td className="py-2 px-3">
                                {paymentMethod === 'CASH' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                                    CASH
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700/50">
                                    QRIS
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-300 text-[11px] truncate max-w-xs">
                                {(sale.items || []).map((it) => it.product?.name).join(', ') || '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-[#D4AF37] text-[11px]">
                                {formatIDR(sale.final_amount)}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <a
                                  href={`/cashier/receipt/${sale.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold border border-slate-700"
                                  title="Cetak Struk"
                                >
                                  <Printer className="w-3 h-3 text-[#D4AF37]" />
                                  <span>Struk</span>
                                </a>
                              </td>
                            </tr>
                          );
                        })}

                      {(!storeDetail?.recent_sales || storeDetail.recent_sales.length === 0) && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500">
                            Belum ada riwayat transaksi pada cabang ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button variant="ghost" onClick={() => setIsDetailModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
