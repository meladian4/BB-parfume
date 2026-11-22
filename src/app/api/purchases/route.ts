import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId') || undefined;

    const purchases = await repository.getPurchases({ supplierId });
    return NextResponse.json({ success: true, data: purchases });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat PO pembelian.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplier_id, destination_store_id, notes, items, user_id, status } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar item barang yang diajukan wajib diisi.' },
        { status: 400 }
      );
    }

    const created = await repository.createPurchase({
      supplier_id: supplier_id || null,
      destination_store_id: destination_store_id || null,
      notes: notes?.trim() || null,
      created_by: user_id || null,
      status: status || 'PENDING_APPROVAL',
      items,
    });

    await repository.createAuditLog({
      action: 'PURCHASE_ORDER_CREATE',
      entity_name: 'purchases',
      entity_id: created.id,
      new_data: { po_number: created.po_number, total_amount: created.total_amount },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat PO pembelian.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
