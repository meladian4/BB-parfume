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
    const authUser = await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN', 'LOGISTICS']);
    await requireOpenShiftForCashier(authUser);

    const body = await request.json().catch(() => ({}));
    const receivedBy = body.received_by || authUser.full_name || 'Kasir / Petugas Toko';
    const receivingNotes = body.receiving_notes || body.remarks || body.notes || '';

    const updated = await repository.receiveStockTransfer(params.id, receivedBy, receivingNotes);
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
    const message = error instanceof Error ? error.message : 'Gagal menerima mutasi di cabang.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
