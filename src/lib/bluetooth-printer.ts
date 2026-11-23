/**
 * Direct Bluetooth Thermal Printer Driver (Web Bluetooth API + ESC/POS)
 * Dirancang khusus untuk printer kasir thermal 58mm / 80mm (Bluetooth BLE / SPP)
 * Kompatibel dengan printer thermal RPP02N, Panda, Iware, VSC, Mini POS, Goulden, dll.
 */

import { formatProductUnit } from '@/lib/formatters';

// Konstanta Command ESC/POS
const ESC = 0x1b;
const GS = 0x1d;

const CMD_INIT = [ESC, 0x40]; // Initialize printer
const CMD_ALIGN_LEFT = [ESC, 0x61, 0x00];
const CMD_ALIGN_CENTER = [ESC, 0x61, 0x01];
const CMD_ALIGN_RIGHT = [ESC, 0x61, 0x02];
const CMD_BOLD_ON = [ESC, 0x45, 0x01];
const CMD_BOLD_OFF = [ESC, 0x45, 0x00];
const CMD_DOUBLE_ON = [GS, 0x21, 0x11]; // Double height & width
const CMD_DOUBLE_OFF = [GS, 0x21, 0x00];
const CMD_FEED_3 = [ESC, 0x64, 0x03]; // Feed 3 lines
const CMD_CUT_PAPER = [GS, 0x56, 0x42, 0x00]; // Cut paper

// Service UUID Bluetooth Thermal Printer Umum
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000af30-0000-1000-8000-00805f9b34fb',
  '0000e0ff-0000-1000-8000-00805f9b34fb',
];

export interface BluetoothPrinterDevice {
  device: any;
  characteristic: any;
  name: string;
}

let activePrinter: BluetoothPrinterDevice | null = null;

/**
 * Cek apakah browser mendukung Web Bluetooth API
 */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Hubungkan ke printer thermal bluetooth di sekitar
 */
export async function connectBluetoothPrinter(): Promise<BluetoothPrinterDevice> {
  if (!isWebBluetoothSupported()) {
    throw new Error(
      'Browser ini belum mendukung Web Bluetooth secara langsung. Gunakan Chrome, Edge, atau browser Android.'
    );
  }

  // Request Bluetooth Device
  const device = await (navigator as any).bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_SERVICES,
  });

  if (!device) {
    throw new Error('Tidak ada printer yang dipilih.');
  }

  const server = await device.gatt.connect();

  // Cari service printer yang cocok
  let primaryService = null;
  for (const sId of PRINTER_SERVICES) {
    try {
      primaryService = await server.getPrimaryService(sId);
      if (primaryService) break;
    } catch {
      // lanjut service berikutnya
    }
  }

  if (!primaryService) {
    // Coba ambil service pertama yang tersedia
    const services = await server.getPrimaryServices();
    if (services && services.length > 0) {
      primaryService = services[0];
    } else {
      throw new Error('Gagal menemukan GATT Service printer Bluetooth pada perangkat ini.');
    }
  }

  // Cari characteristic yang mendukung WRITE atau WRITE_WITHOUT_RESPONSE
  const characteristics = await primaryService.getCharacteristics();
  let writeChar = characteristics.find(
    (c: any) => c.properties.write || c.properties.writeWithoutResponse
  );

  if (!writeChar && characteristics.length > 0) {
    writeChar = characteristics[0];
  }

  if (!writeChar) {
    throw new Error('Gagal menemukan characteristic penulisan data ke printer.');
  }

  activePrinter = {
    device,
    characteristic: writeChar,
    name: device.name || 'Printer Thermal BT',
  };

  return activePrinter;
}

/**
 * Format teks baris 2 kolom rata kiri-kanan (misal: "Item   x1  Rp 25.000")
 */
function formatTwoColumnLine(left: string, right: string, maxChars: number): string {
  const leftTrimmed = left.trim();
  const rightTrimmed = right.trim();
  const spacesNeeded = maxChars - (leftTrimmed.length + rightTrimmed.length);

  if (spacesNeeded <= 0) {
    // Jika terlalu panjang, potong kiri sedikit
    const allowedLeft = Math.max(5, maxChars - rightTrimmed.length - 1);
    return leftTrimmed.substring(0, allowedLeft) + ' ' + rightTrimmed;
  }

  return leftTrimmed + ' '.repeat(spacesNeeded) + rightTrimmed;
}

/**
 * Format teks garis putus-putus pembatas
 */
function makeDivider(maxChars: number, char = '-'): string {
  return char.repeat(maxChars);
}

/**
 * Buat array byte ESC/POS lengkap dari data transaksi
 */
