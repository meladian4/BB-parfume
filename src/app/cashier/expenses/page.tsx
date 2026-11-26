'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatIDR, formatDateTimeJakarta } from '@/lib/formatters';
import { BBLogo } from '@/components/ui/BBLogo';
import { Expense, ExpenseCategory, Store, UserProfile } from '@/types/domain';
import {
  DollarSign,
  Plus,
  Building2,
  FileText,
  Receipt,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Filter,
  Search,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  Layers,
  Store as StoreIcon,
  Check,
  UserCheck,
} from 'lucide-react';

const CATEGORY_INFO: Record<
  ExpenseCategory,
  { label: string; badge: string; desc: string }
> = {
  PACKAGING: {
    label: 'Kemasan & Paper Bag',
    badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
    desc: 'Kantong plastik, paper bag gold, pita, bubble wrap',
  },
  UTILITIES: {
    label: 'Listrik, Air & Internet',
    badge: 'bg-blue-950/70 text-blue-300 border-blue-700/60',
    desc: 'Token PLN toko, galon air mineral, internet wifi / pulsa',
  },
  MAINTENANCE: {
    label: 'Kebersihan & Toko',
    badge: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
    desc: 'Sapu, pel, sabun cuci display, servis AC, ganti lampu',
  },
  SUPPLIES: {
    label: 'Perlengkapan Kasir / ATK',
    badge: 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60',
    desc: 'Kertas roll thermal struk kasir, lakban, pulpen, operasional toko',
  },
  SALARY: {
    label: 'Gaji & Upah Tambahan',
    badge: 'bg-purple-950/70 text-purple-300 border-purple-700/60',
    desc: 'Upah lembur toko / bantuan harian',
  },
  RENT: {
    label: 'Sewa Toko / Retribusi',
    badge: 'bg-orange-950/70 text-orange-300 border-orange-700/60',
    desc: 'Iuran kebersihan lingkungan / retribusi pasar',
  },
  MARKETING: {
    label: 'Promosi Cabang',
    badge: 'bg-pink-950/70 text-pink-300 border-pink-700/60',
    desc: 'Banner promo toko / selebaran',
  },
  OTHER: {
    label: 'Lain-lain (Beban Khusus / Bebas)',
    badge: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    desc: 'Biaya operasional lainnya yang tidak termasuk dalam kategori di atas',
  },
};

