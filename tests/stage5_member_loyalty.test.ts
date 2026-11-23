// ============================================================================
// STAGE 5 ACCEPTANCE TEST: MEMBER & LOYALTY POINTS LEDGER
// BB Parfum Premium Management System
// ============================================================================

import { db } from '../src/lib/db/repository';

async function runStage5Tests() {
  console.log('--- STARTING STAGE 5 ACCEPTANCE TESTS: MEMBER & LOYALTY LEDGER ---');
  db._resetForTesting();

  // 1. VERIFIKASI KONFIGURASI LOYALTY & PENGATURAN SUPER ADMIN
  console.log('\n[TEST 1] Verifikasi & Pembaruan Konfigurasi Loyalty (App Settings)');
  const configAwal = await db.getLoyaltyConfig();
  if (
    configAwal.spend_per_point !== 30000 ||
    configAwal.points_per_step !== 1500 ||
    configAwal.point_value_idr !== 1 ||
    configAwal.min_redeem_points !== 1500
  ) {
    throw new Error(
      `Test 1 Gagal: Nilai default konfigurasi loyalty tidak sesuai (diharapkan Rp 30.000 -> 1.500 Poin, 1 Poin = Rp 1, min 1.500; didapat spend=${configAwal.spend_per_point}, step=${configAwal.points_per_step}, val=${configAwal.point_value_idr}, min=${configAwal.min_redeem_points}).`
    );
  }
  console.log(`✓ Konfigurasi Awal: Belanja Rp ${configAwal.spend_per_point.toLocaleString('id-ID')} = ${configAwal.points_per_step.toLocaleString('id-ID')} Poin | 1 Poin = Rp ${configAwal.point_value_idr.toLocaleString('id-ID')} diskon`);

  // Super Admin mengubah konfigurasi loyalty
  const updatedConfig = await db.updateLoyaltyConfig({ min_redeem_points: 15 }, 'u-admin-01');
  if (updatedConfig.min_redeem_points !== 15) {
    throw new Error('Test 1 Gagal: Pembaruan konfigurasi loyalty gagal.');
  }
  console.log(`✓ Konfigurasi Diperbarui: Minimal penukaran ${updatedConfig.min_redeem_points} Poin`);

  // Kembalikan ke konfigurasi pengujian standar (spend 10.000, points_per_step 1, point_value 1.000, min 10 poin)
  await db.updateLoyaltyConfig({ spend_per_point: 10000, points_per_step: 1, point_value_idr: 1000, min_redeem_points: 10 });

  // 2. REKONSILIASI SALDO AWAL MEMBER TERHADAP BUKU BESAR (LEDGER)
  console.log('\n[TEST 2] Rekonsiliasi Saldo Poin Awal Member vs Riwayat Buku Besar');
  const memberBudi = (await db.getMembers()).find((m) => m.name === 'Budi Santoso')!;
  const memberSiti = (await db.getMembers()).find((m) => m.name === 'Siti Rahmawati')!;

  const recBudi = await db.reconcileMemberPoints(memberBudi.id);
  const recSiti = await db.reconcileMemberPoints(memberSiti.id);

  if (!recBudi.is_reconciled || recBudi.current_balance !== 150) {
    throw new Error(`Test 2 Gagal: Saldo Budi Santoso (${recBudi.current_balance}) tidak cocok dengan ledger (${recBudi.ledger_balance})`);
  }
  if (!recSiti.is_reconciled || recSiti.current_balance !== 75) {
    throw new Error(`Test 2 Gagal: Saldo Siti Rahmawati (${recSiti.current_balance}) tidak cocok dengan ledger (${recSiti.ledger_balance})`);
  }
  console.log(`✓ Member Budi Santoso: Saldo ${recBudi.current_balance} Poin == Ledger ${recBudi.ledger_balance} Poin (Rekonsiliasi: 100% Cocok)`);
  console.log(`✓ Member Siti Rahmawati: Saldo ${recSiti.current_balance} Poin == Ledger ${recSiti.ledger_balance} Poin (Rekonsiliasi: 100% Cocok)`);

  // 3. TRANSAKSI CHECKOUT POS DENGAN PENAMBAHAN POIN (EARN)
  console.log('\n[TEST 3] Transaksi POS & Penambahan Poin Otomatis (EARN Ledger)');
  const storeKendal = (await db.getStores()).find((s) => s.code === 'STORE-KDL-01')!;
  const cashierKendal = (await db.getUserProfiles()).find((u) => u.email === 'kasir.kendal@bbparfum.id')!;
  const products = await db.getProducts();
  const prodA = products[0]; // Rp 185.000

  // Buka Sesi Kasir
  const session = await db.openCashSession({
    store_id: storeKendal.id,
    cashier_id: cashierKendal.id,
    opening_cash: 200000,
  });

  // Belanja Siti: 1 Botol @ Rp 185.000 -> Poin diharapkan = floor(185.000 / 10.000) = 18 Poin
  const saleSiti = await db.processSaleCheckout({
    store_id: storeKendal.id,
    cashier_id: cashierKendal.id,
    cash_session_id: session.id,
    member_id: memberSiti.id,
    idempotency_key: `pos-siti-tx-01-${Date.now()}`,
    items: [{ product_id: prodA.id, quantity: 1 }],
    payment: {
      payment_method: 'CASH',
      amount: 200000,
    },
  });

  if (saleSiti.points_earned !== 18) {
    throw new Error(`Test 3 Gagal: Poin belanja tidak sesuai. Diharapkan 18, diperoleh ${saleSiti.points_earned}`);
  }

  const sitiAfterEarn = (await db.getMemberById(memberSiti.id))!;
  if (sitiAfterEarn.points_balance !== 75 + 18) {
    throw new Error(`Test 3 Gagal: Saldo Siti tidak bertambah 18. Saldo sekarang: ${sitiAfterEarn.points_balance}`);
  }

  const recSitiEarn = await db.reconcileMemberPoints(memberSiti.id);
  if (!recSitiEarn.is_reconciled) {
    throw new Error('Test 3 Gagal: Rekonsiliasi gagal setelah transaksi EARN.');
  }
  console.log(`✓ Penjualan ${saleSiti.invoice_number}: Belanja Rp 185.000 -> Hadiah +18 Poin`);
  console.log(`✓ Saldo Siti Rahmawati terupdate: 75 -> ${sitiAfterEarn.points_balance} Poin (Buku Besar Rekonsiliasi: VALID)`);

  // 4. TRANSAKSI CHECKOUT POS DENGAN PENUKARAN POIN (REDEEM) SEBAGAI POTONGAN BELANJA
  console.log('\n[TEST 4] Penukaran Poin (REDEEM Ledger) Sebagai Diskon Belanja di Kasir');
  // Budi punya 150 poin. Budi menukarkan 30 poin (Diskon: 30 x 1.000 = Rp 30.000).
  // Belanja: 1 Botol @ Rp 185.000.
  // Total Bayar: Rp 185.000 - Rp 30.000 = Rp 155.000.
  // Poin didapat dari belanja bersih Rp 155.000: floor(155.000 / 10.000) = 15 Poin.
  const saleBudi = await db.processSaleCheckout({
    store_id: storeKendal.id,
    cashier_id: cashierKendal.id,
    cash_session_id: session.id,
    member_id: memberBudi.id,
    idempotency_key: `pos-budi-redeem-01-${Date.now()}`,
    items: [{ product_id: prodA.id, quantity: 1 }],
    points_to_redeem: 30, // Tukar 30 poin
    payment: {
      payment_method: 'CASH',
      amount: 155000, // Pas sesuai tagihan setelah diskon poin
    },
  });

  if (saleBudi.final_amount !== 155000) {
    throw new Error(`Test 4 Gagal: Final amount salah. Diharapkan Rp 155.000, dapat ${saleBudi.final_amount}`);
  }
  if (saleBudi.points_redeemed !== 30 || saleBudi.points_earned !== 15) {
    throw new Error(`Test 4 Gagal: Mutasi poin sale tidak sesuai (Redeemed: ${saleBudi.points_redeemed}, Earned: ${saleBudi.points_earned})`);
  }

  // Saldo Budi: 150 - 30 (Redeem) + 15 (Earn) = 135 Poin
  const budiAfterSale = (await db.getMemberById(memberBudi.id))!;
  if (budiAfterSale.points_balance !== 135) {
    throw new Error(`Test 4 Gagal: Saldo Budi tidak sesuai 135. Dapat: ${budiAfterSale.points_balance}`);
  }

  const recBudiRedeem = await db.reconcileMemberPoints(memberBudi.id);
  if (!recBudiRedeem.is_reconciled) {
    throw new Error('Test 4 Gagal: Rekonsiliasi gagal setelah transaksi REDEEM.');
  }
  console.log(`✓ Penjualan ${saleBudi.invoice_number}: Tukar 30 Poin (-Rp 30.000) -> Tagihan Bersih: Rp 155.000`);
  console.log(`✓ Saldo Poin Budi: 150 - 30 + 15 = ${budiAfterSale.points_balance} Poin (Buku Besar Rekonsiliasi: VALID)`);

  // 5. PENCEGAHAN REDEEM MELEBIHI SALDO POIN MEMBER
  console.log('\n[TEST 5] Pencegahan Penukaran Poin Melebihi Saldo yang Dimiliki');
  try {
    await db.processSaleCheckout({
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      cash_session_id: session.id,
      member_id: memberBudi.id,
      idempotency_key: `pos-fail-redeem-${Date.now()}`,
      items: [{ product_id: prodA.id, quantity: 1 }],
      points_to_redeem: 9999, // Melebihi saldo Budi (135)
      payment: {
        payment_method: 'CASH',
        amount: 200000,
      },
    });
    throw new Error('Test 5 Gagal: Penukaran poin melebihi saldo berhasil diproses.');
  } catch (err: any) {
    if (!err.message.includes('Saldo poin member tidak mencukupi')) {
      throw err;
    }
    console.log(`✓ Berhasil dicegah: "${err.message}"`);
  }

  // 6. PEMBALIKAN POIN (REVERSAL) SAAT TRANSAKSI DIBATALKAN / DIRETUR
  console.log('\n[TEST 6] Pembalikan Poin (REVERSAL Ledger) & Pencegahan Double Reversal');
  // Membalikkan transaksi Budi (saleBudi.invoice_number)
  // Harus membalikkan:
  // - 15 poin yang didapat (EARN) ditarik kembali (-15)
  // - 30 poin yang ditukarkan (REDEEM) dikembalikan (+30)
  // Hasil saldo Budi kembali ke: 135 - 15 + 30 = 150 Poin!
  const reversalRes = await db.reversePointsForSale(saleBudi.invoice_number, 'Retur Barang Rusak', cashierKendal.id);
  if (!reversalRes.reversed_earn || !reversalRes.reversed_redeem) {
    throw new Error('Test 6 Gagal: Reversal mutasi earn atau redeem tidak lengkap.');
  }

  const budiAfterReversal = (await db.getMemberById(memberBudi.id))!;
  if (budiAfterReversal.points_balance !== 150) {
    throw new Error(`Test 6 Gagal: Saldo Budi setelah reversal tidak kembali ke 150. Dapat: ${budiAfterReversal.points_balance}`);
  }

  const recBudiRev = await db.reconcileMemberPoints(memberBudi.id);
  if (!recBudiRev.is_reconciled) {
    throw new Error('Test 6 Gagal: Rekonsiliasi gagal setelah REVERSAL.');
  }
  console.log(`✓ Reversal berhasil untuk invoice ${saleBudi.invoice_number}`);
  console.log(`✓ Saldo Budi Santoso pulih kembali ke: ${budiAfterReversal.points_balance} Poin (Buku Besar Rekonsiliasi: VALID)`);

  // Coba Reversal Kedua Kali pada Invoice yang Sama (Wajib Ditolak)
  try {
    await db.reversePointsForSale(saleBudi.invoice_number, 'Coba reversal kedua');
    throw new Error('Test 6 Gagal: Double reversal berhasil diproses.');
  } catch (err: any) {
    if (!err.message.includes('sudah pernah dibalikkan')) {
      throw err;
    }
    console.log(`✓ Double Reversal Berhasil Dicegah: "${err.message}"`);
  }

  // 7. PENYESUAIAN POIN MANUAL OLEH SUPER ADMIN (ADJUSTMENT)
  console.log('\n[TEST 7] Penyesuaian Poin Manual (ADJUSTMENT) dengan Jejak Audit');
  const balanceBeforeAdj = (await db.getMemberById(memberSiti.id))!.points_balance;

  // Super Admin memberikan bonus loyalitas kompensasi +50 poin kepada Siti Rahmawati
  const adjTx = await db.recordPointTransaction({
    member_id: memberSiti.id,
    transaction_type: 'ADJUSTMENT',
    points_delta: 50,
    reference_id: 'ADJ-ADM-2026-001',
    notes: 'Kompensasi Super Admin: Ulang Tahun Pelanggan',
    created_by: 'u-admin-01',
  });

  const sitiFinal = (await db.getMemberById(memberSiti.id))!;
  if (sitiFinal.points_balance !== balanceBeforeAdj + 50) {
    throw new Error(`Test 7 Gagal: Saldo penyesuaian poin manual tidak bertambah 50. Dapat: ${sitiFinal.points_balance}, Harusnya: ${balanceBeforeAdj + 50}`);
  }

  const recSitiFinal = await db.reconcileMemberPoints(memberSiti.id);
  if (!recSitiFinal.is_reconciled) {
    throw new Error('Test 7 Gagal: Rekonsiliasi akhir Siti Rahmawati gagal.');
  }
  console.log(`✓ Penyesuaian poin sukses (Delta: +50 Poin, Saldo Baru: ${sitiFinal.points_balance} Poin)`);
  console.log(`✓ Rekonsiliasi Akhir: ${recSitiFinal.total_transactions} transaksi mutasi buku besar tercatat 100% konsisten.`);

  console.log('\n--- ALL STAGE 5 ACCEPTANCE TESTS PASSED (100%) ---');
}

runStage5Tests().catch((err) => {
  console.error('\n❌ STAGE 5 TEST FAILED:', err);
  process.exit(1);
});
