-- ============================================================================
-- 008_reconciliation_and_audit.sql
-- BB Parfum Premium Management System
-- Tahap 7: Views Rekonsiliasi Matematik & Penjagaan Integritas Audit Trail
-- ============================================================================

-- 1. View Rekonsiliasi Kartu Stok vs Saldo Inventaris
CREATE OR REPLACE VIEW v_inventory_reconciliation AS
SELECT 
    b.store_id,
    s.name AS store_name,
    s.code AS store_code,
    b.product_id,
    p.sku,
    p.name AS product_name,
    b.quantity AS balance_quantity,
    COALESCE(SUM(m.quantity_delta), 0) AS ledger_sum_quantity,
    (b.quantity - COALESCE(SUM(m.quantity_delta), 0)) AS quantity_discrepancy,
    CASE 
        WHEN b.quantity = COALESCE(SUM(m.quantity_delta), 0) THEN TRUE 
        ELSE FALSE 
    END AS is_reconciled
FROM inventory_balances b
JOIN stores s ON s.id = b.store_id
JOIN products p ON p.id = b.product_id
LEFT JOIN stock_movements m ON m.store_id = b.store_id AND m.product_id = b.product_id
GROUP BY b.store_id, s.name, s.code, b.product_id, p.sku, p.name, b.quantity;

-- 2. View Rekonsiliasi Saldo Poin Member vs Buku Besar Loyalty
CREATE OR REPLACE VIEW v_loyalty_reconciliation AS
SELECT 
    m.id AS member_id,
    m.name AS member_name,
    m.phone,
    m.points_balance AS current_balance,
    COALESCE(SUM(pt.points_delta), 0) AS ledger_sum_points,
    (m.points_balance - COALESCE(SUM(pt.points_delta), 0)) AS points_discrepancy,
    CASE 
        WHEN m.points_balance = COALESCE(SUM(pt.points_delta), 0) THEN TRUE 
        ELSE FALSE 
    END AS is_reconciled,
    COUNT(pt.id) AS total_ledger_transactions
FROM members m
LEFT JOIN point_transactions pt ON pt.member_id = m.id
GROUP BY m.id, m.name, m.phone, m.points_balance;

-- 3. View Rekonsiliasi Laci Kasir & Shift Kas
CREATE OR REPLACE VIEW v_cash_session_reconciliation AS
SELECT 
    cs.id AS session_id,
    cs.store_id,
    s.name AS store_name,
    cs.cashier_id,
    up.full_name AS cashier_name,
    cs.status,
    cs.opening_cash,
    cs.total_sales_cash,
    cs.expected_cash,
    cs.actual_closing_cash,
    cs.cash_difference,
    CASE 
        WHEN cs.status = 'CLOSED' AND (cs.cash_difference = 0 OR cs.cash_difference IS NULL) THEN TRUE
        WHEN cs.status = 'OPEN' THEN NULL
        ELSE FALSE
    END AS is_balanced,
    cs.opened_at,
    cs.closed_at
FROM cash_sessions cs
JOIN stores s ON s.id = cs.store_id
JOIN user_profiles up ON up.id = cs.cashier_id;

-- 4. Fungsi & Trigger untuk Mencegah Hard Delete pada Tabel Transaksi Finansial
CREATE OR REPLACE FUNCTION fn_prevent_financial_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Hard delete tidak diizinkan pada tabel transaksi keuangan (%). Gunakan koreksi reversal atau penyesuaian dengan jejak audit.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

-- Pasang pelindung anti hard-delete
DROP TRIGGER IF EXISTS trg_prevent_delete_sales ON sales;
CREATE TRIGGER trg_prevent_delete_sales
BEFORE DELETE ON sales
FOR EACH ROW EXECUTE FUNCTION fn_prevent_financial_hard_delete();

DROP TRIGGER IF EXISTS trg_prevent_delete_payments ON payments;
CREATE TRIGGER trg_prevent_delete_payments
BEFORE DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION fn_prevent_financial_hard_delete();

DROP TRIGGER IF EXISTS trg_prevent_delete_point_transactions ON point_transactions;
CREATE TRIGGER trg_prevent_delete_point_transactions
BEFORE DELETE ON point_transactions
FOR EACH ROW EXECUTE FUNCTION fn_prevent_financial_hard_delete();

DROP TRIGGER IF EXISTS trg_prevent_delete_stock_movements ON stock_movements;
CREATE TRIGGER trg_prevent_delete_stock_movements
BEFORE DELETE ON stock_movements
FOR EACH ROW EXECUTE FUNCTION fn_prevent_financial_hard_delete();
