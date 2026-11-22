import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, resolveEffectiveStoreId, AuthorizationError, StoreAccessError } from '@/lib/auth/guards';
import { CashDepositStatus, CashDepositMethod } from '@/types/domain';

export async function GET(request: NextRequest) {
  try {
    const authUser = await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    const effectiveStoreId = resolveEffectiveStoreId(authUser);

    const { searchParams } = new URL(request.url);
    const requestedStoreId = searchParams.get('store_id');
    const status = searchParams.get('status') as CashDepositStatus | null;

    // Jika Kasir, hanya boleh melihat toko miliknya
    const targetStoreId =
      authUser.role === 'SUPER_ADMIN' ? (requestedStoreId || undefined) : (effectiveStoreId || undefined);

    const deposits = await db.getCashDeposits({
      store_id: targetStoreId,
      status: status || undefined,
    });

    let availableCash = 0;
    if (targetStoreId) {
      availableCash = await db.getStoreAvailableCash(targetStoreId);
    }

    return NextResponse.json({
      success: true,
      deposits,
      available_cash: availableCash,
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof StoreAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Gagal memuat data setoran kas.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    const storeId = resolveEffectiveStoreId(authUser);

    if (!storeId) {
      return NextResponse.json(
        { error: 'Kasir belum terhubung ke cabang toko resmi manapun.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { amount, deposit_method, bank_name, notes } = body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Jumlah setor tunai harus berupa angka lebih besar dari Rp 0.' },
        { status: 400 }
      );
    }

    const validMethods: CashDepositMethod[] = ['CASH_HANDOVER', 'BANK_TRANSFER'];
    const method: CashDepositMethod = validMethods.includes(deposit_method)
      ? deposit_method
      : 'CASH_HANDOVER';

    const deposit = await db.createCashDeposit({
      store_id: storeId,
      cashier_id: authUser.id,
      cashier_name: authUser.full_name || authUser.email || 'Kasir',
      amount: parsedAmount,
      deposit_method: method,
      bank_name: method === 'BANK_TRANSFER' ? bank_name || 'BCA / Mandiri / BRI Pusat' : null,
      notes: notes || null,
    });

    const newAvailableCash = await db.getStoreAvailableCash(storeId);

    return NextResponse.json({
      success: true,
      deposit,
      available_cash: newAvailableCash,
      message: 'Pengajuan setor tunai berhasil dikirim. Menunggu persetujuan Super Admin.',
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof StoreAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Gagal mengajukan setor kas.' }, { status: 400 });
  }
}
