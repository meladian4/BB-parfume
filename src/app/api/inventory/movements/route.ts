import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    const movements = await repository.getStockMovements({
      storeId,
      productId,
      limit,
    });

    return NextResponse.json({ success: true, data: movements });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat kartu pergerakan stok.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
