import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import {
  authenticateAndRequireRole,
  requireOpenShiftForCashier,
  AuthorizationError,
  StoreAccessError,
  ShiftClosedError,
} from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  try {
    await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || undefined;

    const members = await db.getMembers(search);
    return NextResponse.json({ members });
  } catch (error: any) {
    if (
      error instanceof AuthorizationError ||
      error instanceof StoreAccessError ||
      error instanceof ShiftClosedError
    ) {
      return NextResponse.json(
        { error: error.message, shift_required: error instanceof ShiftClosedError },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message || 'Gagal memuat data member.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    await requireOpenShiftForCashier(authUser);
    const body = await request.json();
    const { name, phone, email, tier, member_code, registered_by } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama member wajib diisi.' }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'Nomor telepon/WhatsApp member wajib diisi.' }, { status: 400 });
    }

    const member = await db.createMember({
      name,
      phone,
      email,
      tier: tier || 'SILVER',
      member_code: member_code || null,
      registered_by: registered_by || null,
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error: any) {
    if (
      error instanceof AuthorizationError ||
      error instanceof StoreAccessError ||
      error instanceof ShiftClosedError
    ) {
      return NextResponse.json(
        { error: error.message, shift_required: error instanceof ShiftClosedError },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message || 'Gagal mendaftarkan member.' }, { status: 400 });
  }
}
