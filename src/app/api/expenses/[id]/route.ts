import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID pengeluaran wajib disertakan.' }, { status: 400 });
    }

    await db.deleteExpense(id);
    return NextResponse.json({ success: true, message: 'Pengeluaran operasional berhasil dihapus.' });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus pengeluaran.' },
      { status: 400 }
    );
  }
}
