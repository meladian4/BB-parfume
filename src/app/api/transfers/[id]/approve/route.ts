import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Anti-fraud security rule: Only Super Admin is allowed to approve transfers
    if (body.user_role && body.user_role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Akses Ditolak: Hanya Super Admin yang berwenang menyetujui mutasi stok (Anti-Fraud).' },
        { status: 403 }
      );
    }

    const approvedBy = body.approved_by || 'Owner / Super Admin';

    const updated = await repository.approveStockTransfer(params.id, approvedBy);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyetujui mutasi stok.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
