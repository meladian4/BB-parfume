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

  // Step 2: Super Admin approves void
  const approvedSale = await db.approveSaleVoid(sale.id, superAdmin.id, 'Disetujui');
  assert.strictEqual(approvedSale.sale_status, 'VOIDED');
  assert.strictEqual(approvedSale.payment_status, 'CANCELLED');

  // Step 3: Verify Stock Rollback
  const finalBalance = await db.getInventoryBalance(storeKendal.id, prod.id);
  assert.strictEqual(finalBalance?.quantity, startQty, 'Stok harus kembali utuh setelah di-void');

  // Step 4: Verify Cash Session Rollback
  const sessionSummary = await db.getCashSessionSummary(session.id);
  assert.strictEqual(sessionSummary?.breakdown.cash.total, 0, 'Total kas harus 0 setelah nota di-void');

  // Close session
  await db.closeCashSession(session.id, { actual_cash: 200000 });

  console.log('✅ TEST VOID & SUPER ADMIN APPROVAL BERHASIL 100%!');
}

runVoidTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
