import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST() {
  try {
    await repository.wipeAllData();
    return NextResponse.json({
      success: true,
      message: 'Seluruh data produk, stok persediaan, transaksi penjualan, dan mutasi berhasil dibersihkan ke titik 0. Sistem siap digunakan dari awal.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mereset data sistem.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
