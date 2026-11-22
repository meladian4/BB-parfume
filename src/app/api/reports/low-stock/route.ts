import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN', 'LOGISTICS']);
    const searchParams = request.nextUrl.searchParams;
    const store_id = searchParams.get('store_id') || undefined;

    const alerts = await db.getLowStockAlerts(store_id);

    return NextResponse.json({
      success: true,
      alerts,
      count: alerts.length,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data peringatan stok.' },
      { status: 500 }
    );
  }
}
