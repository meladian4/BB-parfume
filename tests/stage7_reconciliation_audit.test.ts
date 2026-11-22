import { db } from '../src/lib/db/repository';

async function runStage7ReconciliationAuditTests() {
  console.log('================================================================');
  console.log('🧪 ACCEPTANCE TEST TAHAP 7: REKONSILIASI, KEAMANAN & BACKUP');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Detail: ${detail}`);
      failed++;
    }
  }

  try {
    // 1. Reset state database
    db._resetForTesting();
    console.log('1. Uji Keamanan Hak Akses & Penjagaan Toko Kasir (Store Locking)...');

    const users = await db.getUserProfiles();
    const cashierKendal = users.find((u) => u.email === 'kasir.kendal@bbparfum.id')!;
    const cashierPegandon = users.find((u) => u.email === 'kasir.pegandon@bbparfum.id')!;
    const storeKendal = (await db.getStoreByCode('STORE-KDL-01'))!;
    const storePegandon = (await db.getStoreByCode('STORE-PGD-02'))!;
    const storeKaliwungu = (await db.getStoreByCode('STORE-KLW-03'))!;
    const warehouse = (await db.getStoreByCode('WH-KENDAL-01'))!;

    assert(cashierKendal.assigned_store_id === storeKendal.id, 'Kasir Kendal terkunci pada cabang Kendal Kota');
    assert(cashierPegandon.assigned_store_id === storePegandon.id, 'Kasir Pegandon terkunci pada cabang Pegandon');

    // Uji penolakan jika kasir membuka transaksi langsung di Gudang Pusat
    let warehousePosBlocked = false;
    try {
      await db.processSaleCheckout({
        idempotency_key: 'stage7-wh-blocked-test',
        store_id: warehouse.id,
        cashier_id: cashierKendal.id,
        items: [{ product_id: (await db.getProducts())[0].id, quantity: 1 }],
        payment: { payment_method: 'CASH', amount: 200000 },
      });
    } catch {
      warehousePosBlocked = true;
    }
    assert(warehousePosBlocked, 'Gudang pusat menolak transaksi ritel kasir langsung');

    // 2. Simulasi Beragam Transaksi untuk Membentuk Riwayat Mutasi Kompleks
    console.log('\n2. Simulasi Transaksi Kompleks Multi-Cabang...');
    const products = await db.getProducts();
    const pA = products[0];
    const pB = products[1];

    // Sesi kasir Kendal
    const sessKendal = await db.openCashSession({
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      opening_cash: 250000,
    });

    // Penjualan 1 di Kendal
    const sale1 = await db.processSaleCheckout({
      idempotency_key: 'stage7-tx-kdl-001',
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      cash_session_id: sessKendal.id,
      items: [{ product_id: pA.id, quantity: 3, discount_amount: 15000 }],
      payment: { payment_method: 'CASH', amount: 600000 },
    });

    // Penjualan 2 di Kendal dengan Member Poin
    const memberBudi = (await db.getMembers())[0];
    const sale2 = await db.processSaleCheckout({
      idempotency_key: 'stage7-tx-kdl-002',
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      cash_session_id: sessKendal.id,
      member_id: memberBudi.id,
      items: [{ product_id: pB.id, quantity: 2, discount_amount: 0 }],
      payment: { payment_method: 'QRIS', amount: pB.base_price * 2 },
    });

    // Mutasi barang dari Gudang ke Kaliwungu
    const transfer = await db.createStockTransfer({
      source_store_id: warehouse.id,
      destination_store_id: storeKaliwungu.id,
      notes: 'Restock mingguan Kaliwungu',
      items: [{ product_id: pA.id, quantity: 10 }],
    });
    // Kirim dari gudang (In-Transit)
    await db.shipStockTransfer(transfer.id, 'Kurir Distribusi Kendal');
    // Konfirmasi penerimaan di Kaliwungu
    await db.receiveStockTransfer(transfer.id, cashierKendal.full_name);

    // Penyesuaian stok fisik (Stock Opname) di Pegandon
    await db.createStockCount({
      store_id: storePegandon.id,
      conducted_by: cashierPegandon.full_name,
      notes: 'Opname rutin Pegandon',
      items: [{ product_id: pB.id, physical_quantity: 23, notes: 'Selisih 2 botol tester' }],
    });

    // Tutup sesi kasir Kendal dengan rekonsiliasi kas
    const totalCashSales = sale1.payments?.filter((p) => p.payment_method === 'CASH')
      .reduce((sum, p) => sum + (sale1.final_amount), 0) || 0;
    const expectedCashInDrawer = 250000 + totalCashSales;

    const closedSession = await db.closeCashSession(sessKendal.id, {
      actual_cash: expectedCashInDrawer,
      notes: 'Tutup shift pagi tanpa selisih',
    });
    assert(closedSession.status === 'CLOSED', 'Sesi kasir berhasil ditutup');
    assert(closedSession.cash_difference === 0, 'Rekonsiliasi laci kasir seimbang (selisih Rp 0)');

    // 3. Rekonsiliasi Menyeluruh Saldo Inventaris (Inventory Reconcile)
    console.log('\n3. Pengujian Audit Rekonsiliasi Saldo Inventaris...');
    const invReconciliation = await db.reconcileAllInventory();
    assert(invReconciliation.total_records > 0, `Memeriksa ${invReconciliation.total_records} kombinasi stok toko-produk`);
    assert(
      invReconciliation.discrepancy_count === 0,
      `Rekonsiliasi Saldo Fisik vs Riwayat Mutasi Stok: 100% COCOK (${invReconciliation.reconciled_count}/${invReconciliation.total_records} record valid)`
    );

    // 4. Rekonsiliasi Menyeluruh Poin Loyalty (Member Points Reconcile)
    console.log('\n4. Pengujian Audit Rekonsiliasi Poin Member...');
    const memberReconciliation = await db.reconcileAllMembers();
    assert(memberReconciliation.total_members > 0, `Memeriksa ${memberReconciliation.total_members} akun member`);
    assert(
      memberReconciliation.discrepancy_count === 0,
      `Rekonsiliasi Saldo Poin vs Buku Besar Loyalty: 100% COCOK (${memberReconciliation.reconciled_count}/${memberReconciliation.total_members} member valid)`
    );

    // 5. Rekonsiliasi Sesi Kasir (Cash Session Reconcile)
    console.log('\n5. Pengujian Audit Rekonsiliasi Laci Kasir...');
    const cashReconciliation = await db.reconcileAllCashSessions();
    assert(
      cashReconciliation.discrepancy_count === 0,
      `Rekonsiliasi Laci Kasir: 100% Sesi Tertutup Seimbang (${cashReconciliation.balanced_sessions}/${cashReconciliation.closed_sessions})`
    );

    // 6. Prosedur Disaster Recovery & Backup Snapshot
    console.log('\n6. Pengujian Prosedur Backup & Disaster Recovery Snapshot...');
    const backup = await db.exportBackupSnapshot();
    assert(!!backup.generated_at, 'Timestamp backup tersimpan otomatis');
    assert(backup.record_counts.stores === 4, 'Snapshot mencakup 4 lokasi (1 Gudang + 3 Toko)');
    assert(backup.record_counts.sales >= 2, 'Snapshot mencakup seluruh riwayat transaksi penjualan POS');
    assert(backup.record_counts.inventoryBalances > 0, 'Snapshot mencakup data saldo persediaan');
    assert(backup.record_counts.pointTransactions > 0, 'Snapshot mencakup mutasi buku besar poin');
    assert(backup.record_counts.auditLogs > 0, 'Snapshot mencakup jejak audit');

    // Verifikasi log audit untuk aktivitas backup
    const latestLogs = await db.getAuditLogs(5);
    const backupLog = latestLogs.find((l) => l.action === 'BACKUP_SNAPSHOT_EXPORTED');
    assert(!!backupLog, 'Aktivitas ekspor backup tercatat dalam audit trail');

    console.log('\n================================================================');
    console.log(`🏁 HASIL TEST STAGE 7: ${passed} PASS, ${failed} FAIL`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 FATAL ERROR IN TEST STAGE 7:', error);
    process.exit(1);
  }
}

runStage7ReconciliationAuditTests();
