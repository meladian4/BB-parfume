import { NextResponse } from 'next/server';
import { repository } from '@/lib/db/repository';
import { WalletTransactionType } from '@/types/domain';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') as WalletTransactionType) || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const [balance, summary, transactions] = await Promise.all([
      repository.getCompanyWalletBalance(),
      repository.getCompanyWalletSummary(),
      repository.getCompanyWalletTransactions({ type, limit }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        balance,
        summary,
        transactions,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil data dompet kas perusahaan.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
