import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/repository';
import { authenticateAndRequireRole, AuthorizationError } from '@/lib/auth/guards';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function GET(request: NextRequest) {
  try {
    await authenticateAndRequireRole(['SUPER_ADMIN']);
    const sp = request.nextUrl.searchParams;
    const todayWib = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
      new Date()
    );

    const primaryStart = sp.get('primaryStart') || `${todayWib.slice(0, 8)}01`;
    const primaryEnd = sp.get('primaryEnd') || todayWib;
    const compareStart = sp.get('compareStart') || primaryStart;
    const compareEnd = sp.get('compareEnd') || primaryEnd;
    const primaryLabel = sp.get('primaryLabel') || `${primaryStart} s/d ${primaryEnd}`;
    const compareLabel = sp.get('compareLabel') || `${compareStart} s/d ${compareEnd}`;
    const presetTitle = sp.get('presetTitle') || 'Evaluasi Pertumbuhan Penjualan (MoM)';
    const sortBy = sp.get('sortBy') || 'PROFIT_GROWTH_DESC';

    const evaluation = await db.getEvaluationReport({
      primaryStart,
      primaryEnd,
      compareStart,
      compareEnd,
    });

    const sortedBranches = [...evaluation.branches].sort((a, b) => {
      if (sortBy === 'PROFIT_GROWTH_ASC') {
        return a.net_profit.pct - b.net_profit.pct || a.net_profit.diff - b.net_profit.diff;
      }
      if (sortBy === 'TRX_GROWTH_DESC') {
        return b.transactions.pct - a.transactions.pct || b.transactions.diff - a.transactions.diff;
      }
      return b.net_profit.pct - a.net_profit.pct || b.net_profit.diff - a.net_profit.diff;
    });

    const pdfPayload = {
      ...evaluation,
      branches: sortedBranches,
      preset_title: presetTitle,
      primary_label: primaryLabel,
      compare_label: compareLabel,
      sort_by: sortBy,
    };

    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_evaluation_report_pdf.py');
    const tempOutFile = path.join(os.tmpdir(), `evaluasi-bb-${Date.now()}.pdf`);

    await new Promise<void>((resolve, reject) => {
      const child = spawn('python3', [scriptPath, tempOutFile]);
      child.stdin.write(JSON.stringify(pdfPayload));
      child.stdin.end();

      let errOutput = '';
      child.stderr.on('data', (data) => {
        errOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(errOutput || `Python script exited with code ${code}`));
      });
    });

    const fileBuffer = fs.readFileSync(tempOutFile);
    fs.unlinkSync(tempOutFile);

    const safeFilename = `Evaluasi_Pertumbuhan_BB_Parfum_${primaryStart}_${primaryEnd}.pdf`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeFilename}"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    const message =
      error instanceof Error ? error.message : 'Gagal menghasilkan PDF evaluasi pertumbuhan.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
