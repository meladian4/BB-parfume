import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.user_role && body.user_role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang memproses keputusan retur mutasi.' },
        { status: 403 }
      );
    }

    const rejectedBy = body.rejected_by || 'Super Admin Kendal (Owner)';
    const adminNotes = body.admin_notes || body.reason || '';

    const updated = await repository.rejectTransferReturn(params.id, rejectedBy, adminNotes);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengembalikan status pengiriman ke kasir.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
