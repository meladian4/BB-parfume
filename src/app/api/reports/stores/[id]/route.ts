import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN', 'CASHIER']);
    const storeId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const summaries = await db.getStoreTransactionSummaries({
      storeId,
      startDate,
      endDate,
      includeRecentSales: true,
    });

    if (summaries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Toko cabang tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      summary: summaries[0],
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat detail transaksi toko.' },
      { status: 500 }
    );
  }
}
