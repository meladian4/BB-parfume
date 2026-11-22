import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { authenticateAndRequireRole } from '@/lib/auth/guards';

export async function POST() {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    await repository.clearAllInventoryStock();

    return NextResponse.json({
      success: true,
      message: 'Seluruh stok inventaris di semua gudang dan toko berhasil dikosongkan (0 pcs).',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengosongkan stok persediaan.' },
      { status: 500 }
    );
  }
}
