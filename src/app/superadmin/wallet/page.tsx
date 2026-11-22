'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatIDR, formatDateTimeJakarta } from '@/lib/formatters';
import {
  CompanyWalletTransaction,
  CompanyWalletSummary,
  WalletTransactionType,
} from '@/types/domain';
import {
  Wallet,
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Landmark,
  DollarSign,
  Store,
  CreditCard,
  Sparkles,
  Search,
  ShieldCheck,
  PackagePlus,
  Coins,
} from 'lucide-react';

export default function SuperAdminWalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [summary, setSummary] = useState<CompanyWalletSummary | null>(null);
  const [transactions, setTransactions] = useState<CompanyWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | WalletTransactionType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'CAPITAL' | 'OPEX' | 'DEPOSIT' | 'WITHDRAWAL'
  >('NONE');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formReference, setFormReference] = useState<string>('');
  const [formStoreName, setFormStoreName] = useState<string>('BB Parfum Toko 1 - Kendal Kota');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      if (data.success && data.data) {
        setBalance(data.data.balance || 0);
        setSummary(data.data.summary || null);
        setTransactions(Array.isArray(data.data.transactions) ? data.data.transactions : []);
      }
    } catch (err) {
      console.error('Failed to load company wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (modalType: 'CAPITAL' | 'OPEX' | 'DEPOSIT' | 'WITHDRAWAL') => {
    setActiveModal(modalType);
    setFormAmount('');
    setFormDescription('');
    setFormReference('');
    if (modalType === 'CAPITAL') {
      setFormCategory('Modal Usaha');
      setFormDescription('Suntikan Modal Kas Usaha');
    } else if (modalType === 'OPEX') {
      setFormCategory('Sewa Tempat / Ruko');
      setFormDescription('');
    } else if (modalType === 'DEPOSIT') {
      setFormCategory('Setoran Kasir Toko');
      setFormDescription('Setoran Uang Penjualan Toko');
    } else if (modalType === 'WITHDRAWAL') {
      setFormCategory('Prive Pemilik');
      setFormDescription('Pengambilan Prive Keuntungan Owner');
    }
  };

  const handleCloseModal = () => {
    if (!submitting) {
      setActiveModal('NONE');
    }
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Masukkan nominal yang valid dan lebih besar dari 0!');
      return;
    }

    let txType: WalletTransactionType = 'CAPITAL_INJECTION';
    let finalAmount = parsedAmount;
    let finalDesc = formDescription.trim();

    if (activeModal === 'CAPITAL') {
      txType = 'CAPITAL_INJECTION';
      finalAmount = parsedAmount;
      if (!finalDesc) finalDesc = 'Suntikan Modal Kas Usaha';
    } else if (activeModal === 'OPEX') {
      txType = 'OPERATIONAL_EXPENSE';
      finalAmount = -parsedAmount;
      if (!finalDesc) finalDesc = `Biaya Operasional: ${formCategory}`;
    } else if (activeModal === 'DEPOSIT') {
      txType = 'STORE_DEPOSIT';
      finalAmount = parsedAmount;
      finalDesc = `${formStoreName}: ${finalDesc || 'Setoran Kasir Cabang'}`;
    } else if (activeModal === 'WITHDRAWAL') {
      txType = 'OWNER_WITHDRAWAL';
      finalAmount = -parsedAmount;
      if (!finalDesc) finalDesc = 'Penarikan Laba / Prive Owner';
    }

    if (finalAmount < 0 && balance + finalAmount < 0) {
      alert(
        `Saldo kas tidak mencukupi!\nSaldo saat ini: ${formatIDR(balance)}\nPengeluaran diminta: ${formatIDR(parsedAmount)}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/wallet/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_type: txType,
          amount: finalAmount,
          category: formCategory,
          reference_id: formReference.trim() || undefined,
          description: finalDesc,
          operator: 'Super Admin Kendal (Owner)',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal menyimpan mutasi kas.');
      }

      setToastMessage('Transaksi kas berhasil dicatat dan saldo dompet telah diperbarui!');
      setTimeout(() => setToastMessage(null), 4000);
      handleCloseModal();
      await loadWalletData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan transaksi kas.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeFilter !== 'ALL' && tx.transaction_type !== activeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchRef = tx.reference_id?.toLowerCase().includes(q);
        const matchCat = tx.category?.toLowerCase().includes(q);
        const matchOp = tx.operator.toLowerCase().includes(q);
        if (!matchDesc && !matchRef && !matchCat && !matchOp) return false;
      }
      return true;
    });
  }, [transactions, activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#D4AF37]/15 text-[#E5C365] border border-[#D4AF37]/30">
              KONTROL KAS PUSAT (OWNER)
            </span>
            <span className="text-xs text-slate-400 font-mono">BB PARFUM PREMIUM</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#D4AF37]" />
            <span>Dompet & Kas Utama Perusahaan</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kelola modal awal, realisasi pembayaran belanja supplier, operasional ruko/toko, dan penerimaan setoran harian kasir cabang.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenModal('CAPITAL')}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            <span>Injeksi Modal</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenModal('OPEX')}
            className="bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-800/60 font-semibold text-xs"
          >
            <ArrowDownCircle className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
            <span>Biaya Operasional</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenModal('DEPOSIT')}
            className="bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60 font-semibold text-xs"
          >
            <ArrowUpCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            <span>Terima Setoran</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenModal('WITHDRAWAL')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 font-medium text-xs"
          >
            <Coins className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            <span>Prive Owner</span>
          </Button>
        </div>
      </div>

      {/* 3 Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Saldo Kas Aktif */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#162036] via-[#0F172A] to-[#0A0E1A] border-2 border-[#D4AF37]/50 shadow-xl relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-[#E5C365] flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Saldo Kas Aktif (Liquidity)</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
              READY CASH
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
            {formatIDR(balance)}
          </div>

          <div className="text-[11px] text-slate-400 mt-2.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">Siap dialokasikan untuk belanja bahan & OPEX</span>
          </div>
        </div>

        {/* Card 2: Total Arus Masuk */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Kas Masuk</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Buku Besar</span>
          </div>

          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            {formatIDR(summary?.total_inflow || 0)}
          </div>

          <div className="text-[11px] text-slate-400 mt-2 space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Modal Awal / Injeksi:</span>
              <span className="text-white">{formatIDR(summary?.total_capital || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Setoran Kasir Cabang:</span>
              <span className="text-emerald-400">{formatIDR(summary?.total_store_deposits || 0)}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Arus Keluar */}
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-rose-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Total Kas Keluar</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Buku Besar</span>
          </div>

          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            {formatIDR(summary?.total_outflow || 0)}
          </div>

          <div className="text-[11px] text-slate-400 mt-2 space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Belanja Bahan (PO Supplier):</span>
              <span className="text-white">{formatIDR(summary?.total_purchases || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Biaya Operasional (OPEX):</span>
              <span className="text-rose-400">{formatIDR(summary?.total_opex || 0)}</span>
            </div>
            {(summary?.total_withdrawals || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Prive Owner:</span>
                <span className="text-purple-400">{formatIDR(summary?.total_withdrawals || 0)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integration Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-[#162036] to-slate-900 border border-blue-900/50 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white text-[13px]">
              Sistem Kas & Belanja Terintegrasi Otomatis
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Setiap kali Anda menekan tombol <strong>&ldquo;Setujui & Masuk Stok&rdquo;</strong> pada menu Acuan Belanja, kas dompet ini otomatis terpotong riil untuk melunasi faktur supplier.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadWalletData}
            isLoading={loading}
            className="text-xs bg-slate-800 text-slate-200 border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Segarkan Data</span>
          </Button>
        </div>
      </div>

      {/* Buku Besar Mutasi Kas */}
      <Card bordered className="bg-[#0F172A]/90 overflow-hidden shadow-xl">
        <CardHeader className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>Buku Besar Arus Kas & Mutasi Rekening Pusat</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Jejak mutasi uang masuk dan keluar secara kronologis, transparan, dan tidak dapat dimanipulasi.
            </CardDescription>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari keterangan, nomor PO, operator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0A0E1A] border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </CardHeader>

        {/* Filter Tabs */}
        <div className="px-4 py-2 bg-[#12192B] border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeFilter === 'ALL'
                ? 'bg-[#D4AF37] text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            onClick={() => setActiveFilter('CAPITAL_INJECTION')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeFilter === 'CAPITAL_INJECTION'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Modal Usaha
          </button>
          <button
            onClick={() => setActiveFilter('PURCHASE_PAYMENT')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeFilter === 'PURCHASE_PAYMENT'
                ? 'bg-blue-500 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Belanja Supplier
          </button>
          <button
            onClick={() => setActiveFilter('OPERATIONAL_EXPENSE')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeFilter === 'OPERATIONAL_EXPENSE'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Biaya Operasional
          </button>
          <button
            onClick={() => setActiveFilter('STORE_DEPOSIT')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeFilter === 'STORE_DEPOSIT'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Setoran Toko
          </button>
          <button
            onClick={() => setActiveFilter('OWNER_WITHDRAWAL')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeFilter === 'OWNER_WITHDRAWAL'
                ? 'bg-purple-500 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Prive Owner
          </button>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">Memuat buku besar kas dompet...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p>Tidak ada transaksi kas pada kategori ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Waktu & Ref ID</th>
                    <th className="py-3 px-4">Kategori Mutasi</th>
                    <th className="py-3 px-4">Keterangan / Deskripsi</th>
                    <th className="py-3 px-4 text-right">Nominal Kas</th>
                    <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  {filteredTransactions.map((tx) => {
                    const isPlus = tx.amount > 0;
                    let badgeVariant: 'amber' | 'blue' | 'rose' | 'emerald' | 'slate' | 'gold' = 'amber';
                    let label = 'Modal Usaha';

                    if (tx.transaction_type === 'CAPITAL_INJECTION') {
                      badgeVariant = 'amber';
                      label = 'Modal Injeksi';
                    } else if (tx.transaction_type === 'PURCHASE_PAYMENT') {
                      badgeVariant = 'blue';
                      label = 'Belanja Bahan';
                    } else if (tx.transaction_type === 'OPERATIONAL_EXPENSE') {
                      badgeVariant = 'rose';
                      label = 'Operasional OPEX';
                    } else if (tx.transaction_type === 'STORE_DEPOSIT') {
                      badgeVariant = 'emerald';
                      label = 'Setoran Cabang';
                    } else if (tx.transaction_type === 'OWNER_WITHDRAWAL') {
                      badgeVariant = 'slate';
                      label = 'Prive Owner';
                    }

                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-white text-[11px]">{tx.id}</div>
                          <div className="text-[10px] text-slate-500 font-sans">
                            {formatDateTimeJakarta(tx.created_at)}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <Badge variant={badgeVariant} size="sm">
                            {label}
                          </Badge>
                          {tx.category && (
                            <div className="text-[10px] text-slate-400 mt-1 font-sans">
                              {tx.category}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 font-sans text-xs">
                          <div className="font-semibold text-white">{tx.description}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Oleh: <span className="text-slate-300">{tx.operator}</span>
                            {tx.reference_id && (
                              <span className="ml-2 font-mono text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">
                                Ref: {tx.reference_id}
                              </span>
                            )}
                          </div>
                        </td>

                        <td
                          className={`py-3 px-4 text-right font-bold text-xs ${
                            isPlus ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPlus ? '+' : ''}
                          {formatIDR(tx.amount)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-xs text-white">
                          {formatIDR(tx.balance_after)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal 1: Injeksi / Tambah Modal Kas Usaha */}
      <Modal
        isOpen={activeModal === 'CAPITAL'}
        onClose={handleCloseModal}
        title="➕ Injeksi / Tambah Modal Kas Usaha"
        description="Catat setoran modal awal atau modal tambahan dari pemilik usaha ke kas utama perusahaan."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitTransaction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nominal Modal (Rp) <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                Rp
              </span>
              <input
                required
                type="number"
                min="1000"
                step="1000"
                placeholder="Contoh: 50000000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Sumber Dana / Keterangan Tambahan:
            </label>
            <input
              type="text"
              placeholder="Contoh: Setoran Modal Pemilik via Rekening BCA"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" size="sm" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md"
            >
              Simpan Modal Masuk
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Beban Operasional Usaha (OPEX) */}
      <Modal
        isOpen={activeModal === 'OPEX'}
        onClose={handleCloseModal}
        title="➖ Catat Biaya Operasional (OPEX)"
        description="Catat pengeluaran operasional perusahaan seperti sewa ruko, gaji, listrik, dan perlengkapan."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitTransaction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nominal Pengeluaran (Rp) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                Rp
              </span>
              <input
                required
                type="number"
                min="500"
                step="500"
                placeholder="Contoh: 2500000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-rose-400"
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Saldo kas saat ini: {formatIDR(balance)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Kategori Pengeluaran:
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="Sewa Tempat / Ruko">Sewa Tempat / Ruko Cabang</option>
              <option value="Gaji & Insentif Karyawan">Gaji & Insentif Karyawan</option>
              <option value="Listrik, Air & Wifi">Listrik, Air & Wifi</option>
              <option value="Packaging & Perlengkapan">Packaging, Plastik, Pita & Stiker</option>
              <option value="Iklan & Marketing">Iklan & Marketing Media Sosial</option>
              <option value="Beban Operasional Lainnya">Beban Operasional Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Keterangan Rinci:
            </label>
            <input
              type="text"
              placeholder="Contoh: Pembayaran sewa toko cabang Kendal Kota bulan November"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" size="sm" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md"
            >
              Catat Pengeluaran
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Setoran Kasir Cabang Toko */}
      <Modal
        isOpen={activeModal === 'DEPOSIT'}
        onClose={handleCloseModal}
        title="📥 Catat Setoran dari Toko Cabang"
        description="Terima dan bukukan setoran uang hasil penjualan harian dari kasir cabang ke kas pusat."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitTransaction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Pilih Toko Cabang Penyetor:
            </label>
            <select
              value={formStoreName}
              onChange={(e) => setFormStoreName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
            >
              <option value="BB Parfum Toko 1 - Kendal Kota">BB Parfum Toko 1 - Kendal Kota</option>
              <option value="BB Parfum Toko 2 - Pegandon">BB Parfum Toko 2 - Pegandon</option>
              <option value="BB Parfum Toko 3 - Kaliwungu">BB Parfum Toko 3 - Kaliwungu</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nominal Setoran (Rp) <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                Rp
              </span>
              <input
                required
                type="number"
                min="1000"
                step="1000"
                placeholder="Contoh: 15000000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan / Bukti Setor:
            </label>
            <input
              type="text"
              placeholder="Contoh: Setoran uang tunai closing shift kasir malam"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" size="sm" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
            >
              Terima Masuk Kas
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Penarikan Prive / Laba Pemilik Usaha */}
      <Modal
        isOpen={activeModal === 'WITHDRAWAL'}
        onClose={handleCloseModal}
        title="💸 Penarikan Prive / Laba Owner"
        description="Catat penarikan keuntungan pribadi pemilik usaha secara resmi tanpa merusak pembukuan modal kerja."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitTransaction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nominal Penarikan (Rp) <span className="text-purple-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                Rp
              </span>
              <input
                required
                type="number"
                min="1000"
                step="1000"
                placeholder="Contoh: 10000000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-400"
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Saldo kas saat ini: {formatIDR(balance)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Keperluan / Catatan:
            </label>
            <input
              type="text"
              placeholder="Contoh: Penarikan dividen / laba bersih bulan berjalan"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="secondary" size="sm" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md"
            >
              Tarik Saldo Prive
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
