import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import {
  authenticateAndRequireRole,
  requireOpenShiftForCashier,
  AuthorizationError,
  StoreAccessError,
  ShiftClosedError,
} from '@/lib/auth/guards';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    await requireOpenShiftForCashier(authUser);

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || body.return_reason || '';
    const requestedBy = body.requested_by || body.rejected_by || authUser.full_name || 'Kasir Toko Cabang';

    const updated = await repository.requestTransferReturn(params.id, reason, requestedBy);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (
      error instanceof AuthorizationError ||
      error instanceof StoreAccessError ||
      error instanceof ShiftClosedError
    ) {
      return NextResponse.json(
        { success: false, error: error.message, shift_required: error instanceof ShiftClosedError },
        { status: 403 }
      );
    }
    const message = error instanceof Error ? error.message : 'Gagal mengajukan penolakan penerimaan barang.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