export default function CashierExpensesPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [availableCash, setAvailableCash] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal Tambah Beban Operasional
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formStoreId, setFormStoreId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('OTHER');
  const [formOtherCustom, setFormOtherCustom] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formReceiptNote, setFormReceiptNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [uRes, sRes] = await Promise.all([
        fetch('/api/users/me').then((r) => r.json()).catch(() => ({})),
        fetch('/api/stores').then((r) => r.json()).catch(() => ({})),
      ]);

      const currentUser: UserProfile | null = uRes?.user || null;
      setUser(currentUser);

      const storeList: Store[] = sRes?.stores || sRes?.data || [];
      const branchStores = storeList.filter((s) => s.type === 'STORE');

      // Kasir HANYA diizinkan mengakses dan melihat cabang toko miliknya sendiri
      if (currentUser?.role === 'CASHIER') {
        const assignedId = currentUser.assigned_store_id || branchStores[0]?.id || '';
        const myStore = branchStores.find((s) => s.id === assignedId);
        setStores(myStore ? [myStore] : branchStores);
        setFormStoreId(assignedId);
        await fetchExpenses(assignedId);
      } else {
        // Super Admin memiliki kuasa penuh untuk melihat dan memilih semua cabang
        setStores(branchStores.length > 0 ? branchStores : storeList);
        const defaultId = branchStores[0]?.id || '';
        setFormStoreId(defaultId);
        await fetchExpenses(defaultId);
      }
    } catch (err) {
      console.error('Error loading initial cashier expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCash = async (storeIdFilter?: string) => {
    try {
      const targetStore = user?.role === 'CASHIER'
        ? (user.assigned_store_id || formStoreId)
        : (storeIdFilter || formStoreId);

      if (!targetStore) return;
      const res = await fetch(`/api/pos/deposits?store_id=${targetStore}`);
      const data = await res.json();
      if (data.success && typeof data.available_cash === 'number') {
        setAvailableCash(data.available_cash);
      }
    } catch (e) {
      console.error('Gagal mengambil cash fisik toko:', e);
    }
  };

  const fetchExpenses = async (storeIdFilter?: string) => {
    try {
      const targetStore = user?.role === 'CASHIER'
        ? (user.assigned_store_id || formStoreId)
        : (storeIdFilter || formStoreId);

      fetchAvailableCash(targetStore);

      const params = new URLSearchParams();
      params.append('source', 'cashier');

      if (targetStore) {
        params.append('store_id', targetStore);
      }
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedCategory && selectedCategory !== 'ALL') {
        params.append('category', selectedCategory);
      }

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.expenses)) {
        if (user?.role === 'CASHIER' && user.assigned_store_id) {
          setExpenses(data.expenses.filter((e: Expense) => e.store_id === user.assigned_store_id));
        } else {
          setExpenses(data.expenses);
        }
      }
    } catch (err) {
      console.error('Gagal mengambil daftar pengeluaran cabang:', err);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchExpenses();
    }
  }, [selectedCategory, startDate, endDate, formStoreId]);

  // Current store detail
  const currentStore = useMemo(() => {
    return stores.find((s) => s.id === formStoreId) || stores[0] || null;
  }, [stores, formStoreId]);

  // Hitung metrik keuangan cabang
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = todayStr.slice(0, 7); // YYYY-MM

    let totalAll = 0;
    let totalToday = 0;
    let totalThisMonth = 0;

    for (const exp of expenses) {
      totalAll += exp.amount;
      if (exp.expense_date === todayStr) {
        totalToday += exp.amount;
      }
      if (exp.expense_date.startsWith(thisMonthStr)) {
        totalThisMonth += exp.amount;
      }
    }

    return { totalAll, totalToday, totalThisMonth, count: expenses.length };
  }, [expenses]);

  // Filtered by search
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const matchDesc = e.description?.toLowerCase().includes(q);
      const matchCat = e.category?.toLowerCase().includes(q);
      const matchUser = e.created_by_user?.full_name?.toLowerCase().includes(q);
      return matchDesc || matchCat || matchUser;
    });
  }, [expenses, search]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formStoreId) {
      setFormError('Cabang toko tidak terdeteksi. Silakan muat ulang halaman.');
      return;
    }

    const numAmount = Number(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Nominal biaya operasional harus berupa angka lebih dari Rp 0.');
      return;
    }

    if (!formDescription.trim()) {
      setFormError('Rincian / keterangan biaya pengeluaran wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const finalDescription =
        formCategory === 'OTHER' && formOtherCustom.trim()
          ? `[${formOtherCustom.trim()}] ${formDescription.trim()}`
          : formDescription.trim();

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: formStoreId,
          expense_date: formDate,
          category: formCategory,
          description: finalDescription,
          amount: numAmount,
          receipt_url: formReceiptNote.trim() || 'Nota fisik disimpan di kasir toko',
          created_by: user?.id || 'u0000000-0000-0000-0000-000000000003',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mencatat pengeluaran operasional.');
      }

      // Reset form
      setFormDescription('');
      setFormOtherCustom('');
      setFormAmount('');
      setFormReceiptNote('');
      setIsAddModalOpen(false);

      setSuccessBanner(
        `Biaya operasional sebesar ${formatIDR(numAmount)} berhasil dicatat & langsung terhubung ke Super Admin!`
      );
      setTimeout(() => setSuccessBanner(null), 5000);

      await fetchExpenses();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-20 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <BBLogo variant="gold" size="md" withContainer />
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Beban Operasional Cabang</span>
                  <Badge variant="blue" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                    Kasir &bull; {currentStore?.name || 'Cabang Kendal'}
                  </Badge>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catat pengeluaran kas toko cabang secara disiplin. Data ini otomatis terhubung real-time dan disatukan ke dasbor Super Admin untuk audit &amp; laporan laba-rugi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/cashier"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                <span>&larr; POS Kasir Terminal</span>
              </Link>
              <Button
                variant="primary"
                onClick={() => {
                  setFormError('');
                  setIsAddModalOpen(true);
                }}
                className="bg-gradient-to-r from-[#D4AF37] to-[#E5C365] text-[#070A0F] font-bold shadow-md"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>+ Catat Pengeluaran Cabang</span>
              </Button>
            </div>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-semibold">{successBanner}</span>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card bordered className="bg-[#0A0E1A] border-emerald-500/30 shadow-lg">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Cash Fisik di Toko (Belum Disetor)</p>
                  <p className="text-xl font-black font-mono text-emerald-400 mt-1">
                    {formatIDR(availableCash)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Berkurang otomatis saat beban dicatat</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card bordered className="bg-[#0F172A]/90 border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Pengeluaran Hari Ini</p>
                  <p className="text-xl font-bold font-mono text-[#E5C365] mt-1">
                    {formatIDR(metrics.totalToday)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Kas keluar cabang hari ini</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card bordered className="bg-[#0F172A]/90 border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Pengeluaran Bulan Ini</p>
                  <p className="text-xl font-bold font-mono text-white mt-1">
                    {formatIDR(metrics.totalThisMonth)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Total akumulasi bulan berjalan</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card bordered className="bg-[#0F172A]/90 border-slate-800">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-slate-400">Total Transaksi Biaya</p>
                  <p className="text-xl font-bold font-mono text-purple-400 mt-1">
                    {metrics.count} <span className="text-xs font-normal text-slate-400">catatan</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">100% Terhubung Super Admin</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter & Kontrol Pencarian */}
          <Card bordered className="bg-[#0F172A]/90 border-slate-800">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari keterangan pengeluaran, kertas struk, galon, dll..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#090D16] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                {/* Cabang: Terkunci khusus kasir (tanpa dropdown), Dropdown HANYA untuk Super Admin */}
                <div className="flex items-center gap-2 bg-[#090D16] border border-slate-700/80 rounded-xl px-3 py-1.5 shrink-0">
                  <StoreIcon className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs text-slate-400">Cabang:</span>
                  {user?.role === 'SUPER_ADMIN' ? (
                    <select
                      value={formStoreId}
                      onChange={(e) => setFormStoreId(e.target.value)}
                      className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#0F172A] text-white">
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                      <span>{currentStore?.name || 'Cabang Toko Anda'}</span>
                      <span className="text-[10px] font-mono text-[#D4AF37]">({currentStore?.code || 'STORE'})</span>
                    </div>
                  )}
                </div>

                {/* Filter Kategori */}
                <div className="flex items-center gap-2 bg-[#090D16] border border-slate-700/80 rounded-xl px-3 py-1.5 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">Kategori:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-[#0F172A] text-white">Semua Kategori</option>
                    {Object.entries(CATEGORY_INFO).map(([key, val]) => (
                      <option key={key} value={key} className="bg-[#0F172A] text-white">
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchExpenses()}
                  className="shrink-0 text-xs border-slate-700 text-slate-300 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Segarkan</span>
                </Button>
              </div>

              {/* Filter Tanggal */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                <span className="flex items-center gap-1 text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" /> Rentang Tanggal:
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 bg-[#090D16] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
                <span>s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 bg-[#090D16] border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
                {(startDate || endDate || selectedCategory !== 'ALL' || search) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setSelectedCategory('ALL');
                      setSearch('');
                    }}
                    className="text-xs text-rose-400 hover:underline ml-2"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabel Pengeluaran Cabang */}
          <Card bordered className="bg-[#0F172A]/90 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  <span>Daftar Pengeluaran Operasional Cabang</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-0.5">
                  Menampilkan seluruh transaksi biaya toko yang dicatat kasir untuk cabang ini.
                </CardDescription>
              </div>
              <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700">
                {filteredExpenses.length} transaksi ditemukan
              </span>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#D4AF37]" />
                  <span>Memuat data pengeluaran operasional cabang...</span>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs space-y-3">
                  <Receipt className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-slate-300 font-semibold text-sm">
                    Belum Ada Catatan Beban Operasional
                  </p>
                  <p className="text-slate-500 text-xs max-w-md mx-auto">
                    Jika ada pengeluaran kas toko seperti membeli plastik, galon air, kertas struk, atau token listrik, silakan klik tombol di bawah untuk mencatatnya.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setFormError('');
                      setIsAddModalOpen(true);
                    }}
                    className="bg-[#D4AF37] hover:bg-[#E5C365] text-[#070A0F] font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    <span>Catat Biaya Operasional Sekarang</span>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Tanggal Biaya</th>
                        <th className="py-3 px-4">Kategori Pengeluaran</th>
                        <th className="py-3 px-4">Rincian / Keterangan Kebutuhan</th>
                        <th className="py-3 px-4">Dicatat Oleh (Kasir)</th>
                        <th className="py-3 px-4 text-right">Nominal (IDR)</th>
                        <th className="py-3 px-4 text-center">Status Link Pusat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {filteredExpenses.map((exp) => {
                        const cat = CATEGORY_INFO[exp.category] || CATEGORY_INFO.OTHER;
                        const isOther = exp.category === 'OTHER';
                        const customMatch = isOther ? exp.description.match(/^\[(.*?)\]\s*(.*)$/) : null;
                        const displayBadgeLabel = customMatch ? `Lain-lain: ${customMatch[1]}` : cat.label;
                        const displayDesc = customMatch ? customMatch[2] : exp.description;

                        return (
                          <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                                <span>{exp.expense_date}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Input: {formatDateTimeJakarta(exp.created_at)}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg text-[11px] border font-semibold ${cat.badge}`}
                              >
                                {displayBadgeLabel}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white text-xs">
                                {displayDesc}
                              </div>
                              {exp.receipt_url && (
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                  <Receipt className="w-3 h-3 text-slate-500" />
                                  <span>Bukti: {exp.receipt_url}</span>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                                <span>{exp.created_by_user?.full_name || 'Kasir Cabang Toko'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {exp.store?.name || currentStore?.name || 'Cabang Kendal'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#E5C365]">
                              {formatIDR(exp.amount)}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <Badge variant="emerald" size="sm" className="inline-flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Tersinkron Super Admin</span>
                              </Badge>
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
        </main>
      </div>

      {/* Modal Catat Pengeluaran Operasional Cabang */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !submitting && setIsAddModalOpen(false)}
        title="Catat Beban Operasional Cabang Toko"
        description="Input biaya pengeluaran kas toko yang terjadi di cabang ini. Seluruh data akan otomatis terhubung ke sistem pusat Super Admin."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Cabang Aktif & Saldo Cash Fisik (Readonly Info) */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <StoreIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Lokasi Cabang</p>
                  <p className="text-xs font-bold text-white">
                    {currentStore?.name || 'BB Parfum Toko 1 - Kendal Kota'} ({currentStore?.code || 'STORE-KDL-01'})
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Petugas Kasir</p>
                <p className="text-xs font-bold text-amber-300">
                  {user?.full_name || 'Kasir Toko Kendal'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Cash Fisik Toko (Belum Disetor):
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatIDR(availableCash)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              * Biaya operasional yang dicatat otomatis mengurangi sisa uang Cash fisik yang belum disetor di toko ini.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tanggal Pengeluaran */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Tanggal Pengeluaran <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Kategori Pengeluaran */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Kategori Pengeluaran <span className="text-rose-400">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                required
                className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                {Object.entries(CATEGORY_INFO).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Input Opsional Kategori Lain-Lain */}
          {formCategory === 'OTHER' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-in fade-in">
              <label className="text-xs font-semibold text-amber-300 flex items-center justify-between">
                <span>Nama / Jenis Kategori Lain-lain (Opsional)</span>
                <span className="text-[10px] text-amber-400/80">Bisa diisi kategori khusus</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Bensin, Uang Sampah, Konsumsi Lembur..."
                value={formOtherCustom}
                onChange={(e) => setFormOtherCustom(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A0E1A] border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
              <p className="text-[10px] text-amber-400/80">
                Jika diisi, nama ini otomatis tertera sebagai kategori khusus pada laporan kasir &amp; Super Admin.
              </p>
            </div>
          )}

          {/* Nominal Biaya */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Nominal Biaya Pengeluaran (IDR) <span className="text-rose-400">*</span></span>
              {Number(formAmount) > 0 && (
                <span className="text-emerald-400 font-mono font-bold">
                  {formatIDR(Number(formAmount))}
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono font-bold">
                Rp
              </span>
              <input
                type="number"
                min="1"
                required
                placeholder="Contoh: 85000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Keterangan / Deskripsi */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Rincian Kebutuhan / Keterangan Biaya <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={2}
              required
              placeholder="Contoh: Beli Kertas Roll Struk Kasir Thermal (10 Roll) & Lakban Packing Cabang Kendal..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Nomor Bukti / Struk Fisik */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Keterangan Bukti Nota Fisik / Struk (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Struk nota fisik disimpan di laci kasir #KASIR-01"
              value={formReceiptNote}
              onChange={(e) => setFormReceiptNote(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A0E1A] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={submitting}
              onClick={() => setIsAddModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              className="bg-[#D4AF37] hover:bg-[#E5C365] text-[#070A0F] font-bold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>Simpan &amp; Link ke Super Admin</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
