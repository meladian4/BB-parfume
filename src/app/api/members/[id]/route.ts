import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    const member = await db.getMemberById(params.id);
    if (!member) {
      return NextResponse.json({ error: 'Member tidak ditemukan.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Gagal mengambil data member.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const body = await request.json();
    const { name, phone, email, tier, is_active, member_code, registered_by } = body;

    const updated = await db.updateMember(params.id, {
      name,
      phone,
      email,
      tier,
      is_active,
      member_code,
      registered_by,
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Gagal memperbarui data member.' }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    await db.deleteMember(params.id);
    return NextResponse.json({ success: true, message: 'Member berhasil dihapus.' });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Gagal menghapus member.' }, { status: 400 });
  }
}
