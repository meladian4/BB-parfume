import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const receivedBy = body.received_by || 'Kepala Logistik Kendal';
    const items = Array.isArray(body.items) ? body.items : undefined;

    const updated = await repository.receivePurchase(params.id, receivedBy, items);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memproses penerimaan PO.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
