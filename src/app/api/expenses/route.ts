import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';
import { ExpenseCategory } from '@/types/domain';

export async function GET(request: NextRequest) {
  try {
    const authUser = await authenticateAndRequireRole(['SUPER_ADMIN', 'CASHIER']);
    const searchParams = request.nextUrl.searchParams;
    const isCashierReq = searchParams.get('source') === 'cashier';
    let store_id = searchParams.get('store_id') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const category = (searchParams.get('category') as ExpenseCategory) || undefined;

    // Jika dipanggil oleh kasir, kunci mutlak ke assigned_store_id kasir (kasir toko lain tidak bisa melihat toko lainnya)
    if (authUser.role === 'CASHIER') {
      if (!authUser.assigned_store_id) {
        return NextResponse.json({ success: true, expenses: [] });
      }
      store_id = authUser.assigned_store_id;
    }

    const expenses = await db.getExpenses({
      store_id,
      startDate,
      endDate,
      category,
    });

    return NextResponse.json({ success: true, expenses });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data pengeluaran.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticateAndRequireRole(['SUPER_ADMIN', 'CASHIER']);
    const body = await request.json();
    let { store_id, expense_date, category, description, amount, receipt_url, created_by } = body;

    // Jika kasir, kunci mutlak ke assigned_store_id kasir (tidak boleh mencatat ke cabang lain)
    if (authUser.role === 'CASHIER') {
      if (!authUser.assigned_store_id) {
        return NextResponse.json(
          { success: false, error: 'Akses ditolak: Akun kasir belum ditugaskan ke cabang toko manapun.' },
          { status: 403 }
        );
      }
      store_id = authUser.assigned_store_id;
    }

    if (!store_id || !expense_date || !category || !description || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Cabang toko, tanggal, kategori, keterangan, dan nominal biaya wajib diisi.' },
        { status: 400 }
      );
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Nominal biaya operasional harus bernilai positif lebih dari 0.' },
        { status: 400 }
      );
    }

    const expense = await db.createExpense({
      store_id,
      expense_date,
      category,
      description,
      amount: numAmount,
      receipt_url: receipt_url || null,
      created_by: created_by || authUser.id,
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mencatat pengeluaran operasional.' },
      { status: 400 }
    );
  }
}
