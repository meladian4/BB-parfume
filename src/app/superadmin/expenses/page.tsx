'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatIDR } from '@/lib/formatters';
import { Expense, ExpenseCategory, Store } from '@/types/domain';
import {
  DollarSign,
  Plus,
  Trash2,
  Building2,
  FileText,
  Receipt,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Check,
} from 'lucide-react';

const CATEGORY_LABELS: Record<ExpenseCategory, { label: string; badge: string }> = {
  SALARY: { label: 'Gaji & Upah Kasir/Staff', badge: 'bg-purple-900/40 text-purple-300 border-purple-700/50' },
  UTILITIES: { label: 'Listrik, Air & Internet', badge: 'bg-blue-900/40 text-blue-300 border-blue-700/50' },
  RENT: { label: 'Sewa Toko / Bangunan', badge: 'bg-amber-900/40 text-amber-300 border-amber-700/50' },
  PACKAGING: { label: 'Kemasan & Paperbag Premium', badge: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50' },
  MARKETING: { label: 'Pemasaran & Promosi Sosmed', badge: 'bg-pink-900/40 text-pink-300 border-pink-700/50' },
  MAINTENANCE: { label: 'Pemeliharaan Display & AC', badge: 'bg-orange-900/40 text-orange-300 border-orange-700/50' },
  SUPPLIES: { label: 'Perlengkapan Kasir / ATK', badge: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50' },
  OTHER: { label: 'Lain-lain', badge: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
};

export default function SuperAdminExpensesPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal Tambah
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formStoreId, setFormStoreId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('PACKAGING');
  const [formOtherCustom, setFormOtherCustom] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formReceiptUrl, setFormReceiptUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const sRes = await fetch('/api/stores').then((r) => r.json());
      const storeList: Store[] = sRes.stores || [];
      setStores(storeList);
      if (storeList.length > 0 && !formStoreId) {
        setFormStoreId(storeList[0].id);
      }

      await fetchExpenses();
    } catch (err) {
      console.error('Error loading expenses data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams();
      params.append('all', 'true');
      if (selectedStore) params.append('store_id', selectedStore);
      if (selectedCategory) params.append('category', selectedCategory);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses || []);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar pengeluaran:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedStore, selectedCategory, startDate, endDate]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formStoreId || !formDate || !formCategory || !formDescription || !formAmount) {
      setFormError('Semua field bertanda bintang (*) wajib diisi.');
      return;
    }

    const numAmount = Number(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Nominal biaya harus berupa angka lebih dari Rp 0.');
      return;
    }

    try {
      setSubmitting(true);
      const finalDesc =
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
          description: finalDesc,
          amount: numAmount,
          receipt_url: formReceiptUrl || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setFormError(data.error || 'Gagal menyimpan pengeluaran.');
        return;
      }

      // Reset form
      setFormDescription('');
      setFormOtherCustom('');
      setFormAmount('');
      setFormReceiptUrl('');
      setIsAddModalOpen(false);
      await fetchExpenses();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, desc: string) => {
    if (!confirm(`Hapus pengeluaran "${desc}"? Tindakan ini akan tercatat dalam audit log.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchExpenses();
      } else {
        alert(data.error || 'Gagal menghapus pengeluaran.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const cashierExpenses = useMemo(() => {
    return expenses.filter(
      (e) => e.created_by_user?.role === 'CASHIER' || e.created_by?.toLowerCase().includes('kasir')
    );
  }, [expenses]);
  const cashierAmount = useMemo(() => {
    return cashierExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [cashierExpenses]);

  const adminExpenses = useMemo(() => {
    return expenses.filter(
      (e) => !(e.created_by_user?.role === 'CASHIER' || e.created_by?.toLowerCase().includes('kasir'))
    );
  }, [expenses]);
  const adminAmount = useMemo(() => {
    return adminExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [adminExpenses]);

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const displayedExpenses = expenses;

  return (
    <div className="space-y-6">
      {/* Header Action & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#D4AF37]" />
            Buku Pengeluaran Operasional (OPEX)
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Pusat rekapitulasi &amp; kroscek biaya harian cabang (Kendal Kota, Pegandon, Kaliwungu &amp; Gudang) terintegrasi satu pintu dengan kasir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchExpenses()}
            className="border-neutral-800 text-neutral-300 hover:bg-neutral-900"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Segarkan
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-semibold shadow-lg shadow-[#D4AF37]/20 hover:brightness-110"
          >
            <Plus className="w-4 h-4 mr-2" />
            Catat Pengeluaran Baru
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#12151C] border-neutral-800/80 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                Total Semua Biaya
              </p>
              <p className="text-xl font-bold font-mono text-white mt-1">{formatIDR(totalAmount)}</p>
              <p className="text-[11px] text-neutral-400 mt-1">{expenses.length} transaksi terpusat</p>
            </div>
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#12151C] border-blue-900/50 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <p className="text-xs font-semibold tracking-wider text-blue-300 uppercase">
                  Input Kasir Cabang
                </p>
              </div>
              <p className="text-xl font-bold font-mono text-blue-400 mt-1">{formatIDR(cashierAmount)}</p>
              <p className="text-[11px] text-blue-300/80 mt-1">{cashierExpenses.length} transaksi &bull; Siap Kroscek</p>
            </div>
            <div className="p-3 bg-blue-950/50 border border-blue-800/60 rounded-xl text-blue-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#12151C] border-amber-900/40 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#D4AF37] uppercase">
                Input Super Admin / Pusat
              </p>
              <p className="text-xl font-bold font-mono text-[#E5C365] mt-1">{formatIDR(adminAmount)}</p>
              <p className="text-[11px] text-neutral-400 mt-1">{adminExpenses.length} transaksi kantor pusat</p>
            </div>
            <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl text-[#D4AF37]">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#12151C] border-neutral-800/80 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                Cabang Terpilih
              </p>
              <p className="text-sm font-bold text-white truncate mt-1">
                {selectedStore
                  ? stores.find((s) => s.id === selectedStore)?.name || 'Cabang Spesifik'
                  : 'Semua Cabang Toko & Gudang'}
              </p>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3 inline" />
                <span>Masuk Laporan Laba-Rugi</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="bg-[#12151C] border-neutral-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Cabang Toko</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="">Semua Cabang &amp; Gudang</option>
              {stores.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.type === 'WAREHOUSE' ? 'Gudang' : 'Toko'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Kategori Biaya</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="">Semua Kategori</option>
              {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
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
              className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </Card>

      {/* Tabel Pengeluaran Terintegrasi */}
      <Card className="bg-[#12151C] border-neutral-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D4AF37]" />
            Rincian Biaya Operasional (Pusat &amp; Cabang Terintegrasi)
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            {expenses.length} data biaya operasional
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-neutral-400">Memuat data pengeluaran...</div>
        ) : displayedExpenses.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            Belum ada catatan pengeluaran operasional yang sesuai dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-[#181C24] text-[10px] uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Tanggal Biaya</th>
                  <th className="py-3 px-4">Cabang Toko</th>
                  <th className="py-3 px-4">Pencatat / Sumber</th>
                  <th className="py-3 px-4">Kategori Biaya</th>
                  <th className="py-3 px-4">Rincian Kebutuhan</th>
                  <th className="py-3 px-4 text-right">Nominal (IDR)</th>
                  <th className="py-3 px-4 text-center">Bukti / Struk</th>
                  <th className="py-3 px-4 text-center">Status Audit</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {displayedExpenses.map((item) => {
                  const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.OTHER;
                  const isFromCashier =
                    item.created_by_user?.role === 'CASHIER' ||
                    item.created_by?.toLowerCase().includes('kasir');
                  const isOther = item.category === 'OTHER';
                  const customMatch = isOther ? item.description.match(/^\[(.*?)\]\s*(.*)$/) : null;
                  const displayBadgeLabel = customMatch ? `Lain-lain: ${customMatch[1]}` : catInfo.label;
                  const displayDesc = customMatch ? customMatch[2] : item.description;

                  return (
                    <tr key={item.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-neutral-200">
                        {item.expense_date}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{item.store?.name || 'Cabang Kendal'}</span>
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                          {item.store?.code || ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isFromCashier ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-700/60">
                              <UserCheck className="w-3 h-3 mr-1 text-blue-400" />
                              Input Kasir Cabang
                            </span>
                            <div className="text-[11px] font-medium text-neutral-200 mt-0.5">
                              {item.created_by_user?.full_name || 'Kasir Cabang'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#D4AF37]/15 text-[#E5C365] border border-[#D4AF37]/40">
                              Pusat / Owner
                            </span>
                            <div className="text-[11px] font-medium text-neutral-200 mt-0.5">
                              {item.created_by_user?.full_name || 'Super Admin Utama'}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border font-medium ${catInfo.badge}`}
                        >
                          {displayBadgeLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-neutral-200 font-medium">
                        {displayDesc}
                      </td>

                      <td className="py-3.5 px-4 text-right font-semibold font-mono text-white text-sm">
                        {formatIDR(item.amount)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {item.receipt_url ? (
                          item.receipt_url.startsWith('http') ? (
                            <a
                              href={item.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#D4AF37] hover:underline inline-flex items-center gap-1"
                            >
                              Lihat Bukti
                            </a>
                          ) : (
                            <span className="text-[11px] text-neutral-400 italic" title={item.receipt_url}>
                              {item.receipt_url.length > 20
                                ? `${item.receipt_url.slice(0, 18)}...`
                                : item.receipt_url}
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-neutral-500">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Terkroscek</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(item.id, item.description)}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Tambah Pengeluaran */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Catat Pengeluaran Operasional Toko"
        >
          <form onSubmit={handleCreateExpense} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Lokasi Cabang / Toko <span className="text-red-400">*</span>
              </label>
              <select
                value={formStoreId}
                onChange={(e) => setFormStoreId(e.target.value)}
                required
                className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
              >
                {stores.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Tanggal Pengeluaran <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Kategori Biaya <span className="text-red-400">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                  required
                  className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formCategory === 'OTHER' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 animate-in fade-in">
                <label className="block text-xs font-semibold text-amber-300">
                  Nama / Jenis Beban Lain-lain (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bensin Operasional, Konsumsi, Retribusi Tambahan..."
                  value={formOtherCustom}
                  onChange={(e) => setFormOtherCustom(e.target.value)}
                  className="w-full bg-[#181C24] border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                />
                <p className="text-[10px] text-amber-400/80">
                  Jika diisi, nama ini akan tertera sebagai kategori khusus pada laporan keuangan &amp; audit.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Nominal Biaya (IDR) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-mono">Rp</span>
                <input
                  type="number"
                  placeholder="Contoh: 350000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full bg-[#181C24] border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Deskripsi / Keterangan <span className="text-red-400">*</span>
              </label>
              <textarea
                placeholder="Rincian peruntukan biaya (misal: Pembelian 200 pcs Paper Bag Eksklusif Gold Cabang Kendal Kota)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                required
                rows={2}
                className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                URL Bukti / Nota (Opsional)
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={formReceiptUrl}
                onChange={(e) => setFormReceiptUrl(e.target.value)}
                className="w-full bg-[#181C24] border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="border-neutral-700 text-neutral-300"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-semibold"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
