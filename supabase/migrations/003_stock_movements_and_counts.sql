-- ============================================================================
-- 003_stock_movements_and_counts.sql
-- BB PARFUM PREMIUM MANAGEMENT SYSTEM
-- Stock Movement Ledger, Stock Opname, and Atomic Stock Procedures
-- ============================================================================

-- 1. STOCK MOVEMENTS LEDGER TABLE (Buku Besar Pergerakan Stok)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type VARCHAR(40) NOT NULL CHECK (
        movement_type IN (
            'PURCHASE_RECEIPT',
            'TRANSFER_OUT',
            'TRANSFER_IN',
            'SALE',
            'SALE_RETURN',
            'ADJUSTMENT',
            'STOCK_OPNAME'
        )
    ),
    reference_id VARCHAR(100), -- ID PO, Mutasi Transfer, atau Struk POS
    quantity_delta NUMERIC(12, 2) NOT NULL, -- Positif (masuk) atau Negatif (keluar)
    cost_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    balance_after NUMERIC(12, 2) NOT NULL CHECK (balance_after >= 0),
    moving_avg_cost_after NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_store_prod ON public.stock_movements(store_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON public.stock_movements(reference_id);

-- 2. STOCK COUNTS (Stock Opname Fisik)
CREATE TABLE IF NOT EXISTS public.stock_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    conducted_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_count_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_count_id UUID NOT NULL REFERENCES public.stock_counts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    system_quantity NUMERIC(12, 2) NOT NULL,
    physical_quantity NUMERIC(12, 2) NOT NULL CHECK (physical_quantity >= 0),
    difference_quantity NUMERIC(12, 2) NOT NULL,
    cost_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    CONSTRAINT uq_count_item UNIQUE(stock_count_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_count_items_parent ON public.stock_count_items(stock_count_id);

-- 3. STORED PROCEDURE FOR ATOMIC STOCK MOVEMENT WITH MOVING AVERAGE HPP
CREATE OR REPLACE FUNCTION public.execute_stock_movement_atomic(
    p_store_id UUID,
    p_product_id UUID,
    p_movement_type VARCHAR(40),
    p_quantity_delta NUMERIC(12, 2),
    p_cost_per_unit NUMERIC(15, 2),
    p_reference_id VARCHAR(100) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS TABLE (
    new_quantity NUMERIC(12, 2),
    new_moving_avg_cost NUMERIC(15, 2),
    movement_id UUID
) AS $$
DECLARE
    v_current_qty NUMERIC(12, 2) := 0;
    v_current_avg NUMERIC(15, 2) := 0;
    v_new_qty NUMERIC(12, 2);
    v_new_avg NUMERIC(15, 2);
    v_movement_id UUID;
BEGIN
    -- Kunci baris persediaan untuk mencegah race condition (Concurrency Lock)
    SELECT quantity, moving_avg_cost
    INTO v_current_qty, v_current_avg
    FROM public.inventory_balances
    WHERE store_id = p_store_id AND product_id = p_product_id
    FOR UPDATE;

    -- Jika belum ada baris saldo, buat baris awal
    IF NOT FOUND THEN
        v_current_qty := 0;
        v_current_avg := 0;
        INSERT INTO public.inventory_balances(store_id, product_id, quantity, moving_avg_cost, last_updated_at)
        VALUES (p_store_id, p_product_id, 0, 0, NOW());
    END IF;

    -- Hitung saldo baru
    v_new_qty := v_current_qty + p_quantity_delta;

    -- STRICT GUARD: Tolak jika kuantitas akhir menjadi minus / negatif
    IF v_new_qty < 0 THEN
        RAISE EXCEPTION 'TRANSAKSI DITOLAK: Saldo stok tidak mencukupi di lokasi ini. Tersedia: %, diminta potong: %',
            v_current_qty, ABS(p_quantity_delta);
    END IF;

    -- Kalkulasi HPP Moving Average:
    -- Jika barang masuk bertambah (quantity_delta > 0), perbarui HPP bergerak
    IF p_quantity_delta > 0 THEN
        IF (v_current_qty + p_quantity_delta) > 0 THEN
            v_new_avg := ROUND(
                (((v_current_qty * v_current_avg) + (p_quantity_delta * p_cost_per_unit)) / (v_current_qty + p_quantity_delta)),
                2
            );
        ELSE
            v_new_avg := p_cost_per_unit;
        END IF;
    ELSE
        -- Jika barang keluar (penjualan/mutasi keluar), HPP per unit tetap sama
        v_new_avg := v_current_avg;
    END IF;

    -- Update tabel saldo inventaris
    UPDATE public.inventory_balances
    SET quantity = v_new_qty,
        moving_avg_cost = v_new_avg,
        last_updated_at = NOW()
    WHERE store_id = p_store_id AND product_id = p_product_id;

    -- Masukkan ke buku besar pergerakan stok (immutable ledger)
    INSERT INTO public.stock_movements (
        store_id,
        product_id,
        movement_type,
        reference_id,
        quantity_delta,
        cost_per_unit,
        balance_after,
        moving_avg_cost_after,
        notes,
        created_by,
        created_at
    )
    VALUES (
        p_store_id,
        p_product_id,
        p_movement_type,
        p_reference_id,
        p_quantity_delta,
        p_cost_per_unit,
        v_new_qty,
        v_new_avg,
        p_notes,
        p_created_by,
        NOW()
    )
    RETURNING id INTO v_movement_id;

    RETURN QUERY SELECT v_new_qty, v_new_avg, v_movement_id;
END;
$$ LANGUAGE plpgsql;
