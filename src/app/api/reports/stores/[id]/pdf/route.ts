import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import {
  authenticateAndRequireRole,
  validateStoreAccess,
  AuthorizationError,
  StoreAccessError,
} from '@/lib/auth/guards';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await authenticateAndRequireRole(['SUPER_ADMIN', 'CASHIER']);
    const storeId = params.id;
    validateStoreAccess(authUser, storeId);

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const sessionId = searchParams.get('sessionId') || undefined;
    const forceDownload = searchParams.get('download') === '1';

    const summaries = await db.getStoreTransactionSummaries({
      storeId,
      startDate,
      endDate,
      includeRecentSales: true,
    });

    if (summaries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Toko cabang tidak ditemukan.' },
        { status: 404 }
      );
    }

    const summary = summaries[0];

    const storeExpenses = await db.getExpenses({
      store_id: storeId,
      startDate,
      endDate,
    });
    const totalExpenses = storeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    let shiftSummary: Record<string, any> | undefined;
    if (sessionId) {
      const storeSessions = await db.getCashSessions({ store_id: storeId });
      const matched = storeSessions.find((s) => s.id === sessionId);
      if (matched) {
        shiftSummary = {
          id: matched.id,
          status: matched.status,
          cashier_name: matched.cashier?.full_name || authUser.full_name || 'Kasir Cabang',
          opened_at: matched.opened_at,
          closed_at: matched.closed_at || null,
          opening_cash: matched.opening_cash || 0,
          total_sales_cash: matched.total_sales_cash || 0,
          total_expenses: matched.total_expenses || 0,
          total_deposits: matched.total_deposits || 0,
          expected_cash: matched.expected_cash || 0,
          actual_cash: matched.actual_cash ?? matched.closing_cash ?? 0,
          difference: matched.difference ?? matched.cash_difference ?? 0,
          notes: matched.notes || '',
        };
      }
    }

    const formatIdDate = (ymd: string) => {
      const parts = ymd.split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : ymd;
    };

    const isSingleDay = Boolean(startDate && endDate && startDate === endDate);
    const periodLabel = isSingleDay
      ? `Laporan Harian (${formatIdDate(startDate!)})`
      : startDate && endDate
      ? `${formatIdDate(startDate)} s/d ${formatIdDate(endDate)}`
      : startDate
      ? `Mulai ${formatIdDate(startDate)}`
      : endDate
      ? `Sampai ${formatIdDate(endDate)}`
      : 'Semua Riwayat Transaksi';

    const pdfPayload = {
      ...summary,
      period_label: periodLabel,
      shift_summary: shiftSummary,
      expenses: storeExpenses,
      total_expenses: totalExpenses,
    };

    // Jalankan skrip Python ReportLab
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_store_report_pdf.py');
    const tempOutFile = path.join(os.tmpdir(), `report-${storeId}-${Date.now()}.pdf`);

    await new Promise<void>((resolve, reject) => {
      const child = spawn('python3', [scriptPath, tempOutFile]);

      child.stdin.write(JSON.stringify(pdfPayload));
      child.stdin.end();

      let errOutput = '';
      child.stderr.on('data', (data) => {
        errOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(errOutput || `Python script exited with code ${code}`));
        }
      });
    });

    const fileBuffer = fs.readFileSync(tempOutFile);
    fs.unlinkSync(tempOutFile);

    const safeFilename = isSingleDay
      ? `Laporan_Harian_${summary.store_code || 'Toko'}_${startDate}.pdf`
      : `Laporan_Transaksi_${summary.store_code || 'Toko'}_${Date.now()}.pdf`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${forceDownload ? 'attachment' : 'inline'}; filename="${safeFilename}"`,
      },
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError || error instanceof StoreAccessError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan PDF laporan transaksi toko.' },
      { status: 500 }
    );
  }
}
