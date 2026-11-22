import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const approvedBy = body.approved_by || 'Super Admin Kendal (Owner)';
    const directReceive = body.direct_receive === true;
    const items = Array.isArray(body.items) ? body.items : undefined;

    let updated;
    if (directReceive) {
      updated = await repository.approveAndReceivePurchase(params.id, approvedBy, items);
    } else {
      updated = await repository.approvePurchase(params.id, approvedBy);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyetujui permintaan belanja.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

