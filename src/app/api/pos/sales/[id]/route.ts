import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, resolveEffectiveStoreId, AuthorizationError, StoreAccessError } from '@/lib/auth/guards';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    const effectiveStoreId = resolveEffectiveStoreId(authUser);

    const sale = await db.getSaleById(params.id);
    if (!sale) {
      return NextResponse.json({ error: 'Invoice penjualan tidak ditemukan.' }, { status: 404 });
    }

    // Jika kasir, pastikan invoice milik cabang tokonya
    if (authUser.role === 'CASHIER' && sale.store_id !== effectiveStoreId) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki hak akses melihat transaksi dari cabang lain.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ sale });
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof StoreAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Gagal memuat detail transaksi.' }, { status: 500 });
  }
}
