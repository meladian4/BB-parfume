import { db } from '../src/lib/db/repository';

async function runStage6FinanceReportsTests() {
  console.log('================================================================');
  console.log('🧪 ACCEPTANCE TEST TAHAP 6: LAPORAN KEUANGAN & BIAYA OPERASIONAL');
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
    console.log('1. Verifikasi Data Awal dan Toko...');
    const stores = await db.getStores();
    const retailStores = stores.filter((s) => s.type === 'STORE');
    assert(retailStores.length === 3, 'Memiliki tepat 3 cabang toko retail Kendal');

    const storeKendal = retailStores.find((s) => s.code === 'STORE-KDL-01')!;
    const storePegandon = retailStores.find((s) => s.code === 'STORE-PGD-02')!;
    const storeKaliwungu = retailStores.find((s) => s.code === 'STORE-KLW-03')!;
    assert(!!storeKendal && !!storePegandon && !!storeKaliwungu, 'Ketiga cabang (Kendal Kota, Pegandon, Kaliwungu) terdaftar');

    // 2. Pencatatan Biaya Operasional (Expenses)
    console.log('\n2. Pengujian Pencatatan Biaya Operasional (OPEX)...');
    const exp1 = await db.createExpense({
      store_id: storeKendal.id,
      expense_date: '2026-10-11',
      category: 'RENT',
      description: 'Sewa ruko cabang Kendal Kota bulan Oktober',
      amount: 2500000,
    });
    assert(exp1.amount === 2500000, 'Biaya sewa toko Kendal berhasil dicatat sebesar Rp 2.500.000');

    const exp2 = await db.createExpense({
      store_id: storePegandon.id,
      expense_date: '2026-10-11',
      category: 'UTILITIES',
      description: 'Tagihan listrik dan WiFi cabang Pegandon',
      amount: 450000,
    });
    assert(exp2.amount === 450000, 'Biaya listrik & internet cabang Pegandon berhasil dicatat sebesar Rp 450.000');

    const exp3 = await db.createExpense({
      store_id: storeKaliwungu.id,
      expense_date: '2026-10-11',
      category: 'PACKAGING',
      description: 'Paper bag mewah eksklusif gold 300 pcs',
      amount: 600000,
    });
    assert(exp3.amount === 600000, 'Biaya packaging cabang Kaliwungu berhasil dicatat sebesar Rp 600.000');

    // Validasi penolakan nominal <= 0
    let negativeExpenseBlocked = false;
    try {
      await db.createExpense({
        store_id: storeKendal.id,
        expense_date: '2026-10-11',
        category: 'OTHER',
        description: 'Biaya tidak valid',
        amount: -50000,
      });
    } catch {
      negativeExpenseBlocked = true;
    }
    assert(negativeExpenseBlocked, 'Pencegahan biaya nominal negatif berhasil ditolak');

    // 3. Simulasi Transaksi Penjualan Kasir POS dengan HPP Snapshot
    console.log('\n3. Simulasi Transaksi POS & Snapshot HPP...');
    const products = await db.getProducts();
    const p1 = products[0];

    // Ambil saldo moving average cost sebelum transaksi
    const balanceBefore = await db.getInventoryBalance(storeKendal.id, p1.id);
    const movingCostBefore = balanceBefore?.moving_avg_cost || 0;

    // Buka sesi kasir di Kendal
    const cashiers = (await db.getUserProfiles()).filter((u) => u.role === 'CASHIER');
    const cashierKendal = cashiers.find((c) => c.assigned_store_id === storeKendal.id) || cashiers[0];

    const sessionKendal = await db.openCashSession({
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      opening_cash: 200000,
    });
    assert(sessionKendal.status === 'OPEN', 'Sesi kasir Kendal Kota berhasil dibuka');

    // Checkout Penjualan di Kendal: Jual 2 unit p1
    const discountPromo = 20000;
    const saleKendal = await db.processSaleCheckout({
      idempotency_key: 'stage6-sale-kendal-001',
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      cash_session_id: sessionKendal.id,
      items: [{ product_id: p1.id, quantity: 2, discount_amount: discountPromo }],
      payment: {
        payment_method: 'CASH',
        amount: 500000,
      },
    });

    const expectedSubtotal = p1.base_price * 2;
    const expectedFinal = expectedSubtotal - discountPromo;
    const expectedCost = movingCostBefore * 2;

    assert(saleKendal.subtotal === expectedSubtotal, `Subtotal kotor penjualan Kendal Rp ${expectedSubtotal}`);
    assert(saleKendal.final_amount === expectedFinal, `Penjualan bersih (setelah diskon) Rp ${expectedFinal}`);
    assert(saleKendal.total_cost === expectedCost, `HPP barang terjual tersnapshot akurat Rp ${expectedCost}`);

    // 4. Laporan Finansial dan Verifikasi Rumus
    console.log('\n4. Verifikasi Rumus Laporan Finansial...');
    const report = await db.getFinancialReport();

    // Verifikasi rumus Penjualan Bersih
    assert(
      report.total_net_sales === report.total_gross_sales - report.total_discounts,
      'Rumus Penjualan Bersih: Net Sales = Gross Sales - Diskon'
    );

    // Verifikasi rumus Laba Kotor
    assert(
      report.gross_profit === report.total_net_sales - report.total_cogs,
      'Rumus Laba Kotor: Gross Profit = Net Sales - COGS'
    );

    // Verifikasi rumus Laba Operasional
    assert(
      report.net_operating_profit === report.gross_profit - report.total_expenses,
      'Rumus Laba Operasional: Net Operating Profit = Gross Profit - Biaya OPEX'
    );

    // Periksa angka spesifik Kendal
    const kendalMetric = report.store_metrics.find((m) => m.store_id === storeKendal.id);
    assert(!!kendalMetric, 'Metrik per cabang toko Kendal Kota ditemukan dalam laporan');
    if (kendalMetric) {
      const allKendalExpenses = (await db.getExpenses({ store_id: storeKendal.id })).reduce(
        (sum, e) => sum + e.amount,
        0
      );
      assert(kendalMetric.net_sales === expectedFinal, `Net Sales Kendal Kota tepat Rp ${expectedFinal}`);
      assert(kendalMetric.cogs === expectedCost, `COGS Kendal Kota tepat Rp ${expectedCost}`);
      assert(
        kendalMetric.gross_profit === expectedFinal - expectedCost,
        `Laba kotor Kendal Kota tepat Rp ${expectedFinal - expectedCost}`
      );
      assert(kendalMetric.expenses === allKendalExpenses, `Beban operasional Kendal Kota tepat Rp ${allKendalExpenses}`);
      assert(
        kendalMetric.net_operating_profit === kendalMetric.gross_profit - allKendalExpenses,
        `Laba operasional Kendal Kota konsisten (Gross Profit - Expenses)`
      );
    }

    // 5. Verifikasi Pemisahan Mutasi dan Pembelian Supplier
    console.log('\n5. Verifikasi Pemisahan Mutasi & Pembelian dari Omzet...');
    // Mutasi antar-toko tidak boleh menambah total_net_sales
    const netSalesBeforeTransfer = report.total_net_sales;
    await db.createStockTransfer({
      source_store_id: storeKendal.id,
      destination_store_id: storePegandon.id,
      notes: 'Mutasi restock Kendal ke Pegandon',
      items: [{ product_id: p1.id, quantity: 2 }],
    });
    const reportAfterTransfer = await db.getFinancialReport();
    assert(
      reportAfterTransfer.total_net_sales === netSalesBeforeTransfer,
      'Mutasi internal antar-cabang TIDAK menambah omzet penjualan'
    );

    // 6. Verifikasi Nilai Persediaan (Inventory Valuation)
    console.log('\n6. Verifikasi Nilai Persediaan Fisik (Moving Average HPP)...');
    assert(report.total_inventory_value > 0, 'Total nilai persediaan terhitung positif berbasis saldo fisik x HPP');

    // 7. Verifikasi Peringatan Stok Menipis (Low Stock Alerts)
    console.log('\n7. Verifikasi Peringatan Stok Menipis...');
    // Buat satu stok produk menjadi di bawah batas minimum buffer
    const pTarget = products[1];
    const balTarget = await db.getInventoryBalance(storePegandon.id, pTarget.id);
    if (balTarget && balTarget.quantity > 3) {
      await db.recordStockMovement({
        store_id: storePegandon.id,
        product_id: pTarget.id,
        movement_type: 'ADJUSTMENT',
        quantity_delta: -(balTarget.quantity - 2), // Sisakan 2 unit (di bawah min alert)
        notes: 'Simulasi penurunan stok untuk uji buffer',
      });
    }

    const lowStockAlerts = await db.getLowStockAlerts(storePegandon.id);
    assert(lowStockAlerts.length > 0, 'Peringatan stok menipis berhasil mendeteksi varian di bawah minimum buffer');
    const alertItem = lowStockAlerts.find((a) => a.product.id === pTarget.id);
    assert(!!alertItem && alertItem.current_stock <= alertItem.min_stock_alert, 'Kuantitas stok terdeteksi <= batas minimum alert');

    // 8. Verifikasi Audit Log Pengeluaran
    console.log('\n8. Verifikasi Audit Log Biaya Operasional...');
    const auditLogs = await db.getAuditLogs(10);
    const expenseLog = auditLogs.find((l) => l.action === 'EXPENSE_RECORDED');
    assert(!!expenseLog, 'Pencatatan pengeluaran tersimpan dalam immutable audit trail');

    console.log('\n================================================================');
    console.log(`🏁 HASIL TEST STAGE 6: ${passed} PASS, ${failed} FAIL`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 FATAL ERROR IN TEST STAGE 6:', error);
    process.exit(1);
  }
}

runStage6FinanceReportsTests();
