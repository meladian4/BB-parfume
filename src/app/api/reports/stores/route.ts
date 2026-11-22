import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const searchParams = request.nextUrl.searchParams;
    const storeId = searchParams.get('store_id') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const summaries = await db.getStoreTransactionSummaries({
      storeId,
      startDate,
      endDate,
      includeRecentSales: false,
    });

    return NextResponse.json({
      success: true,
      summaries,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat rangkuman transaksi toko.' },
      { status: 500 }
    );
  }
}
