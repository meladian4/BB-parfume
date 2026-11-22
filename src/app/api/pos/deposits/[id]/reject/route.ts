import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await authenticateAndRequireRole(['SUPER_ADMIN']);
    const rejecterName = authUser.full_name || authUser.email || 'Super Admin (Bpk. Ahmad)';

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || 'Ditolak oleh Super Admin.';

    const deposit = await db.rejectCashDeposit(params.id, rejecterName, reason);

    return NextResponse.json({
      success: true,
      deposit,
      message: `Setoran kas cabang ${deposit.store_name} telah ditolak. Saldo kas toko tidak terpotong.`,
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || 'Gagal menolak setoran kas.' },
      { status: 400 }
    );
  }
}
