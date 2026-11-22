import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function GET() {
  try {
    const stores = await repository.getStores();
    return NextResponse.json({ success: true, stores, data: stores });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat toko.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, type, address, phone } = body;

    if (!code || !name || !type || !address) {
      return NextResponse.json(
        { success: false, error: 'Semua field wajib (code, name, type, address) harus diisi.' },
        { status: 400 }
      );
    }

    if (!['WAREHOUSE', 'STORE'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipe lokasi harus WAREHOUSE atau STORE.' },
        { status: 400 }
      );
    }

    const created = await repository.createStore({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type,
      address: address.trim(),
      phone: phone?.trim() || null,
      is_active: true,
    });

    await repository.createAuditLog({
      action: 'STORE_CREATE_API',
      entity_name: 'stores',
      entity_id: created.id,
      new_data: { code, name, type, address },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat toko.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
