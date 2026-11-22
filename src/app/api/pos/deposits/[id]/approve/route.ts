import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await authenticateAndRequireRole(['SUPER_ADMIN']);
    const approverName = authUser.full_name || authUser.email || 'Super Admin (Bpk. Ahmad)';

    const deposit = await db.approveCashDeposit(params.id, approverName);

    return NextResponse.json({
      success: true,
      deposit,
      message: `Setoran kas cabang ${deposit.store_name} sebesar Rp ${deposit.amount.toLocaleString('id-ID')} telah disetujui dan kas perusahaan telah diperbarui.`,
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || 'Gagal menyetujui setoran kas.' },
      { status: 400 }
    );
  }
}
