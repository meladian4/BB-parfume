import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const reason = body.reason?.trim() || 'Ditolak oleh Super Admin';
    const rejectedBy = body.rejected_by || 'Super Admin Kendal (Owner)';

    const updated = await repository.rejectPurchase(params.id, reason, rejectedBy);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menolak permintaan belanja.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

