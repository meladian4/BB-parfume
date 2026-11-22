import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, resolveEffectiveStoreId, AuthorizationError, StoreAccessError } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
  try {
    const authUser = await authenticateAndRequireRole(['CASHIER', 'SUPER_ADMIN']);
    const storeId = resolveEffectiveStoreId(authUser);

    if (!storeId) {
      return NextResponse.json(
        { error: 'Kasir belum terhubung ke cabang toko resmi manapun.' },
        { status: 400 }
      );
    }

    const session = await db.getCurrentCashSession(storeId, authUser.id);
    const availableCash = await db.getStoreAvailableCash(storeId);
    return NextResponse.json({ session, available_cash: availableCash });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof StoreAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Gagal memuat sesi kasir.' }, { status: 500 });
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
    const { action } = body;

    if (action === 'OPEN') {
      const openingCash = Number(body.opening_cash);
      if (isNaN(openingCash) || openingCash < 0) {
        return NextResponse.json(
          { error: 'Modal awal kasir harus berupa angka positif.' },
          { status: 400 }
        );
      }

      const session = await db.openCashSession({
        store_id: storeId,
        cashier_id: authUser.id,
        opening_cash: openingCash,
        notes: body.notes || 'Pembukaan Shift Kasir',
      });

      return NextResponse.json({ success: true, session }, { status: 201 });
    }

    if (action === 'CLOSE') {
      let targetSessionId = body.session_id;
      if (!targetSessionId) {
        // Otomatis fallback cari shift aktif toko jika tidak dikirim dari front-end
        const activeSess = await db.getCurrentCashSession(storeId, authUser.id);
        if (activeSess) {
          targetSessionId = activeSess.id;
        } else {
          return NextResponse.json({ error: 'Session ID wajib disertakan atau tidak ada shift aktif.' }, { status: 400 });
        }
      }

      const actual = Number(body.actual_cash);
      if (isNaN(actual) || actual < 0) {
        return NextResponse.json(
          { error: 'Uang fisik aktual harus berupa angka positif.' },
          { status: 400 }
        );
      }

      const session = await db.closeCashSession(targetSessionId, {
        actual_cash: actual,
        notes: body.notes || 'Tutup Shift Kasir',
      });

      return NextResponse.json({ success: true, session });
    }

    return NextResponse.json(
      { error: "Aksi tidak dikenal. Gunakan 'OPEN' atau 'CLOSE'." },
      { status: 400 }
    );
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof StoreAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || 'Gagal memproses sesi kasir.' }, { status: 400 });
  }
}
