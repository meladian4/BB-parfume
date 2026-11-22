import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN', 'CASHIER']);
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id') || undefined;
    const limit = Number(searchParams.get('limit')) || 100;

    const transactions = await db.getPointTransactions({
      member_id: memberId,
      limit,
    });

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat mutasi poin.' },
      { status: 500 }
    );
  }
}
