-- ============================================================================
-- 004_purchases_and_transfers.sql
-- BB PARFUM PREMIUM MANAGEMENT SYSTEM
-- Purchases (PO Gudang Pusat), Stock Transfers, and Items
-- ============================================================================

-- 1. PURCHASES (PO Pembelian Supplier ke Gudang Pusat)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    destination_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED')),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    notes TEXT,
    ordered_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON public.purchases(created_at DESC);

-- 2. PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT uq_po_product UNIQUE(purchase_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_purchase_items_parent ON public.purchase_items(purchase_id);

-- 3. STOCK TRANSFERS (Surat Jalan & Mutasi Antar Cabang)
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    source_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    destination_store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_SHIPMENT' CHECK (
        status IN ('PENDING_SHIPMENT', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED')
    ),
    notes TEXT,
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    shipped_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    received_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Asal dan tujuan mutasi tidak boleh sama
    CONSTRAINT chk_different_stores CHECK (source_store_id <> destination_store_id)
);

CREATE INDEX IF NOT EXISTS idx_transfers_status ON public.stock_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfers_source ON public.stock_transfers(source_store_id);
CREATE INDEX IF NOT EXISTS idx_transfers_dest ON public.stock_transfers(destination_store_id);
CREATE INDEX IF NOT EXISTS idx_transfers_created_at ON public.stock_transfers(created_at DESC);

-- 4. STOCK TRANSFER ITEMS
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
    CONSTRAINT uq_transfer_product UNIQUE(stock_transfer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_parent ON public.stock_transfer_items(stock_transfer_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_purchases_updated_at ON public.purchases;
CREATE TRIGGER trigger_purchases_updated_at
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
