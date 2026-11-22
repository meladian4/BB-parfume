// ============================================================================
// Acceptance Tests - TAHAP 3: Pembelian Supplier, HPP Bergerak, dan Mutasi Cabang
// BB PARFUM PREMIUM MANAGEMENT SYSTEM
// ============================================================================

import { repository } from '../src/lib/db/repository';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runStage3Tests() {
  console.log('=================================================================');
  console.log('🚀 MEMULAI ACCEPTANCE TEST TAHAP 3 — PEMBELIAN, HPP & MUTASI');
  console.log('=================================================================\n');

  repository._resetForTesting();

  const stores = await repository.getStores();
  const products = await repository.getProducts();
  const suppliers = await repository.getSuppliers();

  const warehouse = stores.find((s) => s.type === 'WAREHOUSE')!;
  const storePegandon = stores.find((s) => s.code === 'STORE-PGD-02')!;
  const storeKaliwungu = stores.find((s) => s.code === 'STORE-KLW-03')!;
  const testProduct = products[0]; // BB Royal Velvet Oud 50ml (base_price: 185000, initial HPP: 83250)
  const supplierGrasse = suppliers[0]; // PT Grasse Fragrance Indonesia

  // --------------------------------------------------------------------------
  // TEST SUITE 1: BUAT PURCHASE ORDER (PO) & PENERIMAAN GUDANG PUSAT
  // --------------------------------------------------------------------------
  console.log('▶ TEST 1: Pembuatan PO & Penerimaan Barang Supplier di Gudang Pusat...');
  const initialWhStock = (await repository.getInventoryBalance(warehouse.id, testProduct.id))!;
  assert(initialWhStock.quantity === 100, `Stok awal gudang harus 100, didapat: ${initialWhStock.quantity}`);
  assert(initialWhStock.moving_avg_cost === 83250, `HPP awal harus 83250, didapat: ${initialWhStock.moving_avg_cost}`);

  // Buat PO untuk 100 botol dengan harga beli Rp 95.000 / botol
  const draftPurchase = await repository.createPurchase({
    supplier_id: supplierGrasse.id,
    destination_store_id: warehouse.id,
    notes: 'PO Pengadaan Bibit Velvet Oud Batch 02',
    created_by: 'Kepala Logistik Kendal',
    items: [
      {
        product_id: testProduct.id,
        quantity: 100,
        unit_cost: 95000,
      },
    ],
  });

  assert(draftPurchase.status === 'PENDING_APPROVAL', `Status PO harus PENDING_APPROVAL, didapat: ${draftPurchase.status}`);
  const purchase = await repository.approvePurchase(draftPurchase.id, 'Super Admin Kendal');
  assert(purchase.status === 'ORDERED', `Status PO harus ORDERED, didapat: ${purchase.status}`);
  assert(purchase.total_amount === 9500000, `Total PO harus Rp 9.500.000, didapat: ${purchase.total_amount}`);

  // Terima barang PO di gudang
  const receivedPO = await repository.receivePurchase(purchase.id, 'Kepala Logistik Kendal');
  assert(receivedPO.status === 'RECEIVED', `Status PO harus RECEIVED, didapat: ${receivedPO.status}`);
  assert(!!receivedPO.received_at, 'Waktu received_at harus terisi');

  // Cek saldo gudang dan HPP rata-rata baru:
  // (100 * 83250 + 100 * 95000) / 200 = 17825000 / 200 = 89125
  const whAfterPO = (await repository.getInventoryBalance(warehouse.id, testProduct.id))!;
  assert(whAfterPO.quantity === 200, `Stok gudang setelah PO harus 200, didapat: ${whAfterPO.quantity}`);
  assert(whAfterPO.moving_avg_cost === 89125, `HPP moving average gudang harus 89125, didapat: ${whAfterPO.moving_avg_cost}`);
  console.log(`  Stok Gudang: 100 -> 200 botol | HPP Gudang: Rp 83.250 -> Rp ${whAfterPO.moving_avg_cost}`);
  console.log('  ✅ Lolos: PO berhasil diterima di Gudang Pusat dan HPP bergerak terhitung otomatis.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 2: SURAT JALAN MUTASI & BARANG DALAM PERJALANAN (IN_TRANSIT)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 2: Mutasi Gudang ke Cabang Pegandon & Status In-Transit...');
  const initialPgdStock = (await repository.getInventoryBalance(storePegandon.id, testProduct.id))!;
  assert(initialPgdStock.quantity === 25, `Stok awal Pegandon harus 25, didapat: ${initialPgdStock.quantity}`);

  // Buat surat jalan mutasi 30 botol dari Gudang ke Cabang Pegandon
  const transfer = await repository.createStockTransfer({
    source_store_id: warehouse.id,
    destination_store_id: storePegandon.id,
    notes: 'Distribusi reguler mingguan Cabang Pegandon',
    created_by: 'Kepala Logistik Kendal',
    items: [
      {
        product_id: testProduct.id,
        quantity: 30,
      },
    ],
  });

  assert(transfer.status === 'PENDING_SHIPMENT', `Status awal mutasi harus PENDING_SHIPMENT, didapat: ${transfer.status}`);
  assert(transfer.items![0].unit_cost === 89125, `Snapshot HPP mutasi harus membawa HPP gudang (89125), didapat: ${transfer.items![0].unit_cost}`);

  // Kirim barang (Ship) -> Stok Gudang terpotong, status menjadi IN_TRANSIT
  const shippedTransfer = await repository.shipStockTransfer(transfer.id, 'Kurir Logistik Kendal');
  assert(shippedTransfer.status === 'IN_TRANSIT', `Status harus IN_TRANSIT, didapat: ${shippedTransfer.status}`);

  // Stok Gudang berkurang dari 200 menjadi 170
  const whAfterShip = (await repository.getInventoryBalance(warehouse.id, testProduct.id))!;
  assert(whAfterShip.quantity === 170, `Stok gudang setelah pengiriman harus 170, didapat: ${whAfterShip.quantity}`);
  assert(whAfterShip.moving_avg_cost === 89125, 'HPP gudang tidak boleh berubah akibat mutasi keluar');

  // Stok Cabang Pegandon BELUM BOLEH BERTAMBAH saat barang masih in-transit
  const pgdDuringTransit = (await repository.getInventoryBalance(storePegandon.id, testProduct.id))!;
  assert(
    pgdDuringTransit.quantity === 25,
    `Stok cabang selama in-transit harus tetap 25, didapat: ${pgdDuringTransit.quantity}`
  );
  console.log(`  Stok Gudang terpotong: 200 -> 170 botol (TRANSFER_OUT)`);
  console.log(`  Status Mutasi: IN_TRANSIT (Barang dalam perjalanan kurir)`);
  console.log(`  Stok Toko Pegandon (Belum terima): tetap 25 botol`);
  console.log('  ✅ Lolos: Barang dalam perjalanan (In-Transit) terlacak aman dan belum masuk stok toko.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: KONFIRMASI TERIMA DI CABANG PEGANDON & UPDATE HPP TOKO
  // --------------------------------------------------------------------------
  console.log('▶ TEST 3: Konfirmasi Penerimaan Mutasi di Toko Pegandon & Update HPP Cabang...');
  // Cabang Pegandon menerima barang mutasi
  const receivedTransfer = await repository.receiveStockTransfer(transfer.id, 'Kasir Toko Pegandon');
  assert(receivedTransfer.status === 'RECEIVED', `Status harus RECEIVED, didapat: ${receivedTransfer.status}`);

  // Cek saldo akhir Toko Pegandon:
  // Awal: 25 botol @ 83250
  // Masuk: +30 botol @ 89125
  // Total Qty: 55 botol
  // HPP Baru: (25 * 83250 + 30 * 89125) / 55 = (2081250 + 2673750) / 55 = 4755000 / 55 = 86455
  const pgdFinal = (await repository.getInventoryBalance(storePegandon.id, testProduct.id))!;
  assert(pgdFinal.quantity === 55, `Stok Pegandon setelah terima mutasi harus 55, didapat: ${pgdFinal.quantity}`);
  assert(pgdFinal.moving_avg_cost === 86455, `HPP Pegandon baru harus 86455, didapat: ${pgdFinal.moving_avg_cost}`);
  console.log(`  Stok Cabang Pegandon: 25 -> 55 botol (TRANSFER_IN)`);
  console.log(`  HPP Baru Cabang Pegandon: Rp 83.250 -> Rp ${pgdFinal.moving_avg_cost}`);
  console.log('  ✅ Lolos: Konfirmasi terima mutasi berhasil dan HPP cabang terupdate proporsional.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 4: PENCEGAHAN MUTASI MELEBIHI STOK GUDANG (ANTI-NEGATIVE)
  // --------------------------------------------------------------------------
  console.log('▶ TEST 4: Pencegahan Mutasi Melebihi Stok Gudang yang Tersedia...');
  const currentWhAvailable = (await repository.getInventoryBalance(warehouse.id, testProduct.id))!.quantity; // 170

  // Buat mutasi fiktif 500 botol (melebihi 170 botol)
  const oversizedTransfer = await repository.createStockTransfer({
    source_store_id: warehouse.id,
    destination_store_id: storeKaliwungu.id,
    notes: 'Mencoba mutasi melebihi stok gudang',
    items: [
      {
        product_id: testProduct.id,
        quantity: 500, // Melebihi 170
      },
    ],
  });

  let shipBlocked = false;
  try {
    await repository.shipStockTransfer(oversizedTransfer.id, 'Kurir');
  } catch (err: unknown) {
    shipBlocked = true;
  }

  assert(shipBlocked, 'Pengiriman mutasi melebihi stok gudang HARUS DITOLAK');

  // Pastikan stok gudang tetap utuh 170
  const whSafeCheck = (await repository.getInventoryBalance(warehouse.id, testProduct.id))!;
  assert(whSafeCheck.quantity === 170, `Stok gudang harus tetap 170, didapat: ${whSafeCheck.quantity}`);
  console.log(`  Stok Gudang: ${currentWhAvailable} botol. Diminta mutasi: 500 botol -> PENGIRIMAN DITOLAK.`);
  console.log('  ✅ Lolos: Sistem menolak pengiriman mutasi melebihi stok yang ada di gudang.\n');

  // --------------------------------------------------------------------------
  // TEST SUITE 5: VALIDASI LARANGAN MUTASI KE LOKASI SAMA
  // --------------------------------------------------------------------------
  console.log('▶ TEST 5: Pencegahan Mutasi ke Lokasi yang Sama (Self-Transfer)...');
  let selfTransferBlocked = false;
  try {
    await repository.createStockTransfer({
      source_store_id: warehouse.id,
      destination_store_id: warehouse.id, // Asal dan tujuan sama
      items: [{ product_id: testProduct.id, quantity: 10 }],
    });
  } catch (err: unknown) {
    selfTransferBlocked = true;
  }
  assert(selfTransferBlocked, 'Mutasi ke lokasi yang sama harus ditolak');
  console.log('  ✅ Lolos: Larangan mutasi ke lokasi yang sama ditegakkan.\n');

  console.log('=================================================================');
  console.log('🎉 SEMUA ACCEPTANCE TESTS TAHAP 3 BERHASIL 100%!');
  console.log('=================================================================');
}

runStage3Tests().catch((err) => {
  console.error('❌ Gagal menjalankan test Tahap 3:', err);
  process.exit(1);
});
