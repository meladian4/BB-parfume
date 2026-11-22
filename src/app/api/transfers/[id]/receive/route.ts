import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const receivedBy = body.received_by || 'Kasir / Petugas Toko';
    const receivingNotes = body.receiving_notes || body.remarks || body.notes || '';

    const updated = await repository.receiveStockTransfer(params.id, receivedBy, receivingNotes);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menerima mutasi di cabang.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
