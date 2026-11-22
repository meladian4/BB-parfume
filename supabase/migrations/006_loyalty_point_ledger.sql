-- ============================================================================
-- Migration 006: Loyalty Point Ledger, Settings, and Point Transactions
-- BB Parfum Premium Management System
-- ============================================================================

-- 1. App Settings Table (Konfigurasi Loyalty & Sistem)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

-- Default Loyalty Configuration:
-- spend_per_point: Belanja kelipatan Rp 10.000 dapat 1 Poin (EARN)
-- point_value_idr: 1 Poin bernilai diskon Rp 1.000 (REDEEM)
-- min_redeem_points: Minimal 10 poin untuk penukaran
INSERT INTO public.app_settings (key, value, description)
VALUES 
    ('loyalty_config', '{"spend_per_point": 10000, "point_value_idr": 1000, "min_redeem_points": 10, "is_active": true}'::jsonb, 'Konfigurasi program loyalitas BB Parfum Kendal')
ON CONFLICT (key) DO NOTHING;

-- 2. Point Transaction Ledger Table (Immutable)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('EARN', 'REDEEM', 'REVERSAL', 'ADJUSTMENT')),
    points_delta INT NOT NULL, -- Positif untuk EARN/ADJUSTMENT+, Negatif untuk REDEEM/ADJUSTMENT-
    balance_after INT NOT NULL CHECK (balance_after >= 0), -- Saldo setelah mutasi, dilarang negatif
    reference_id VARCHAR(100), -- Invoice number atau kode koreksi
    notes TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Jakarta', now())
);

CREATE INDEX IF NOT EXISTS idx_point_tx_member ON public.point_transactions(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_tx_ref ON public.point_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_type ON public.point_transactions(transaction_type);
