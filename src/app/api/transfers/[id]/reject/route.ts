import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));

    // Anti-fraud security rule: Only Super Admin is allowed to reject transfers
    if (body.user_role && body.user_role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang menolak mutasi stok (Anti-Fraud).' },
        { status: 403 }
      );
    }

    const reason = body.reason?.trim() || 'Ditolak oleh Super Admin';
    const rejectedBy = body.rejected_by || 'Owner / Super Admin';

    const updated = await repository.rejectStockTransfer(params.id, reason, rejectedBy);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menolak mutasi stok.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
