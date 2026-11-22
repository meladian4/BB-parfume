'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Sale } from '@/types/domain';
import { formatIDR, formatDateTimeJakarta, formatProductUnit } from '@/lib/formatters';
import { Printer, ArrowLeft, Bluetooth } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { printReceiptViaBluetooth } from '@/lib/bluetooth-printer';

function ReceiptPrintContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = params?.id as string;
  const paperSize = searchParams.get('size') || '58mm';

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/pos/sales/${id}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Gagal memuat struk transaksi.');
        }
        const data = await res.json();
        setSale(data.sale);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSale();
    }
  }, [id]);

  const [btPrinting, setBtPrinting] = useState(false);
  const [btPrinterName, setBtPrinterName] = useState<string | null>(null);
  const [btStatusMsg, setBtStatusMsg] = useState<string | null>(null);

  const handlePrintBluetooth = async () => {
    if (!sale) return;
    try {
      setBtPrinting(true);
      setBtStatusMsg('Sedang menyambungkan ke printer bluetooth...');
      const cashierName = sale.cashier?.full_name || 'Kasir';
      const res = await printReceiptViaBluetooth(
        sale,
        sale.store,
        cashierName,
        is58mm ? '58mm' : '80mm'
      );
      setBtPrinterName(res.printerName);
      setBtStatusMsg(`✓ Berhasil mencetak ke ${res.printerName}`);
      setTimeout(() => setBtStatusMsg(null), 5000);
    } catch (err: any) {
      console.error('Bluetooth Print Error:', err);
      setBtStatusMsg(`Gagal: ${err.message || 'Printer bluetooth tidak terhubung'}`);
    } finally {
      setBtPrinting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center font-mono">
        Memuat struk penjualan...
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-slate-900 text-rose-400 flex flex-col items-center justify-center p-4">
        <p className="font-semibold mb-4">{error || 'Data transaksi tidak ditemukan.'}</p>
        <Button variant="secondary" onClick={() => router.push('/cashier')}>
          Kembali ke Terminal Kasir
        </Button>
      </div>
    );
  }

  const is58mm = paperSize === '58mm';
  const widthClass = is58mm ? 'w-[58mm] max-w-[58mm]' : 'w-[80mm] max-w-[80mm]';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 print:p-0 print:bg-white">
      {/* Screen Controls (Hidden during print) */}
      <div className="print:hidden w-full max-w-md mb-6 space-y-2">
        <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
          <Button variant="ghost" size="sm" onClick={() => router.push('/cashier')}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Terminal Kasir
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrintBluetooth}
              disabled={btPrinting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              <Bluetooth className={`w-4 h-4 mr-1.5 ${btPrinting ? 'animate-spin' : ''}`} />
              <span>{btPrinting ? 'Mencetak...' : 'Cetak Bluetooth'}</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1.5" />
              Browser
            </Button>
          </div>
        </div>

        {btStatusMsg && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${
              btStatusMsg.startsWith('✓')
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
            }`}
          >
            <span>{btStatusMsg}</span>
            <button
              type="button"
              onClick={() => setBtStatusMsg(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* THERMAL RECEIPT SLIP */}
      <div
        className={`bg-white text-black font-mono text-[11px] leading-tight p-3 sm:p-4 shadow-2xl print:shadow-none print:w-full print:m-0 ${widthClass}`}
        style={{
          boxSizing: 'border-box',
        }}
      >
        {/* Branch Header */}
        <div className="text-center pb-2 border-b border-dashed border-gray-400">
          <div className="flex justify-center mb-1">
            <img src="/logo-black.png" alt="BB Parfum" className="w-10 h-10 object-contain" />
          </div>
          <p className="font-bold text-sm tracking-wider">BB PARFUM PREMIUM</p>
          <p className="text-[10px] text-gray-800">{sale.store?.name}</p>
          <p className="text-[9px] text-gray-600">{sale.store?.address}</p>
          <p className="text-[9px] text-gray-600">Telp: {sale.store?.phone}</p>
        </div>

        {/* Metadata */}
        <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
          <div className="flex justify-between">
            <span>No:</span>
            <span className="font-bold">{sale.invoice_number}</span>
          </div>
          <div className="flex justify-between">
            <span>Tgl:</span>
            <span>{formatDateTimeJakarta(sale.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir:</span>
            <span>{sale.cashier?.full_name}</span>
          </div>
          {sale.member && (
            <div className="flex justify-between font-bold pt-1 border-t border-dotted border-gray-300 text-gray-900">
              <span>Member: {sale.member.name}</span>
            </div>
          )}
        </div>

        {/* Items List (Ingredients & Takaran, Harga Satuan Disembunyikan) */}
        <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-gray-700 pb-1 border-b border-dotted border-gray-300 uppercase tracking-wider">
            <span>Ingredients</span>
            <span>Takaran</span>
          </div>
          {sale.items?.map((item) => {
            const unit = formatProductUnit(item.product);
            return (
              <div key={item.id} className="flex justify-between text-[10px]">
                <span className="font-semibold truncate max-w-[70%]">{item.product?.name}</span>
                <span className="text-gray-800 font-medium">{item.quantity} {unit}</span>
              </div>
            );
          })}
        </div>

        {/* Totals & Payment (Hanya Menampilkan Total Harga Pilihan) */}
        <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Total Diskon:</span>
              <span>-{formatIDR(sale.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs pt-0.5">
            <span>TOTAL PEMBAYARAN:</span>
            <span>{formatIDR(sale.final_amount)}</span>
          </div>
          <div className="flex justify-between pt-0.5">
            <span>Metode ({sale.payments?.[0]?.payment_method || 'CASH'}):</span>
            <span>{formatIDR(sale.payments?.[0]?.amount || sale.final_amount)}</span>
          </div>
          {sale.payments?.[0]?.payment_method === 'CASH' && (
            <div className="flex justify-between font-bold">
              <span>Kembali:</span>
              <span>{formatIDR(sale.payments?.[0]?.change_amount || 0)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-3 text-[9px] text-gray-600 space-y-0.5">
          <p className="font-bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</p>
          <p>Barang yang sudah dibeli tidak dapat ditukar</p>
          <p>kecuali sesuai ketentuan retur resmi.</p>
          <p className="pt-1 text-[8px] text-gray-400">BB Parfum Premium Management</p>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center font-mono">
          Memuat pratinjau struk...
        </div>
      }
    >
      <ReceiptPrintContent />
    </Suspense>
  );
}
