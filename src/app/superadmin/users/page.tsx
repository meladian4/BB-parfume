'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, Store, UserRole } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Users,
  UserPlus,
  Shield,
  Store as StoreIcon,
  Truck,
  Edit,
  KeyRound,
  Trash2,
  Power,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Info,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { formatDateTimeJakarta } from '@/lib/formatters';
import { SettingsSubNav } from '@/components/superadmin/SettingsSubNav';

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal Tambah Pengguna
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addFullName, setAddFullName] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('CASHIER');
  const [addAssignedStoreId, setAddAssignedStoreId] = useState('');
  const [addError, setAddError] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Modal Edit Pengguna & Hak Akses
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editUnlockNow, setEditUnlockNow] = useState(false);
  const [editRole, setEditRole] = useState<UserRole>('CASHIER');
  const [editAssignedStoreId, setEditAssignedStoreId] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Modal Reset Password & Kredensial Login
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<UserProfile | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('password123');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        fetch('/api/users').then((r) => r.json()),
        fetch('/api/stores').then((r) => r.json()),
      ]);

      const userList = uRes.users || uRes.data || [];
      const storeList = sRes.stores || sRes.data || [];
      setUsers(userList);
      setStores(storeList);

      if (storeList.length > 0 && !addAssignedStoreId) {
        const firstStore = storeList.find((s: Store) => s.type === 'STORE') || storeList[0];
        setAddAssignedStoreId(firstStore.id);
      }
    } catch (err) {
      console.error('Error loading users/stores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAdd(true);
    setAddError('');

    try {
      if (addRole === 'CASHIER' && !addAssignedStoreId) {
        throw new Error('LARANGAN AKSES: Petugas Kasir wajib dikunci ke salah satu cabang toko retail.');
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addEmail.trim().toLowerCase(),
          full_name: addFullName.trim(),
          role: addRole,
          assigned_store_id: addRole === 'SUPER_ADMIN' ? null : addAssignedStoreId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menambahkan pengguna.');
      }

      setIsAddModalOpen(false);
      resetAddForm();
      setNotificationMsg({ type: 'success', text: `Pengguna '${addFullName}' berhasil ditambahkan dengan role ${addRole}.` });
      await loadData();
    } catch (err: any) {
      setAddError(err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const resetAddForm = () => {
    setAddEmail('');
    setAddFullName('');
    setAddRole('CASHIER');
    const firstStore = stores.find((s) => s.type === 'STORE') || stores[0];
    setAddAssignedStoreId(firstStore ? firstStore.id : '');
    setAddError('');
  };

  const openEditModal = (u: UserProfile) => {
    setEditUser(u);
    setEditFullName(u.full_name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditAssignedStoreId(u.assigned_store_id || '');
    setEditIsActive(u.is_active);
    setEditPassword('');
    setShowEditPassword(false);
    setEditUnlockNow(Boolean(u.is_locked));
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setSubmittingEdit(true);
    setEditError('');

    try {
      if (editRole === 'CASHIER' && !editAssignedStoreId) {
        throw new Error('LARANGAN AKSES: Kasir wajib dikunci ke salah satu cabang toko retail.');
      }

      const payload: any = {
        full_name: editFullName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        assigned_store_id: editRole === 'SUPER_ADMIN' ? null : editAssignedStoreId,
        is_active: editIsActive,
      };

      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      if (editUser.is_locked && editUnlockNow) {
        payload.is_locked = false;
      }

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal memperbarui pengguna.');
      }

      setIsEditModalOpen(false);
      setNotificationMsg({
        type: 'success',
        text: `Profil, email, dan pengaturan '${editFullName}' berhasil diperbarui${editPassword.trim() ? ' (kata sandi baru tersimpan)' : ''}.`,
      });
      await loadData();
    } catch (err: any) {
      setEditError(err.message || 'Gagal memperbarui data pengguna.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const openResetModal = (u: UserProfile) => {
    setResetTargetUser(u);
    setResetEmail(u.email);
    setCustomPassword('password123');
    setShowResetPassword(false);
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;

    setResetSubmitting(true);
    try {
      const res = await fetch(`/api/users/${resetTargetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PASSWORD',
          password: customPassword.trim(),
          email: resetEmail.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mereset kata sandi dan email.');
      }

      setIsResetModalOpen(false);
      setNotificationMsg({
        type: 'success',
        text: `Kredensial login '${resetTargetUser.full_name}' berhasil diperbarui (Email: ${resetEmail.trim().toLowerCase()}, Kata Sandi: "${customPassword.trim()}"). Akun otomatis dibuka kuncinya.`,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mereset kata sandi dan email.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleUnlockUser = async (u: UserProfile) => {
    if (!confirm(`Buka kunci akun "${u.full_name}" (${u.email})? Pengguna akan dapat login kembali.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UNLOCK_ACCOUNT' }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal membuka kunci akun.');
      }

      setNotificationMsg({
        type: 'success',
        text: `Kunci akun '${u.full_name}' berhasil dibuka. Percobaan login gagal telah direset ke 0.`,
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuka kunci akun.');
    }
  };

  const handleToggleStatus = async (u: UserProfile) => {
    const actionName = u.is_active ? 'menonaktifkan' : 'mengaktifkan kembali';
    if (!confirm(`Apakah Anda yakin ingin ${actionName} akun "${u.full_name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_STATUS' }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal mengubah status pengguna.');
      }

      setNotificationMsg({ type: 'success', text: data.message });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status akun.');
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (!confirm(`Hapus permanen akun "${u.full_name}" (${u.email})? Tindakan ini akan tercatat di Audit Log.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal menghapus pengguna.');
      }

      setNotificationMsg({ type: 'success', text: `Pengguna '${u.full_name}' berhasil dihapus.` });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengguna.');
    }
  };

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return (
          <Badge variant="gold" size="sm">
            <Shield className="w-3 h-3 inline mr-1" />
            Super Admin
          </Badge>
        );
      case 'LOGISTICS':
        return (
          <Badge variant="blue" size="sm">
            <Truck className="w-3 h-3 inline mr-1" />
            Logistik
          </Badge>
        );
      case 'CASHIER':
        return (
          <Badge variant="emerald" size="sm">
            <StoreIcon className="w-3 h-3 inline mr-1" />
            Kasir Toko
          </Badge>
        );
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.assigned_store?.name && u.assigned_store.name.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Sub Menu Pengaturan Sistem */}
      <SettingsSubNav activeTab="users" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4AF37]" />
            <span>Manajemen Pengguna, Hak Akses & Larangan Pos Akun</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Super Admin memiliki wewenang penuh untuk menambah, mengedit profil, mengubah penugasan cabang, mereset password, dan mengunci hak akses kasir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="border-slate-800 text-slate-300 hover:bg-slate-800/60"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Segarkan
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              resetAddForm();
              setIsAddModalOpen(true);
            }}
            className="shadow-sm shadow-[#D4AF37]/20 bg-[#D4AF37] text-black font-semibold"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            <span>Tambah Pengguna Baru</span>
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
              : 'bg-rose-950/50 border-rose-800/80 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-slate-400 hover:text-white text-xs underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* MATRIX LARANGAN & PEMBATASAN HAK AKSES PER POS AKUN */}
      <div className="p-4 rounded-xl bg-[#101625] border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
          <span>Matriks Larangan & Pembatasan Otoritas Tiap Pos Akun</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Pos Kasir */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-emerald-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <StoreIcon className="w-3.5 h-3.5" />
                POS KASIR (CASHIER)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">Terkunci 1 Toko</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
              <li><strong className="text-rose-400">Dilarang:</strong> Mengakses cabang lain di luar yang ditetapkan.</li>
              <li><strong className="text-rose-400">Dilarang:</strong> Bertransaksi POS di Gudang Pusat.</li>
              <li><strong className="text-rose-400">Dilarang:</strong> Akses laporan keuangan, OPEX, dan pengguna.</li>
              <li><strong className="text-emerald-400">Diizinkan:</strong> Transaksi kasir POS, member, cetak struk, tutup shift.</li>
            </ul>
          </div>

          {/* Pos Logistik */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-blue-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                POS LOGISTIK (LOGISTICS)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50">Gudang & Stok</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
              <li><strong className="text-rose-400">Dilarang:</strong> Melayani transaksi POS ritel kasir.</li>
              <li><strong className="text-rose-400">Dilarang:</strong> Akses laporan laba-rugi & keuangan korporat.</li>
              <li><strong className="text-rose-400">Dilarang:</strong> Mutasi ke cabang tujuan yang sama.</li>
              <li><strong className="text-blue-400">Diizinkan:</strong> PO supplier, stok gudang, HPP bergerak, mutasi.</li>
            </ul>
          </div>

          {/* Pos Super Admin */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#E5C365] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                POS SUPER ADMIN
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50">Global Multi-Cabang</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
              <li><strong className="text-rose-400">Dilarang:</strong> Hard-delete transaksi keuangan yang diposting.</li>
              <li><strong className="text-rose-400">Dilarang:</strong> Menghapus akun Super Admin terakhir.</li>
              <li><strong className="text-amber-400">Diizinkan:</strong> Akses semua toko, edit hak akses, reset password, OPEX, audit.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECURITY BANNER: 3X FAILED LOGINS AUTO-LOCKOUT POLICY */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-[#101625] border border-amber-600/40 flex items-start sm:items-center gap-3 text-xs shadow-lg">
        <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[#D4AF37] shrink-0 mt-0.5 sm:mt-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <div className="font-bold text-white flex items-center gap-2">
            <span>Kebijakan Keamanan Login Multi-Cabang Kendal (Anti-Fraud & Auto-Lockout)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 border border-amber-700 text-[#E5C365]">Auto-Lock 3x</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Akun Petugas Kasir & Logistik yang <strong className="text-rose-400">gagal login 3 kali</strong> akan langsung <strong className="text-rose-400">terkunci otomatis</strong> demi keamanan. Akun <strong className="text-[#D4AF37]">Super Admin dikecualikan</strong> (tidak pernah terkunci). Super Admin memiliki wewenang penuh untuk mengganti email, memperbarui kata sandi, dan membuka kunci akun kapan saja.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="bg-[#101625] border-slate-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama pengguna, email, atau nama cabang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="ALL">Semua Role Hak Akses</option>
              <option value="SUPER_ADMIN">Hanya SUPER_ADMIN</option>
              <option value="LOGISTICS">Hanya LOGISTICS</option>
              <option value="CASHIER">Hanya CASHIER (Kasir Toko)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card bordered className="bg-[#0F172A]/90 overflow-hidden shadow-xl">
        <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-white">Daftar Akun Petugas & Kasir</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Ditemukan {filteredUsers.length} dari total {users.length} pengguna terdaftar.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat data pengguna...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">Tidak ada pengguna yang sesuai dengan filter pencarian.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#162036] text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Email Login</th>
                    <th className="py-3 px-4">Hak Akses Role</th>
                    <th className="py-3 px-4">Penugasan Cabang</th>
                    <th className="py-3 px-4 text-center">Status Akun</th>
                    <th className="py-3 px-4 text-center">Aksi Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredUsers.map((u) => {
                    const isPrimaryAdmin = u.email === 'admin@bbparfum.id';
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white">
                          {u.full_name}
                          {isPrimaryAdmin && (
                            <span className="ml-1.5 text-[10px] text-[#D4AF37] font-semibold">(Utama)</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{u.email}</td>
                        <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>
                        <td className="py-3.5 px-4">
                          {u.role === 'SUPER_ADMIN' ? (
                            <span className="text-slate-400 italic">Semua Cabang (Global)</span>
                          ) : u.assigned_store ? (
                            <span className="font-medium text-[#E5C365]">
                              {u.assigned_store.name} ({u.assigned_store.code})
                            </span>
                          ) : (
                            <span className="text-rose-400 font-medium">Belum Ditugaskan</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {u.is_locked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-600/80 shadow-sm shadow-rose-900/40 animate-pulse">
                              <Lock className="w-3 h-3 text-rose-400" />
                              Terkunci (3x Gagal)
                            </span>
                          ) : u.is_active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/50">
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Tombol Buka Kunci (Jika Terkunci) */}
                            {u.is_locked && (
                              <button
                                onClick={() => handleUnlockUser(u)}
                                title="Buka Kunci Akun (Reset 3x Gagal Login)"
                                className="p-1.5 rounded-md bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 hover:bg-emerald-900 transition flex items-center gap-1 shadow-sm shadow-emerald-500/20"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Tombol Edit */}
                            <button
                              onClick={() => openEditModal(u)}
                              title="Edit Profil, Email & Kata Sandi"
                              className="p-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Reset Password / Ganti Kredensial */}
                            <button
                              onClick={() => openResetModal(u)}
                              title="Ganti Email & Kata Sandi Login"
                              className="p-1.5 rounded-md bg-amber-950/50 border border-amber-800/50 text-[#E5C365] hover:bg-amber-900/60 transition"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Toggle Status (Aktif/Nonaktif) */}
                            {!isPrimaryAdmin && (
                              <button
                                onClick={() => handleToggleStatus(u)}
                                title={u.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                                className={`p-1.5 rounded-md transition border ${
                                  u.is_active
                                    ? 'bg-rose-950/40 border-rose-800/40 text-rose-400 hover:bg-rose-900/50'
                                    : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/50'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Tombol Hapus */}
                            {!isPrimaryAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="Hapus Pengguna"
                                className="p-1.5 rounded-md bg-slate-800/60 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* =================================================================== */}
      {/* MODAL 1: TAMBAH PENGGUNA BARU                                       */}
      {/* =================================================================== */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Pengguna Baru & Tetapkan Otoritas"
        description="Tetapkan nama, email, role, dan penguncian cabang toko."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Nama Lengkap Petugas"
            placeholder="Misal: Siti Nurhaliza"
            value={addFullName}
            onChange={(e) => setAddFullName(e.target.value)}
            required
          />

          <Input
            label="Email Login"
            type="email"
            placeholder="nama@bbparfum.id"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Hak Akses Role</label>
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as UserRole)}
              className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="CASHIER">CASHIER (Kasir POS Terkunci di 1 Toko)</option>
              <option value="LOGISTICS">LOGISTICS (Logistik & Gudang Pusat)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh Semua Cabang)</option>
            </select>
          </div>

          {addRole !== 'SUPER_ADMIN' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Toko / Cabang Penugasan {addRole === 'CASHIER' && <span className="text-rose-400">*</span>}
              </label>
              <select
                value={addAssignedStoreId}
                onChange={(e) => setAddAssignedStoreId(e.target.value)}
                className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D4AF37]"
                required={addRole === 'CASHIER'}
              >
                <option value="">-- Pilih Lokasi --</option>
                {stores
                  .filter((s) => (addRole === 'CASHIER' ? s.type === 'STORE' : true))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.type === 'WAREHOUSE' ? 'Gudang' : 'Toko Retail'}
                    </option>
                  ))}
              </select>
              {addRole === 'CASHIER' && (
                <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 space-y-0.5">
                  <p className="font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    Larangan Akses Ketat Kasir:
                  </p>
                  <p>Kasir hanya dapat membuka kasir POS di toko ini dan dilarang mengakses Gudang Pusat atau cabang lain.</p>
                </div>
              )}
            </div>
          )}

          {addError && (
            <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50">
              {addError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              disabled={submittingAdd}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submittingAdd} className="bg-[#D4AF37] text-black font-semibold">
              Simpan Pengguna
            </Button>
          </div>
        </form>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL 2: EDIT PENGGUNA & HAK AKSES                                  */}
      {/* =================================================================== */}
      {isEditModalOpen && editUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Hak Akses & Profil: ${editUser.full_name}`}
          description="Ubah role, toko penugasan, email login, atau perbarui kata sandi pengguna ini."
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <Input
              label="Nama Lengkap Petugas"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              required
            />

            <Input
              label="Email Login (Kredensial)"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />

            {/* Ganti Kata Sandi Baru */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Ganti Kata Sandi Baru (Opsional)
              </label>
              <div className="relative">
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-[#162036] border border-[#1E293B] rounded-lg pl-3 pr-10 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title={showEditPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Jika dikosongkan, kata sandi saat ini tetap berlaku tanpa perubahan.
              </p>
            </div>

            {/* Alert & Checkbox jika akun terkunci */}
            {editUser.is_locked && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-700/80 text-xs text-rose-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-rose-200">
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>Akun Ini Sedang Terkunci (3x Gagal Login)</span>
                </div>
                <p className="text-[11px] text-rose-300/90">
                  Pengguna gagal memasukkan kata sandi yang benar sebanyak 3 kali berturut-turut.
                </p>
                <label className="flex items-center gap-2 cursor-pointer pt-1 text-emerald-300 font-semibold text-xs">
                  <input
                    type="checkbox"
                    checked={editUnlockNow}
                    onChange={(e) => setEditUnlockNow(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 rounded"
                  />
                  <span>Buka Kunci Akun Sekarang & Reset Hitungan Percobaan Gagal</span>
                </label>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Hak Akses Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="CASHIER">CASHIER (Kasir POS Terkunci di 1 Toko)</option>
                <option value="LOGISTICS">LOGISTICS (Logistik & Gudang Pusat)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh Semua Cabang)</option>
              </select>
            </div>

            {editRole !== 'SUPER_ADMIN' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Toko / Cabang Penugasan {editRole === 'CASHIER' && <span className="text-rose-400">*</span>}
                </label>
                <select
                  value={editAssignedStoreId}
                  onChange={(e) => setEditAssignedStoreId(e.target.value)}
                  className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D4AF37]"
                  required={editRole === 'CASHIER'}
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {stores
                    .filter((s) => (editRole === 'CASHIER' ? s.type === 'STORE' : true))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) - {s.type === 'WAREHOUSE' ? 'Gudang' : 'Toko Retail'}
                      </option>
                    ))}
                </select>
                {editRole === 'CASHIER' && (
                  <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 space-y-0.5">
                    <p className="font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      Larangan Akses Ketat Kasir:
                    </p>
                    <p>Akun ini hanya dapat membuka kasir di toko cabang terpilih. Dilarang bertransaksi di cabang lain atau di Gudang Pusat.</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Status Akun</label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                  <input
                    type="radio"
                    name="editIsActive"
                    checked={editIsActive === true}
                    onChange={() => setEditIsActive(true)}
                    className="accent-[#D4AF37]"
                  />
                  <span>Aktif (Bisa Login & Bertransaksi)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-rose-300">
                  <input
                    type="radio"
                    name="editIsActive"
                    checked={editIsActive === false}
                    onChange={() => setEditIsActive(false)}
                    className="accent-rose-500"
                  />
                  <span>Nonaktif (Akses Ditolak)</span>
                </label>
              </div>
            </div>

            {editError && (
              <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50">
                {editError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                disabled={submittingEdit}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" isLoading={submittingEdit} className="bg-[#D4AF37] text-black font-semibold">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: GANTI EMAIL & KATA SANDI LOGIN                             */}
      {/* =================================================================== */}
      {isResetModalOpen && resetTargetUser && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title={`Ganti Email & Kata Sandi: ${resetTargetUser.full_name}`}
          description={`Perbarui email login atau atur kata sandi baru untuk akun ${resetTargetUser.email}.`}
        >
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 text-xs text-amber-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Manajemen Kredensial Login Super Admin
              </p>
              <p>
                Email dan kata sandi baru akan langsung berlaku untuk login. Mengubah kata sandi di sini juga <strong>otomatis membuka kunci akun</strong> jika sebelumnya akun sedang terkunci.
              </p>
            </div>

            {resetTargetUser.is_locked && (
              <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-700/80 text-xs text-rose-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Akun saat ini <strong>TERKUNCI (3x gagal login)</strong>. Menyimpan kredensial baru akan otomatis membuka kunci akun ini.</span>
              </div>
            )}

            <Input
              label="Email Login Akun"
              type="email"
              placeholder="email@bbparfum.id"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi baru"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="w-full bg-[#162036] border border-[#1E293B] rounded-lg pl-3 pr-10 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D4AF37]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title={showResetPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400">Pilihan cepat:</span>
              <button
                type="button"
                onClick={() => setCustomPassword('password123')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              >
                password123 (Default)
              </button>
              <button
                type="button"
                onClick={() => setCustomPassword('Kendal2026!')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              >
                Kendal2026!
              </button>
              <button
                type="button"
                onClick={() => {
                  const rand = Math.floor(100 + Math.random() * 900);
                  setCustomPassword(`BBP-Kendal-${rand}!`);
                }}
                className="text-[11px] px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40"
              >
                🎲 Acak Sandi Baru
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsResetModalOpen(false)}
                disabled={resetSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" variant="primary" isLoading={resetSubmitting} className="bg-[#D4AF37] text-black font-semibold">
                Simpan Email & Kata Sandi
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
