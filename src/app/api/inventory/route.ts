import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || undefined;

    const balances = await repository.getInventoryBalances(storeId);
    return NextResponse.json({ success: true, data: balances });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat saldo inventaris.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { store_id, product_id, physical_quantity, notes, user_id } = body;

    if (!store_id || !product_id || physical_quantity === undefined || !notes) {
      return NextResponse.json(
        {
          success: false,
          error: 'Field store_id, product_id, physical_quantity, dan alasan notes wajib diisi.',
        },
        { status: 400 }
      );
    }

    const qtyNum = Number(physical_quantity);
    if (isNaN(qtyNum) || qtyNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Kuantitas fisik harus berupa angka valid >= 0.' },
        { status: 400 }
      );
    }

    const result = await repository.createStockAdjustment({
      store_id,
      product_id,
      physical_quantity: qtyNum,
      notes: notes.trim(),
      created_by: user_id || null,
    });

    await repository.createAuditLog({
      action: 'STOCK_ADJUSTMENT_API',
      entity_name: 'inventory_balances',
      entity_id: result.balance.id,
      new_data: {
        store_id,
        product_id,
        new_quantity: result.balance.quantity,
        delta: result.movement.quantity_delta,
        notes,
      },
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal melakukan penyesuaian stok.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
