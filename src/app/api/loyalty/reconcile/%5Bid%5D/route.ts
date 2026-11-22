import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const reconciliation = await db.reconcileMemberPoints(params.id);
    return NextResponse.json({ success: true, reconciliation });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal merekonsiliasi poin member.' },
      { status: 500 }
    );
  }
}
