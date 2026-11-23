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
        { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang menyetujui retur mutasi ke gudang.' },
        { status: 403 }
      );
    }

    const approvedBy = body.approved_by || 'Super Admin Kendal (Owner)';
    const adminNotes = body.admin_notes || body.notes || '';

    const updated = await repository.approveTransferReturn(params.id, approvedBy, adminNotes);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyetujui pengembalian barang ke gudang.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
