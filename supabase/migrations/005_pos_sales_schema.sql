-- ============================================================================
-- Migration 005: POS, Cash Sessions, Sales, Sale Items, Payments
-- BB Parfum Premium Management System
-- ============================================================================

-- 1. Cash Sessions Table (Laci kasir toko)
CREATE TABLE IF NOT EXISTS public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    cashier_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    opening_cash NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    closing_cash NUMERIC(15, 2),
    total_sales_cash NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    actual_cash NUMERIC(15, 2),
    difference NUMERIC(15, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    closed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_store_status ON public.cash_sessions(store_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_cashier ON public.cash_sessions(cashier_id);

-- 2. Basic Members Table (Tahap 4 & 5 Integration)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    points_balance INT NOT NULL DEFAULT 0,
    tier VARCHAR(50) NOT NULL DEFAULT 'SILVER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);

-- 3. Sales Header Table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    cashier_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    cash_session_id UUID REFERENCES public.cash_sessions(id) ON DELETE SET NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    final_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- Total snapshot HPP
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'REFUNDED', 'CANCELLED')),
    sale_status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (sale_status IN ('COMPLETED', 'CANCELLED', 'REFUNDED')),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

CREATE INDEX IF NOT EXISTS idx_sales_store_date ON public.sales(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON public.sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_member ON public.sales(member_id);
CREATE INDEX IF NOT EXISTS idx_sales_idempotency ON public.sales(idempotency_key);

-- 4. Sale Items Table (Snapshot Harga & HPP)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
    discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items(product_id);

-- 5. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'QRIS', 'TRANSFER', 'DEBIT')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    change_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (change_amount >= 0),
    payment_reference VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_sale ON public.payments(sale_id);
