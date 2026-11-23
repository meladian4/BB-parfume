import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || body.return_reason || '';
    const requestedBy = body.requested_by || body.rejected_by || 'Kasir Toko Cabang';

    const updated = await repository.requestTransferReturn(params.id, reason, requestedBy);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengajukan penolakan penerimaan barang.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
