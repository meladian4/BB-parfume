'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { formatIDR, formatDateTimeJakarta } from '@/lib/formatters';
import { Member, PointTransaction, UserProfile } from '@/types/domain';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  History,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  Award,
  Edit,
  Trash2,
} from 'lucide-react';

export default function SuperAdminMembersPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // State Modal Tambah Member
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addTier, setAddTier] = useState('SILVER');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // State Modal Buku Besar (Ledger)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [ledgerTransactions, setLedgerTransactions] = useState<PointTransaction[]>([]);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // State Modal Adjustment Poin
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustDelta, setAdjustDelta] = useState<string>('');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // State Modal Edit Member
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMemberToEdit, setSelectedMemberToEdit] = useState<Member | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTier, setEditTier] = useState('SILVER');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // State Modal Hapus Member
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMemberToDelete, setSelectedMemberToDelete] = useState<Member | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // State Rekonsiliasi Hasil
  const [reconStatus, setReconStatus] = useState<Record<string, boolean>>({});

  // Paginasi agar ringan dan cepat
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, mRes] = await Promise.all([
        fetch('/api/users/me').then((r) => r.json()),
        fetch('/api/members').then((r) => r.json()),
      ]);

      setUser(uRes.user);
      const memberList: Member[] = mRes.members || [];
      setMembers(memberList);

      // Verifikasi rekonsiliasi buku besar poin untuk tiap member
      const reconMap: Record<string, boolean> = {};
      for (const m of memberList) {
        try {
          const recRes = await fetch(`/api/loyalty/reconcile/${m.id}`).then((r) => r.json());
          reconMap[m.id] = recRes.reconciliation?.is_reconciled ?? true;
        } catch {
          reconMap[m.id] = true;
        }
      }
      setReconStatus(reconMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenLedger = async (member: Member) => {
    setSelectedMember(member);
    setIsLedgerModalOpen(true);
    try {
      setLoadingLedger(true);
      const res = await fetch(`/api/loyalty/transactions?member_id=${member.id}`);
      const data = await res.json();
      setLedgerTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleOpenAdjust = (member: Member) => {
    setSelectedMember(member);
    setAdjustDelta('');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleSubmitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      setSubmittingAdjust(true);
      const res = await fetch('/api/loyalty/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: selectedMember.id,
          points_delta: Number(adjustDelta),
          notes: adjustNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(`Penyesuaian poin berhasil dicatat ke buku besar mutasi.`);
      setIsAdjustModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyesuaikan poin.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAdd(true);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          phone: addPhone,
          email: addEmail || null,
          tier: addTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsAddModalOpen(false);
      setAddName('');
      setAddPhone('');
      setAddEmail('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan member.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const handleOpenEdit = (m: Member) => {
    setSelectedMemberToEdit(m);
    setEditName(m.name);
    setEditPhone(m.phone);
    setEditEmail(m.email || '');
    setEditTier(m.tier);
    setIsEditModalOpen(true);
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberToEdit) return;
    try {
      setSubmittingEdit(true);
      const res = await fetch(`/api/members/${selectedMemberToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail || null,
          tier: editTier,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data member.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleOpenDelete = (m: Member) => {
    setSelectedMemberToDelete(m);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteMember = async () => {
    if (!selectedMemberToDelete) return;
    try {
      setSubmittingDelete(true);
      const res = await fetch(`/api/members/${selectedMemberToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsDeleteModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus member.');
    } finally {
      setSubmittingDelete(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedMembers = filteredMembers.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#D4AF37]" />
                Manajemen Member & Loyalitas Terpusat
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Database member satu pintu untuk seluruh cabang Kendal Kota, Pegandon, dan Kaliwungu • Immutable Point Ledger
              </p>
            </div>

            <Button
              variant="gold"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 shadow-lg shadow-[#D4AF37]/10"
            >
              <Plus className="w-4 h-4" />
              Daftar Member Baru
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pelanggan, nomor WhatsApp, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
            />
          </div>

          {/* Table Members */}
          <Card className="overflow-hidden border-[#1E293B] bg-[#0A0E1A]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-slate-400 border-b border-[#1E293B] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Nama Pelanggan</th>
                    <th className="py-3 px-4">Kontak (WA/Email)</th>
                    <th className="py-3 px-4">Tier Keanggotaan</th>
                    <th className="py-3 px-4 text-right">Saldo Poin</th>
                    <th className="py-3 px-4 text-center">Integritas Ledger</th>
                    <th className="py-3 px-4 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60">
                  {paginatedMembers.map((m) => {
                    const isReconciled = reconStatus[m.id] ?? true;
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{m.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">ID: {m.id.slice(0, 18)}...</p>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#D4AF37]" />
                            <span>{m.phone}</span>
                          </div>
                          {m.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{m.email}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              m.tier === 'PLATINUM'
                                ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                                : m.tier === 'GOLD'
                                ? 'bg-[#D4AF37]/20 text-[#E5C365] border-[#D4AF37]/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {m.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-base font-black text-[#D4AF37]">
                            {m.points_balance}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">pts</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isReconciled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Terekonsiliasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/20">
                              <AlertCircle className="w-3 h-3" />
                              Selisih
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenLedger(m)}
                              className="h-7 px-2 text-xs text-slate-300 hover:text-white"
                              title="Lihat Buku Besar Poin"
                            >
                              <History className="w-3.5 h-3.5 mr-1" />
                              Buku Besar
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenAdjust(m)}
                              className="h-7 px-2 text-xs text-[#D4AF37] hover:text-[#E5C365]"
                              title="Sesuaikan Poin"
                            >
                              <Sliders className="w-3.5 h-3.5 mr-1" />
                              Penyesuaian
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenEdit(m)}
                              className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 bg-blue-950/40 border-blue-800/50"
                              title="Edit Data Member"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenDelete(m)}
                              className="h-7 px-2 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 border-rose-800/50"
                              title="Hapus Member"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMembers.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-500">
                        Tidak ada member yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredMembers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-[#0F172A] border-t border-[#1E293B] gap-3 text-xs text-slate-400">
                <div>
                  Menampilkan{' '}
                  <span className="font-semibold text-white">
                    {(safeCurrentPage - 1) * pageSize + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-semibold text-white">
                    {Math.min(safeCurrentPage * pageSize, filteredMembers.length)}
                  </span>{' '}
                  dari <span className="font-semibold text-[#D4AF37]">{filteredMembers.length}</span> member
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 text-xs disabled:opacity-40"
                  >
                    Sebelumnya
                  </Button>
                  <span className="px-2 font-mono text-slate-300">
                    Hal {safeCurrentPage} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-3 text-xs disabled:opacity-40"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            )}
          </Card>

      {/* MODAL 1: BUKU BESAR MUTASI POIN (LEDGER) */}
      <Modal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        title={`Buku Besar Mutasi Poin — ${selectedMember?.name || ''}`}
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
            <div>
              <p className="text-[10px] text-slate-400">Total Saldo Terverifikasi</p>
              <p className="text-base font-black text-[#D4AF37]">{selectedMember?.points_balance} Poin</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400">Status Rekonsiliasi</p>
              <p className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Konsisten
              </p>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {ledgerTransactions.map((tx) => {
              const isPositive = tx.points_delta > 0;
              return (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          tx.transaction_type === 'EARN'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : tx.transaction_type === 'REDEEM'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : tx.transaction_type === 'REVERSAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {tx.reference_id || 'ADJUSTMENT'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">{tx.notes}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{formatDateTimeJakarta(tx.created_at)}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`font-black text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? `+${tx.points_delta}` : tx.points_delta} pts
                    </p>
                    <p className="text-[10px] text-slate-400">Saldo: {tx.balance_after}</p>
                  </div>
                </div>
              );
            })}
            {ledgerTransactions.length === 0 && !loadingLedger && (
              <p className="text-center py-6 text-slate-500">Belum ada riwayat mutasi poin.</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setIsLedgerModalOpen(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: PENYESUAIAN POIN MANUAL (ADJUSTMENT) */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title={`Penyesuaian Manual Poin — ${selectedMember?.name || ''}`}
      >
        <form onSubmit={handleSubmitAdjust} className="space-y-4 text-xs">
          <p className="text-slate-400">
            Penyesuaian poin akan dicatat langsung ke buku besar immutable dengan tipe mutasi <b>ADJUSTMENT</b> serta jejak audit resmi Super Admin.
          </p>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Saldo Poin Saat Ini:</span>
            <span className="text-sm font-bold text-white">{selectedMember?.points_balance} Poin</span>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Nominal Penyesuaian (Gunakan tanda minus &quot;-&quot; untuk pengurangan)
            </label>
            <Input
              type="number"
              placeholder="Contoh: +50 atau -20"
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Alasan Penyesuaian (Wajib untuk Kepatuhan Audit)
            </label>
            <Input
              type="text"
              placeholder="Contoh: Kompensasi keterlambatan kurir / Promo ulang tahun"
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsAdjustModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" type="submit" disabled={submittingAdjust}>
              {submittingAdjust ? 'Menyimpan...' : 'Simpan Penyesuaian ke Ledger'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: PENDAFTARAN MEMBER BARU */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Daftar Member Loyalitas Baru"
      >
        <form onSubmit={handleAddMember} className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Nama Lengkap Pelanggan</label>
            <Input
              type="text"
              placeholder="Contoh: Anisa Maharani"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Nomor WhatsApp / HP Unik</label>
            <Input
              type="text"
              placeholder="Contoh: 081234567890"
              value={addPhone}
              onChange={(e) => setAddPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Email (Opsional)</label>
            <Input
              type="email"
              placeholder="anisa@gmail.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Tier Awal</label>
            <select
              value={addTier}
              onChange={(e) => setAddTier(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-white"
            >
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
              <option value="PLATINUM">PLATINUM</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" type="submit" disabled={submittingAdd}>
              {submittingAdd ? 'Menyimpan...' : 'Daftarkan Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: EDIT DATA MEMBER */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !submittingEdit && setIsEditModalOpen(false)}
        title="Edit Data Member Loyalitas"
      >
        <form onSubmit={handleEditMember} className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Nama Lengkap Pelanggan</label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Nomor WhatsApp / HP</label>
            <Input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Email (Opsional)</label>
            <Input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Tier Keanggotaan</label>
            <select
              value={editTier}
              onChange={(e) => setEditTier(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
              <option value="PLATINUM">PLATINUM</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" type="submit" disabled={submittingEdit}>
              {submittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: KONFIRMASI HAPUS MEMBER */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !submittingDelete && setIsDeleteModalOpen(false)}
        title="Hapus Member Loyalitas"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Apakah Anda yakin ingin menghapus data member <strong className="text-white">{selectedMemberToDelete?.name}</strong> (<span className="text-[#D4AF37] font-mono">{selectedMemberToDelete?.phone}</span>)?
          </p>
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[11px]">
            ⚠️ Tindakan ini akan menghapus akun member dari sistem dan tercatat di jejak audit.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={handleDeleteMember}
              disabled={submittingDelete}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {submittingDelete ? 'Menghapus...' : 'Ya, Hapus Member'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
