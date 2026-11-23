'use client';

import React, { useState, useEffect } from 'react';
import { Store, StoreType } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Store as StoreIcon,
  Warehouse,
  Plus,
  MapPin,
  Phone,
  CheckCircle2,
  Edit,
  XCircle,
} from 'lucide-react';
import { SettingsSubNav } from '@/components/superadmin/SettingsSubNav';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Tambah Cabang
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<StoreType>('STORE');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Edit Cabang / Gudang
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<StoreType>('STORE');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editReceiptHeader, setEditReceiptHeader] = useState('BB PARFUM PREMIUM');
  const [editReceiptFooter, setEditReceiptFooter] = useState(
    'Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian retur resmi.'
  );
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stores').then((r) => r.json());
      setStores(res?.stores || res?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          type,
          address: address.trim(),
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal membuat toko.');
      }

      setIsModalOpen(false);
      resetForm();
      await loadStores();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan lokasi.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setName('');
    setType('STORE');
    setAddress('');
    setPhone('');
    setError('');
  };

  const openEditModal = (store: Store) => {
    setEditingStore(store);
    setEditCode(store.code);
    setEditName(store.name);
    setEditType(store.type);
    setEditAddress(store.address || '');
    setEditPhone(store.phone || '');
    setEditReceiptHeader(store.receipt_header || 'BB PARFUM PREMIUM');
    setEditReceiptFooter(
      store.receipt_footer ||
        'Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian retur resmi.'
    );
    setEditIsActive(store.is_active !== false);
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    setEditSubmitting(true);
    setEditError('');

    try {
      const res = await fetch(`/api/stores/${editingStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editCode.trim().toUpperCase(),
          name: editName.trim(),
          type: editType,
          address: editAddress.trim(),
          phone: editPhone.trim(),
          receipt_header: editReceiptHeader.trim() || null,
          receipt_footer: editReceiptFooter.trim() || null,
          is_active: editIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memperbarui data lokasi.');
      }

      setIsEditModalOpen(false);
      setEditingStore(null);
      await loadStores();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan lokasi.');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Menu Pengaturan Sistem */}
      <SettingsSubNav activeTab="stores" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-[#D4AF37]" />
            <span>Manajemen Toko Cabang &amp; Gudang Kendal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi lokasi fisik BB Parfum (1 Gudang Pusat Distribusi dan 3 Cabang Toko di Kendal).
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="shadow-sm shadow-[#D4AF37]/20"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Tambah Cabang Baru</span>
        </Button>
      </div>

      {/* Grid of Stores */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Memuat data cabang...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map((store) => {
            const isWarehouse = store.type === 'WAREHOUSE';
            return (
              <Card
                key={store.id}
                glow
                className="border-slate-800 bg-[#0F172A]/90 hover:border-slate-700"
              >
                <CardHeader className="flex flex-row items-start justify-between pb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isWarehouse
                          ? 'bg-amber-500/15 text-[#D4AF37] border border-[#D4AF37]/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isWarehouse ? (
                        <Warehouse className="w-5 h-5" />
                      ) : (
                        <StoreIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{store.name}</CardTitle>
                      <CardDescription className="font-mono text-[11px] text-[#D4AF37]">
                        {store.code}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={isWarehouse ? 'gold' : 'emerald'} size="sm">
                      {isWarehouse ? 'Gudang Pusat' : 'Toko Cabang'}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => openEditModal(store)}
                      title={`Edit Lokasi & Struk ${store.name}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 hover:text-white flex items-center gap-1 transition"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Edit Toko &amp; Struk</span>
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs text-slate-300 pt-0">
                  <div className="flex items-start gap-2 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
                    <span>{store.address}</span>
                  </div>
                  {store.phone && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-500">Status Operasional</span>
                    {store.is_active !== false ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Aktif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 font-medium">
                        <XCircle className="w-3 h-3" />
                        Nonaktif
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Add Store */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Cabang / Lokasi Baru"
        description="Pastikan kode lokasi unik dan alamat cabang Kendal tercatat lengkap."
      >
        <form onSubmit={handleCreateStore} className="space-y-4">
          <Input
            label="Kode Lokasi (Unik)"
            placeholder="Misal: STORE-KDL-04"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />

          <Input
            label="Nama Cabang / Toko"
            placeholder="Misal: BB Parfum Store Kaliwungu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Tipe Lokasi</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as StoreType)}
              className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="STORE">STORE (Toko Retail POS)</option>
              <option value="WAREHOUSE">WAREHOUSE (Gudang Distribusi)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Alamat Lengkap</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jl. Raya Utama No. XX, Kecamatan, Kabupaten Kendal"
              rows={3}
              className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              required
            />
          </div>

          <Input
            label="Nomor Telepon / WhatsApp Cabang"
            placeholder="0812-XXXX-XXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/50">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Simpan Lokasi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Store */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !editSubmitting && setIsEditModalOpen(false)}
        title={`Edit Lokasi — ${editingStore?.name || ''}`}
        description="Perbarui nama toko/gudang, kode cabang, alamat lengkap, nomor telepon, atau status operasional."
      >
        <form onSubmit={handleUpdateStore} className="space-y-4">
          <Input
            label="Nama Cabang / Toko / Gudang"
            placeholder="Misal: BB Parfum Toko 1 - Kendal Kota"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />

          <Input
            label="Kode Lokasi (Unik)"
            placeholder="Misal: STORE-KDL-01"
            value={editCode}
            onChange={(e) => setEditCode(e.target.value.toUpperCase())}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Tipe Lokasi</label>
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value as StoreType)}
              className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="STORE">STORE (Toko Retail POS)</option>
              <option value="WAREHOUSE">WAREHOUSE (Gudang Distribusi)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Alamat Lengkap</label>
            <textarea
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="Jl. Raya Utama No. XX, Kecamatan, Kabupaten Kendal"
              rows={3}
              className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              required
            />
          </div>

          <Input
            label="Nomor Telepon / WhatsApp Cabang"
            placeholder="0812-XXXX-XXXX"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Status Operasional</label>
            <select
              value={editIsActive ? 'ACTIVE' : 'INACTIVE'}
              onChange={(e) => setEditIsActive(e.target.value === 'ACTIVE')}
              className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="ACTIVE">Aktif Beroperasi</option>
              <option value="INACTIVE">Nonaktif Sementara</option>
            </select>
          </div>

          {/* Pengaturan Struk Cetak Khusus Cabang Ini */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <p className="text-xs font-bold text-[#E5C365]">
              Pengaturan Tampilan Struk Kasir Cabang Ini:
            </p>
            <Input
              label="Judul Header Struk"
              placeholder="BB PARFUM PREMIUM"
              value={editReceiptHeader}
              onChange={(e) => setEditReceiptHeader(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Pesan / Catatan Bawah Struk (Footer Struk)
              </label>
              <textarea
                value={editReceiptFooter}
                onChange={(e) => setEditReceiptFooter(e.target.value)}
                placeholder="Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian retur resmi."
                rows={2}
                className="w-full bg-[#162036] border border-[#1E293B] rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Live Preview Header & Footer Struk */}
            <div className="p-3 rounded-xl bg-white text-black font-mono text-[10px] leading-tight space-y-2 border border-slate-700">
              <div className="text-center border-b border-dashed border-gray-400 pb-1.5">
                <p className="font-bold text-xs">{editReceiptHeader || 'BB PARFUM PREMIUM'}</p>
                <p className="text-gray-700">{editName || 'Nama Cabang'}</p>
                <p className="text-[9px] text-gray-600">{editAddress || 'Alamat Cabang'}</p>
                <p className="text-[9px] text-gray-600">Telp: {editPhone || '-'}</p>
              </div>
              <div className="text-center text-[9px] text-gray-600 pt-0.5">
                <p className="font-bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
                <p>{editReceiptFooter || 'Barang yang sudah dibeli tidak dapat ditukar.'}</p>
              </div>
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
              disabled={editSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={editSubmitting}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
