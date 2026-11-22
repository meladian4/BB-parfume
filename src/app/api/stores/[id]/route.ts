import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';

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
