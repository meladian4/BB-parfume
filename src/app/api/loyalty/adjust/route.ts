import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticateAndRequireRole(['SUPER_ADMIN']);
    const body = await request.json();
    const { member_id, points_delta, notes } = body;

    if (!member_id) {
      return NextResponse.json({ success: false, error: 'Member ID wajib diisi.' }, { status: 400 });
    }

    const delta = Math.round(Number(points_delta));
    if (isNaN(delta) || delta === 0) {
      return NextResponse.json(
        { success: false, error: 'Nominal penyesuaian poin harus berupa angka tidak nol.' },
        { status: 400 }
      );
    }

    if (!notes || !notes.trim()) {
      return NextResponse.json(
        { success: false, error: 'Alasan penyesuaian poin wajib disertakan untuk keperluan audit.' },
        { status: 400 }
      );
    }

    const transaction = await db.recordPointTransaction({
      member_id,
      transaction_type: 'ADJUSTMENT',
      points_delta: delta,
      notes: notes.trim(),
      created_by: authUser.id,
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyesuaikan poin member.' },
      { status: 400 }
    );
  }
}