export function buildReceiptEscPosData(
  sale: any,
  store: any,
  cashierName: string,
  paperSize: '58mm' | '80mm' = '58mm'
): Uint8Array {
  const maxChars = paperSize === '58mm' ? 32 : 48;
  const encoder = new TextEncoder();
  const bytes: number[] = [];

  const addBytes = (...cmd: number[]) => bytes.push(...cmd);
  const addText = (text: string) => {
    const encoded = encoder.encode(text + '\n');
    for (let i = 0; i < encoded.length; i++) {
      bytes.push(encoded[i]);
    }
  };

  // 1. Reset / Inisialisasi
  addBytes(...CMD_INIT);

  // 2. Header Toko (Rata Tengah)
  addBytes(...CMD_ALIGN_CENTER);
  addBytes(...CMD_BOLD_ON);
  addBytes(...CMD_DOUBLE_ON);
  addText('BB PARFUM');
  addBytes(...CMD_DOUBLE_OFF);
  addText('PREMIUM FRAGRANCE');
  addBytes(...CMD_BOLD_OFF);

  const storeName = sale?.store?.name || store?.name || 'Cabang Kendal';
  const storeAddress = sale?.store?.address || store?.address || 'Kendal, Jawa Tengah';
  const storePhone = sale?.store?.phone || store?.phone || '-';

  addText(storeName);
  addText(storeAddress);
  if (storePhone && storePhone !== '-') {
    addText(`Telp: ${storePhone}`);
  }

  // 3. Garis Pembatas
  addText(makeDivider(maxChars, '-'));

  // 4. Metadata Struk (Rata Kiri)
  addBytes(...CMD_ALIGN_LEFT);
  addText(formatTwoColumnLine('No. Faktur:', sale?.invoice_number || 'TRX-000', maxChars));
  
  const dateStr = sale?.created_at
    ? new Date(sale.created_at).toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '-';
  addText(formatTwoColumnLine('Waktu:', dateStr, maxChars));
  addText(formatTwoColumnLine('Kasir:', cashierName, maxChars));

  if (sale?.member?.name) {
    addText(formatTwoColumnLine('Member:', sale.member.name, maxChars));
  }

  // 5. Garis Pembatas Item
  addText(makeDivider(maxChars, '-'));

  // Header Kolom Item
  addBytes(...CMD_BOLD_ON);
  addText(formatTwoColumnLine('Ingredients', 'Takaran', maxChars));
  addBytes(...CMD_BOLD_OFF);
  addText(makeDivider(maxChars, '.'));

  // Daftar Barang / Takaran
  if (Array.isArray(sale?.items)) {
    for (const it of sale.items) {
      const p = it.product;
      const unit = formatProductUnit(p);
      const name = p?.name || 'Produk';
      const qtyStr = `${it.quantity} ${unit}`;
      addText(formatTwoColumnLine(name, qtyStr, maxChars));
    }
  }

  // 6. Garis Pembatas Pembayaran
  addText(makeDivider(maxChars, '-'));

  // 7. Rangkuman Pembayaran
  if ((sale?.discount_amount || 0) > 0) {
    addText(
      formatTwoColumnLine(
        'Diskon:',
        `-Rp ${(sale.discount_amount || 0).toLocaleString('id-ID')}`,
        maxChars
      )
    );
  }

  addBytes(...CMD_BOLD_ON);
  addText(
    formatTwoColumnLine(
      'TOTAL:',
      `Rp ${(sale?.final_amount || 0).toLocaleString('id-ID')}`,
      maxChars
    )
  );
  addBytes(...CMD_BOLD_OFF);

  const payment = sale?.payments?.[0];
  const method = payment?.payment_method || 'CASH';
  const payAmount = payment?.amount || sale?.final_amount || 0;
  addText(formatTwoColumnLine(`Bayar (${method}):`, `Rp ${payAmount.toLocaleString('id-ID')}`, maxChars));

  if (method === 'CASH' && payment?.change_amount) {
    addText(
      formatTwoColumnLine(
        'Kembali:',
        `Rp ${(payment.change_amount || 0).toLocaleString('id-ID')}`,
        maxChars
      )
    );
  }

  if (sale?.points_earned && sale.points_earned > 0) {
    addText(formatTwoColumnLine('Reward Poin:', `+${sale.points_earned.toLocaleString('id-ID')} Poin`, maxChars));
  }

  // 8. Footer Struk (Rata Tengah)
  addBytes(...CMD_ALIGN_CENTER);
  addText(makeDivider(maxChars, '-'));
  addText('TERIMA KASIH ATAS KUNJUNGAN ANDA');
  addText('Barang yang dibeli tidak dapat ditukar');
  addText('kecuali ada perjanjian retur.');
  addText('BB Parfum POS System');

  // Feed 3 baris dan potong kertas
  addBytes(...CMD_FEED_3);
  addBytes(...CMD_CUT_PAPER);

  return new Uint8Array(bytes);
}

/**
 * Kirim data struk langsung ke Printer Bluetooth (dengan pembagian chunk aman)
 */
export async function sendEscPosToPrinter(
  printer: BluetoothPrinterDevice,
  data: Uint8Array
): Promise<void> {
  const CHUNK_SIZE = 120; // Ukuran paket transmisi BLE yang stabil
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + CHUNK_SIZE);
    if (printer.characteristic.writeValueWithoutResponse) {
      await printer.characteristic.writeValueWithoutResponse(chunk);
    } else {
      await printer.characteristic.writeValue(chunk);
    }
    // Delay mikro 20ms agar buffer printer tidak meluap
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/**
 * Fungsi Pintas Utama: Cetak Langsung ke Bluetooth
 */
export async function printReceiptViaBluetooth(
  sale: any,
  store: any,
  cashierName: string,
  paperSize: '58mm' | '80mm' = '58mm'
): Promise<{ success: boolean; printerName: string }> {
  let printer = activePrinter;

  // Jika belum ada printer aktif yang terhubung, minta pairing sekarang
  if (!printer || !printer.device?.gatt?.connected) {
    printer = await connectBluetoothPrinter();
  }

  const rawBytes = buildReceiptEscPosData(sale, store, cashierName, paperSize);
  await sendEscPosToPrinter(printer, rawBytes);

  return {
    success: true,
    printerName: printer.name,
  };
}
