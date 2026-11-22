'use client';

import React, { useState, useEffect } from 'react';
import { Store, StoreType } from '@/types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Store as StoreIcon, Warehouse, Plus, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { SettingsSubNav } from '@/components/superadmin/SettingsSubNav';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<StoreType>('STORE');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Sub Menu Pengaturan Sistem */}
      <SettingsSubNav activeTab="stores" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <StoreIcon className="w-5 h-5 text-[#D4AF37]" />
            <span>Manajemen Toko Cabang & Gudang Kendal</span>
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
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
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
                  <Badge variant={isWarehouse ? 'gold' : 'emerald'} size="sm">
                    {isWarehouse ? 'Gudang Pusat' : 'Toko Cabang'}
                  </Badge>
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
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Aktif
                    </span>
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
    </div>
  );
}
