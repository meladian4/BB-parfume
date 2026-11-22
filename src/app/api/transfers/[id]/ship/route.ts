import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const shippedBy = body.shipped_by || 'Staf Ekspedisi Gudang';

    const updated = await repository.shipStockTransfer(params.id, shippedBy);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim mutasi stok.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
