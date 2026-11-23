import assert from 'node:assert';
import { db } from '../src/lib/db/repository';

async function runVoidTest() {
  console.log('Testing Void & Approval workflow...');
  db._resetForTesting();

  // Setup: get store and product
  const storeKendal = (await db.getStores()).find((s) => s.code === 'STORE-KDL-01')!;
  const cashierKendal = (await db.getUserProfiles()).find((u) => u.email === 'kasir.kendal@bbparfum.id')!;
  const superAdmin = (await db.getUserProfiles()).find((u) => u.role === 'SUPER_ADMIN')!;
  const products = await db.getProducts();
  const prod = products[0];

  // Open a cash session
  const session = await db.openCashSession({
    store_id: storeKendal.id,
    cashier_id: cashierKendal.id,
    opening_cash: 200000,
    notes: 'Shift Testing Void',
  });

  // Get initial stock
  const initialBalance = await db.getInventoryBalance(storeKendal.id, prod.id);
  const startQty = initialBalance ? initialBalance.quantity : 0;

  // Make a sale
  const sale = await db.processSaleCheckout({
    store_id: storeKendal.id,
    cashier_id: cashierKendal.id,
    cash_session_id: session.id,
    items: [
      {
        product_id: prod.id,
        quantity: 2,
        unit_price: prod.base_price,
        discount_amount: 0,
      },
    ],
    payment: {
      payment_method: 'CASH',
      amount: prod.base_price * 2,
    },
    idempotency_key: `test-void-${Date.now()}`,
  });

  assert.strictEqual(sale.sale_status, 'COMPLETED');
  const midBalance = await db.getInventoryBalance(storeKendal.id, prod.id);
  assert.strictEqual(midBalance?.quantity, startQty - 2, 'Stok harus berkurang 2 saat checkout');

  // Step 1: Cashier requests void
  const requestedSale = await db.requestSaleVoid(sale.id, cashierKendal.id, 'Salah input varian');
  assert.strictEqual(requestedSale.sale_status, 'VOID_PENDING');
  assert.strictEqual(requestedSale.void_reason, 'Salah input varian');

  // SAFEGUARD TEST 1: POS harus terkunci saat pengajuan VOID_PENDING
  const lockStatusVoid = await db.checkStorePosLockStatus(storeKendal.id);
  assert.strictEqual(lockStatusVoid.is_locked, true, 'POS harus terkunci saat ada pengajuan void pending');
  assert.strictEqual(lockStatusVoid.lock_type, 'PENDING_VOID');

  let voidLockThrew = false;
  try {
    await db.processSaleCheckout({
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      cash_session_id: session.id,
      items: [{ product_id: prod.id, quantity: 1, unit_price: prod.base_price }],
      payment: { payment_method: 'CASH', amount: prod.base_price },
      idempotency_key: `test-locked-void-${Date.now()}`,
    });
  } catch (err: any) {
    voidLockThrew = true;
    assert.match(err.message, /TRANSAKSI POS DIKUNCI/);
  }
  assert.strictEqual(voidLockThrew, true, 'processSaleCheckout harus melempar error saat POS terkunci');

  // Step 2: Super Admin approves void
  const approvedSale = await db.approveSaleVoid(sale.id, superAdmin.id, 'Disetujui');
  assert.strictEqual(approvedSale.sale_status, 'VOIDED');
  assert.strictEqual(approvedSale.payment_status, 'CANCELLED');

  // Verifikasi POS tidak lagi terkunci setelah approval void
  const lockStatusAfterVoidApproval = await db.checkStorePosLockStatus(storeKendal.id);
  assert.strictEqual(lockStatusAfterVoidApproval.is_locked, false, 'POS harus terbuka kembali setelah void disetujui');

  // Step 3: Verify Stock Rollback
  const finalBalance = await db.getInventoryBalance(storeKendal.id, prod.id);
  assert.strictEqual(finalBalance?.quantity, startQty, 'Stok harus kembali utuh setelah di-void');

  // Step 4: Verify Cash Session Rollback
  const sessionSummary = await db.getCashSessionSummary(session.id);
  assert.strictEqual(sessionSummary?.breakdown.cash.total, 0, 'Total kas harus 0 setelah nota di-void');

  // SAFEGUARD TEST 2: POS harus terkunci saat pengajuan SETOR KAS (Cash Deposit) PENDING
  // Buka transaksi sukses terlebih dahulu untuk menghasilkan kas
  await db.processSaleCheckout({
    store_id: storeKendal.id,
    cashier_id: cashierKendal.id,
    cash_session_id: session.id,
    items: [{ product_id: prod.id, quantity: 1, unit_price: prod.base_price }],
    payment: { payment_method: 'CASH', amount: prod.base_price },
    idempotency_key: `test-pre-deposit-${Date.now()}`,
  });

  const deposit = await db.createCashDeposit({
    store_id: storeKendal.id,
    cashier_id: cashierKendal.id,
    cashier_name: cashierKendal.full_name,
    amount: 50000,
    deposit_method: 'CASH_HANDOVER',
    notes: 'Setor kas uji safeguard',
  });
  assert.strictEqual(deposit.status, 'PENDING');

  const lockStatusDeposit = await db.checkStorePosLockStatus(storeKendal.id);
  assert.strictEqual(lockStatusDeposit.is_locked, true, 'POS harus terkunci saat ada pengajuan setor kas pending');
  assert.strictEqual(lockStatusDeposit.lock_type, 'PENDING_DEPOSIT');

  let depositLockThrew = false;
  try {
    await db.processSaleCheckout({
      store_id: storeKendal.id,
      cashier_id: cashierKendal.id,
      cash_session_id: session.id,
      items: [{ product_id: prod.id, quantity: 1, unit_price: prod.base_price }],
      payment: { payment_method: 'CASH', amount: prod.base_price },
      idempotency_key: `test-locked-deposit-${Date.now()}`,
    });
  } catch (err: any) {
    depositLockThrew = true;
    assert.match(err.message, /TRANSAKSI POS DIKUNCI/);
  }
  assert.strictEqual(depositLockThrew, true, 'processSaleCheckout harus melempar error saat setor kas pending');

  // SAFEGUARD TEST 3: Buka shift laci kasir baru harus ditolak jika masih ada setor kas pending
  let openSessionThrew = false;
  try {
    await db.openCashSession({
      store_id: storeKendal.id,
      cashier_id: 'other-cashier-id',
      opening_cash: 50000,
    });
  } catch (err: any) {
    openSessionThrew = true;
    assert.match(err.message, /BUKA SHIFT DITOLAK/);
  }
  assert.strictEqual(openSessionThrew, true, 'openCashSession harus ditolak saat masih ada setor kas pending');

  // Super Admin approves cash deposit
  await db.approveCashDeposit(deposit.id, superAdmin.id);
  const lockStatusAfterDepositApproval = await db.checkStorePosLockStatus(storeKendal.id);
  assert.strictEqual(lockStatusAfterDepositApproval.is_locked, false, 'POS harus terbuka kembali setelah setor kas disetujui');

  // Close session
  await db.closeCashSession(session.id, { actual_cash: 200000 });

  console.log('✅ TEST VOID & SUPER ADMIN APPROVAL BERHASIL 100%!');
}

runVoidTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
