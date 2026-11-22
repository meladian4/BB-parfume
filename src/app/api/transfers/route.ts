import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { getSessionUser } from '@/lib/auth/guards';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceStoreId = searchParams.get('sourceStoreId') || undefined;
    let destinationStoreId = searchParams.get('destinationStoreId') || undefined;

    const user = await getSessionUser('CASHIER');
    if (user && user.role === 'CASHIER' && user.assigned_store_id) {
      // Kasir HANYA diizinkan memuat kiriman mutasi yang ditujukan ke tokonya sendiri
      destinationStoreId = user.assigned_store_id;
    }

    const transfers = await repository.getStockTransfers({
      sourceStoreId,
      destinationStoreId,
    });
    return NextResponse.json({ success: true, data: transfers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat mutasi stok.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source_store_id, destination_store_id, notes, items, user_id } = body;

    if (!source_store_id || !destination_store_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Field source_store_id, destination_store_id, dan items wajib diisi.' },
        { status: 400 }
      );
    }

    const created = await repository.createStockTransfer({
      source_store_id,
      destination_store_id,
      notes: notes?.trim() || null,
      created_by: user_id || null,
      status: 'PENDING_APPROVAL',
      items,
    });

    await repository.createAuditLog({
      action: 'STOCK_TRANSFER_CREATE',
      entity_name: 'stock_transfers',
      entity_id: created.id,
      new_data: { transfer_number: created.transfer_number, source_store_id, destination_store_id },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat mutasi stok.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
