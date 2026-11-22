import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, resolveEffectiveStoreId, AuthorizationError, StoreAccessError } from '@/lib/auth/guards';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: saleId } = await params;
    const authUser = await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    const body = await request.json();
    const { action, reason, notes } = body;

    const existingSale = await db.getSaleById(saleId);
    if (!existingSale) {
      return NextResponse.json(
        { error: `Transaksi dengan ID '${saleId}' tidak ditemukan.` },
        { status: 404 }
      );
    }

    // Role cashier check
    if (authUser.role === 'CASHIER') {
      const effectiveStoreId = resolveEffectiveStoreId(authUser);
      if (effectiveStoreId && existingSale.store_id !== effectiveStoreId) {
        return NextResponse.json(
          { error: 'Anda tidak berhak mengakses transaksi dari cabang lain.' },
          { status: 403 }
        );
      }
    }

    if (action === 'REQUEST_VOID') {
      if (!reason || !reason.trim()) {
        return NextResponse.json(
          { error: 'Alasan pembatalan (void) transaksi wajib diisi.' },
          { status: 400 }
        );
      }

      const updatedSale = await db.requestSaleVoid(saleId, authUser.id, reason.trim());
      return NextResponse.json({
        success: true,
        message: 'Pengajuan pembatalan (void) transaksi berhasil dikirim ke Super Admin.',
        sale: updatedSale,
      });
    }

    if (action === 'APPROVE_VOID') {
      if (authUser.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Hanya akun Super Admin / Owner yang memiliki wewenang menyetujui pembatalan transaksi.' },
          { status: 403 }
        );
      }

      const updatedSale = await db.approveSaleVoid(saleId, authUser.id, notes?.trim());
      return NextResponse.json({
        success: true,
        message: `Pembatalan transaksi ${existingSale.invoice_number} disetujui. Stok toko dan saldo kas telah berhasil di-rollback.`,
        sale: updatedSale,
      });
    }

    if (action === 'REJECT_VOID') {
      if (authUser.role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Hanya akun Super Admin / Owner yang memiliki wewenang menolak pengajuan pembatalan transaksi.' },
          { status: 403 }
        );
      }

      const updatedSale = await db.rejectSaleVoid(saleId, authUser.id, notes?.trim());
      return NextResponse.json({
        success: true,
        message: `Pengajuan pembatalan transaksi ${existingSale.invoice_number} ditolak.`,
        sale: updatedSale,
      });
    }

    return NextResponse.json({ error: 'Aksi pembatalan tidak valid.' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof StoreAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Gagal memproses pembatalan transaksi.' }, { status: 500 });
  }
}

