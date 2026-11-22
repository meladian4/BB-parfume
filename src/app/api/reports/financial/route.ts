import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const searchParams = request.nextUrl.searchParams;
    const store_id = searchParams.get('store_id') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const report = await db.getFinancialReport({
      store_id,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      report,
      metadata: {
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
        generated_at: new Date().toISOString(),
        disclaimer:
          'Laporan ini adalah Laporan Operasional Ritel Internal (Penjualan Bersih, HPP Snapshot Transaksi, dan Biaya Operasional Toko), bukan Laporan Akuntansi Keuangan Lengkap (General Ledger / Neraca Saldo / Pajak Korporat).',
      },
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan laporan keuangan.' },
      { status: 500 }
    );
  }
}
