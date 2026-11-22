-- ============================================================================
-- 002_products_inventory_schema.sql
-- BB PARFUM PREMIUM MANAGEMENT SYSTEM
-- Categories, Products, Suppliers, and Inventory Balances
-- ============================================================================

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(60) UNIQUE NOT NULL,
    barcode VARCHAR(60) UNIQUE,
    name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    size_ml INT NOT NULL CHECK (size_ml > 0),
    scent_type VARCHAR(60) NOT NULL, -- e.g. 'Extrait de Parfum', 'Eau de Parfum', 'Eau de Toilette'
    top_notes TEXT,
    middle_notes TEXT,
    base_notes TEXT,
    base_price NUMERIC(15, 2) NOT NULL CHECK (base_price >= 0),
    min_stock_alert INT NOT NULL DEFAULT 5 CHECK (min_stock_alert >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- 3. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(40),
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INVENTORY BALANCES TABLE
-- Saldo stok multi-lokasi yang dilindungi constraint anti-stok negatif
CREATE TABLE IF NOT EXISTS public.inventory_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    moving_avg_cost NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (moving_avg_cost >= 0),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_store_product_balance UNIQUE(store_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_store_prod ON public.inventory_balances(store_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON public.inventory_balances(quantity);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
