-- ============================================================================
-- seed.sql
-- BB PARFUM PREMIUM MANAGEMENT SYSTEM
-- Seed Master Locations: 1 Warehouse + 3 Stores in Kendal, Indonesia
-- Master Categories and Initial Premium Perfume Products
-- ============================================================================

-- 1. STORES & WAREHOUSE SEED
INSERT INTO public.stores (id, code, name, type, address, phone, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'WH-KENDAL-01', 'Gudang Pusat Distribusi Kendal', 'WAREHOUSE', 'Jl. Sukarno-Hatta No. 88, Kebondalem, Kendal', '0812-3344-5501', true),
    ('a0000000-0000-0000-0000-000000000002', 'STORE-KDL-01', 'BB Parfum Toko 1 - Kendal Kota', 'STORE', 'Jl. Pemuda No. 12A, Kendal Kota', '0812-3344-5502', true),
    ('a0000000-0000-0000-0000-000000000003', 'STORE-PGD-02', 'BB Parfum Toko 2 - Pegandon', 'STORE', 'Jl. Raya Pegandon No. 28, Pegandon, Kendal', '0812-3344-5503', true),
    ('a0000000-0000-0000-0000-000000000004', 'STORE-KLW-03', 'BB Parfum Toko 3 - Kaliwungu', 'STORE', 'Jl. Raya Timur Kaliwungu No. 15, Kaliwungu, Kendal', '0812-3344-5504', true)
ON CONFLICT (code) DO NOTHING;

-- 2. CATEGORIES SEED
INSERT INTO public.categories (id, name, slug, description)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Signature Collection', 'signature-collection', 'Parfum eksklusif racikan signature BB Parfum tahan 12+ jam'),
    ('c0000000-0000-0000-0000-000000000002', 'Floral & Fresh', 'floral-fresh', 'Aroma segar bunga musim semi dengan aksen citrus yang mewah'),
    ('c0000000-0000-0000-0000-000000000003', 'Woody & Oriental', 'woody-oriental', 'Sentuhan kayu oud, cendana, amber, dan rempah hangat elegan'),
    ('c0000000-0000-0000-0000-000000000004', 'Gourmand & Sweet', 'gourmand-sweet', 'Aroma manis vanila Madagaskar, karamel, dan roasted coffee beans')
ON CONFLICT (slug) DO NOTHING;

-- 3. PRODUCTS SEED
INSERT INTO public.products (id, sku, barcode, name, category_id, size_ml, scent_type, top_notes, middle_notes, base_notes, base_price, min_stock_alert, is_active)
VALUES
    (
        'p0000000-0000-0000-0000-000000000001',
        'BBP-SIG-VELVET-50',
        '899123456001',
        'BB Royal Velvet Oud 50ml',
        'c0000000-0000-0000-0000-000000000001',
        50,
        'Extrait de Parfum',
        'Bergamot, Saffron',
        'Bulgarian Rose, Amberwood',
        'Agarwood (Oud), White Musk',
        185000,
        10,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000002',
        'BBP-SIG-GOLD-100',
        '899123456002',
        'BB Imperial Gold Reserve 100ml',
        'c0000000-0000-0000-0000-000000000001',
        100,
        'Extrait de Parfum',
        'Blood Orange, Pink Pepper',
        'Orris, Jasmine Sambac',
        'Cedarwood, Madagascar Vanilla',
        275000,
        5,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000003',
        'BBP-FLO-BLOOM-50',
        '899123456003',
        'BB Kendal Blossom Breeze 50ml',
        'c0000000-0000-0000-0000-000000000002',
        50,
        'Eau de Parfum',
        'Peony, Mandarine',
        'Damask Rose, Apricot',
        'Soft Musk, Patchouli',
        145000,
        8,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000004',
        'BBP-GOU-VANIL-50',
        '899123456004',
        'BB Midnight Vanilla Bean 50ml',
        'c0000000-0000-0000-0000-000000000004',
        50,
        'Extrait de Parfum',
        'Almond, Coconut Nectar',
        'Tonka Bean, Heliotrope',
        'Bourbon Vanilla, Caramel Sandalwood',
        165000,
        8,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000005',
        'BBP-WOD-SANTAL-50',
        '899123456005',
        'BB Santal Kendalense 50ml',
        'c0000000-0000-0000-0000-000000000003',
        50,
        'Eau de Parfum',
        'Cardamom, Violet Leaf',
        'Papyrus, Iris',
        'Australian Sandalwood, Amber, Leather',
        175000,
        6,
        true
    )
ON CONFLICT (sku) DO NOTHING;

-- 4. SUPPLIERS SEED
INSERT INTO public.suppliers (id, code, name, contact_person, phone, email, address, is_active)
VALUES
    ('s0000000-0000-0000-0000-000000000001', 'SUP-GRA-01', 'PT Grasse Fragrance Indonesia', 'Bpk. Hendrawan', '0811-9988-7711', 'order@grasse.co.id', 'Kawasan Industri Candi, Semarang', true),
    ('s0000000-0000-0000-0000-000000000002', 'SUP-BOT-02', 'CV Botol Prima Perkasa', 'Ibu Diana', '0812-4455-6677', 'sales@botolprima.com', 'Krapyak, Semarang Barat', true)
ON CONFLICT (code) DO NOTHING;
