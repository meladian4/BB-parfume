import { NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET() {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const data = await db.getSuperAdminPendingNotifications();
    return NextResponse.json({ success: true, ...data });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    const message =
      error instanceof Error ? error.message : 'Gagal memuat notifikasi persetujuan.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
