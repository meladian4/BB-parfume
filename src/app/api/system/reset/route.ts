import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function POST() {
  try {
    // Wajib autentikasi Super Admin
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    await repository.wipeAllData();
    return NextResponse.json({
      success: true,
      message: 'Seluruh data produk, stok persediaan, transaksi penjualan, dan mutasi berhasil dibersihkan ke titik 0. Sistem siap digunakan dari awal.',
    });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : 'Gagal mereset data sistem.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
