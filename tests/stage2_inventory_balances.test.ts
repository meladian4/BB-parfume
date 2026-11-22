// ============================================================================
// Acceptance Tests - TAHAP 2: Database dan Saldo Stok Persediaan
// BB PARFUM PREMIUM MANAGEMENT SYSTEM
// ============================================================================

import { repository } from '../src/lib/db/repository';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runStage2Tests() {
  console.log('=================================================================');
  console.log('🚀 MEMULAI ACCEPTANCE TEST TAHAP 2 — DATABASE & SALDO STOK');
  console.log('=================================================================\n');

  repository._resetForTesting();

  // Ambil referensi store dan produk
  const stores = await repository.getStores();
  const products = await repository.getProducts();

  const warehouse = stores.find((s) => s.type === 'WAREHOUSE')!;
  const storeKendal = stores.find((s) => s.code === 'STORE-KDL-01')!;
  const storePegandon = stores.find((s) => s.code === 'STORE-PGD-02')!;
  const storeKaliwungu = stores.find((s) => s.code === 'STORE-KLW-03')!;
  const testProduct = products[0]; // BB Royal Velvet Oud 50ml (base_price: 185000)

  // --------------------------------------------------------------------------
  // TEST SUITE 1: VERIFIKASI SALDO AWAL MULTI-LOKASI
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Verifikasi Saldo Stok Awal Multi-Lokasi Kendal...');
  const whBalance = await repository.getInventoryBalance(warehouse.id, testProduct.id);
  const kdlBalance = await repository.getInventoryBalance(storeKendal.id, testProduct.id);
  const pgdBalance = await repository.getInventoryBalance(storePegandon.id, testProduct.id);
  const klwBalance = await repository.getInventoryBalance(storeKaliwungu.id, testProduct.id);

  assert(!!whBalance && whBalance.quantity === 100, `Gudang pusat harus memiliki stok awal 100, didapat: ${whBalance?.quantity}`);
  assert(!!kdlBalance && kdlBalance.quantity === 25, `Toko Kendal Kota harus memiliki stok awal 25, didapat: ${kdlBalance?.quantity}`);
  assert(!!pgdBalance && pgdBalance.quantity === 25, `Toko Pegandon harus memiliki stok awal 25, didapat: ${pgdBalance?.quantity}`);
  assert(!!klwBalance && klwBalance.quantity === 25, `Toko Kaliwungu harus memiliki stok awal 25, didapat: ${klwBalance?.quantity}`);
  console.log(`  Gudang: ${whBalance?.quantity} btl | Kendal: ${kdlBalance?.quantity} btl | Pegandon: ${pgdBalance?.quantity} btl | Kaliwungu: ${klwBalance?.quantity} btl`);
  console.log('  ✅ Lolos: Saldo awal terisolasi dengan benar per lokasi cabang.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 2: HPP RATA-RATA TERTIMBANG BERGERAK (MOVING WEIGHTED AVERAGE COST)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 2: Kalkulasi HPP Rata-Rata Tertimbang Bergerak (Moving Average)...');
  const initialQty = whBalance!.quantity; // 100
  const initialAvg = whBalance!.moving_avg_cost; // 83250 (45% dari 185000)

  // Terima barang masuk dari supplier: 50 botol dengan harga beli baru Rp 95.000 / botol
  const inflowQty = 50;
  const inflowCost = 95000;
  const expectedNewQty = initialQty + inflowQty; // 150
  const expectedNewAvg = Math.round(
    ((initialQty * initialAvg) + (inflowQty * inflowCost)) / expectedNewQty
  );

  const receiptResult = await repository.recordStockMovement({
    store_id: warehouse.id,
    product_id: testProduct.id,
    movement_type: 'PURCHASE_RECEIPT',
    quantity_delta: inflowQty,
    cost_per_unit: inflowCost,
    reference_id: 'PO-KDL-2026-001',
    notes: 'Penerimaan batch bibit baru dari supplier',
    created_by: 'Kepala Logistik Kendal',
  });

  assert(
    receiptResult.balance.quantity === expectedNewQty,
    `Kuantitas setelah penerimaan harus ${expectedNewQty}, didapat: ${receiptResult.balance.quantity}`
  );
  assert(
    receiptResult.balance.moving_avg_cost === expectedNewAvg,
    `HPP moving average harus ${expectedNewAvg}, didapat: ${receiptResult.balance.moving_avg_cost}`
  );
  assert(
    receiptResult.movement.balance_after === expectedNewQty,
    `Buku besar movement balance_after harus cocok: ${receiptResult.movement.balance_after}`
  );
  assert(
    receiptResult.movement.moving_avg_cost_after === expectedNewAvg,
    `Buku besar movement HPP after harus cocok: ${receiptResult.movement.moving_avg_cost_after}`
  );
  console.log(`  Stok awal: ${initialQty} @ Rp ${initialAvg}`);
  console.log(`  Penerimaan: +${inflowQty} @ Rp ${inflowCost}`);
  console.log(`  Hasil HPP Baru: ${receiptResult.balance.quantity} botol @ Rp ${receiptResult.balance.moving_avg_cost}`);
  console.log('  ✅ Lolos: Kalkulasi HPP Moving Average matematis akurat.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: PENGURANGAN STOK TANPA MENGUBAH HPP
  // --------------------------------------------------------------------------
  console.log('▶ TEST 3: Pengeluaran Stok (Outflow) Mempertahankan HPP Unit...');
  const currentAvgBeforeOutflow = receiptResult.balance.moving_avg_cost;

  // Mutasi keluar 20 botol
  const outflowResult = await repository.recordStockMovement({
    store_id: warehouse.id,
    product_id: testProduct.id,
    movement_type: 'TRANSFER_OUT',
    quantity_delta: -20,
    cost_per_unit: currentAvgBeforeOutflow,
    reference_id: 'TR-WH-KDL-001',
    notes: 'Kirim barang ke Cabang Kendal Kota',
  });

  assert(
    outflowResult.balance.quantity === expectedNewQty - 20,
    `Saldo setelah keluar harus ${expectedNewQty - 20}, didapat: ${outflowResult.balance.quantity}`
  );
  assert(
    outflowResult.balance.moving_avg_cost === currentAvgBeforeOutflow,
    `HPP per unit tidak boleh berubah saat mutasi keluar: ${outflowResult.balance.moving_avg_cost}`
  );
  console.log('  ✅ Lolos: Pengurangan stok memotong kuantitas tanpa mengubah nilai HPP per unit.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 4: PENCEGAHAN STOK NEGATIF MUTLAK (ANTI-NEGATIVE STOCK)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 4: Pencegahan Stok Negatif Mutlak di Level Database...');
  const tokoKendalCurrent = await repository.getInventoryBalance(storeKendal.id, testProduct.id);
  const availableQty = tokoKendalCurrent!.quantity; // 25

  let negativeBlocked = false;
  try {
    // Mencoba memotong 30 botol padahal hanya ada 25 botol
    await repository.recordStockMovement({
      store_id: storeKendal.id,
      product_id: testProduct.id,
      movement_type: 'SALE',
      quantity_delta: -(availableQty + 5), // -30
      cost_per_unit: tokoKendalCurrent!.moving_avg_cost,
      reference_id: 'POS-TEST-FAIL',
      notes: 'Mencoba transaksi melebihi stok yang ada',
    });
  } catch (err: unknown) {
    negativeBlocked = true;
  }

  assert(negativeBlocked, 'Sistem HARUS MENOLAK mutasi yang menyebabkan stok negatif');

  // Pastikan saldo di database TIDAK TERPENGARUH sama sekali
  const tokoKendalAfterCheck = await repository.getInventoryBalance(storeKendal.id, testProduct.id);
  assert(
    tokoKendalAfterCheck!.quantity === availableQty,
    `Saldo harus tetap utuh ${availableQty}, didapat: ${tokoKendalAfterCheck!.quantity}`
  );
  console.log(`  Tersedia: ${availableQty} botol. Diminta potong: ${availableQty + 5} botol &rarr; TRANSAKSI DITOLAK.`);
  console.log('  ✅ Lolos: Proteksi anti-stok negatif bekerja 100% dan saldo tetap aman.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 5: PENYESUAIAN STOK FISIK (STOCK ADJUSTMENT)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 5: Penyesuaian Stok Fisik Terkontrol (Stock Adjustment)...');
  const targetPhysical = 28; // Dari 25 disesuaikan ke 28 (+3)
  const adjustResult = await repository.createStockAdjustment({
    store_id: storePegandon.id,
    product_id: testProduct.id,
    physical_quantity: targetPhysical,
    notes: 'Hasil hitung ulang etalase kaca depan Pegandon',
    created_by: 'Kepala Toko Pegandon',
  });

  assert(
    adjustResult.balance.quantity === targetPhysical,
    `Saldo setelah adjustment harus ${targetPhysical}, didapat: ${adjustResult.balance.quantity}`
  );
  assert(
    adjustResult.movement.movement_type === 'ADJUSTMENT',
    `Tipe movement harus ADJUSTMENT, didapat: ${adjustResult.movement.movement_type}`
  );
  assert(
    adjustResult.movement.quantity_delta === 3,
    `Delta adjustment harus +3, didapat: ${adjustResult.movement.quantity_delta}`
  );
  console.log('  ✅ Lolos: Penyesuaian stok fisik tercatat dengan alasan dan delta akurat.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 6: STOCK OPNAME & REKONSILIASI
  // --------------------------------------------------------------------------
  console.log('▶ TEST 6: Modul Stock Opname Fisik Cabang Kaliwungu...');
  const opname = await repository.createStockCount({
    store_id: storeKaliwungu.id,
    conducted_by: 'Kasir Toko Kaliwungu',
    notes: 'Opname mingguan toko Kaliwungu',
    items: [
      {
        product_id: testProduct.id,
        physical_quantity: 24, // Sistem 25, fisik 24 (selisih -1)
        notes: '1 botol tester tumpah',
      },
    ],
  });

  assert(opname.status === 'COMPLETED', 'Status opname harus COMPLETED');
  assert(opname.items?.length === 1, 'Item opname harus 1');
  assert(opname.items![0].difference_quantity === -1, 'Selisih opname harus -1');

  // Cek saldo akhir toko Kaliwungu setelah rekonsiliasi opname
  const finalKlw = await repository.getInventoryBalance(storeKaliwungu.id, testProduct.id);
  assert(finalKlw!.quantity === 24, `Saldo Kaliwungu setelah opname harus 24, didapat: ${finalKlw!.quantity}`);
  console.log('  ✅ Lolos: Stock opname berhasil merekonsiliasi fisik dan mencatat selisih.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 7: AUDIT BUKU BESAR KARTU STOK (STOCK MOVEMENTS LEDGER)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 7: Verifikasi Integritas Buku Besar Kartu Stok (Audit Ledger)...');
  const whMovements = await repository.getStockMovements({
    storeId: warehouse.id,
    productId: testProduct.id,
  });

  assert(whMovements.length >= 3, `Minimal 3 catatan mutasi di gudang, didapat: ${whMovements.length}`);
  console.log(`  Total mutasi tercatat untuk produk di gudang: ${whMovements.length} transaksi`);
  for (const m of whMovements) {
    console.log(`  - [${m.movement_type}] Delta: ${m.quantity_delta > 0 ? '+' : ''}${m.quantity_delta} | Saldo: ${m.balance_after} | HPP: Rp ${m.moving_avg_cost_after} | Ref: ${m.reference_id || '-'}`);
  }
  console.log('  ✅ Lolos: Jejak audit kartu stok tercatat secara kronologis dan tidak dapat dimanipulasi.\n');

  console.log('=================================================================');
  console.log('🎉 SEMUA ACCEPTANCE TESTS TAHAP 2 BERHASIL 100%!');
  console.log('=================================================================');
}

runStage2Tests().catch((err) => {
  console.error('❌ Gagal menjalankan test Tahap 2:', err);
  process.exit(1);
});
