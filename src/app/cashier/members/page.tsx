'use client';

import React, { useState, useEffect } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDateTimeJakarta } from '@/lib/formatters';
import { Member, PointTransaction, UserProfile } from '@/types/domain';
import { Users, Search, Plus, Phone, Mail, Award, History, CheckCircle2, UserCheck, CreditCard, Calendar, ArrowUpDown } from 'lucide-react';

type DatePreset = 'TODAY' | 'YESTERDAY' | 'LAST_7' | 'THIS_MONTH' | 'ALL' | 'CUSTOM';

export default function CashierMembersPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'DATE_DESC' | 'DATE_ASC' | 'POINTS_DESC'>('DATE_DESC');

  // State Modal Tambah Member
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMemberCode, setAddMemberCode] = useState('');
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRegisteredBy, setAddRegisteredBy] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // State Modal Riwayat Poin
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [ledgerTransactions, setLedgerTransactions] = useState<PointTransaction[]>([]);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [loadingLedger, setLoadingLedger] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, mRes, empRes] = await Promise.all([
        fetch('/api/users/me').then((r) => r.json()).catch(() => ({})),
        fetch('/api/members').then((r) => r.json()).catch(() => ({})),
        fetch('/api/users').then((r) => r.json()).catch(() => ({})),
      ]);

      setUser(uRes.user);
      setMembers(mRes.members || []);
      const empList: UserProfile[] = empRes.users || empRes.data || [];
      setEmployees(Array.isArray(empList) ? empList.filter((e) => e.is_active !== false) : []);
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

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAdd(true);
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_code: addMemberCode.trim() || null,
          name: addName,
          phone: addPhone,
          email: addEmail || null,
          registered_by: addRegisteredBy.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsAddModalOpen(false);
      setAddMemberCode('');
      setAddName('');
      setAddPhone('');
      setAddEmail('');
      setAddRegisteredBy('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mendaftarkan member.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Khusus cabang kasir: 1 akun kasir digunakan 2 orang karyawan (hanya tampilkan 2 opsi karyawan untuk akun kasir cabang ini)
  const branchEmployeeOptions = (() => {
    if (user?.role === 'CASHIER') {
      const myProfile = employees.find((e) => e.id === user.id) || user;
      const storeLabel =
        myProfile.assigned_store_id === 'a0000000-0000-0000-0000-000000000002'
          ? 'Kendal Kota'
          : myProfile.assigned_store_id === 'a0000000-0000-0000-0000-000000000003'
          ? 'Pegandon'
          : myProfile.assigned_store_id === 'a0000000-0000-0000-0000-000000000004'
          ? 'Kaliwungu'
          : myProfile.full_name || 'Cabang';
      const opt1 = myProfile.employee_1_name?.trim() || `Karyawan 1 - ${storeLabel}`;
      const opt2 = myProfile.employee_2_name?.trim() || `Karyawan 2 - ${storeLabel}`;
      return Array.from(new Set([opt1, opt2].filter(Boolean)));
    }
    // Jika dibuka oleh Super Admin, tampilkan 2 opsi karyawan dari seluruh akun kasir cabang
    const allBranchStaff: string[] = [];
    employees
      .filter((e) => e.role === 'CASHIER')
      .forEach((c) => {
        const storeLabel =
          c.assigned_store_id === 'a0000000-0000-0000-0000-000000000002'
            ? 'Kendal Kota'
            : c.assigned_store_id === 'a0000000-0000-0000-0000-000000000003'
            ? 'Pegandon'
            : c.assigned_store_id === 'a0000000-0000-0000-0000-000000000004'
            ? 'Kaliwungu'
            : c.full_name || 'Cabang';
        allBranchStaff.push(c.employee_1_name?.trim() || `Karyawan 1 - ${storeLabel}`);
        allBranchStaff.push(c.employee_2_name?.trim() || `Karyawan 2 - ${storeLabel}`);
      });
    return Array.from(new Set(allBranchStaff.filter(Boolean)));
  })();

  const employeeOptions = branchEmployeeOptions;

  const getTodayStr = () => new Date().toISOString().slice(0, 10);
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };
  const getLast7DaysStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  };
  const getMonthStartStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };

  const dateFilteredMembers = members.filter((m) => {
    const dateStr = (m.created_at || '').slice(0, 10);
    if (datePreset === 'TODAY') {
      return dateStr === getTodayStr();
    }
    if (datePreset === 'YESTERDAY') {
      return dateStr === getYesterdayStr();
    }
    if (datePreset === 'LAST_7') {
      return dateStr >= getLast7DaysStr();
    }
    if (datePreset === 'THIS_MONTH') {
      return dateStr >= getMonthStartStr();
    }
    if (datePreset === 'CUSTOM') {
      if (customStartDate && dateStr < customStartDate) return false;
      if (customEndDate && dateStr > customEndDate) return false;
    }
    return true;
  });

  const employeeEffortSummary = employeeOptions.map((empName, idx) => {
    const count = dateFilteredMembers.filter((m) => (m.registered_by || '') === empName).length;
    const colors = [
      { dotClass: 'bg-amber-400', textClass: 'text-amber-400' },
      { dotClass: 'bg-emerald-400', textClass: 'text-emerald-400' },
      { dotClass: 'bg-purple-400', textClass: 'text-purple-400' },
      { dotClass: 'bg-sky-400', textClass: 'text-sky-400' },
    ];
    const color = colors[idx % colors.length];
    return { name: empName, count, ...color };
  });

  const unassignedCount = dateFilteredMembers.filter((m) => !m.registered_by).length;

  const filteredMembers = dateFilteredMembers
    .filter((m) => {
      if (employeeFilter !== 'ALL') {
        if (employeeFilter === 'UNASSIGNED') {
          if (m.registered_by) return false;
        } else if ((m.registered_by || '') !== employeeFilter) {
          return false;
        }
      }
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.member_code && m.member_code.toLowerCase().includes(q)) ||
        (m.registered_by && m.registered_by.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'POINTS_DESC') {
        return (b.points_balance || 0) - (a.points_balance || 0);
      }
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return sortBy === 'DATE_ASC' ? timeA - timeB : timeB - timeA;
    });

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans">
      <Topbar user={user || undefined} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar role={user?.role || 'CASHIER'} />

        <main className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#D4AF37]" />
                Layanan Member Kasir
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Pencarian data member toko, pengecekan poin loyalitas pelanggan, dan pendaftaran cepat
              </p>
            </div>

            <Button
              variant="gold"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 shadow-lg shadow-[#D4AF37]/10"
            >
              <Plus className="w-4 h-4" />
              Daftar Pelanggan Baru
            </Button>
          </div>

          {/* Card Info Rangkuman Member & Kontribusi Karyawan Cabang */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3 h-3 text-[#D4AF37]" />
                Rangkuman Pendaftaran Member &amp; Kinerja Karyawan Cabang
              </p>
              {employeeFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setEmployeeFilter('ALL')}
                  className="text-[10px] text-[#D4AF37] hover:underline font-medium"
                >
                  Tampilkan Semua Member
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Member */}
              <button
                type="button"
                onClick={() => setEmployeeFilter('ALL')}
                className={`text-left rounded-xl p-2 transition-all cursor-pointer ${
                  employeeFilter === 'ALL'
                    ? 'bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/60'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Total Semua Member</span>
                </p>
                <p className="text-sm font-bold text-slate-200 mt-0.5">
                  {dateFilteredMembers.length} <span className="text-xs font-medium text-slate-400">member</span>
                </p>
              </button>

              {/* 2 Karyawan Cabang */}
              {employeeEffortSummary.map((emp) => {
                const isSelected = employeeFilter === emp.name;
                return (
                  <button
                    key={emp.name}
                    type="button"
                    onClick={() => setEmployeeFilter(isSelected ? 'ALL' : emp.name)}
                    title={`Klik untuk filter member yang didaftarkan oleh ${emp.name}`}
                    className={`text-left rounded-xl p-2 transition-all cursor-pointer sm:border-l sm:border-slate-800 sm:rounded-l-none sm:pl-3 ${
                      isSelected
                        ? 'bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/60'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${emp.dotClass}`} />
                      <span className="truncate">{emp.name}</span>
                    </p>
                    <p className={`text-sm font-bold mt-0.5 ${emp.textClass}`}>
                      {emp.count} <span className="text-xs font-medium text-slate-400">member</span>
                    </p>
                  </button>
                );
              })}

              {/* Tanpa Petugas */}
              <button
                type="button"
                onClick={() => setEmployeeFilter(employeeFilter === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED')}
                className={`text-left rounded-xl p-2 transition-all cursor-pointer sm:border-l sm:border-slate-800 sm:rounded-l-none sm:pl-3 ${
                  employeeFilter === 'UNASSIGNED'
                    ? 'bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/60'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Tanpa Petugas</span>
                </p>
                <p className="text-sm font-bold text-purple-400 mt-0.5">
                  {unassignedCount} <span className="text-xs font-medium text-slate-400">member</span>
                </p>
              </button>
            </div>
          </div>

          {/* Search & Employee Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari ID member, nama pelanggan, WhatsApp, atau petugas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-slate-400">Petugas:</span>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0F172A]">Semua Karyawan</option>
                {employeeOptions.map((empName) => (
                  <option key={empName} value={empName} className="bg-[#0F172A]">
                    {empName}
                  </option>
                ))}
                <option value="UNASSIGNED" className="bg-[#0F172A]">Tanpa Petugas</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="text-slate-400">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'DATE_DESC' | 'DATE_ASC' | 'POINTS_DESC')}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="DATE_DESC" className="bg-[#0F172A]">Terbaru Didaftarkan</option>
                <option value="DATE_ASC" className="bg-[#0F172A]">Terlama Didaftarkan</option>
                <option value="POINTS_DESC" className="bg-[#0F172A]">Saldo Poin Tertinggi</option>
              </select>
            </div>
          </div>

          {/* Rentang Waktu Filter Bar (Hari Ini, Kemarin, 7 Hari Terakhir, Bulan Ini, Semua Waktu, Pilih Tanggal) */}
          <div className="pt-2 border-t border-[#1E293B]/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                Rentang Waktu:
              </span>
              {(
                [
                  { id: 'TODAY', label: 'Hari Ini' },
                  { id: 'YESTERDAY', label: 'Kemarin' },
                  { id: 'LAST_7', label: '7 Hari Terakhir' },
                  { id: 'THIS_MONTH', label: 'Bulan Ini' },
                  { id: 'ALL', label: 'Semua Waktu' },
                  { id: 'CUSTOM', label: 'Pilih Tanggal' },
                ] as { id: DatePreset; label: string }[]
              ).map((preset) => {
                const isActive = datePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDatePreset(preset.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-sm'
                        : 'bg-[#0F172A] text-slate-400 hover:text-slate-200 border border-[#1E293B]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {datePreset === 'CUSTOM' && (
              <div className="flex items-center gap-2 bg-[#0F172A] p-1.5 rounded-xl border border-[#1E293B]">
                <span className="text-[10px] text-slate-400">Dari:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-[#090D16] border border-slate-700 rounded px-2 py-0.5 text-xs text-white [color-scheme:dark]"
                />
                <span className="text-[10px] text-slate-400">s/d:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-[#090D16] border border-slate-700 rounded px-2 py-0.5 text-xs text-white [color-scheme:dark]"
                />
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="text-[10px] text-slate-400 hover:text-red-400 px-1"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Table Members */}
          <Card className="overflow-hidden border-[#1E293B] bg-[#0A0E1A]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-slate-400 border-b border-[#1E293B] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ID &amp; Nama Pelanggan</th>
                    <th className="py-3 px-4">Kontak WhatsApp</th>
                    <th className="py-3 px-4">Petugas Pendaftar</th>
                    <th className="py-3 px-4">Tier Loyalitas</th>
                    <th className="py-3 px-4 text-right">Saldo Poin</th>
                    <th className="py-3 px-4 text-center">Riwayat Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{m.name}</p>
                          {m.member_code && (
                            <span className="px-1.5 py-0.5 rounded bg-[#D4AF37]/15 text-[#E5C365] border border-[#D4AF37]/30 font-mono text-[10px] font-bold">
                              {m.member_code}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Terdaftar: {formatDateTimeJakarta(m.created_at)}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#D4AF37]" />
                          <span>{m.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {m.registered_by ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/50 text-emerald-300 border border-emerald-800/50 text-[11px] font-medium">
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            {m.registered_by}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">-</span>
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
                        <span className="text-base font-black text-[#D4AF37]">{m.points_balance}</span>
                        <span className="text-[10px] text-slate-400 ml-1">pts</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenLedger(m)}
                          className="h-7 px-2 text-xs text-slate-300 hover:text-white"
                        >
                          <History className="w-3.5 h-3.5 mr-1" />
                          Lihat Poin
                        </Button>
                      </td>
                    </tr>
                  ))}
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
          </Card>
        </main>
      </div>

      {/* MODAL RIWAYAT MUTASI POIN */}
      <Modal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        title={`Riwayat Poin — ${selectedMember?.name || ''}`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Saldo Poin Saat Ini:</span>
            <span className="text-base font-black text-[#D4AF37]">{selectedMember?.points_balance} Poin</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {ledgerTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex justify-between items-center"
              >
                <div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      tx.transaction_type === 'EARN'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : tx.transaction_type === 'REDEEM'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}
                  >
                    {tx.transaction_type}
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1">{tx.notes}</p>
                  <p className="text-[9px] text-slate-500">{formatDateTimeJakarta(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.points_delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.points_delta > 0 ? `+${tx.points_delta}` : tx.points_delta} pts
                  </p>
                  <p className="text-[10px] text-slate-400">Saldo: {tx.balance_after}</p>
                </div>
              </div>
            ))}
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

      {/* MODAL DAFTAR BARU */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Daftarkan Member Baru"
      >
        <form onSubmit={handleAddMember} className="space-y-4 text-xs">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              ID Member / Kode Kartu (Opsional)
            </label>
            <Input
              type="text"
              placeholder="Contoh: BB-001 (Kosongkan jika otomatis)"
              value={addMemberCode}
              onChange={(e) => setAddMemberCode(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Nama Lengkap Pelanggan</label>
            <Input
              type="text"
              placeholder="Contoh: Rian Pratama"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Nomor WhatsApp / HP</label>
            <Input
              type="text"
              placeholder="081..."
              value={addPhone}
              onChange={(e) => setAddPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Email (Opsional)</label>
            <Input
              type="email"
              placeholder="rian@gmail.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Karyawan / Petugas Pendaftar (Opsional — Monitoring Kinerja)
            </label>
            <select
              value={addRegisteredBy}
              onChange={(e) => setAddRegisteredBy(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="">-- Pilih Karyawan / Petugas (Opsional) --</option>
              {employeeOptions.map((empName) => (
                <option key={empName} value={empName}>
                  {empName}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Digunakan untuk memantau kontribusi pendaftaran member oleh masing-masing karyawan.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" type="submit" disabled={submittingAdd}>
              {submittingAdd ? 'Menyimpan...' : 'Daftarkan Pelanggan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
