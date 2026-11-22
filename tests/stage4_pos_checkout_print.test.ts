// ============================================================================
// STAGE 4 ACCEPTANCE TEST: POS, CHECKOUT, STOK CEGAH MINUS, IDEMPOTENSI, SESI KASIR
// BB Parfum Premium Management System
// ============================================================================

import { db } from '../src/lib/db/repository';

async function runStage4Tests() {
  console.log('--- STARTING STAGE 4 ACCEPTANCE TESTS ---');
  db._resetForTesting();

  // Ambil store Toko 1 Kendal Kota dan Kasir Toko Kendal Kota
  const storeKendal = (await db.getStores()).find((s) => s.code === 'STORE-KDL-01')!;
  const cashierKendal = (await db.getUserProfiles()).find((u) => u.email === 'kasir.kendal@bbparfum.id')!;
  const products = await db.getProducts();
  const prodA = products[0]; // e.g. BBP-SIG-KDL-50
  const prodB = products[1];

  console.log(`[SETUP] Store: ${storeKendal.name} (${storeKendal.code})`);
  console.log(`[SETUP] Cashier: ${cashierKendal.full_name}`);

  // 1. TEST BUKA SESI KASIR
  console.log('\n[TEST 1] Buka Sesi Kasir Baru dengan Modal Awal Rp 300.000');
  const session = await db.openCashSession({
    store_id: storeKendal.id,
    cashier_id: cashierKendal.id,
    opening_cash: 300000,
    notes: 'Shift Pagi Pembukaan Toko Kendal Kota',
  });
  if (session.status !== 'OPEN' || session.opening_cash !== 300000) {
    throw new Error('Test 1 Gagal: Sesi kasir tidak terbuka sesuai nilai modal awal.');
  }
  console.log(`✓ Sesi kasir berhasil dibuka (ID: ${session.id}, Modal Awal: Rp ${session.opening_cash})`);

  // 2. CEK PENCEGAHAN BUKA SESI GANDA (SAAT MASIH OPEN)
  console.log('\n[TEST 2] Pencegahan Buka Sesi Kasir Ganda');
  try {
    await db.openCashSession({
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      opening_cash: 500000,
    });
    throw new Error('Test 2 Gagal: Seharusnya menolak pembukaan sesi saat sesi sebelumnya masih aktif.');
  } catch (err: any) {
    if (!err.message.includes('sudah memiliki sesi kasir aktif')) {
      throw err;
    }
    console.log(`✓ Berhasil dicegah: ${err.message}`);
  }

  // Cek saldo stok toko sebelum penjualan
  const balanceBeforeA = await db.getInventoryBalance(storeKendal.id, prodA.id);
  const balanceBeforeB = await db.getInventoryBalance(storeKendal.id, prodB.id);
  const initialQtyA = balanceBeforeA?.quantity || 0;
  const initialCostA = balanceBeforeA?.moving_avg_cost || 0;
  console.log(`[STOK AWAL] ${prodA.name}: ${initialQtyA} pcs @ HPP Rp ${initialCostA}`);

  // 3. TEST CHECKOUT POS SUKSES & SNAPSHOT HARGA + HPP
  console.log('\n[TEST 3] Checkout POS Berhasil dengan Potong Stok Atomik & Snapshot');
  const idempotencyKey1 = `pos-kdl-tx-001-${Date.now()}`;
  const sale1 = await db.processSaleCheckout({
    store_id: storeKendal.id,
    cashier_id: cashierKendal.id,
    cash_session_id: session.id,
    idempotency_key: idempotencyKey1,
    items: [
      { product_id: prodA.id, quantity: 2, discount_amount: 10000 },
      { product_id: prodB.id, quantity: 1, discount_amount: 0 },
    ],
    payment: {
      payment_method: 'CASH',
      amount: 700000,
    },
    notes: 'Pelanggan Walk-in Retail',
  });

  const expectedSubtotal = prodA.base_price * 2 + prodB.base_price * 1;
  const expectedFinal = expectedSubtotal - 10000;
  const expectedChange = 700000 - expectedFinal;

  if (sale1.final_amount !== expectedFinal) {
    throw new Error(`Test 3 Gagal: Final amount tidak sesuai. Dapat ${sale1.final_amount}, Harusnya ${expectedFinal}`);
  }
  if (!sale1.payments || sale1.payments[0].change_amount !== expectedChange) {
    throw new Error(`Test 3 Gagal: Kembalian tidak sesuai. Dapat ${sale1.payments?.[0].change_amount}, Harusnya ${expectedChange}`);
  }

  // Verifikasi Snapshot HPP dan Harga Jual pada Sale Item
  const itemA = sale1.items?.find((it) => it.product_id === prodA.id);
  if (!itemA || itemA.unit_price !== prodA.base_price || itemA.unit_cost !== initialCostA) {
    throw new Error('Test 3 Gagal: Snapshot harga jual atau snapshot HPP tidak akurat pada item.');
  }

  // Verifikasi Stok Berkurang Tepat 2 pcs
  const balanceAfterA = await db.getInventoryBalance(storeKendal.id, prodA.id);
  if (balanceAfterA?.quantity !== initialQtyA - 2) {
    throw new Error(`Test 3 Gagal: Stok tidak berkurang 2 pcs. Sisa: ${balanceAfterA?.quantity}, Harusnya: ${initialQtyA - 2}`);
  }
  console.log(`✓ Penjualan sukses ${sale1.invoice_number} (Final: Rp ${sale1.final_amount}, Kembalian: Rp ${expectedChange})`);
  console.log(`✓ Stok '${prodA.name}' terpotong akurat dari ${initialQtyA} -> ${balanceAfterA.quantity}`);
  console.log(`✓ Snapshot HPP tercatat akurat: Rp ${itemA.unit_cost}`);

  // 4. TEST IDEMPOTENCY KEY: CEGAH TRANSAKSI GANDA
  console.log('\n[TEST 4] Mekanisme Idempotensi: Request Ulang dengan Key Sama Tidak Mengurangi Stok Lagi');
  const duplicateSale = await db.processSaleCheckout({
    store_id: storeKendal.id,
    cashier_id: cashierKendal.id,
    cash_session_id: session.id,
    idempotency_key: idempotencyKey1, // Key sama persis
    items: [
      { product_id: prodA.id, quantity: 2, discount_amount: 10000 },
      { product_id: prodB.id, quantity: 1, discount_amount: 0 },
    ],
    payment: {
      payment_method: 'CASH',
      amount: 700000,
    },
  });

  if (duplicateSale.id !== sale1.id || duplicateSale.invoice_number !== sale1.invoice_number) {
    throw new Error('Test 4 Gagal: Transaksi dengan idempotency key sama menghasilkan record baru.');
  }
  const balanceAfterDup = await db.getInventoryBalance(storeKendal.id, prodA.id);
  if (balanceAfterDup?.quantity !== initialQtyA - 2) {
    throw new Error('Test 4 Gagal: Stok terpotong ganda pada request idempotent!');
  }
  console.log('✓ Idempotensi terbukti bekerja: mengembalikan invoice transaksi sebelumnya tanpa memotong stok lagi.');

  // 5. TEST PENCEGAHAN STOK MINUS (STRICT ANTI-NEGATIVE STOCK)
  console.log('\n[TEST 5] Pencegahan Stok Minus Saat Kuantitas Melebihi Ketersediaan Cabang');
  const availableNow = balanceAfterDup.quantity;
  try {
    await db.processSaleCheckout({
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      cash_session_id: session.id,
      idempotency_key: `pos-fail-stock-${Date.now()}`,
      items: [
        { product_id: prodA.id, quantity: availableNow + 10 }, // melebihi stok
      ],
      payment: {
        payment_method: 'CASH',
        amount: 5000000,
      },
    });
    throw new Error('Test 5 Gagal: Transaksi berhasil padahal stok tidak cukup.');
  } catch (err: any) {
    if (!err.message.includes('Stok tidak mencukupi')) {
      throw err;
    }
    console.log(`✓ Transaksi stok minus berhasil dicegah: "${err.message}"`);
  }

  // 6. TEST PEMBAYARAN TUNAI KURANG
  console.log('\n[TEST 6] Validasi Pembayaran Uang Tunai Kurang');
  try {
    await db.processSaleCheckout({
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      cash_session_id: session.id,
      idempotency_key: `pos-fail-cash-${Date.now()}`,
      items: [
        { product_id: prodA.id, quantity: 1 },
      ],
      payment: {
        payment_method: 'CASH',
        amount: 1000, // Uang tunai kurang
      },
    });
    throw new Error('Test 6 Gagal: Pembayaran uang kurang berhasil diproses.');
  } catch (err: any) {
    if (!err.message.includes('kurang dari total belanja')) {
      throw err;
    }
    console.log(`✓ Validasi uang tunai kurang berhasil dicegah: "${err.message}"`);
  }

  // 7. TEST TUTUP SESI KASIR & REKONSILIASI KAS
  console.log('\n[TEST 7] Tutup Sesi Kasir & Rekonsiliasi Uang Laci Kasir');
  // Expected cash = Opening Cash (300.000) + Total Cash Sales (sale1.final_amount)
  const currentSessionState = await db.getCurrentCashSession(storeKendal.id, cashierKendal.id);
  const expectedLaci = 300000 + sale1.final_amount;
  if (currentSessionState?.expected_cash !== expectedLaci) {
    throw new Error(`Test 7 Gagal: Expected cash laci kasir tidak sesuai. Harusnya ${expectedLaci}, dapat ${currentSessionState?.expected_cash}`);
  }

  // Kasir menghitung fisik kas di laci: uang pas sama persis
  const closedSession = await db.closeCashSession(session.id, {
    actual_cash: expectedLaci,
    notes: 'Uang fisik pas sesuai catatan sistem',
  });

  if (closedSession.status !== 'CLOSED' || closedSession.difference !== 0) {
    throw new Error('Test 7 Gagal: Status sesi kasir tidak CLOSED atau difference tidak 0.');
  }
  console.log(`✓ Sesi kasir berhasil ditutup (Expected: Rp ${closedSession.expected_cash}, Aktual: Rp ${closedSession.actual_cash}, Selisih: Rp ${closedSession.difference})`);

  console.log('\n--- ALL STAGE 4 ACCEPTANCE TESTS PASSED (100%) ---');
}

runStage4Tests().catch((err) => {
  console.error('\n❌ STAGE 4 TEST FAILED:', err);
  process.exit(1);
});
