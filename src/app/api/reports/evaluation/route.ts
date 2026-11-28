import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const sp = request.nextUrl.searchParams;
    const todayWib = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
      new Date()
    );

    const primaryStart = sp.get('primaryStart') || `${todayWib.slice(0, 8)}01`;
    const primaryEnd = sp.get('primaryEnd') || todayWib;
    const compareStart = sp.get('compareStart') || primaryStart;
    const compareEnd = sp.get('compareEnd') || primaryEnd;

    const evaluation = await db.getEvaluationReport({
      primaryStart,
      primaryEnd,
      compareStart,
      compareEnd,
    });

    return NextResponse.json({ success: true, evaluation });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    const message =
      error instanceof Error ? error.message : 'Gagal memuat laporan evaluasi pertumbuhan.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
