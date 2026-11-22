import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN', 'CASHIER']);
    const storeId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

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
    const periodLabel = startDate && endDate
      ? `${startDate} s/d ${endDate}`
      : startDate
      ? `Mulai ${startDate}`
      : endDate
      ? `Sampai ${endDate}`
      : 'Semua Riwayat Transaksi';

    const pdfPayload = {
      ...summary,
      period_label: periodLabel,
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

    const safeFilename = `Laporan_Transaksi_${summary.store_code || 'Toko'}_${Date.now()}.pdf`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeFilename}"`,
      },
    });
  } catch (error: any) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghasilkan PDF laporan transaksi toko.' },
      { status: 500 }
    );
  }
}
