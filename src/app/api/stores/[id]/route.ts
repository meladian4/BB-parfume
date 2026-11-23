import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const store = await db.getStoreById(id);
    if (!store) {
      return NextResponse.json(
        { success: false, error: `Toko dengan ID '${id}' tidak ditemukan.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, store, data: store });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data toko.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const { id } = params;
    const body = await request.json();
    const { code, name, type, address, phone, is_active, receipt_header, receipt_footer } = body;

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama cabang / toko wajib diisi.' },
        { status: 400 }
      );
    }
    if (address !== undefined && !String(address).trim()) {
      return NextResponse.json(
        { success: false, error: 'Alamat lengkap toko wajib diisi.' },
        { status: 400 }
      );
    }

    const updated = await db.updateStore(id, {
      code: code !== undefined ? String(code).trim().toUpperCase() : undefined,
      name: name !== undefined ? String(name).trim() : undefined,
      type: type !== undefined ? type : undefined,
      address: address !== undefined ? String(address).trim() : undefined,
      phone: phone !== undefined ? String(phone).trim() || undefined : undefined,
      receipt_header: receipt_header !== undefined ? String(receipt_header).trim() || null : undefined,
      receipt_footer: receipt_footer !== undefined ? String(receipt_footer).trim() || null : undefined,
      is_active: is_active !== undefined ? Boolean(is_active) : undefined,
    });

    return NextResponse.json({
      success: true,
      store: updated,
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui data toko.' },
      { status: 400 }
    );
  }
}
