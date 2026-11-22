'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoyaltyConfig, UserProfile } from '@/types/domain';
import { formatIDR } from '@/lib/formatters';
import { Settings, Award, ShieldCheck, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';
import { SettingsSubNav } from '@/components/superadmin/SettingsSubNav';

export default function SuperAdminSettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    spend_per_point: '30000',
    point_value_idr: '1500',
    min_redeem_points: '1',
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [clearingStock, setClearingStock] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const [wipingAll, setWipingAll] = useState(false);
  const [wipeSuccess, setWipeSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, cRes] = await Promise.all([
        fetch('/api/users/me').then((r) => r.json()),
        fetch('/api/loyalty/config').then((r) => r.json()),
      ]);
      setUser(uRes.user);
      if (cRes.config) {
        setFormData({
          spend_per_point: String(cRes.config.spend_per_point ?? 30000),
          point_value_idr: String(cRes.config.point_value_idr ?? 1500),
          min_redeem_points: String(cRes.config.min_redeem_points ?? 1),
          is_active: Boolean(cRes.config.is_active),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessMessage(null);
      const payload: LoyaltyConfig = {
        spend_per_point: Number(formData.spend_per_point) || 30000,
        point_value_idr: Number(formData.point_value_idr) || 0,
        min_redeem_points: Number(formData.min_redeem_points) || 1,
        is_active: formData.is_active,
      };
      const res = await fetch('/api/loyalty/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMessage('Konfigurasi program loyalitas berhasil diperbarui & dicatat ke audit log.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan konfigurasi.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearStock = async () => {
    const confirmed = window.confirm(
      'PERINGATAN RESMI SUPERADMIN:\nApakah Anda yakin ingin MENGOSONGKAN SELURUH STOK di Gudang Pusat & semua Toko Cabang menjadi 0 pcs?\n\nTindakan ini akan mereset sisa stok fisik seluruh produk di semua lokasi.'
    );
    if (!confirmed) return;

    try {
      setClearingStock(true);
      setClearSuccess(null);
      const res = await fetch('/api/inventory/clear', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClearSuccess(data.message || 'Seluruh stok berhasil dikosongkan (0 pcs).');
      setTimeout(() => setClearSuccess(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Gagal mengosongkan stok persediaan.');
    } finally {
      setClearingStock(false);
    }
  };

  const handleWipeAll = async () => {
    const confirmed = window.confirm(
      'PERINGATAN TINGKAT TINGGI RESMI OWNER:\nApakah Anda yakin ingin MENGHAPUS SEMUA DATA & MEMULAI DARI AWAL?\n\nTindakan ini akan:\n- Menghapus seluruh katalog produk parfum & bibit (0 item)\n- Menghapus seluruh saldo persediaan stok di gudang & cabang (0 stok)\n- Menghapus seluruh riwayat mutasi transfer antar-cabang\n- Menghapus seluruh riwayat PO pembelian supplier\n- Menghapus seluruh riwayat transaksi penjualan kasir & sesi laci kas\n- Menghapus seluruh biaya operasional OPEX\n\nStruktur 4 lokasi (1 Gudang + 3 Toko) dan akun pengguna resmi (Super Admin, Logistik, Kasir) tetap dipertahankan.'
    );
    if (!confirmed) return;

    try {
      setWipingAll(true);
      setWipeSuccess(null);
      const res = await fetch('/api/system/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setWipeSuccess(data.message || 'Seluruh data berhasil dibersihkan ke titik 0. Sistem siap dimulai dari awal.');
      setTimeout(() => setWipeSuccess(null), 8000);
    } catch (err: any) {
      alert(err.message || 'Gagal mereset data sistem.');
    } finally {
      setWipingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Menu Pengaturan Sistem */}
      <SettingsSubNav activeTab="settings" />

      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#D4AF37]" />
          Pengaturan Sistem & Kebijakan Poin Loyalitas
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Aturan perhitungan poin EARN, nilai penukaran REDEEM, dan limitasi penukaran transaksi kasir
        </p>
      </div>

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-[#1E293B] bg-[#0A0E1A] p-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="border-b border-[#1E293B] pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Parameter Program Loyalitas</h2>
                      <p className="text-[11px] text-slate-400">Aturan resmi yang berlaku serentak di 3 cabang toko Kendal</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37] bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs font-semibold text-slate-300">
                      {formData.is_active ? 'Program Aktif' : 'Program Dinonaktifkan'}
                    </span>
                  </label>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-200 block mb-1">
                      Nilai Belanja Memenuhi Syarat per 1 Poin (IDR)
                    </label>
                    <p className="text-[11px] text-slate-400 mb-1.5">
                      Setiap pelanggan belanja kelipatan nominal ini (Rp 30.000), sistem otomatis memberikan 1 poin (EARN senilai Rp 1.500).
                    </p>
                    <Input
                      type="number"
                      value={formData.spend_per_point}
                      onChange={(e) => setFormData({ ...formData, spend_per_point: e.target.value })}
                      placeholder="30000"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Kebijakan: Rp 30.000 per transaksi &amp; kelipatannya (Belanja Rp 60.000 = 2 poin, Rp 90.000 = 3 poin)
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-200 block mb-1">
                      Nilai Diskon Rupiah per 1 Poin Penukaran (IDR)
                    </label>
                    <p className="text-[11px] text-slate-400 mb-1.5">
                      Nilai potongan harga tunai yang didapat pelanggan untuk setiap 1 poin yang ditukarkan (REDEEM = Rp 1.500).
                    </p>
                    <Input
                      type="number"
                      value={formData.point_value_idr}
                      onChange={(e) => setFormData({ ...formData, point_value_idr: e.target.value })}
                      placeholder="1500"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Kebijakan: Rp 1.500 per poin (Tukar 2 poin = diskon Rp 3.000, tukar 10 poin = diskon Rp 15.000)
                    </p>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-200 block mb-1">
                      Batas Minimal Penukaran Poin Kasir (Poin)
                    </label>
                    <p className="text-[11px] text-slate-400 mb-1.5">
                      Jumlah poin minimum yang harus dimiliki pelanggan sebelum dapat ditukarkan di POS (default: 1 Poin / Rp 1.500).
                    </p>
                    <Input
                      type="number"
                      value={formData.min_redeem_points}
                      onChange={(e) => setFormData({ ...formData, min_redeem_points: e.target.value })}
                      placeholder="1"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Member dapat menukarkan poin mulai dari 1 poin (Rp 1.500 potongan langsung).
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1E293B] flex justify-end">
                  <Button variant="gold" type="submit" disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="border-[#1E293B] bg-[#0A0E1A] p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Simulasi Nilai Loyalitas Member
              </h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Simulasi Belanja Min. Kelipatan</p>
                  <p className="text-xs font-bold text-white">Belanja Rp 30.000</p>
                  <p className="text-emerald-400 font-bold">
                    Poin Diperoleh: +1 Poin (Senilai Rp 1.500)
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Simulasi Belanja 1 Botol</p>
                  <p className="text-xs font-bold text-white">Parfum 50ml ({formatIDR(185000)})</p>
                  <p className="text-emerald-400 font-bold">
                    Poin Diperoleh: +{Math.floor(185000 / (Number(formData.spend_per_point) || 30000))} Poin (+{formatIDR(Math.floor(185000 / (Number(formData.spend_per_point) || 30000)) * (Number(formData.point_value_idr) || 1500))})
                  </p>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Simulasi Penukaran 10 Poin</p>
                  <p className="text-xs font-bold text-white">10 Poin Pelanggan</p>
                  <p className="text-[#D4AF37] font-bold">
                    Potongan Belanja: {formatIDR(10 * (Number(formData.point_value_idr) || 1500))}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Kepatuhan Buku Besar
                </p>
                <p className="text-slate-400">
                  Semua perubahan rasio loyalitas tidak akan mengubah riwayat buku besar masa lampau. Seluruh data transaksi historis tersimpan aman.
                </p>
              </div>
            </Card>
          </div>

          {/* Zona Bahaya / Reset Stok */}
          <Card className="border-rose-900/40 bg-rose-950/15 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    Zona Bahaya: Reset Inventaris Seluruh Cabang
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/50 text-rose-300 border border-rose-700/50">
                      SUPER ADMIN ONLY
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Mengosongkan semua sisa stok di Gudang Distribusi Kendal dan 3 Toko Cabang menjadi <strong className="text-white">0 pcs</strong>. Cocok digunakan saat persiapan pembukaan operasional perdana atau audit fisik menyeluruh.
                  </p>
                  {clearSuccess && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{clearSuccess}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <Button
                  variant="danger"
                  type="button"
                  isLoading={clearingStock}
                  onClick={handleClearStock}
                  className="w-full md:w-auto"
                >
                  Kosongkan Semua Stok (0 pcs)
                </Button>
              </div>
            </div>
          </Card>

          {/* Zona Bahaya 2: Mulai Dari Awal (Reset Seluruh Data) */}
          <Card className="border-rose-800 bg-rose-950/25 p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    Mulai Dari Awal: Hapus Seluruh Data Operasional
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-700 text-white">
                      MASTER RESET
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Membersihkan seluruh produk (0 item), seluruh stok persediaan (0 stok), transaksi penjualan, mutasi cabang, dan PO supplier ke titik nol murni. Akun pengguna dan struktur 4 lokasi (1 Gudang + 3 Toko) tetap aman.
                  </p>
                  {wipeSuccess && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{wipeSuccess}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <Button
                  variant="danger"
                  type="button"
                  isLoading={wipingAll}
                  onClick={handleWipeAll}
                  className="w-full md:w-auto bg-rose-600 hover:bg-rose-500 text-white font-extrabold shadow-lg shadow-rose-900/40"
                >
                  Mulai Dari Awal (Reset Bersih)
                </Button>
              </div>
            </div>
          </Card>
    </div>
  );
}
