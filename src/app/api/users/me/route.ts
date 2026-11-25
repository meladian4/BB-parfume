import { NextResponse } from 'next/server';
import { getSessionUser, AuthorizationError } from '@/lib/auth/guards';

export async function GET() {
  try {
    const user = await getSessionUser('CASHIER');
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, user: null, error: error.message },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat profil aktif.' },
      { status: 500 }
    );
  }
}
