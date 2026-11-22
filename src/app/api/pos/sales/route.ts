import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, resolveEffectiveStoreId, AuthorizationError, StoreAccessError } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  try {
    const authUser = await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    const effectiveStoreId = resolveEffectiveStoreId(authUser);

    // Kasir hanya boleh melihat riwayat toko miliknya
    const { searchParams } = new URL(request.url);
    const storeParam = authUser.role === 'SUPER_ADMIN' ? searchParams.get('store_id') || undefined : effectiveStoreId || undefined;
    const limit = Number(searchParams.get('limit')) || 200;

    const sales = await db.getSales({
      store_id: storeParam,
      limit,
    });

    return NextResponse.json({ sales });
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof StoreAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Gagal memuat riwayat transaksi.' }, { status: 500 });
  }
}
