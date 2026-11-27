import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import {
  authenticateAndRequireRole,
  resolveEffectiveStoreId,
  requireOpenShiftForCashier,
  AuthorizationError,
  StoreAccessError,
  ShiftClosedError,
} from '@/lib/auth/guards';

export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    const effectiveStoreId = resolveEffectiveStoreId(authUser);

    if (!effectiveStoreId) {
      return NextResponse.json(
        { error: 'Kasir belum terhubung ke cabang toko resmi manapun.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { items, payment, idempotency_key, member_id, notes, cash_session_id, points_to_redeem, perfume_tier } = body;

    if (!idempotency_key || !idempotency_key.trim()) {
      return NextResponse.json(
        { error: 'Idempotency key wajib disertakan untuk mencegah transaksi ganda.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Keranjang belanja tidak boleh kosong.' },
        { status: 400 }
      );
    }

    if (!payment || !payment.payment_method) {
      return NextResponse.json(
        { error: 'Metode pembayaran wajib dipilih.' },
        { status: 400 }
      );
    }

    // Safeguard Shift: Kasir wajib membuka shift sebelum melakukan transaksi POS
    const activeShift = await requireOpenShiftForCashier(authUser, effectiveStoreId);

    // Safeguard Operasional: Pastikan POS tidak sedang terkunci akibat pengajuan setor kas atau void pending
    const lockStatus = await db.checkStorePosLockStatus(effectiveStoreId);
    if (lockStatus.is_locked) {
      return NextResponse.json(
        {
          error: `TRANSAKSI POS DIKUNCI: ${lockStatus.reason}`,
          lock_status: lockStatus,
        },
        { status: 403 }
      );
    }

    // Eksekusi transaksi atomik via repository
    const sale = await db.processSaleCheckout({
      store_id: effectiveStoreId, // Kunci ke cabang resmi user kasir
      cashier_id: authUser.id,
      cash_session_id: activeShift?.id || cash_session_id || undefined,
      member_id: member_id || undefined,
      idempotency_key: idempotency_key.trim(),
      items,
      payment,
      points_to_redeem: points_to_redeem ? Number(points_to_redeem) : undefined,
      perfume_tier: perfume_tier || undefined,
      notes,
    });

    return NextResponse.json({
      success: true,
      sale,
    }, { status: 201 });
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
    return NextResponse.json(
      { error: error.message || 'Gagal memproses transaksi checkout POS.' },
      { status: 400 }
    );
  }
}
