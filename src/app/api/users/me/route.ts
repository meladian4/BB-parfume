import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getSessionUser('CASHIER');
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat profil aktif.' },
      { status: 500 }
    );
  }
}
