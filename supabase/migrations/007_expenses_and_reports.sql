-- ============================================================================
-- Migration 007: Operational Expenses & Financial Reporting
-- BB Parfum Premium Management System
-- ============================================================================

-- 1. Operational Expenses Table (Biaya Operasional Toko & Gudang)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'SALARY',        -- Gaji Karyawan / Bonus Kasir
        'UTILITIES',     -- Listrik, Air, Internet Cabang
        'RENT',          -- Sewa Ruko / Toko
        'PACKAGING',     -- Paper bag parfum, botol tester, box luxury
        'MARKETING',     -- Iklan lokal / Banner promosi
        'MAINTENANCE',   -- Kebersihan, perbaikan AC, perawatan toko
        'OTHER'          -- Biaya operasional lain-lain
    )),
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    receipt_url TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

CREATE INDEX IF NOT EXISTS idx_expenses_store_date ON public.expenses(store_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
