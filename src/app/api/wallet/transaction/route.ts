import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { transaction_type, amount, category, reference_id, description, operator } = body;

    if (!transaction_type) {
      return NextResponse.json({ success: false, error: 'Jenis transaksi kas wajib diisi.' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount === 0) {
      return NextResponse.json({ success: false, error: 'Nominal transaksi kas tidak valid.' }, { status: 400 });
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ success: false, error: 'Keterangan transaksi wajib diisi.' }, { status: 400 });
    }

    const tx = await repository.recordCompanyWalletTransaction({
      transaction_type,
      amount: numAmount,
      category,
      reference_id,
      description: description.trim(),
      operator: operator || 'Super Admin (Owner)',
    });

    return NextResponse.json({ success: true, data: tx });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mencatat transaksi kas perusahaan.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
