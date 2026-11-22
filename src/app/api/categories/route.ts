import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function GET() {
  try {
    const categories = await repository.getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat kategori.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
