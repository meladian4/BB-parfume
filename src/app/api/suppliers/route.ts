import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function GET() {
  try {
    const suppliers = await repository.getSuppliers();
    return NextResponse.json({ success: true, data: suppliers, suppliers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat supplier.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
