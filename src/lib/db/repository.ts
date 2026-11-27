// ============================================================================
// Database Repository Layer
// BB Parfum Premium Management System
// ============================================================================

import { hashPassword, isPasswordHashed, verifyPassword } from '@/lib/auth/crypto';
import {
  Store,
  UserProfile,
  ProductCategory,
  Product,
  InventoryBalance,
  AuditLog,
  StockMovement,
  StockMovementType,
  StockCount,
  StockCountItem,
  Supplier,
  Purchase,
  PurchaseItem,
  PurchaseStatus,
  StockTransfer,
  StockTransferItem,
  StockTransferStatus,
  CashSession,
  CashSessionStatus,
  CashDeposit,
  CashDepositStatus,
  CashDepositMethod,
  PosLockStatus,
  Member,
  PaymentMethod,
  PaymentStatus,
  SaleStatus,
  SaleItem,
  Payment,
  Sale,
  PointTransaction,
  PointTransactionType,
  LoyaltyConfig,
  AppSetting,
  Expense,
  ExpenseCategory,
  StoreFinancialMetric,
  FinancialReportSummary,
  CompanyWalletTransaction,
  CompanyWalletSummary,
  WalletTransactionType,
  CategorySalesSummary,
  StoreTransactionSummary,
} from '@/types/domain';

// Initial Official Master Stores
const INITIAL_STORES: Store[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    code: 'WH-KENDAL-01',
    name: 'Gudang Pusat Distribusi Kendal',
    type: 'WAREHOUSE',
    address: 'Jl. Sukarno-Hatta No. 88, Kebondalem, Kendal',
    phone: '0812-3344-5501',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    code: 'STORE-KDL-01',
    name: 'BB Parfum Toko 1 - Kendal Kota',
    type: 'STORE',
    address: 'Jl. Pemuda No. 12A, Kendal Kota',
    phone: '0812-3344-5502',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    code: 'STORE-PGD-02',
    name: 'BB Parfum Toko 2 - Pegandon',
    type: 'STORE',
    address: 'Jl. Raya Pegandon No. 28, Pegandon, Kendal',
    phone: '0812-3344-5503',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    code: 'STORE-KLW-03',
    name: 'BB Parfum Toko 3 - Kaliwungu',
    type: 'STORE',
    address: 'Jl. Raya Timur Kaliwungu No. 15, Kaliwungu, Kendal',
    phone: '0812-3344-5504',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
];

// Initial Categories
const INITIAL_CATEGORIES: ProductCategory[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000010',
    name: 'Bibit Parfum (Fragrance Oil)',
    slug: 'bibit-parfum',
    description: 'Bibit parfum murni konsentrat tinggi untuk racikan & isi ulang refill',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000020',
    name: 'Pelarut & Campuran (Alkohol / Absolute)',
    slug: 'pelarut-campuran',
    description: 'Bahan pelarut racikan: Absolute prima, alkohol food grade, fixative pengawet aroma',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000030',
    name: 'Botol & Kemasan Kosong',
    slug: 'botol-kemasan',
    description: 'Botol kosong spray & roll-on ukuran 6ml, 30ml, 50ml, 100ml',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Signature Collection',
    slug: 'signature-collection',
    description: 'Parfum eksklusif racikan signature BB Parfum tahan 12+ jam',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    name: 'Floral & Fresh',
    slug: 'floral-fresh',
    description: 'Aroma segar bunga musim semi dengan aksen citrus yang mewah',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    name: 'Woody & Oriental',
    slug: 'woody-oriental',
    description: 'Sentuhan kayu oud, cendana, amber, dan rempah hangat elegan',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    name: 'Gourmand & Sweet',
    slug: 'gourmand-sweet',
    description: 'Aroma manis vanila Madagaskar, karamel, dan roasted coffee beans',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
];

// Initial Master Perfumes
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p0000000-0000-0000-0000-000000000001',
    sku: 'BBP-SIG-VELVET-50',
    barcode: '899123456001',
    name: 'BB Royal Velvet Oud 50ml',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    size_ml: 50,
    scent_type: 'Extrait de Parfum',
    top_notes: 'Bergamot, Saffron',
    middle_notes: 'Bulgarian Rose, Amberwood',
    base_notes: 'Agarwood (Oud), White Musk',
    base_price: 185000,
    min_stock_alert: 10,
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000002',
    sku: 'BBP-SIG-GOLD-100',
    barcode: '899123456002',
    name: 'BB Imperial Gold Reserve 100ml',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    size_ml: 100,
    scent_type: 'Extrait de Parfum',
    top_notes: 'Blood Orange, Pink Pepper',
    middle_notes: 'Orris, Jasmine Sambac',
    base_notes: 'Cedarwood, Madagascar Vanilla',
    base_price: 275000,
    min_stock_alert: 5,
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000003',
    sku: 'BBP-FLO-BLOOM-50',
    barcode: '899123456003',
    name: 'BB Kendal Blossom Breeze 50ml',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    size_ml: 50,
    scent_type: 'Eau de Parfum',
    top_notes: 'Peony, Mandarine',
    middle_notes: 'Damask Rose, Apricot',
    base_notes: 'Soft Musk, Patchouli',
    base_price: 145000,
    min_stock_alert: 8,
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000004',
    sku: 'BBP-GOU-VANIL-50',
    barcode: '899123456004',
    name: 'BB Midnight Vanilla Bean 50ml',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    size_ml: 50,
    scent_type: 'Extrait de Parfum',
    top_notes: 'Almond, Coconut Nectar',
    middle_notes: 'Tonka Bean, Heliotrope',
    base_notes: 'Bourbon Vanilla, Caramel Sandalwood',
    base_price: 165000,
    min_stock_alert: 8,
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000005',
    sku: 'BBP-WOD-SANTAL-50',
    barcode: '899123456005',
    name: 'BB Santal Kendalense 50ml',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    size_ml: 50,
    scent_type: 'Eau de Parfum',
    top_notes: 'Cardamom, Violet Leaf',
    middle_notes: 'Papyrus, Iris',
    base_notes: 'Australian Sandalwood, Amber, Leather',
    base_price: 175000,
    min_stock_alert: 6,
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
];

// Initial Initial Profiles for Role Testing
const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    email: 'admin@bbparfum.id',
    full_name: 'Super Admin Utama',
    role: 'SUPER_ADMIN',
    assigned_store_id: null,
    is_active: true,
    is_locked: false,
    failed_login_attempts: 0,
    locked_at: null,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    email: 'logistik@bbparfum.id',
    full_name: 'Manajer Logistik Kendal',
    role: 'LOGISTICS',
    assigned_store_id: 'a0000000-0000-0000-0000-000000000001', // Gudang Pusat
    is_active: true,
    is_locked: false,
    failed_login_attempts: 0,
    locked_at: null,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000003',
    email: 'kasir.kendal@bbparfum.id',
    full_name: 'Kasir Toko Kendal Kota',
    role: 'CASHIER',
    assigned_store_id: 'a0000000-0000-0000-0000-000000000002', // Toko Kendal Kota
    employee_1_name: 'Karyawan 1 - Kendal Kota',
    employee_2_name: 'Karyawan 2 - Kendal Kota',
    is_active: true,
    is_locked: false,
    failed_login_attempts: 0,
    locked_at: null,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000004',
    email: 'kasir.pegandon@bbparfum.id',
    full_name: 'Kasir Toko Pegandon',
    role: 'CASHIER',
    assigned_store_id: 'a0000000-0000-0000-0000-000000000003', // Toko Pegandon
    employee_1_name: 'Karyawan 1 - Pegandon',
    employee_2_name: 'Karyawan 2 - Pegandon',
    is_active: true,
    is_locked: false,
    failed_login_attempts: 0,
    locked_at: null,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000005',
    email: 'kasir.kaliwungu@bbparfum.id',
    full_name: 'Kasir Toko Kaliwungu',
    role: 'CASHIER',
    assigned_store_id: 'a0000000-0000-0000-0000-000000000004', // Toko Kaliwungu
    employee_1_name: 'Karyawan 1 - Kaliwungu',
    employee_2_name: 'Karyawan 2 - Kaliwungu',
    is_active: true,
    is_locked: false,
    failed_login_attempts: 0,
    locked_at: null,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
];

// Initial Suppliers
const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's0000000-0000-0000-0000-000000000001',
    code: 'SUP-GRA-01',
    name: 'PT Grasse Fragrance Indonesia',
    contact_person: 'Bpk. Hendrawan',
    phone: '0811-9988-7711',
    email: 'order@grasse.co.id',
    address: 'Kawasan Industri Candi, Semarang',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 's0000000-0000-0000-0000-000000000002',
    code: 'SUP-BOT-02',
    name: 'CV Botol Prima Perkasa',
    contact_person: 'Ibu Diana',
    phone: '0812-4455-6677',
    email: 'sales@botolprima.com',
    address: 'Krapyak, Semarang Barat',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
];

// Initial Loyalty Members
const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm0000000-0000-0000-0000-000000000001',
    name: 'Budi Santoso',
    phone: '081234567890',
    email: 'budi.santoso@gmail.com',
    points_balance: 150,
    tier: 'GOLD',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'm0000000-0000-0000-0000-000000000002',
    name: 'Siti Rahmawati',
    phone: '081398765432',
    email: 'siti.rahma@yahoo.com',
    points_balance: 75,
    tier: 'SILVER',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'm0000000-0000-0000-0000-000000000003',
    name: 'Ahmad Dahlan',
    phone: '085712345678',
    email: 'ahmad.dahlan@outlook.com',
    points_balance: 200,
    tier: 'PLATINUM',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
];

// Initial Expenses
const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-0001',
    store_id: 'a0000000-0000-0000-0000-000000000002', // Kendal Kota
    expense_date: '2026-10-01',
    category: 'UTILITIES',
    description: 'Tagihan Listrik PLN & Internet WiFi Toko Kendal Kota Bulan Oktober',
    amount: 1250000,
    receipt_url: null,
    created_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: new Date('2026-10-01T08:00:00Z').toISOString(),
    updated_at: new Date('2026-10-01T08:00:00Z').toISOString(),
  },
  {
    id: 'exp-0002',
    store_id: 'a0000000-0000-0000-0000-000000000003', // Pegandon
    expense_date: '2026-10-02',
    category: 'PACKAGING',
    description: 'Pita & Paper Bag Luxury Gold 200 pcs Cabang Pegandon',
    amount: 600000,
    receipt_url: null,
    created_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: new Date('2026-10-02T10:00:00Z').toISOString(),
    updated_at: new Date('2026-10-02T10:00:00Z').toISOString(),
  },
  {
    id: 'exp-0003',
    store_id: 'a0000000-0000-0000-0000-000000000004', // Kaliwungu
    expense_date: '2026-10-03',
    category: 'MAINTENANCE',
    description: 'Service Rutin AC & Pembersihan Display Toko Kaliwungu',
    amount: 350000,
    receipt_url: null,
    created_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: new Date('2026-10-03T09:30:00Z').toISOString(),
    updated_at: new Date('2026-10-03T09:30:00Z').toISOString(),
  },
  {
    id: 'exp-0004',
    store_id: 'a0000000-0000-0000-0000-000000000002', // Kendal Kota
    expense_date: '2026-10-04',
    category: 'OTHER',
    description: 'Beli Kertas Roll Thermal Kasir (10 Roll) & Lakban Packing Toko',
    amount: 85000,
    receipt_url: null,
    created_by: 'u0000000-0000-0000-0000-000000000003', // Kasir Toko Kendal Kota
    created_at: new Date('2026-10-04T11:15:00Z').toISOString(),
    updated_at: new Date('2026-10-04T11:15:00Z').toISOString(),
  },
];

class MemoryDatabaseState {
  stores: Store[] = [...INITIAL_STORES];
  categories: ProductCategory[] = [...INITIAL_CATEGORIES];
  products: Product[] = [];
  profiles: UserProfile[] = [...INITIAL_PROFILES];
  suppliers: Supplier[] = [...INITIAL_SUPPLIERS];
  purchases: Purchase[] = [];
  purchaseItems: PurchaseItem[] = [];
  stockTransfers: StockTransfer[] = [];
  stockTransferItems: StockTransferItem[] = [];
  inventoryBalances: InventoryBalance[] = [];
  stockMovements: StockMovement[] = [];
  stockCounts: StockCount[] = [];
  stockCountItems: StockCountItem[] = [];
  auditLogs: AuditLog[] = [];
  isTestMode: boolean = false;
  
  // POS, Cash Sessions & Sales
  cashSessions: CashSession[] = [];
  cashDeposits: CashDeposit[] = [];
  members: Member[] = [...INITIAL_MEMBERS];
  sales: Sale[] = [];
  saleItems: SaleItem[] = [];
  payments: Payment[] = [];
  idempotencyKeys: Set<string> = new Set();

  // Loyalty Program & Ledger
  loyaltyConfig: LoyaltyConfig = {
    spend_per_point: 30000,
    points_per_step: 1500,
    point_value_idr: 1,
    min_redeem_points: 1500,
    is_active: true,
  };
  pointTransactions: PointTransaction[] = [];

  // Operational Expenses
  expenses: Expense[] = [...INITIAL_EXPENSES];
  passwords: Map<string, string> = new Map([
    ['u0000000-0000-0000-0000-000000000001', 'berkahbarokahamiin'],
    ['u0000000-0000-0000-0000-000000000002', 'logistikkendal1'],
    ['u0000000-0000-0000-0000-000000000003', 'bbkendal1'],
    ['u0000000-0000-0000-0000-000000000004', 'bbpegandon1'],
    ['u0000000-0000-0000-0000-000000000005', 'bbkaliwungu1'],
  ]);

  // Company Master Wallet Ledger
  companyWalletTransactions: CompanyWalletTransaction[] = [];

  // Async Non-Blocking Persistence Queue
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private isWritingFile: boolean = false;
  private pendingSave: boolean = false;
  private hasDirtyState: boolean = false;
  private shutdownHookRegistered: boolean = false;

  constructor(withInitialStock: boolean = false, withInitialProducts: boolean = false) {
    this.products = withInitialProducts ? [...INITIAL_PRODUCTS] : [];
    this.initInventory(withInitialStock);
    this.initLoyaltyLedger();
    this.initCompanyWallet();
    this.loadFromFile();
  }

  private initCompanyWallet() {
    if (this.companyWalletTransactions.length === 0) {
      this.companyWalletTransactions.push({
        id: 'wtx-init-capital-001',
        transaction_type: 'CAPITAL_INJECTION',
        amount: 150000000,
        balance_after: 150000000,
        category: 'Modal Awal',
        reference_id: 'CAPITAL-INITIAL-001',
        description: 'Suntikan Modal Kas Awal Usaha dari Pemilik (Owner)',
        operator: 'Super Admin (Owner)',
        created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
      });
    }
  }

  private initLoyaltyLedger() {
    this.pointTransactions = [];
    for (const member of this.members) {
      if (member.points_balance > 0) {
        this.pointTransactions.push({
          id: `pt-init-${member.id.slice(0, 8)}`,
          member_id: member.id,
          transaction_type: 'EARN',
          points_delta: member.points_balance,
          balance_after: member.points_balance,
          reference_id: 'INIT-LOYALTY-MIGRATION',
          notes: 'Saldo Awal Migrasi Loyalty Member',
          created_by: null,
          created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
          member: member,
        });
      }
    }
  }

  initInventory(withInitialStock: boolean = false) {
    this.inventoryBalances = [];
    this.stockMovements = [];
    // Generate initial inventory balances for all store-product combinations (default: 0 pcs / dikosongkan)
    for (const store of this.stores) {
      for (const prod of this.products) {
        const qty = withInitialStock ? (store.type === 'WAREHOUSE' ? 100 : 25) : 0;
        const avgCost = withInitialStock ? Math.round(prod.base_price * 0.45) : 0;
        this.inventoryBalances.push({
          id: `inv-${store.id.slice(0, 8)}-${prod.id.slice(0, 8)}`,
          store_id: store.id,
          product_id: prod.id,
          quantity: qty,
          moving_avg_cost: avgCost,
          last_updated_at: new Date().toISOString(),
          product: prod,
          store: store,
        });

        // Initial opening stock movement only recorded if quantity > 0
        if (qty > 0) {
          this.stockMovements.push({
            id: `mov-init-${store.id.slice(0, 8)}-${prod.id.slice(0, 8)}`,
            store_id: store.id,
            product_id: prod.id,
            movement_type: store.type === 'WAREHOUSE' ? 'PURCHASE_RECEIPT' : 'TRANSFER_IN',
            reference_id: store.type === 'WAREHOUSE' ? 'PO-INITIAL-001' : 'TR-INITIAL-001',
            quantity_delta: qty,
            cost_per_unit: avgCost,
            balance_after: qty,
            moving_avg_cost_after: avgCost,
            notes: store.type === 'WAREHOUSE' ? 'Saldo Awal Pembelian Supplier' : 'Saldo Awal Distribusi Cabang',
            created_by: null,
            created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
            product: prod,
            store: store,
          });
        }
      }
    }
  }

  reset(withInitialStock: boolean = false, withInitialProducts: boolean = false) {
    this.stores = [...INITIAL_STORES];
    this.categories = [...INITIAL_CATEGORIES];
    this.products = withInitialProducts ? [...INITIAL_PRODUCTS] : [];
    this.profiles = [...INITIAL_PROFILES];
    this.suppliers = [...INITIAL_SUPPLIERS];
    this.purchases = [];
    this.purchaseItems = [];
    this.stockTransfers = [];
    this.stockTransferItems = [];
    this.inventoryBalances = [];
    this.stockMovements = [];
    this.stockCounts = [];
    this.stockCountItems = [];
    this.auditLogs = [];
    this.cashSessions = [];
    this.members = [...INITIAL_MEMBERS];
    this.sales = [];
    this.saleItems = [];
    this.payments = [];
    this.idempotencyKeys = new Set();
    this.loyaltyConfig = {
      spend_per_point: 30000,
      points_per_step: 1500,
      point_value_idr: 1,
      min_redeem_points: 1500,
      is_active: true,
    };
    this.pointTransactions = [];
    this.expenses = [...INITIAL_EXPENSES];
    this.initInventory(withInitialStock);
    this.initLoyaltyLedger();
  }

  resetToCleanSlate() {
    this.stores = [...INITIAL_STORES];
    this.categories = [...INITIAL_CATEGORIES];
    this.products = [];
    this.profiles = [...INITIAL_PROFILES];
    this.suppliers = [...INITIAL_SUPPLIERS];
    this.purchases = [];
    this.purchaseItems = [];
    this.stockTransfers = [];
    this.stockTransferItems = [];
    this.inventoryBalances = [];
    this.stockMovements = [];
    this.stockCounts = [];
    this.stockCountItems = [];
    this.auditLogs = [
      {
        id: `log-reset-${Date.now()}`,
        action: 'SYSTEM_WIPE_ALL_DATA',
        entity_name: 'database',
        entity_id: 'ALL',
        new_data: { message: 'Database direset bersih ke titik 0 untuk input manual owner' },
        created_at: new Date().toISOString(),
      },
    ];
    this.cashSessions = [];
    this.members = [...INITIAL_MEMBERS].map((m) => ({ ...m, points_balance: 0 }));
    this.sales = [];
    this.saleItems = [];
    this.payments = [];
    this.idempotencyKeys = new Set();
    this.loyaltyConfig = {
      spend_per_point: 30000,
      points_per_step: 1500,
      point_value_idr: 1,
      min_redeem_points: 1500,
      is_active: true,
    };
    this.pointTransactions = [];
    this.expenses = [];
    this.saveToFile();
  }

  private shouldSkipPersistence(): boolean {
    if (this.isTestMode) return true;
    if (typeof window !== 'undefined') return true;
    if (process.env.NODE_ENV === 'test' || process.env.IS_ACCEPTANCE_TEST === 'true') return true;
    if (typeof process !== 'undefined' && process.argv && process.argv.some((a) => a.includes('tests/'))) return true;
    return false;
  }

  private buildSnapshotPayload(): string {
    const snapshot = {
      products: this.products,
      categories: this.categories,
      stores: this.stores,
      inventoryBalances: this.inventoryBalances,
      stockTransfers: this.stockTransfers,
      stockTransferItems: this.stockTransferItems,
      stockMovements: this.stockMovements,
      purchases: this.purchases,
      purchaseItems: this.purchaseItems,
      sales: this.sales,
      saleItems: this.saleItems,
      payments: this.payments,
      expenses: this.expenses,
      members: this.members,
      pointTransactions: this.pointTransactions,
      auditLogs: this.auditLogs,
      profiles: this.profiles,
      cashSessions: this.cashSessions,
      cashDeposits: this.cashDeposits,
      loyaltyConfig: this.loyaltyConfig,
      companyWalletTransactions: this.companyWalletTransactions,
      passwords: Object.fromEntries(
        Array.from(this.passwords.entries()).map(([k, v]) => [
          k,
          isPasswordHashed(v) ? v : hashPassword(v),
        ])
      ),
    };
    // Minified JSON (no indentation) — cuts disk size ~50-60% and speeds up serialization
    return JSON.stringify(snapshot);
  }

  private registerShutdownHooks() {
    if (this.shutdownHookRegistered || typeof process === 'undefined' || !process.on) return;
    this.shutdownHookRegistered = true;
    const handleExit = () => {
      if (this.hasDirtyState) {
        this.flushToFileSync();
      }
    };
    process.once('beforeExit', handleExit);
    process.once('SIGINT', () => {
      handleExit();
      process.exit(0);
    });
    process.once('SIGTERM', () => {
      handleExit();
      process.exit(0);
    });
  }

  private async flushToFileAsync() {
    if (this.shouldSkipPersistence()) return;
    if (this.isWritingFile) {
      this.pendingSave = true;
      return;
    }
    this.isWritingFile = true;
    this.hasDirtyState = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path');
      const dataDir = path.join(process.cwd(), '.data');
      await fs.promises.mkdir(dataDir, { recursive: true });
      const filePath = path.join(dataDir, 'bb_state.json');
      const tmpPath = path.join(dataDir, `bb_state.json.tmp.${Date.now()}`);
      const payload = this.buildSnapshotPayload();
      // Non-blocking atomic write: write to temp file, then rename
      await fs.promises.writeFile(tmpPath, payload, 'utf-8');
      await fs.promises.rename(tmpPath, filePath);
    } catch {
      // ignore
    } finally {
      this.isWritingFile = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        void this.flushToFileAsync();
      }
    }
  }

  flushToFileSync() {
    if (this.shouldSkipPersistence()) return;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.hasDirtyState = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path');
      const dataDir = path.join(process.cwd(), '.data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'bb_state.json');
      const tmpPath = path.join(dataDir, `bb_state.json.tmp.${Date.now()}`);
      fs.writeFileSync(tmpPath, this.buildSnapshotPayload(), 'utf-8');
      fs.renameSync(tmpPath, filePath);
    } catch {
      // ignore
    }
  }

  saveToFile() {
    if (this.shouldSkipPersistence()) return;
    this.registerShutdownHooks();
    this.hasDirtyState = true;
    // Debounce rapid consecutive mutations (e.g. checkout + stock + points) into 1 background write
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flushToFileAsync();
    }, 300);
    if (typeof (this.saveTimer as any).unref === 'function') {
      (this.saveTimer as any).unref();
    }
  }

  loadFromFile() {
    if (this.isTestMode) return;
    if (typeof window !== 'undefined') return;
    if (process.env.NODE_ENV === 'test' || process.env.IS_ACCEPTANCE_TEST === 'true') return;
    if (typeof process !== 'undefined' && process.argv && process.argv.some((a) => a.includes('tests/'))) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path');
      const filePath = path.join(process.cwd(), '.data', 'bb_state.json');
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.stores) && parsed.stores.length > 0) this.stores = parsed.stores;
        if (Array.isArray(parsed.products) && parsed.products.length > 0) this.products = parsed.products;
        if (Array.isArray(parsed.categories) && parsed.categories.length > 0) this.categories = parsed.categories;
        if (Array.isArray(parsed.inventoryBalances) && parsed.inventoryBalances.length > 0) this.inventoryBalances = parsed.inventoryBalances;
        if (Array.isArray(parsed.stockTransfers)) this.stockTransfers = parsed.stockTransfers;
        if (Array.isArray(parsed.stockTransferItems)) this.stockTransferItems = parsed.stockTransferItems;
        if (Array.isArray(parsed.stockMovements)) this.stockMovements = parsed.stockMovements;
        if (Array.isArray(parsed.purchases)) this.purchases = parsed.purchases;
        if (Array.isArray(parsed.purchaseItems)) this.purchaseItems = parsed.purchaseItems;
        if (Array.isArray(parsed.sales)) this.sales = parsed.sales;
        if (Array.isArray(parsed.saleItems)) this.saleItems = parsed.saleItems;
        if (Array.isArray(parsed.payments)) this.payments = parsed.payments;
        if (Array.isArray(parsed.expenses)) this.expenses = parsed.expenses;
        if (Array.isArray(parsed.members)) this.members = parsed.members;
        if (Array.isArray(parsed.pointTransactions)) this.pointTransactions = parsed.pointTransactions;
        if (Array.isArray(parsed.auditLogs)) this.auditLogs = parsed.auditLogs;
        if (Array.isArray(parsed.cashSessions)) this.cashSessions = parsed.cashSessions;
        if (Array.isArray(parsed.cashDeposits)) this.cashDeposits = parsed.cashDeposits;
        if (Array.isArray(parsed.companyWalletTransactions) && parsed.companyWalletTransactions.length > 0) {
          this.companyWalletTransactions = parsed.companyWalletTransactions;
        }
        if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
          this.profiles = parsed.profiles.map((p: any) => {
            let emp1 = p.employee_1_name;
            let emp2 = p.employee_2_name;
            if (p.role === 'CASHIER' && !emp1 && !emp2) {
              const label =
                p.assigned_store_id === 'a0000000-0000-0000-0000-000000000002'
                  ? 'Kendal Kota'
                  : p.assigned_store_id === 'a0000000-0000-0000-0000-000000000003'
                  ? 'Pegandon'
                  : p.assigned_store_id === 'a0000000-0000-0000-0000-000000000004'
                  ? 'Kaliwungu'
                  : p.full_name || 'Cabang';
              emp1 = `Karyawan 1 - ${label}`;
              emp2 = `Karyawan 2 - ${label}`;
            }
            return {
              ...p,
              employee_1_name: emp1 ?? null,
              employee_2_name: emp2 ?? null,
              is_locked: p.is_locked ?? false,
              failed_login_attempts: p.failed_login_attempts ?? 0,
              locked_at: p.locked_at ?? null,
            };
          });
        }
        if (parsed.loyaltyConfig && typeof parsed.loyaltyConfig === 'object') {
          const isLegacyDefault =
            parsed.loyaltyConfig.points_per_step === undefined &&
            Number(parsed.loyaltyConfig.spend_per_point) === 30000 &&
            Number(parsed.loyaltyConfig.point_value_idr) === 1500;
          if (isLegacyDefault) {
            this.loyaltyConfig = {
              spend_per_point: 30000,
              points_per_step: 1500,
              point_value_idr: 1,
              min_redeem_points: 1500,
              is_active: parsed.loyaltyConfig.is_active ?? true,
            };
          } else {
            this.loyaltyConfig = {
              spend_per_point: parsed.loyaltyConfig.spend_per_point || 30000,
              points_per_step: parsed.loyaltyConfig.points_per_step ?? 1500,
              point_value_idr: parsed.loyaltyConfig.point_value_idr ?? 1,
              min_redeem_points: parsed.loyaltyConfig.min_redeem_points ?? 1500,
              is_active: parsed.loyaltyConfig.is_active ?? true,
            };
          }
        }
        if (parsed.passwords && typeof parsed.passwords === 'object') {
          let migratedPlain = false;
          for (const [k, v] of Object.entries(parsed.passwords)) {
            if (typeof v === 'string') {
              if (isPasswordHashed(v)) {
                this.passwords.set(k, v);
              } else {
                this.passwords.set(k, hashPassword(v));
                migratedPlain = true;
              }
            }
          }
          if (migratedPlain) {
            this.saveToFile();
          }
        }
      }
    } catch {
      // ignore
    }
  }
}

// Global state instance across requests (persisted across Next.js route chunks via globalThis)
const globalState: MemoryDatabaseState =
  (globalThis as any).__bb_globalState || new MemoryDatabaseState(false, false);
(globalThis as any).__bb_globalState = globalState;

// Pastikan companyWalletTransactions terinisialisasi jika instance berasal dari cache hot-reload
if (!Array.isArray(globalState.companyWalletTransactions)) {
  globalState.companyWalletTransactions = [];
  try {
    (globalState as any).initCompanyWallet?.();
  } catch {
    // ignore
  }
}
if (!Array.isArray(globalState.cashDeposits)) {
  globalState.cashDeposits = [];
}

// Helper: deteksi apakah biaya operasional dibayar oleh Super Admin (Pusat/Setoran)
// atau oleh Kasir Cabang (Laci Toko)
function isCentralExpense(e: Expense): boolean {
  if (e.funding_source === 'CENTRAL') return true;
  if (e.funding_source === 'STORE') return false;
  if (!e.created_by) return false;
  const profile = globalState.profiles.find(
    (p) => p.id === e.created_by || p.full_name === e.created_by
  );
  if (profile) return profile.role === 'SUPER_ADMIN';
  const low = e.created_by.toLowerCase();
  return low.includes('super admin') || low.includes('owner');
}

export const repository = {
  // STORES
  async getStores(): Promise<Store[]> {
    return [...globalState.stores];
  },

  async getStoreById(id: string): Promise<Store | null> {
    const found = globalState.stores.find((s) => s.id === id);
    return found ? { ...found } : null;
  },

  async getStoreByCode(code: string): Promise<Store | null> {
    const found = globalState.stores.find((s) => s.code.toUpperCase() === code.toUpperCase());
    return found ? { ...found } : null;
  },

  async createStore(data: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Promise<Store> {
    const existing = globalState.stores.find((s) => s.code.toUpperCase() === data.code.toUpperCase());
    if (existing) {
      throw new Error(`Kode toko '${data.code}' sudah digunakan.`);
    }

    const newStore: Store = {
      ...data,
      id: `a0000000-0000-0000-0000-${String(globalState.stores.length + 1).padStart(12, '0')}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalState.stores.push(newStore);
    globalState.saveToFile();
    return newStore;
  },

  async updateStore(id: string, data: Partial<Omit<Store, 'id' | 'created_at'>>): Promise<Store> {
    const index = globalState.stores.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Toko dengan ID '${id}' tidak ditemukan.`);
    }
    if (data.code && data.code.trim().toUpperCase() !== globalState.stores[index].code.toUpperCase()) {
      const cleanCode = data.code.trim().toUpperCase();
      const dup = globalState.stores.find((s) => s.id !== id && s.code.toUpperCase() === cleanCode);
      if (dup) {
        throw new Error(`Kode lokasi '${cleanCode}' sudah digunakan oleh '${dup.name}'.`);
      }
      data.code = cleanCode;
    }
    const cleanPatch = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    const updated: Store = {
      ...globalState.stores[index],
      ...cleanPatch,
      updated_at: new Date().toISOString(),
    };
    globalState.stores[index] = updated;
    globalState.saveToFile();

    await this.createAuditLog({
      action: 'STORE_UPDATED',
      entity_name: 'stores',
      entity_id: id,
      new_data: {
        code: updated.code,
        name: updated.name,
        type: updated.type,
        address: updated.address,
        phone: updated.phone,
        is_active: updated.is_active,
      },
    });

    return updated;
  },

  // USER PROFILES
  async getUserProfiles(): Promise<UserProfile[]> {
    return globalState.profiles.map((p) => ({
      ...p,
      assigned_store: p.assigned_store_id
        ? globalState.stores.find((s) => s.id === p.assigned_store_id) || null
        : null,
    }));
  },

  async getUsers(): Promise<UserProfile[]> {
    return this.getUserProfiles();
  },

  async getUserProfileById(id: string): Promise<UserProfile | null> {
    const found = globalState.profiles.find((p) => p.id === id);
    if (!found) return null;
    return {
      ...found,
      assigned_store: found.assigned_store_id
        ? globalState.stores.find((s) => s.id === found.assigned_store_id) || null
        : null,
    };
  },

  async getUserProfileByEmail(email: string): Promise<UserProfile | null> {
    const found = globalState.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!found) return null;
    return {
      ...found,
      assigned_store: found.assigned_store_id
        ? globalState.stores.find((s) => s.id === found.assigned_store_id) || null
        : null,
    };
  },

  async upsertUserProfile(
    data: Omit<UserProfile, 'created_at' | 'updated_at' | 'assigned_store'>
  ): Promise<UserProfile> {
    // Validasi aturan: Cashier wajib memiliki assigned_store_id dan tidak boleh ke WAREHOUSE
    if (data.role === 'CASHIER') {
      if (!data.assigned_store_id) {
        throw new Error('Kasir wajib ditugaskan ke salah satu toko cabang.');
      }
      const targetStore = globalState.stores.find((s) => s.id === data.assigned_store_id);
      if (targetStore && targetStore.type === 'WAREHOUSE') {
        throw new Error('Kasir hanya dapat ditugaskan pada toko cabang retail, dilarang ditugaskan ke Gudang Pusat.');
      }
    }

    const index = globalState.profiles.findIndex((p) => p.id === data.id || p.email === data.email);
    if (index !== -1) {
      const updated: UserProfile = {
        ...globalState.profiles[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      globalState.profiles[index] = updated;
      return updated;
    }

    const created: UserProfile = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalState.profiles.push(created);
    return created;
  },

  async updateUserProfile(
    id: string,
    data: Partial<Omit<UserProfile, 'id' | 'created_at' | 'assigned_store'>> & { password?: string }
  ): Promise<UserProfile> {
    const index = globalState.profiles.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Pengguna dengan ID '${id}' tidak ditemukan.`);
    }

    const current = globalState.profiles[index];

    // Jika email diubah, validasi email tidak bentrok dengan akun lain
    if (data.email && data.email.trim().toLowerCase() !== current.email.toLowerCase()) {
      const targetEmail = data.email.trim().toLowerCase();
      const existing = globalState.profiles.find(
        (p) => p.email.toLowerCase() === targetEmail && p.id !== id
      );
      if (existing) {
        throw new Error(`Email '${data.email}' sudah terdaftar pada pengguna lain (${existing.full_name}).`);
      }
    }

    const newRole = data.role !== undefined ? data.role : current.role;
    const newStoreId = data.assigned_store_id !== undefined ? data.assigned_store_id : current.assigned_store_id;

    if (newRole === 'CASHIER') {
      if (!newStoreId) {
        throw new Error('Petugas Kasir wajib ditugaskan ke salah satu cabang toko.');
      }
      const targetStore = globalState.stores.find((s) => s.id === newStoreId);
      if (targetStore && targetStore.type === 'WAREHOUSE') {
        throw new Error('Kasir hanya dapat ditugaskan pada toko cabang retail, dilarang ditugaskan ke Gudang Pusat.');
      }
    }

    // Jika password baru diberikan, update passwords map
    if (data.password && data.password.trim()) {
      globalState.passwords.set(id, hashPassword(data.password.trim()));
    }

    // Pengelolaan is_locked & failed_login_attempts
    let newIsLocked = data.is_locked !== undefined ? data.is_locked : current.is_locked ?? false;
    let newFailedAttempts = data.failed_login_attempts !== undefined ? data.failed_login_attempts : current.failed_login_attempts ?? 0;
    let newLockedAt = data.locked_at !== undefined ? data.locked_at : current.locked_at ?? null;

    if (data.is_locked === false) {
      newIsLocked = false;
      newFailedAttempts = 0;
      newLockedAt = null;
    }

    const { password, ...cleanData } = data;

    const updated: UserProfile = {
      ...current,
      ...cleanData,
      role: newRole,
      assigned_store_id: newRole === 'SUPER_ADMIN' ? null : newStoreId,
      is_locked: newIsLocked,
      failed_login_attempts: newFailedAttempts,
      locked_at: newLockedAt,
      updated_at: new Date().toISOString(),
    };

    globalState.profiles[index] = updated;
    globalState.saveToFile();

    await this.createAuditLog({
      action: 'USER_PROFILE_UPDATED',
      entity_name: 'user_profiles',
      entity_id: id,
      new_data: {
        email: updated.email,
        full_name: updated.full_name,
        role: updated.role,
        assigned_store_id: updated.assigned_store_id,
        is_active: updated.is_active,
        is_locked: updated.is_locked,
        password_changed: Boolean(data.password && data.password.trim()),
      },
    });

    return (await this.getUserProfileById(id))!;
  },

  async deleteUserProfile(id: string): Promise<boolean> {
    const index = globalState.profiles.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Pengguna dengan ID '${id}' tidak ditemukan.`);
    }

    const target = globalState.profiles[index];

    // Mencegah penghapusan Super Admin utama
    if (target.email === 'admin@bbparfum.id') {
      throw new Error('Akun Super Admin Utama (admin@bbparfum.id) tidak dapat dihapus.');
    }

    // Pastikan minimal ada 1 Super Admin tersisa
    if (target.role === 'SUPER_ADMIN') {
      const superAdmins = globalState.profiles.filter((p) => p.role === 'SUPER_ADMIN');
      if (superAdmins.length <= 1) {
        throw new Error('Tidak dapat menghapus Super Admin terakhir di sistem.');
      }
    }

    globalState.profiles.splice(index, 1);

    await this.createAuditLog({
      action: 'USER_PROFILE_DELETED',
      entity_name: 'user_profiles',
      entity_id: id,
      new_data: { email: target.email, full_name: target.full_name, role: target.role },
    });

    return true;
  },

  async resetUserPassword(id: string, newPassword?: string): Promise<{ success: boolean; message: string; default_password: string; new_password: string }> {
    const user = await this.getUserProfileById(id);
    if (!user) {
      throw new Error(`Pengguna dengan ID '${id}' tidak ditemukan.`);
    }

    const pass = newPassword || 'password123';
    globalState.passwords.set(id, hashPassword(pass));

    // Otomatis buka kunci jika akun sebelumnya terkunci
    const profile = globalState.profiles.find((p) => p.id === id);
    if (profile) {
      profile.is_locked = false;
      profile.failed_login_attempts = 0;
      profile.locked_at = null;
      profile.updated_at = new Date().toISOString();
    }
    globalState.saveToFile();

    await this.createAuditLog({
      action: 'USER_PASSWORD_RESET',
      entity_name: 'user_profiles',
      entity_id: id,
      new_data: { email: user.email, reset_by: 'SUPER_ADMIN', reset_at: new Date().toISOString() },
    });

    return {
      success: true,
      message: `Password untuk ${user.full_name} (${user.email}) berhasil direset.`,
      default_password: pass,
      new_password: pass,
    };
  },

  async unlockUserAccount(id: string): Promise<UserProfile> {
    const index = globalState.profiles.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Pengguna dengan ID '${id}' tidak ditemukan.`);
    }

    const profile = globalState.profiles[index];
    profile.is_locked = false;
    profile.failed_login_attempts = 0;
    profile.locked_at = null;
    profile.updated_at = new Date().toISOString();
    globalState.saveToFile();

    await this.createAuditLog({
      action: 'USER_ACCOUNT_UNLOCKED',
      entity_name: 'user_profiles',
      entity_id: id,
      new_data: { email: profile.email, full_name: profile.full_name, unlocked_by: 'SUPER_ADMIN', unlocked_at: new Date().toISOString() },
    });

    return (await this.getUserProfileById(id))!;
  },

  async toggleUserStatus(id: string): Promise<UserProfile> {
    const index = globalState.profiles.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Pengguna dengan ID '${id}' tidak ditemukan.`);
    }

    const current = globalState.profiles[index];
    if (current.email === 'admin@bbparfum.id' && current.is_active) {
      throw new Error('Akun Super Admin Utama tidak dapat dinonaktifkan.');
    }

    current.is_active = !current.is_active;
    current.updated_at = new Date().toISOString();

    await this.createAuditLog({
      action: 'USER_STATUS_TOGGLED',
      entity_name: 'user_profiles',
      entity_id: id,
      new_data: { email: current.email, is_active: current.is_active },
    });

    return (await this.getUserProfileById(id))!;
  },

  // CATEGORIES
  async getCategories(): Promise<ProductCategory[]> {
    return [...globalState.categories];
  },

  async createCategory(data: Omit<ProductCategory, 'id' | 'created_at'>): Promise<ProductCategory> {
    const existing = globalState.categories.find(
      (c) => c.slug.toLowerCase() === data.slug.toLowerCase() || c.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existing) {
      throw new Error(`Kategori '${data.name}' sudah ada.`);
    }
    const newCategory: ProductCategory = {
      ...data,
      id: `c0000000-0000-0000-0000-${String(globalState.categories.length + 1).padStart(12, '0')}`,
      created_at: new Date().toISOString(),
    };
    globalState.categories.push(newCategory);
    return newCategory;
  },

  // PRODUCTS
  async getProducts(filters?: { categoryId?: string; search?: string; isActiveOnly?: boolean }): Promise<Product[]> {
    let result = globalState.products.map((p) => ({
      ...p,
      category: globalState.categories.find((c) => c.id === p.category_id),
    }));

    if (filters?.isActiveOnly) {
      result = result.filter((p) => p.is_active);
    }
    if (filters?.categoryId) {
      result = result.filter((p) => p.category_id === filters.categoryId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    return result;
  },

  async getProductById(id: string): Promise<Product | null> {
    const found = globalState.products.find((p) => p.id === id);
    if (!found) return null;
    return {
      ...found,
      category: globalState.categories.find((c) => c.id === found.category_id),
    };
  },

  async getProductByBarcodeOrSku(code: string): Promise<Product | null> {
    const q = code.trim().toLowerCase();
    const found = globalState.products.find(
      (p) => p.sku.toLowerCase() === q || (p.barcode && p.barcode.toLowerCase() === q)
    );
    if (!found) return null;
    return {
      ...found,
      category: globalState.categories.find((c) => c.id === found.category_id),
    };
  },

  async createProduct(
    data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'> & {
      initial_stock?: number;
      initial_cost?: number;
      initial_store_id?: string;
    }
  ): Promise<Product> {
    let finalSku = data.sku ? data.sku.trim().toUpperCase() : '';
    if (!finalSku) {
      const prefix = data.product_type === 'BIBIT' ? 'BBT' : data.product_type === 'PELARUT' ? 'PLR' : data.product_type === 'BOTOL' ? 'BTL' : 'BBP';
      const cleanName = data.name.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'ITEM';
      const rand = Math.floor(100 + Math.random() * 900);
      finalSku = `${prefix}-${cleanName}-${rand}`;
    }

    const existingSku = globalState.products.find((p) => p.sku.toLowerCase() === finalSku.toLowerCase());
    if (existingSku) {
      throw new Error(`SKU '${finalSku}' sudah terdaftar.`);
    }

    if (data.barcode) {
      const existingBarcode = globalState.products.find(
        (p) => p.barcode && p.barcode.toLowerCase() === data.barcode!.toLowerCase()
      );
      if (existingBarcode) {
        throw new Error(`Barcode '${data.barcode}' sudah terdaftar pada produk lain.`);
      }
    }

    const newProduct: Product = {
      ...data,
      sku: finalSku,
      base_price: typeof data.base_price === 'number' && !isNaN(data.base_price) ? data.base_price : 0,
      size_ml: typeof data.size_ml === 'number' && !isNaN(data.size_ml) ? data.size_ml : 50,
      scent_type: data.scent_type || 'Bibit Parfum Murni',
      product_type: data.product_type || 'BIBIT',
      unit_name: data.unit_name || 'ml',
      is_blendable: data.is_blendable ?? true,
      id: `p0000000-0000-0000-0000-${String(globalState.products.length + 1).padStart(12, '0')}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalState.products.push(newProduct);

    // Otomatis inisialisasi baris saldo inventaris 0 untuk semua store
    for (const store of globalState.stores) {
      globalState.inventoryBalances.push({
        id: `inv-${store.id.slice(0, 8)}-${newProduct.id.slice(0, 8)}`,
        store_id: store.id,
        product_id: newProduct.id,
        quantity: 0,
        moving_avg_cost: 0,
        last_updated_at: new Date().toISOString(),
      });
    }

    // Inisialisasi stok awal jika diisi
    if (data.initial_stock && data.initial_stock > 0) {
      const targetStoreId = data.initial_store_id || globalState.stores[0]?.id;
      if (targetStoreId) {
        await this.recordStockMovement({
          store_id: targetStoreId,
          product_id: newProduct.id,
          movement_type: 'ADJUSTMENT',
          quantity_delta: data.initial_stock,
          cost_per_unit: data.initial_cost || Math.round(newProduct.base_price * 0.45),
          notes: `Saldo Awal Input Produk: ${newProduct.name}`,
          created_by: 'Super Admin',
        });
      }
    }

    globalState.saveToFile();

    return {
      ...newProduct,
      category: globalState.categories.find((c) => c.id === newProduct.category_id),
    };
  },

  async updateProduct(
    id: string,
    data: Partial<Omit<Product, 'id' | 'created_at' | 'category'>>
  ): Promise<Product> {
    const index = globalState.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Produk dengan ID '${id}' tidak ditemukan.`);
    }

    if (data.sku && data.sku !== globalState.products[index].sku) {
      const existingSku = globalState.products.find(
        (p) => p.id !== id && p.sku.toLowerCase() === data.sku!.toLowerCase()
      );
      if (existingSku) {
        throw new Error(`SKU '${data.sku}' sudah digunakan.`);
      }
    }

    if (data.barcode && data.barcode !== globalState.products[index].barcode) {
      const existingBarcode = globalState.products.find(
        (p) => p.id !== id && p.barcode && p.barcode.toLowerCase() === data.barcode!.toLowerCase()
      );
      if (existingBarcode) {
        throw new Error(`Barcode '${data.barcode}' sudah digunakan.`);
      }
    }

    const updated: Product = {
      ...globalState.products[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    globalState.products[index] = updated;
    globalState.saveToFile();

    return {
      ...updated,
      category: globalState.categories.find((c) => c.id === updated.category_id),
    };
  },

  // INVENTORY BALANCES
  async getInventoryBalances(storeId?: string): Promise<InventoryBalance[]> {
    let list = globalState.inventoryBalances;
    if (storeId) {
      list = list.filter((b) => b.store_id === storeId);
    }
    return list.map((b) => ({
      ...b,
      product: globalState.products.find((p) => p.id === b.product_id),
      store: globalState.stores.find((s) => s.id === b.store_id),
    }));
  },

  async getInventoryBalance(storeId: string, productId: string): Promise<InventoryBalance | null> {
    const found = globalState.inventoryBalances.find(
      (b) => b.store_id === storeId && b.product_id === productId
    );
    if (!found) return null;
    return {
      ...found,
      product: globalState.products.find((p) => p.id === found.product_id),
      store: globalState.stores.find((s) => s.id === found.store_id),
    };
  },

  /**
   * ATOMIC STOCK MOVEMENT WITH MOVING WEIGHTED AVERAGE COST & NEGATIVE STOCK PREVENTION
   */
  async recordStockMovement(params: {
    store_id: string;
    product_id: string;
    movement_type: StockMovementType;
    quantity_delta: number;
    cost_per_unit?: number;
    reference_id?: string;
    notes?: string;
    created_by?: string | null;
  }): Promise<{ balance: InventoryBalance; movement: StockMovement }> {
    const {
      store_id,
      product_id,
      movement_type,
      quantity_delta,
      cost_per_unit = 0,
      reference_id,
      notes,
      created_by,
    } = params;

    let balanceIndex = globalState.inventoryBalances.findIndex(
      (b) => b.store_id === store_id && b.product_id === product_id
    );

    if (balanceIndex === -1) {
      const newBal: InventoryBalance = {
        id: `inv-${store_id.slice(0, 8)}-${product_id.slice(0, 8)}`,
        store_id,
        product_id,
        quantity: 0,
        moving_avg_cost: 0,
        last_updated_at: new Date().toISOString(),
      };
      globalState.inventoryBalances.push(newBal);
      balanceIndex = globalState.inventoryBalances.length - 1;
    }

    const currentBal = globalState.inventoryBalances[balanceIndex];
    const newQuantity = currentBal.quantity + quantity_delta;

    // STRICT CHECK: ANTI-STOK NEGATIF
    if (newQuantity < 0) {
      throw new Error(
        `TRANSAKSI DITOLAK: Saldo stok tidak mencukupi di lokasi ini. Tersedia: ${currentBal.quantity}, diminta potong: ${Math.abs(
          quantity_delta
        )} botol.`
      );
    }

    // Perhitungan HPP Moving Weighted Average:
    // Jika barang masuk bertambah (quantity_delta > 0), hitung HPP rata-rata baru
    let newMovingAvgCost = currentBal.moving_avg_cost;
    if (quantity_delta > 0) {
      if (newQuantity > 0) {
        newMovingAvgCost = Math.round(
          ((currentBal.quantity * currentBal.moving_avg_cost) + (quantity_delta * cost_per_unit)) /
            newQuantity
        );
      } else {
        newMovingAvgCost = cost_per_unit;
      }
    }

    // Update Saldo Persediaan
    currentBal.quantity = newQuantity;
    currentBal.moving_avg_cost = newMovingAvgCost;
    currentBal.last_updated_at = new Date().toISOString();

    // Catat ke Buku Besar Pergerakan Stok (Immutable Ledger)
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      store_id,
      product_id,
      movement_type,
      reference_id: reference_id || null,
      quantity_delta,
      cost_per_unit,
      balance_after: newQuantity,
      moving_avg_cost_after: newMovingAvgCost,
      notes: notes || null,
      created_by: created_by || null,
      created_at: new Date().toISOString(),
      product: globalState.products.find((p) => p.id === product_id),
      store: globalState.stores.find((s) => s.id === store_id),
    };
    globalState.stockMovements.unshift(newMovement);

    globalState.saveToFile();

    return {
      balance: {
        ...currentBal,
        product: globalState.products.find((p) => p.id === product_id),
        store: globalState.stores.find((s) => s.id === store_id),
      },
      movement: newMovement,
    };
  },

  // KARTU STOK BERGERAK (STOCK MOVEMENTS LEDGER)
  async getStockMovements(filters?: {
    storeId?: string;
    productId?: string;
    movementType?: StockMovementType;
    limit?: number;
  }): Promise<StockMovement[]> {
    let list = globalState.stockMovements;
    if (filters?.storeId) {
      list = list.filter((m) => m.store_id === filters.storeId);
    }
    if (filters?.productId) {
      list = list.filter((m) => m.product_id === filters.productId);
    }
    if (filters?.movementType) {
      list = list.filter((m) => m.movement_type === filters.movementType);
    }
    return list.slice(0, filters?.limit || 100).map((m) => ({
      ...m,
      product: globalState.products.find((p) => p.id === m.product_id),
      store: globalState.stores.find((s) => s.id === m.store_id),
    }));
  },

  // STOCK ADJUSTMENT (PENYESUAIAN STOK)
  async createStockAdjustment(params: {
    store_id: string;
    product_id: string;
    physical_quantity: number;
    notes: string;
    cost_per_unit?: number;
    created_by?: string | null;
  }): Promise<{ balance: InventoryBalance; movement: StockMovement }> {
    const current = await this.getInventoryBalance(params.store_id, params.product_id);
    const systemQty = current ? current.quantity : 0;
    const diff = params.physical_quantity - systemQty;

    if (diff === 0) {
      throw new Error('Kuantitas fisik sama dengan sistem. Tidak ada penyesuaian yang diperlukan.');
    }

    const prod = globalState.products.find((p) => p.id === params.product_id);
    const unitLabel = prod?.unit_name || 'satuan';
    const fallbackCost = params.cost_per_unit ?? (prod ? Math.round(prod.base_price * 0.45) : 0);

    return this.recordStockMovement({
      store_id: params.store_id,
      product_id: params.product_id,
      movement_type: 'ADJUSTMENT',
      quantity_delta: diff,
      cost_per_unit: (current && current.moving_avg_cost > 0) ? current.moving_avg_cost : fallbackCost,
      notes: `Penyesuaian Fisik (${diff > 0 ? '+' : ''}${diff} ${unitLabel}): ${params.notes}`,
      created_by: params.created_by,
    });
  },

  // STOCK COUNTS (STOCK OPNAME)
  async getStockCounts(storeId?: string): Promise<StockCount[]> {
    let list = globalState.stockCounts;
    if (storeId) {
      list = list.filter((c) => c.store_id === storeId);
    }
    return list.map((c) => ({
      ...c,
      items: globalState.stockCountItems.filter((i) => i.stock_count_id === c.id).map((i) => ({
        ...i,
        product: globalState.products.find((p) => p.id === i.product_id),
      })),
    }));
  },

  async createStockCount(params: {
    store_id: string;
    conducted_by: string;
    notes?: string;
    items: Array<{ product_id: string; physical_quantity: number; notes?: string }>;
  }): Promise<StockCount> {
    const countId = `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newCount: StockCount = {
      id: countId,
      store_id: params.store_id,
      status: 'COMPLETED',
      conducted_by: params.conducted_by,
      notes: params.notes || null,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    globalState.stockCounts.unshift(newCount);

    for (const it of params.items) {
      const balance = await this.getInventoryBalance(params.store_id, it.product_id);
      const sysQty = balance ? balance.quantity : 0;
      const diff = it.physical_quantity - sysQty;
      const cost = balance ? balance.moving_avg_cost : 0;

      globalState.stockCountItems.push({
        id: `cnt-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        stock_count_id: countId,
        product_id: it.product_id,
        system_quantity: sysQty,
        physical_quantity: it.physical_quantity,
        difference_quantity: diff,
        cost_per_unit: cost,
        notes: it.notes || null,
      });

      // Jika ada selisih, catat otomatis movement STOCK_OPNAME
      if (diff !== 0) {
        await this.recordStockMovement({
          store_id: params.store_id,
          product_id: it.product_id,
          movement_type: 'STOCK_OPNAME',
          quantity_delta: diff,
          cost_per_unit: cost,
          reference_id: countId,
          notes: `Rekonsiliasi Stock Opname (${diff > 0 ? '+' : ''}${diff} botol)`,
          created_by: params.conducted_by,
        });
      }
    }

    return {
      ...newCount,
      items: globalState.stockCountItems.filter((i) => i.stock_count_id === countId),
    };
  },

  // ==========================================================================
  // SUPPLIERS
  // ==========================================================================
  async getSuppliers(): Promise<Supplier[]> {
    return [...globalState.suppliers];
  },

  async getSupplierById(id: string): Promise<Supplier | null> {
    const found = globalState.suppliers.find((s) => s.id === id);
    return found ? { ...found } : null;
  },

  async createSupplier(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    const existing = globalState.suppliers.find(
      (s) => s.code.toUpperCase() === data.code.toUpperCase()
    );
    if (existing) {
      throw new Error(`Kode supplier '${data.code}' sudah digunakan.`);
    }

    const newSupplier: Supplier = {
      ...data,
      id: `s0000000-0000-0000-0000-${String(globalState.suppliers.length + 1).padStart(12, '0')}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalState.suppliers.push(newSupplier);
    return newSupplier;
  },

  // ==========================================================================
  // PURCHASES (PO PEMBELIAN SUPPLIER KE GUDANG PUSAT)
  // ==========================================================================
  async getPurchases(filters?: { status?: PurchaseStatus; supplierId?: string }): Promise<Purchase[]> {
    let list = globalState.purchases;
    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters?.supplierId) {
      list = list.filter((p) => p.supplier_id === filters.supplierId);
    }
    return list.map((p) => ({
      ...p,
      supplier: globalState.suppliers.find((s) => s.id === p.supplier_id),
      destination_store: globalState.stores.find((s) => s.id === p.destination_store_id),
      items: globalState.purchaseItems
        .filter((it) => it.purchase_id === p.id)
        .map((it) => ({
          ...it,
          product: globalState.products.find((prod) => prod.id === it.product_id),
        })),
    }));
  },

  async getPurchaseById(id: string): Promise<Purchase | null> {
    const found = globalState.purchases.find((p) => p.id === id);
    if (!found) return null;
    return {
      ...found,
      supplier: globalState.suppliers.find((s) => s.id === found.supplier_id),
      destination_store: globalState.stores.find((s) => s.id === found.destination_store_id),
      items: globalState.purchaseItems
        .filter((it) => it.purchase_id === found.id)
        .map((it) => ({
          ...it,
          product: globalState.products.find((prod) => prod.id === it.product_id),
        })),
    };
  },

  async createPurchase(params: {
    supplier_id?: string | null;
    destination_store_id?: string | null;
    notes?: string;
    created_by?: string | null;
    status?: PurchaseStatus;
    items: Array<{ product_id: string; quantity: number; unit_cost?: number }>;
  }): Promise<Purchase> {
    if (!params.items || params.items.length === 0) {
      throw new Error('PO harus memiliki minimal satu item barang.');
    }

    const defaultSupplier = globalState.suppliers[0]?.id || 'sup-default';
    const defaultWarehouse = globalState.stores.find((s) => s.type === 'WAREHOUSE')?.id || globalState.stores[0]?.id || 'store-warehouse';

    const supId = params.supplier_id || defaultSupplier;
    const destId = params.destination_store_id || defaultWarehouse;

    const totalAmount = params.items.reduce((sum, it) => {
      const bal = globalState.inventoryBalances.find((b) => b.product_id === it.product_id);
      const prod = globalState.products.find((p) => p.id === it.product_id);
      const cost = (it.unit_cost !== undefined && it.unit_cost > 0)
        ? it.unit_cost
        : (bal?.moving_avg_cost || (prod?.base_price ? Math.round(prod.base_price * 0.4) : 0));
      return sum + it.quantity * cost;
    }, 0);

    const poNumber = `REQ-BBP-${Date.now().toString().slice(-6)}`;
    const purchaseId = `po-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newPurchase: Purchase = {
      id: purchaseId,
      po_number: poNumber,
      supplier_id: supId,
      destination_store_id: destId,
      status: params.status || 'PENDING_APPROVAL',
      total_amount: totalAmount,
      notes: params.notes || null,
      ordered_at: null,
      created_by: params.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalState.purchases.unshift(newPurchase);

    for (const item of params.items) {
      const bal = globalState.inventoryBalances.find((b) => b.product_id === item.product_id);
      const prod = globalState.products.find((p) => p.id === item.product_id);
      const cost = (item.unit_cost !== undefined && item.unit_cost > 0)
        ? item.unit_cost
        : (bal?.moving_avg_cost || (prod?.base_price ? Math.round(prod.base_price * 0.4) : 0));
      globalState.purchaseItems.push({
        id: `po-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        purchase_id: purchaseId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: cost,
        subtotal: item.quantity * cost,
      });
    }

    globalState.saveToFile();

    return (await this.getPurchaseById(purchaseId))!;
  },

  /**
   * PERSETUJUAN PERMINTAAN PEMBELANJAAN OLEH SUPER ADMIN
   * Menandai permintaan belanja sebagai acuan resmi pembelian ke supplier (status -> ORDERED)
   */
  async approvePurchase(purchaseId: string, approvedBy?: string | null): Promise<Purchase> {
    const po = globalState.purchases.find((p) => p.id === purchaseId);
    if (!po) {
      throw new Error(`Dokumen permintaan belanja dengan ID '${purchaseId}' tidak ditemukan.`);
    }

    if (po.status === 'RECEIVED') {
      throw new Error('Dokumen ini sudah selesai diterima sebelumnya.');
    }

    po.status = 'ORDERED';
    po.approved_by = approvedBy || 'Super Admin Kendal';
    po.approved_at = new Date().toISOString();
    po.ordered_at = new Date().toISOString();
    po.updated_at = new Date().toISOString();

    await this.createAuditLog({
      action: 'PURCHASE_APPROVED',
      entity_name: 'purchases',
      entity_id: po.id,
      new_data: { po_number: po.po_number, approved_by: po.approved_by },
    });

    globalState.saveToFile();

    return (await this.getPurchaseById(purchaseId))!;
  },

  /**
   * PENOLAKAN PERMINTAAN PEMBELANJAAN OLEH SUPER ADMIN
   */
  async rejectPurchase(purchaseId: string, reason: string, rejectedBy?: string | null): Promise<Purchase> {
    const po = globalState.purchases.find((p) => p.id === purchaseId);
    if (!po) {
      throw new Error(`Dokumen permintaan belanja dengan ID '${purchaseId}' tidak ditemukan.`);
    }

    po.status = 'REJECTED';
    po.rejected_by = rejectedBy || 'Super Admin Kendal';
    po.rejected_at = new Date().toISOString();
    po.rejection_reason = reason || 'Ditolak oleh Super Admin';
    po.updated_at = new Date().toISOString();

    await this.createAuditLog({
      action: 'PURCHASE_REJECTED',
      entity_name: 'purchases',
      entity_id: po.id,
      new_data: { po_number: po.po_number, reason: po.rejection_reason },
    });

    globalState.saveToFile();

    return (await this.getPurchaseById(purchaseId))!;
  },

  /**
   * PENERIMAAN BARANG PO DI GUDANG PUSAT
   * Atomically mutates inventory balance with PURCHASE_RECEIPT & updates moving average HPP
   */
  async receivePurchase(
    purchaseId: string,
    receivedBy?: string | null,
    actualItems?: Array<{ product_id: string; unit_cost?: number; quantity?: number }>
  ): Promise<Purchase> {
    const po = globalState.purchases.find((p) => p.id === purchaseId);
    if (!po) {
      throw new Error(`PO dengan ID '${purchaseId}' tidak ditemukan.`);
    }

    if (po.status === 'RECEIVED') {
      throw new Error('PO ini sudah pernah diterima sebelumnya.');
    }

    if (po.status === 'CANCELLED') {
      throw new Error('PO yang sudah dibatalkan tidak dapat diterima.');
    }

    const items = globalState.purchaseItems.filter((it) => it.purchase_id === purchaseId);
    let newTotalAmount = 0;

    // Proses penerimaan stok atomik untuk setiap item
    for (const item of items) {
      if (actualItems) {
        const found = actualItems.find((a) => a.product_id === item.product_id);
        if (found) {
          if (typeof found.quantity === 'number' && found.quantity > 0) {
            item.quantity = Math.round(found.quantity);
          }
          if (typeof found.unit_cost === 'number' && found.unit_cost >= 0) {
            item.unit_cost = Math.round(found.unit_cost);
          }
          item.subtotal = item.quantity * item.unit_cost;
        }
      }
      newTotalAmount += item.subtotal;

      await this.recordStockMovement({
        store_id: po.destination_store_id,
        product_id: item.product_id,
        movement_type: 'PURCHASE_RECEIPT',
        quantity_delta: item.quantity,
        cost_per_unit: item.unit_cost,
        reference_id: po.po_number,
        notes: `Penerimaan PO Supplier (${po.po_number})`,
        created_by: receivedBy || null,
      });
    }

    po.total_amount = newTotalAmount;
    po.status = 'RECEIVED';
    po.received_by = receivedBy || 'Super Admin Kendal';
    po.received_at = new Date().toISOString();
    po.updated_at = new Date().toISOString();

    // Potong kas dompet utama perusahaan untuk belanja supplier
    try {
      await this.recordCompanyWalletTransaction({
        transaction_type: 'PURCHASE_PAYMENT',
        amount: -newTotalAmount,
        category: 'Belanja Bahan Supplier',
        reference_id: po.po_number,
        description: `Pembayaran Belanja Bahan Baku (${po.po_number})`,
        operator: receivedBy || 'Super Admin Kendal',
      });
    } catch (wErr) {
      console.warn('Wallet deduction notice:', wErr);
    }

    await this.createAuditLog({
      action: 'PURCHASE_RECEIVED',
      entity_name: 'purchases',
      entity_id: po.id,
      new_data: { po_number: po.po_number, total_amount: po.total_amount, items_count: items.length },
    });

    globalState.saveToFile();

    return (await this.getPurchaseById(purchaseId))!;
  },

  /**
   * PERSETUJUAN SEKALIGUS PENERIMAAN LANGSUNG KE STOK GUDANG LOGISTIK (1-KLIK)
   * Mengubah status menjadi RECEIVED dan langsung menambahkan kuantitas barang ke stok gudang
   * dengan kalkulasi harga beli riil (moving average HPP otomatis terupdate).
   */
  async approveAndReceivePurchase(
    purchaseId: string,
    operator?: string | null,
    actualItems?: Array<{ product_id: string; unit_cost?: number; quantity?: number }>
  ): Promise<Purchase> {
    const po = globalState.purchases.find((p) => p.id === purchaseId);
    if (!po) {
      throw new Error(`Dokumen permintaan belanja dengan ID '${purchaseId}' tidak ditemukan.`);
    }

    if (po.status === 'RECEIVED') {
      throw new Error('Dokumen ini sudah pernah diterima sebelumnya.');
    }

    if (po.status === 'CANCELLED' || po.status === 'REJECTED') {
      throw new Error(`Dokumen dengan status '${po.status}' tidak dapat diproses.`);
    }

    const items = globalState.purchaseItems.filter((it) => it.purchase_id === purchaseId);
    let newTotalAmount = 0;

    for (const item of items) {
      if (actualItems) {
        const found = actualItems.find((a) => a.product_id === item.product_id);
        if (found) {
          if (typeof found.quantity === 'number' && found.quantity > 0) {
            item.quantity = Math.round(found.quantity);
          }
          if (typeof found.unit_cost === 'number' && found.unit_cost >= 0) {
            item.unit_cost = Math.round(found.unit_cost);
          }
          item.subtotal = item.quantity * item.unit_cost;
        }
      }
      newTotalAmount += item.subtotal;

      // Update stok gudang pusat/tujuan langsung secara atomik
      await this.recordStockMovement({
        store_id: po.destination_store_id,
        product_id: item.product_id,
        movement_type: 'PURCHASE_RECEIPT',
        quantity_delta: item.quantity,
        cost_per_unit: item.unit_cost,
        reference_id: po.po_number,
        notes: `Belanja Langsung Masuk Stok (${po.po_number}) oleh ${operator || 'Super Admin'}`,
        created_by: operator || 'Super Admin Kendal',
      });
    }

    po.total_amount = newTotalAmount;
    po.status = 'RECEIVED';
    po.approved_by = operator || 'Super Admin Kendal';
    po.approved_at = new Date().toISOString();
    po.ordered_at = new Date().toISOString();
    po.received_by = operator || 'Super Admin Kendal';
    po.received_at = new Date().toISOString();
    po.updated_at = new Date().toISOString();

    // Potong kas dompet utama perusahaan untuk belanja supplier
    try {
      await this.recordCompanyWalletTransaction({
        transaction_type: 'PURCHASE_PAYMENT',
        amount: -newTotalAmount,
        category: 'Belanja Bahan Supplier',
        reference_id: po.po_number,
        description: `Pembayaran Belanja Bahan Baku (${po.po_number})`,
        operator: operator || 'Super Admin Kendal',
      });
    } catch (wErr) {
      console.warn('Wallet deduction notice:', wErr);
    }

    await this.createAuditLog({
      action: 'PURCHASE_APPROVED_AND_RECEIVED',
      entity_name: 'purchases',
      entity_id: po.id,
      new_data: {
        po_number: po.po_number,
        total_amount: po.total_amount,
        items_count: items.length,
        approved_by: po.approved_by,
      },
    });

    globalState.saveToFile();

    return (await this.getPurchaseById(purchaseId))!;
  },

  // ==========================================================================
  // STOCK TRANSFERS (MUTASI GUDANG PUSAT -> CABANG KENDAL)
  // ==========================================================================
  async getStockTransfers(filters?: {
    sourceStoreId?: string;
    destinationStoreId?: string;
    status?: StockTransferStatus;
  }): Promise<StockTransfer[]> {
    let list = globalState.stockTransfers;
    if (filters?.sourceStoreId) {
      list = list.filter((t) => t.source_store_id === filters.sourceStoreId);
    }
    if (filters?.destinationStoreId) {
      list = list.filter((t) => t.destination_store_id === filters.destinationStoreId);
    }
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status);
    }
    return list.map((t) => ({
      ...t,
      source_store: globalState.stores.find((s) => s.id === t.source_store_id),
      destination_store: globalState.stores.find((s) => s.id === t.destination_store_id),
      items: globalState.stockTransferItems
        .filter((it) => it.stock_transfer_id === t.id)
        .map((it) => ({
          ...it,
          product: globalState.products.find((p) => p.id === it.product_id),
        })),
    }));
  },

  async getStockTransferById(id: string): Promise<StockTransfer | null> {
    const found = globalState.stockTransfers.find((t) => t.id === id);
    if (!found) return null;
    return {
      ...found,
      source_store: globalState.stores.find((s) => s.id === found.source_store_id),
      destination_store: globalState.stores.find((s) => s.id === found.destination_store_id),
      items: globalState.stockTransferItems
        .filter((it) => it.stock_transfer_id === found.id)
        .map((it) => ({
          ...it,
          product: globalState.products.find((p) => p.id === it.product_id),
        })),
    };
  },

  async createStockTransfer(params: {
    source_store_id: string;
    destination_store_id: string;
    notes?: string;
    created_by?: string | null;
    status?: StockTransferStatus;
    items: Array<{ product_id: string; quantity: number }>;
  }): Promise<StockTransfer> {
    if (params.source_store_id === params.destination_store_id) {
      throw new Error('Lokasi asal dan tujuan mutasi tidak boleh sama.');
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('Mutasi harus memiliki minimal satu item barang.');
    }

    const transferId = `tr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transferNumber = `TR-BBP-${Date.now().toString().slice(-6)}`;

    const newTransfer: StockTransfer = {
      id: transferId,
      transfer_number: transferNumber,
      source_store_id: params.source_store_id,
      destination_store_id: params.destination_store_id,
      status: params.status || 'PENDING_SHIPMENT',
      notes: params.notes || null,
      shipped_by: params.created_by || null,
      created_at: new Date().toISOString(),
    };
    globalState.stockTransfers.unshift(newTransfer);

    for (const item of params.items) {
      const sourceBalance = await this.getInventoryBalance(params.source_store_id, item.product_id);
      const snapshotCost = sourceBalance ? sourceBalance.moving_avg_cost : 0;

      globalState.stockTransferItems.push({
        id: `tr-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        stock_transfer_id: transferId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: snapshotCost,
      });
    }

    globalState.saveToFile();

    return (await this.getStockTransferById(transferId))!;
  },

  /**
   * PENGIRIMAN MUTASI: POTONG STOK ASAL (GUDANG PUSAT) DAN MASUKKAN KE STATUS IN_TRANSIT
   */
  async shipStockTransfer(transferId: string, shippedBy?: string | null): Promise<StockTransfer> {
    const transfer = globalState.stockTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      throw new Error(`Mutasi dengan ID '${transferId}' tidak ditemukan.`);
    }

    if (transfer.status !== 'PENDING_SHIPMENT' && transfer.status !== 'PENDING_APPROVAL') {
      throw new Error(`Mutasi dengan status '${transfer.status}' tidak dapat dikirim.`);
    }

    const items = globalState.stockTransferItems.filter((it) => it.stock_transfer_id === transferId);

    // Potong stok asal (Gudang) via movement TRANSFER_OUT
    for (const item of items) {
      await this.recordStockMovement({
        store_id: transfer.source_store_id,
        product_id: item.product_id,
        movement_type: 'TRANSFER_OUT',
        quantity_delta: -item.quantity,
        cost_per_unit: item.unit_cost,
        reference_id: transfer.transfer_number,
        notes: `Kirim Mutasi ke Cabang (${transfer.transfer_number})`,
        created_by: shippedBy || null,
      });
    }

    transfer.status = 'IN_TRANSIT';
    transfer.shipped_at = new Date().toISOString();
    transfer.shipped_by = shippedBy || null;

    await this.createAuditLog({
      action: 'STOCK_TRANSFER_SHIPPED',
      entity_name: 'stock_transfers',
      entity_id: transfer.id,
      new_data: { transfer_number: transfer.transfer_number, items_count: items.length },
    });

    globalState.saveToFile();

    return (await this.getStockTransferById(transferId))!;
  },

  /**
   * PERSETUJUAN (APPROVAL) MUTASI OLEH SUPER ADMIN:
   * Menyetujui surat jalan pengajuan logistik, memotong stok gudang asal, dan status menjadi IN_TRANSIT
   */
  async approveStockTransfer(transferId: string, approvedBy?: string | null): Promise<StockTransfer> {
    const transfer = globalState.stockTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      throw new Error(`Mutasi dengan ID '${transferId}' tidak ditemukan.`);
    }

    if (transfer.status !== 'PENDING_APPROVAL' && transfer.status !== 'PENDING_SHIPMENT') {
      throw new Error(`Hanya mutasi yang menunggu persetujuan yang dapat disetujui. Status saat ini: '${transfer.status}'`);
    }

    const items = globalState.stockTransferItems.filter((it) => it.stock_transfer_id === transferId);

    // Potong stok asal (Gudang) via movement TRANSFER_OUT
    for (const item of items) {
      await this.recordStockMovement({
        store_id: transfer.source_store_id,
        product_id: item.product_id,
        movement_type: 'TRANSFER_OUT',
        quantity_delta: -item.quantity,
        cost_per_unit: item.unit_cost,
        reference_id: transfer.transfer_number,
        notes: `Persetujuan Mutasi Super Admin (${transfer.transfer_number})`,
        created_by: approvedBy || 'Super Admin',
      });
    }

    const now = new Date().toISOString();
    transfer.status = 'IN_TRANSIT';
    transfer.approved_at = now;
    transfer.approved_by = approvedBy || 'Super Admin';
    transfer.shipped_at = now;
    transfer.shipped_by = transfer.shipped_by || approvedBy || 'Staf Ekspedisi';

    await this.createAuditLog({
      action: 'STOCK_TRANSFER_APPROVED',
      entity_name: 'stock_transfers',
      entity_id: transfer.id,
      new_data: {
        transfer_number: transfer.transfer_number,
        approved_by: transfer.approved_by,
        items_count: items.length,
      },
    });

    globalState.saveToFile();

    return (await this.getStockTransferById(transferId))!;
  },

  /**
   * PENOLAKAN (REJECTION) MUTASI OLEH SUPER ADMIN:
   * Menolak pengajuan mutasi logistik. Stok gudang tidak terpotong, alasan penolakan dicatat.
   */
  async rejectStockTransfer(transferId: string, reason: string, rejectedBy?: string | null): Promise<StockTransfer> {
    const transfer = globalState.stockTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      throw new Error(`Mutasi dengan ID '${transferId}' tidak ditemukan.`);
    }

    if (transfer.status !== 'PENDING_APPROVAL' && transfer.status !== 'PENDING_SHIPMENT') {
      throw new Error(`Hanya mutasi yang menunggu persetujuan yang dapat ditolak. Status saat ini: '${transfer.status}'`);
    }

    const items = globalState.stockTransferItems.filter((it) => it.stock_transfer_id === transferId);
    const now = new Date().toISOString();
    transfer.status = 'REJECTED';
    transfer.rejected_at = now;
    transfer.rejected_by = rejectedBy || 'Super Admin';
    transfer.rejection_reason = reason || 'Ditolak oleh Super Admin';

    await this.createAuditLog({
      action: 'STOCK_TRANSFER_REJECTED',
      entity_name: 'stock_transfers',
      entity_id: transfer.id,
      new_data: {
        transfer_number: transfer.transfer_number,
        rejected_by: transfer.rejected_by,
        reason: transfer.rejection_reason,
        items_count: items.length,
      },
    });

    globalState.saveToFile();

    return (await this.getStockTransferById(transferId))!;
  },

  /**
   * KONFIRMASI PENERIMAAN MUTASI DI CABANG TUJUAN (KENDAL KOTA / PEGANDON / KALIWUNGU)
   * Tambah stok tujuan via movement TRANSFER_IN & update HPP moving average cabang
   */
  async receiveStockTransfer(
    transferId: string,
    receivedBy?: string | null,
    receivingNotes?: string | null
  ): Promise<StockTransfer> {
    const transfer = globalState.stockTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      throw new Error(`Mutasi dengan ID '${transferId}' tidak ditemukan.`);
    }

    if (transfer.status !== 'IN_TRANSIT') {
      throw new Error(`Hanya mutasi berstatus IN_TRANSIT yang dapat diterima di cabang. Status saat ini: '${transfer.status}'`);
    }

    const items = globalState.stockTransferItems.filter((it) => it.stock_transfer_id === transferId);
    const cleanNotes = receivingNotes?.trim() || null;

    // Tambah stok tujuan via movement TRANSFER_IN
    for (const item of items) {
      await this.recordStockMovement({
        store_id: transfer.destination_store_id,
        product_id: item.product_id,
        movement_type: 'TRANSFER_IN',
        quantity_delta: item.quantity,
        cost_per_unit: item.unit_cost,
        reference_id: transfer.transfer_number,
        notes: `Konfirmasi Terima Mutasi Cabang (${transfer.transfer_number})${cleanNotes ? ` - Remark Kasir: ${cleanNotes}` : ''}`,
        created_by: receivedBy || null,
      });
    }

    transfer.status = 'RECEIVED';
    transfer.received_at = new Date().toISOString();
    transfer.received_by = receivedBy || null;
    transfer.receiving_notes = cleanNotes;

    await this.createAuditLog({
      action: 'STOCK_TRANSFER_RECEIVED',
      entity_name: 'stock_transfers',
      entity_id: transfer.id,
      new_data: {
        transfer_number: transfer.transfer_number,
        items_count: items.length,
        received_by: transfer.received_by,
        receiving_notes: transfer.receiving_notes,
      },
    });

    globalState.saveToFile();

    return (await this.getStockTransferById(transferId))!;
  },

  /**
   * PENOLAKAN PENERIMAAN BARANG OLEH KASIR CABANG (IN_TRANSIT -> RETURN_REQUESTED)
   * Ketika fisik barang tidak sesuai surat jalan, kasir menolak barang untuk dikembalikan ke Logistik Gudang.
   * Stok cabang tidak bertambah; menunggu approval Super Admin agar stok dikembalikan ke Gudang Pusat.
   */
  async requestTransferReturn(
    transferId: string,
    reason: string,
    requestedBy?: string | null
  ): Promise<StockTransfer> {
    const transfer = globalState.stockTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      throw new Error(`Mutasi dengan ID '${transferId}' tidak ditemukan.`);
    }

    if (transfer.status !== 'IN_TRANSIT') {
      throw new Error(`Hanya mutasi berstatus IN_TRANSIT yang dapat ditolak penerimaannya oleh kasir. Status saat ini: '${transfer.status}'`);
    }

    const cleanReason = reason?.trim();
    if (!cleanReason) {
      throw new Error('Alasan penolakan / ketidaksesuaian barang wajib diisi.');
    }

    const items = globalState.stockTransferItems.filter((it) => it.stock_transfer_id === transferId);
    const now = new Date().toISOString();

    transfer.status = 'RETURN_REQUESTED';
    transfer.return_requested_at = now;
    transfer.return_requested_by = requestedBy?.trim() || 'Kasir Toko Cabang';
    transfer.return_reason = cleanReason;
    transfer.return_admin_notes = null;

    await this.createAuditLog({
      action: 'STOCK_TRANSFER_RETURN_REQUESTED',
      entity_name: 'stock_transfers',
      entity_id: transfer.id,
      new_data: {
        transfer_number: transfer.transfer_number,
        return_requested_by: transfer.return_requested_by,
        return_reason: transfer.return_reason,
        items_count: items.length,
      },
    });

    globalState.saveToFile();

    return (await this.getStockTransferById(transferId))!;
  },

  /**
   * PERSETUJUAN RETUR BARANG OLEH SUPER ADMIN (RETURN_REQUESTED -> RETURNED)
   * Menyetujui penolakan kasir dan mengembalikan stok ke Gudang Pusat (source_store_id) via TRANSFER_IN.
   */
  async approveTransferReturn(
    transferId: string,
    approvedBy?: string | null,
    adminNotes?: string | null
  ): Promise<StockTransfer> {
    const transfer = globalState.stockTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      throw new Error(`Mutasi dengan ID '${transferId}' tidak ditemukan.`);
    }

    if (transfer.status !== 'RETURN_REQUESTED') {
      throw new Error(`Hanya mutasi berstatus RETURN_REQUESTED yang dapat disetujui returnya. Status saat ini: '${transfer.status}'`);
    }

    const items = globalState.stockTransferItems.filter((it) => it.stock_transfer_id === transferId);
    const cleanAdminNotes = adminNotes?.trim() || null;

    // Kembalikan stok ke Gudang Pusat (source_store_id)
    for (const item of items) {
      await this.recordStockMovement({
        store_id: transfer.source_store_id,
        product_id: item.product_id,
        movement_type: 'TRANSFER_IN',
        quantity_delta: item.quantity,
        cost_per_unit: item.unit_cost,
        reference_id: transfer.transfer_number,
        notes: `Pengembalian Retur Mutasi ke Gudang (${transfer.transfer_number}) - Alasan Kasir: ${transfer.return_reason || '-'}${cleanAdminNotes ? ` | Catatan Super Admin: ${cleanAdminNotes}` : ''}`,
        created_by: approvedBy || 'Super Admin',
      });
    }

    transfer.status = 'RETURNED';
    transfer.return_approved_at = new Date().toISOString();
    transfer.return_approved_by = approvedBy?.trim() || 'Super Admin';
    transfer.return_admin_notes = cleanAdminNotes;

    await this.createAuditLog({
      action: 'STOCK_TRANSFER_RETURN_APPROVED',
      entity_name: 'stock_transfers',
      entity_id: transfer.id,
      new_data: {
        transfer_number: transfer.transfer_number,
        return_approved_by: transfer.return_approved_by,
        return_reason: transfer.return_reason,
        return_admin_notes: transfer.return_admin_notes,
        restored_to_store_id: transfer.source_store_id,
        items_count: items.length,
      },
    });

    globalState.saveToFile();

    return (await this.getStockTransferById(transferId))!;
  },

  /**
   * PENOLAKAN RETUR OLEH SUPER ADMIN (RETURN_REQUESTED -> IN_TRANSIT)
   * Jika Super Admin menilai barang tetap harus diterima kasir (misal salah cek), kembalikan status ke IN_TRANSIT.
   */
  async rejectTransferReturn(
    transferId: string,
    rejectedBy?: string | null,
    adminNotes?: string | null
  ): Promise<StockTransfer> {
    const transfer = globalState.stockTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      throw new Error(`Mutasi dengan ID '${transferId}' tidak ditemukan.`);
    }

    if (transfer.status !== 'RETURN_REQUESTED') {
      throw new Error(`Hanya mutasi berstatus RETURN_REQUESTED yang dapat dikembalikan ke kasir. Status saat ini: '${transfer.status}'`);
    }

    const cleanAdminNotes = adminNotes?.trim() || 'Retur ditolak Super Admin, silakan cek & terima ulang barang.';
    transfer.status = 'IN_TRANSIT';
    transfer.return_admin_notes = cleanAdminNotes;

    await this.createAuditLog({
      action: 'STOCK_TRANSFER_RETURN_REJECTED',
      entity_name: 'stock_transfers',
      entity_id: transfer.id,
      new_data: {
        transfer_number: transfer.transfer_number,
        rejected_by: rejectedBy || 'Super Admin',
        return_admin_notes: cleanAdminNotes,
      },
    });

    globalState.saveToFile();

    return (await this.getStockTransferById(transferId))!;
  },

  // AUDIT LOGS
  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    globalState.auditLogs.unshift(newLog);
    return newLog;
  },

  async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    return globalState.auditLogs.slice(0, limit);
  },

  // ============================================================================
  // POS: CASH SESSIONS (Laci Kasir)
  // ============================================================================

  async getCurrentCashSession(storeId: string, cashierId: string): Promise<CashSession | null> {
    const session = globalState.cashSessions.find(
      (s) => s.store_id === storeId && s.cashier_id === cashierId && s.status === 'OPEN'
    );
    if (!session) return null;

    const openTime = new Date(session.opened_at).getTime();

    // Hitung real-time setoran kas APPROVED dan beban operasional selama shift berlangsung
    const totalDeposits = (globalState.cashDeposits || [])
      .filter(
        (d) =>
          d.store_id === session.store_id &&
          d.status === 'APPROVED' &&
          new Date(d.created_at).getTime() >= openTime
      )
      .reduce((sum, d) => sum + (d.amount || 0), 0);

    const totalExpenses = (globalState.expenses || [])
      .filter(
        (e) =>
          e.store_id === session.store_id &&
          !isCentralExpense(e) &&
          new Date(e.created_at || e.expense_date).getTime() >= openTime
      )
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const liveExpectedCash = Math.max(
      0,
      (session.opening_cash || 0) + (session.total_sales_cash || 0) - totalDeposits - totalExpenses
    );

    return {
      ...session,
      expected_cash: liveExpectedCash,
      total_expenses: totalExpenses,
      total_deposits: totalDeposits,
      store: globalState.stores.find((st) => st.id === session.store_id),
      cashier: globalState.profiles.find((p) => p.id === session.cashier_id),
    };
  },

  async getCashSessionSummary(sessionId: string) {
    const session = globalState.cashSessions.find((s) => s.id === sessionId);
    if (!session) return null;

    const sessionSales = globalState.sales.filter((s) => s.cash_session_id === sessionId && s.sale_status !== 'VOIDED');

    let cashTotal = 0;
    let cashCount = 0;
    let qrisTotal = 0;
    let qrisCount = 0;
    let transferTotal = 0;
    let transferCount = 0;
    let debitTotal = 0;
    let debitCount = 0;

    for (const sale of sessionSales) {
      const payment = globalState.payments.find((p) => p.sale_id === sale.id);
      const method = payment?.payment_method || 'CASH';
      if (method === 'CASH') {
        cashTotal += sale.final_amount;
        cashCount++;
      } else if (method === 'QRIS') {
        qrisTotal += sale.final_amount;
        qrisCount++;
      } else if (method === 'TRANSFER') {
        transferTotal += sale.final_amount;
        transferCount++;
      } else if (method === 'DEBIT') {
        debitTotal += sale.final_amount;
        debitCount++;
      }
    }

    return {
      session: {
        ...session,
        store: globalState.stores.find((st) => st.id === session.store_id),
        cashier: globalState.profiles.find((p) => p.id === session.cashier_id),
      },
      breakdown: {
        cash: { total: cashTotal, count: cashCount },
        qris: { total: qrisTotal, count: qrisCount },
        transfer: { total: transferTotal, count: transferCount },
        debit: { total: debitTotal, count: debitCount },
        totalNonCash: qrisTotal + transferTotal + debitTotal,
        totalOmzet: cashTotal + qrisTotal + transferTotal + debitTotal,
        totalTransactions: sessionSales.length,
      },
    };
  },

  async openCashSession(data: {
    store_id: string;
    cashier_id: string;
    opening_cash: number;
    notes?: string;
  }): Promise<CashSession> {
    const existing = await this.getCurrentCashSession(data.store_id, data.cashier_id);
    if (existing) {
      throw new Error(`Kasir ini sudah memiliki sesi kasir aktif yang belum ditutup (ID: ${existing.id}).`);
    }

    // Safeguard: Cegah buka shift baru jika masih ada pengajuan setor kas yang PENDING ke Super Admin
    const pendingDeposit = (globalState.cashDeposits || []).find(
      (d) => d.store_id === data.store_id && d.status === 'PENDING'
    );
    if (pendingDeposit) {
      throw new Error(
        `BUKA SHIFT DITOLAK: Masih terdapat pengajuan setor kas sebesar Rp ${pendingDeposit.amount.toLocaleString(
          'id-ID'
        )} yang sedang menunggu persetujuan (approval) Super Admin. Kasir belum dapat membuka shift baru hingga pengajuan disetujui atau ditolak.`
      );
    }

    const newSession: CashSession = {
      id: `cs-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      store_id: data.store_id,
      cashier_id: data.cashier_id,
      opening_cash: Number(data.opening_cash) || 0,
      total_sales_cash: 0,
      expected_cash: Number(data.opening_cash) || 0,
      status: 'OPEN',
      opened_at: new Date().toISOString(),
      notes: data.notes || null,
      created_at: new Date().toISOString(),
    };

    globalState.cashSessions.unshift(newSession);
    globalState.saveToFile();

    await this.createAuditLog({
      action: 'CASH_SESSION_OPENED',
      entity_name: 'cash_sessions',
      entity_id: newSession.id,
      new_data: { store_id: data.store_id, opening_cash: newSession.opening_cash },
    });

    return (await this.getCurrentCashSession(data.store_id, data.cashier_id))!;
  },

  async closeCashSession(
    sessionId: string,
    data: { actual_cash: number; notes?: string }
  ): Promise<CashSession> {
    const session = globalState.cashSessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Sesi kasir dengan ID '${sessionId}' tidak ditemukan.`);
    }

    if (session.status === 'CLOSED') {
      throw new Error(`Sesi kasir '${sessionId}' sudah ditutup sebelumnya.`);
    }

    const actualCash = Number(data.actual_cash) || 0;
    const openTime = new Date(session.opened_at).getTime();

    // Setoran kas yang sudah disetujui selama shift berlangsung
    const depositsDuringShift = (globalState.cashDeposits || []).filter(
      (d) =>
        d.store_id === session.store_id &&
        d.status === 'APPROVED' &&
        new Date(d.created_at).getTime() >= openTime
    );
    const totalDeposited = depositsDuringShift.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Pengeluaran operasional cabang (kasir) selama shift berlangsung (tidak termasuk OPEX pusat Super Admin)
    const expensesDuringShift = (globalState.expenses || []).filter(
      (e) =>
        e.store_id === session.store_id &&
        !isCentralExpense(e) &&
        new Date(e.created_at || e.expense_date).getTime() >= openTime
    );
    const totalExpenses = expensesDuringShift.reduce((sum, e) => sum + (e.amount || 0), 0);

    // Total kas fisik yang seharusnya ada di laci kasir
    const expectedCash = Math.max(
      0,
      session.opening_cash + session.total_sales_cash - totalDeposited - totalExpenses
    );
    const difference = actualCash - expectedCash;

    session.closing_cash = actualCash;
    session.actual_cash = actualCash;
    session.actual_closing_cash = actualCash;
    session.expected_cash = expectedCash;
    session.difference = difference;
    session.cash_difference = difference;
    session.total_expenses = totalExpenses;
    session.total_deposits = totalDeposited;
    session.status = 'CLOSED';
    session.closed_at = new Date().toISOString();
    if (data.notes) {
      session.notes = session.notes ? `${session.notes} | ${data.notes}` : data.notes;
    }
    globalState.saveToFile();

    await this.createAuditLog({
      action: 'CASH_SESSION_CLOSED',
      entity_name: 'cash_sessions',
      entity_id: session.id,
      new_data: {
        expected_cash: expectedCash,
        actual_cash: actualCash,
        difference: difference,
      },
    });

    return {
      ...session,
      store: globalState.stores.find((st) => st.id === session.store_id),
      cashier: globalState.profiles.find((p) => p.id === session.cashier_id),
    };
  },

  async getCashSessions(options?: {
    store_id?: string;
    cashier_id?: string;
    limit?: number;
  }): Promise<CashSession[]> {
    let result = [...globalState.cashSessions];

    if (options?.store_id) {
      result = result.filter((s) => s.store_id === options.store_id);
    }
    if (options?.cashier_id) {
      result = result.filter((s) => s.cashier_id === options.cashier_id);
    }

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result.map((session) => ({
      ...session,
      store: globalState.stores.find((st) => st.id === session.store_id),
      cashier: globalState.profiles.find((p) => p.id === session.cashier_id),
    }));
  },

  // ============================================================================
  // STORE CASH MANAGEMENT & CASH DEPOSITS (SETOR KAS KE PUSAT)
  // ============================================================================

  async getStoreAvailableCash(storeId: string): Promise<number> {
    // 1. Cek apakah ada shift kasir yang sedang OPEN untuk toko ini
    const openSession = globalState.cashSessions.find(
      (s) => s.store_id === storeId && s.status === 'OPEN'
    );

    if (openSession) {
      // Hitung cash penjualan saat ini di laci kasir
      const baseCash = (openSession.opening_cash || 0) + (openSession.total_sales_cash || 0);
      const openTime = new Date(openSession.opened_at).getTime();
      
      // Kurangi setoran yang sudah APPROVED sejak shift ini dibuka
      const depositsDuringShift = (globalState.cashDeposits || []).filter(
        (d) =>
          d.store_id === storeId &&
          d.status === 'APPROVED' &&
          new Date(d.created_at).getTime() >= openTime
      );
      const totalDeposited = depositsDuringShift.reduce((sum, d) => sum + (d.amount || 0), 0);

      // Kurangi transaksi nominal pengeluaran (beban operasional cabang kasir) toko sejak shift ini dibuka
      const expensesDuringShift = (globalState.expenses || []).filter(
        (e) =>
          e.store_id === storeId &&
          !isCentralExpense(e) &&
          new Date(e.created_at || e.expense_date).getTime() >= openTime
      );
      const totalExpenses = expensesDuringShift.reduce((sum, e) => sum + (e.amount || 0), 0);

      return Math.max(0, baseCash - totalDeposited - totalExpenses);
    }

    // 2. Jika tidak ada shift yang OPEN, ambil dari shift terakhir yang sudah CLOSED
    const closedSessions = globalState.cashSessions
      .filter((s) => s.store_id === storeId && s.status === 'CLOSED')
      .sort((a, b) => new Date(b.closed_at || b.created_at).getTime() - new Date(a.closed_at || a.created_at).getTime());

    if (closedSessions.length === 0) {
      // Jika belum ada riwayat shift sebelumnya, cari total pembayaran tunai toko
      const cashPaymentsTotal = (globalState.payments || [])
        .filter((p) => {
          if (p.payment_method !== 'CASH') return false;
          const sale = globalState.sales.find((s) => s.id === p.sale_id);
          return sale && sale.store_id === storeId && sale.payment_status !== 'CANCELLED';
        })
        .reduce((sum, p) => sum + Math.max(0, (p.amount || 0) - (p.change_amount || 0)), 0);

      const totalDeposited = (globalState.cashDeposits || [])
        .filter((d) => d.store_id === storeId && d.status === 'APPROVED')
        .reduce((sum, d) => sum + (d.amount || 0), 0);
      const totalExpenses = (globalState.expenses || [])
        .filter((e) => e.store_id === storeId && !isCentralExpense(e))
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      return Math.max(0, cashPaymentsTotal - totalDeposited - totalExpenses);
    }

    const lastClosed = closedSessions[0];
    const baseCash = lastClosed.actual_closing_cash ?? lastClosed.closing_cash ?? 0;

    // Kurangi setoran yang sudah APPROVED setelah shift terakhir ditutup
    const lastClosedTime = new Date(lastClosed.closed_at || lastClosed.created_at).getTime();
    const depositsAfterClose = (globalState.cashDeposits || []).filter(
      (d) =>
        d.store_id === storeId &&
        d.status === 'APPROVED' &&
        new Date(d.created_at).getTime() >= lastClosedTime
    );
    const totalDeposited = depositsAfterClose.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Kurangi transaksi nominal pengeluaran (beban operasional cabang kasir) toko setelah shift terakhir ditutup
    const expensesAfterClose = (globalState.expenses || []).filter(
      (e) =>
        e.store_id === storeId &&
        !isCentralExpense(e) &&
        new Date(e.created_at || e.expense_date).getTime() >= lastClosedTime
    );
    const totalExpenses = expensesAfterClose.reduce((sum, e) => sum + (e.amount || 0), 0);

    return Math.max(0, baseCash - totalDeposited - totalExpenses);
  },

  async checkStorePosLockStatus(storeId: string): Promise<PosLockStatus> {
    const pendingDeposit = (globalState.cashDeposits || []).find(
      (d) => d.store_id === storeId && d.status === 'PENDING'
    );
    const pendingVoid = (globalState.sales || []).find(
      (s) => s.store_id === storeId && s.sale_status === 'VOID_PENDING'
    );

    if (pendingDeposit && pendingVoid) {
      return {
        is_locked: true,
        lock_type: 'BOTH',
        reason: `Terdapat pengajuan setor kas (Rp ${pendingDeposit.amount.toLocaleString('id-ID')}) dan pengajuan batal transaksi (${pendingVoid.invoice_number}) yang sedang menunggu persetujuan Super Admin. POS Kasir dikunci sementara hingga disetujui atau ditolak.`,
        pending_deposit: pendingDeposit,
        pending_void: pendingVoid,
      };
    }

    if (pendingDeposit) {
      return {
        is_locked: true,
        lock_type: 'PENDING_DEPOSIT',
        reason: `Terdapat pengajuan setor kas sebesar Rp ${pendingDeposit.amount.toLocaleString('id-ID')} yang sedang menunggu persetujuan Super Admin. POS Kasir dikunci sementara hingga disetujui atau ditolak.`,
        pending_deposit: pendingDeposit,
      };
    }

    if (pendingVoid) {
      return {
        is_locked: true,
        lock_type: 'PENDING_VOID',
        reason: `Terdapat pengajuan pembatalan (Void) transaksi ${pendingVoid.invoice_number} yang sedang menunggu persetujuan Super Admin. POS Kasir dikunci sementara hingga disetujui atau ditolak.`,
        pending_void: pendingVoid,
      };
    }

    return {
      is_locked: false,
      lock_type: null,
    };
  },

  async getCashDeposits(options?: {
    store_id?: string;
    status?: CashDepositStatus;
  }): Promise<CashDeposit[]> {
    if (!Array.isArray(globalState.cashDeposits)) {
      globalState.cashDeposits = [];
    }
    let list = [...globalState.cashDeposits];
    if (options?.store_id) {
      list = list.filter((d) => d.store_id === options.store_id);
    }
    if (options?.status) {
      list = list.filter((d) => d.status === options.status);
    }
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list.map((d) => ({
      ...d,
      store: globalState.stores.find((st) => st.id === d.store_id),
    }));
  },

  async createCashDeposit(data: {
    store_id: string;
    cashier_id: string;
    cashier_name: string;
    amount: number;
    deposit_method: CashDepositMethod;
    bank_name?: string | null;
    notes?: string | null;
  }): Promise<CashDeposit> {
    const store = globalState.stores.find((st) => st.id === data.store_id);
    const storeName = store ? store.name : 'Cabang Toko';

    const availableCash = await this.getStoreAvailableCash(data.store_id);
    if (data.amount <= 0) {
      throw new Error('Jumlah setor cash harus lebih besar dari Rp 0.');
    }
    if (data.amount > availableCash) {
      throw new Error(
        `Jumlah setor tunai (Rp ${data.amount.toLocaleString('id-ID')}) melebihi Cash fisik yang tersedia di toko saat ini (Rp ${availableCash.toLocaleString('id-ID')}).`
      );
    }

    const newDeposit: CashDeposit = {
      id: `dep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      store_id: data.store_id,
      store_name: storeName,
      cashier_id: data.cashier_id,
      cashier_name: data.cashier_name,
      amount: data.amount,
      status: 'PENDING',
      deposit_method: data.deposit_method,
      bank_name: data.bank_name || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!Array.isArray(globalState.cashDeposits)) {
      globalState.cashDeposits = [];
    }
    globalState.cashDeposits.unshift(newDeposit);

    await this.createAuditLog({
      action: 'CASH_DEPOSIT_REQUEST',
      entity_name: 'cash_deposit',
      entity_id: newDeposit.id,
      new_data: {
        store: storeName,
        cashier: data.cashier_name,
        amount: data.amount,
        method: data.deposit_method,
      },
    });

    globalState.saveToFile();
    return newDeposit;
  },

  async approveCashDeposit(id: string, approvedBy: string): Promise<CashDeposit> {
    if (!Array.isArray(globalState.cashDeposits)) {
      globalState.cashDeposits = [];
    }
    const deposit = globalState.cashDeposits.find((d) => d.id === id);
    if (!deposit) throw new Error('Pengajuan setor cash tidak ditemukan.');
    if (deposit.status !== 'PENDING') {
      throw new Error(`Pengajuan setor cash ini sudah berstatus ${deposit.status}.`);
    }

    deposit.status = 'APPROVED';
    deposit.approved_by = approvedBy;
    deposit.approved_at = new Date().toISOString();
    deposit.updated_at = new Date().toISOString();

    // Otomatis masukkan ke Kas Perusahaan (Company Master Wallet) sebagai STORE_DEPOSIT
    await this.recordCompanyWalletTransaction({
      transaction_type: 'STORE_DEPOSIT',
      amount: deposit.amount,
      category: deposit.deposit_method === 'BANK_TRANSFER' ? 'Transfer Bank' : 'Setor Tunai',
      reference_id: deposit.id,
      description: `Setoran Kasir Cabang: ${deposit.store_name} (${deposit.cashier_name})`,
      operator: approvedBy,
    });

    await this.createAuditLog({
      action: 'CASH_DEPOSIT_APPROVED',
      entity_name: 'cash_deposit',
      entity_id: deposit.id,
      new_data: {
        store: deposit.store_name,
        amount: deposit.amount,
        approved_by: approvedBy,
      },
    });

    globalState.saveToFile();
    return deposit;
  },

  async rejectCashDeposit(id: string, rejectedBy: string, reason: string): Promise<CashDeposit> {
    if (!Array.isArray(globalState.cashDeposits)) {
      globalState.cashDeposits = [];
    }
    const deposit = globalState.cashDeposits.find((d) => d.id === id);
    if (!deposit) throw new Error('Pengajuan setor cash tidak ditemukan.');
    if (deposit.status !== 'PENDING') {
      throw new Error(`Pengajuan setor cash ini sudah berstatus ${deposit.status}.`);
    }

    deposit.status = 'REJECTED';
    deposit.rejected_by = rejectedBy;
    deposit.rejected_at = new Date().toISOString();
    deposit.rejection_reason = reason || 'Ditolak oleh Super Admin';
    deposit.updated_at = new Date().toISOString();

    await this.createAuditLog({
      action: 'CASH_DEPOSIT_REJECTED',
      entity_name: 'cash_deposit',
      entity_id: deposit.id,
      new_data: {
        store: deposit.store_name,
        amount: deposit.amount,
        rejected_by: rejectedBy,
        reason,
      },
    });

    globalState.saveToFile();
    return deposit;
  },

  // ============================================================================
  // MEMBERS & LOYALTY
  // ============================================================================

  async getMembers(search?: string): Promise<Member[]> {
    let list = [...globalState.members];
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.phone.toLowerCase().includes(q) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.member_code && m.member_code.toLowerCase().includes(q)) ||
          (m.registered_by && m.registered_by.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async getMemberById(id: string): Promise<Member | null> {
    const member = globalState.members.find((m) => m.id === id);
    return member || null;
  },

  async getMemberByPhone(phone: string): Promise<Member | null> {
    const cleanPhone = phone.trim();
    const member = globalState.members.find((m) => m.phone === cleanPhone);
    return member || null;
  },

  async createMember(data: {
    name: string;
    phone: string;
    email?: string | null;
    tier?: string;
    member_code?: string | null;
    registered_by?: string | null;
  }): Promise<Member> {
    const cleanPhone = data.phone.trim();
    const existing = await this.getMemberByPhone(cleanPhone);
    if (existing) {
      throw new Error(`Member dengan nomor HP '${cleanPhone}' sudah terdaftar (${existing.name}).`);
    }

    const cleanCode = data.member_code?.trim() || null;
    if (cleanCode) {
      const existingCode = globalState.members.find(
        (m) => m.member_code && m.member_code.toLowerCase() === cleanCode.toLowerCase()
      );
      if (existingCode) {
        throw new Error(`ID Member '${cleanCode}' sudah digunakan oleh member lain (${existingCode.name}).`);
      }
    }

    const newMember: Member = {
      id: `m0000000-${Date.now().toString(16).slice(-4)}-4000-8000-${Math.random().toString(16).slice(2, 14)}`,
      member_code: cleanCode,
      name: data.name.trim(),
      phone: cleanPhone,
      email: data.email?.trim() || null,
      registered_by: data.registered_by?.trim() || null,
      points_balance: 0,
      tier: data.tier || 'SILVER',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    globalState.members.unshift(newMember);

    await this.createAuditLog({
      action: 'MEMBER_CREATED',
      entity_name: 'members',
      entity_id: newMember.id,
      new_data: {
        name: newMember.name,
        phone: newMember.phone,
        member_code: newMember.member_code,
        registered_by: newMember.registered_by,
      },
    });

    globalState.saveToFile();

    return newMember;
  },

  async updateMember(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string | null;
      tier?: string;
      is_active?: boolean;
      member_code?: string | null;
      registered_by?: string | null;
    }
  ): Promise<Member> {
    const member = globalState.members.find((m) => m.id === id);
    if (!member) {
      throw new Error(`Member dengan ID '${id}' tidak ditemukan.`);
    }

    if (data.phone && data.phone.trim() !== member.phone) {
      const cleanPhone = data.phone.trim();
      const existing = await this.getMemberByPhone(cleanPhone);
      if (existing && existing.id !== id) {
        throw new Error(`Nomor telepon '${cleanPhone}' sudah digunakan oleh member lain (${existing.name}).`);
      }
      member.phone = cleanPhone;
    }

    if (data.member_code !== undefined) {
      const cleanCode = data.member_code?.trim() || null;
      if (cleanCode) {
        const existingCode = globalState.members.find(
          (m) => m.id !== id && m.member_code && m.member_code.toLowerCase() === cleanCode.toLowerCase()
        );
        if (existingCode) {
          throw new Error(`ID Member '${cleanCode}' sudah digunakan oleh member lain (${existingCode.name}).`);
        }
      }
      member.member_code = cleanCode;
    }

    if (data.name !== undefined) member.name = data.name.trim();
    if (data.email !== undefined) member.email = data.email?.trim() || null;
    if (data.registered_by !== undefined) member.registered_by = data.registered_by?.trim() || null;
    if (data.tier !== undefined) member.tier = data.tier;
    if (data.is_active !== undefined) member.is_active = data.is_active;
    member.updated_at = new Date().toISOString();

    await this.createAuditLog({
      action: 'MEMBER_UPDATED',
      entity_name: 'members',
      entity_id: member.id,
      new_data: {
        name: member.name,
        phone: member.phone,
        tier: member.tier,
        member_code: member.member_code,
        registered_by: member.registered_by,
      },
    });

    globalState.saveToFile();

    return member;
  },

  async deleteMember(id: string): Promise<boolean> {
    const idx = globalState.members.findIndex((m) => m.id === id);
    if (idx === -1) {
      throw new Error(`Member dengan ID '${id}' tidak ditemukan.`);
    }

    const deleted = globalState.members[idx];
    globalState.members.splice(idx, 1);

    await this.createAuditLog({
      action: 'MEMBER_DELETED',
      entity_name: 'members',
      entity_id: id,
      old_data: { name: deleted.name, phone: deleted.phone, tier: deleted.tier },
    });

    globalState.saveToFile();

    return true;
  },

  // ============================================================================
  // LOYALTY PROGRAM & POINT LEDGER
  // ============================================================================

  async getLoyaltyConfig(): Promise<LoyaltyConfig> {
    return { ...globalState.loyaltyConfig };
  },

  async updateLoyaltyConfig(
    config: Partial<LoyaltyConfig>,
    updatedBy?: string
  ): Promise<LoyaltyConfig> {
    const cleanPatch = Object.fromEntries(
      Object.entries(config).filter(([, v]) => v !== undefined)
    ) as Partial<LoyaltyConfig>;
    globalState.loyaltyConfig = {
      ...globalState.loyaltyConfig,
      ...cleanPatch,
    };
    globalState.saveToFile();

    await this.createAuditLog({
      action: 'LOYALTY_CONFIG_UPDATED',
      entity_name: 'app_settings',
      entity_id: 'loyalty_config',
      new_data: { ...globalState.loyaltyConfig } as unknown as Record<string, unknown>,
    });

    return { ...globalState.loyaltyConfig };
  },

  async getPointTransactions(options?: {
    member_id?: string;
    limit?: number;
  }): Promise<PointTransaction[]> {
    let list = [...globalState.pointTransactions];

    if (options?.member_id) {
      list = list.filter((tx) => tx.member_id === options.member_id);
    }

    if (options?.limit) {
      list = list.slice(0, options.limit);
    }

    return list.map((tx) => ({
      ...tx,
      member: globalState.members.find((m) => m.id === tx.member_id),
    }));
  },

  /**
   * PENCATATAN MUTASI POIN KE BUKU BESAR (IMMUTABLE POINT LEDGER)
   * Mendukung: EARN, REDEEM, REVERSAL, ADJUSTMENT
   */
  async recordPointTransaction(data: {
    member_id: string;
    transaction_type: PointTransactionType;
    points_delta: number;
    reference_id?: string;
    notes?: string;
    created_by?: string;
  }): Promise<PointTransaction> {
    const member = globalState.members.find((m) => m.id === data.member_id);
    if (!member) {
      throw new Error(`Member dengan ID '${data.member_id}' tidak ditemukan.`);
    }

    const currentBalance = member.points_balance || 0;
    const pointsDelta = Math.round(Number(data.points_delta));
    const balanceAfter = currentBalance + pointsDelta;

    if (balanceAfter < 0) {
      throw new Error(
        `Saldo poin member '${member.name}' tidak mencukupi untuk penukaran. Saldo saat ini: ${currentBalance} Poin, Diminta: ${Math.abs(pointsDelta)} Poin.`
      );
    }

    const newTx: PointTransaction = {
      id: `pt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      member_id: data.member_id,
      transaction_type: data.transaction_type,
      points_delta: pointsDelta,
      balance_after: balanceAfter,
      reference_id: data.reference_id || null,
      notes: data.notes || null,
      created_by: data.created_by || null,
      created_at: new Date().toISOString(),
    };

    // Update Saldo & Status Member
    member.points_balance = balanceAfter;
    member.updated_at = new Date().toISOString();

    // Auto update Member Tier berdasarkan saldo poin
    if (balanceAfter >= 500) {
      member.tier = 'PLATINUM';
    } else if (balanceAfter >= 200) {
      member.tier = 'GOLD';
    } else {
      member.tier = 'SILVER';
    }

    globalState.pointTransactions.unshift(newTx);

    await this.createAuditLog({
      action: 'POINT_LEDGER_RECORDED',
      entity_name: 'point_transactions',
      entity_id: newTx.id,
      new_data: {
        member_id: member.id,
        type: data.transaction_type,
        delta: pointsDelta,
        balance_after: balanceAfter,
      },
    });

    globalState.saveToFile();

    return {
      ...newTx,
      member: { ...member },
    };
  },

  /**
   * REKONSILIASI SALDO POIN MEMBER TERHADAP BUKU BESAR MUTASI
   */
  async reconcileMemberPoints(memberId: string): Promise<{
    member_id: string;
    current_balance: number;
    ledger_balance: number;
    is_reconciled: boolean;
    total_transactions: number;
  }> {
    const member = globalState.members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error(`Member dengan ID '${memberId}' tidak ditemukan.`);
    }

    const txList = globalState.pointTransactions.filter((tx) => tx.member_id === memberId);
    const ledgerSum = txList.reduce((sum, tx) => sum + tx.points_delta, 0);

    return {
      member_id: memberId,
      current_balance: member.points_balance,
      ledger_balance: ledgerSum,
      is_reconciled: member.points_balance === ledgerSum,
      total_transactions: txList.length,
    };
  },

  /**
   * PEMBALIKAN POIN (REVERSAL) SAAT TRANSAKSI DIBATALKAN / DIRETUR
   * Mencegah pembalikan ganda (non-double reversal)
   */
  async reversePointsForSale(
    invoiceNumber: string,
    reason?: string,
    createdBy?: string
  ): Promise<{
    reversed_earn?: PointTransaction;
    reversed_redeem?: PointTransaction;
  }> {
    const existingReversal = globalState.pointTransactions.find(
      (tx) => tx.reference_id === invoiceNumber && tx.transaction_type === 'REVERSAL'
    );
    if (existingReversal) {
      throw new Error(
        `Poin untuk transaksi invoice '${invoiceNumber}' sudah pernah dibalikkan sebelumnya.`
      );
    }

    const txRelated = globalState.pointTransactions.filter(
      (tx) => tx.reference_id === invoiceNumber
    );

    if (txRelated.length === 0) {
      throw new Error(`Tidak ditemukan transaksi poin untuk invoice '${invoiceNumber}'.`);
    }

    let reversedEarn: PointTransaction | undefined;
    let reversedRedeem: PointTransaction | undefined;

    for (const tx of txRelated) {
      if (tx.transaction_type === 'EARN' && tx.points_delta > 0) {
        // Tarik kembali poin yang pernah dihadiahkan
        reversedEarn = await this.recordPointTransaction({
          member_id: tx.member_id,
          transaction_type: 'REVERSAL',
          points_delta: -tx.points_delta,
          reference_id: invoiceNumber,
          notes: `Reversal Poin Belanja: ${reason || 'Pembatalan Transaksi'}`,
          created_by: createdBy,
        });
      } else if (tx.transaction_type === 'REDEEM' && tx.points_delta < 0) {
        // Kembalikan poin yang pernah ditukarkan oleh pelanggan
        reversedRedeem = await this.recordPointTransaction({
          member_id: tx.member_id,
          transaction_type: 'REVERSAL',
          points_delta: Math.abs(tx.points_delta),
          reference_id: invoiceNumber,
          notes: `Reversal Penukaran Poin: ${reason || 'Pembatalan Transaksi'}`,
          created_by: createdBy,
        });
      }
    }

    return {
      reversed_earn: reversedEarn,
      reversed_redeem: reversedRedeem,
    };
  },

  // ============================================================================
  // POS: SALES & ATOMIC CHECKOUT
  // ============================================================================

  async processSaleCheckout(data: {
    store_id: string;
    cashier_id: string;
    cash_session_id?: string;
    member_id?: string;
    idempotency_key: string;
    items: {
      product_id: string;
      quantity: number;
      unit_price?: number;
      discount_amount?: number;
    }[];
    payment: {
      payment_method: PaymentMethod;
      amount: number;
      payment_reference?: string;
    };
    points_to_redeem?: number;
    perfume_tier?: string;
    notes?: string;
  }): Promise<Sale> {
    // 1. MEKANISME IDEMPOTENSI: Mencegah pemrosesan ulang transaksi ganda
    if (!data.idempotency_key || !data.idempotency_key.trim()) {
      throw new Error('Idempotency key wajib disertakan untuk setiap transaksi checkout POS.');
    }

    const existingSale = globalState.sales.find((s) => s.idempotency_key === data.idempotency_key);
    if (existingSale) {
      // Jika idempotency key sudah ada, kembalikan transaksi yang telah tersimpan (idempotent result)
      return (await this.getSaleById(existingSale.id))!;
    }

    // 2. Validasi Toko & Kasir
    const store = globalState.stores.find((st) => st.id === data.store_id);
    if (!store) {
      throw new Error(`Toko dengan ID '${data.store_id}' tidak ditemukan.`);
    }

    if (store.type === 'WAREHOUSE') {
      throw new Error('Gudang Pusat Distribusi tidak melayani transaksi ritel kasir langsung.');
    }

    const cashier = globalState.profiles.find((p) => p.id === data.cashier_id);
    if (!cashier) {
      throw new Error(`Profil kasir dengan ID '${data.cashier_id}' tidak ditemukan.`);
    }

    // Safeguard Operasional: Cek apakah POS toko sedang dikunci menunggu approval setor kas atau void
    const lockStatus = await this.checkStorePosLockStatus(data.store_id);
    if (lockStatus.is_locked) {
      throw new Error(`TRANSAKSI POS DIKUNCI: ${lockStatus.reason}`);
    }

    // 3. Validasi Keranjang Belanja
    if (!data.items || data.items.length === 0) {
      throw new Error('Keranjang belanja kosong. Masukkan minimal 1 produk.');
    }

    // 4. CEK STOK & CEGAH STOK NEGATIF SECARA ATOMIK
    // Snapshot harga jual dan HPP persediaan saat transaksi dilakukan
    const preparedItems: {
      product_id: string;
      quantity: number;
      unit_price: number;
      unit_cost: number;
      discount_amount: number;
      subtotal: number;
      product: Product;
    }[] = [];

    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalCostSnapshot = 0;

    for (const item of data.items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Kuantitas untuk produk harus lebih dari 0.`);
      }

      const product = globalState.products.find((p) => p.id === item.product_id);
      if (!product) {
        throw new Error(`Produk dengan ID '${item.product_id}' tidak ditemukan.`);
      }

      const inventory = globalState.inventoryBalances.find(
        (inv) => inv.store_id === data.store_id && inv.product_id === item.product_id
      );

      const availableQty = inventory ? inventory.quantity : 0;
      if (availableQty < item.quantity) {
        throw new Error(
          `Stok tidak mencukupi untuk '${product.name}' di ${store.name}. Tersedia: ${availableQty}, Diminta: ${item.quantity}.`
        );
      }

      const unitPrice =
        item.unit_price !== undefined && Number(item.unit_price) >= 0
          ? Number(item.unit_price)
          : product.base_price;
      const unitCost = inventory ? inventory.moving_avg_cost : Math.round(product.base_price * 0.45);
      const discount = Math.max(0, Number(item.discount_amount) || 0);
      const itemSubtotal = Math.max(0, unitPrice * item.quantity - discount);
      const itemTotalCost = unitCost * item.quantity;

      totalSubtotal += unitPrice * item.quantity;
      totalDiscount += discount;
      totalCostSnapshot += itemTotalCost;

      preparedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        unit_cost: unitCost,
        discount_amount: discount,
        subtotal: itemSubtotal,
        product,
      });
    }

    // 4B. LOGIKA REDEEM POIN LOYALTY (Jika Pelanggan Menggunakan Poin)
    let pointsToRedeem = 0;
    let pointDiscountValue = 0;

    if (data.points_to_redeem && data.points_to_redeem > 0) {
      if (!data.member_id) {
        throw new Error('Penukaran poin loyalty hanya dapat dilakukan untuk member terdaftar.');
      }

      const member = globalState.members.find((m) => m.id === data.member_id);
      if (!member) {
        throw new Error(`Member dengan ID '${data.member_id}' tidak ditemukan.`);
      }

      const loyaltyConfig = globalState.loyaltyConfig;
      if (!loyaltyConfig.is_active) {
        throw new Error('Program loyalty poin saat ini sedang dinonaktifkan.');
      }

      if (data.points_to_redeem < loyaltyConfig.min_redeem_points) {
        throw new Error(
          `Penukaran poin minimal adalah ${loyaltyConfig.min_redeem_points} Poin (Diminta: ${data.points_to_redeem} Poin).`
        );
      }

      if (member.points_balance < data.points_to_redeem) {
        throw new Error(
          `Saldo poin member tidak mencukupi. Tersedia: ${member.points_balance} Poin, Diminta: ${data.points_to_redeem} Poin.`
        );
      }

      pointsToRedeem = data.points_to_redeem;
      pointDiscountValue = pointsToRedeem * loyaltyConfig.point_value_idr;
      totalDiscount += pointDiscountValue;
    }

    const finalAmount = Math.max(0, totalSubtotal - totalDiscount);

    // 5. Validasi Pembayaran
    const paymentMethod = data.payment.payment_method;
    let paymentAmount = Number(data.payment.amount) || 0;
    let changeAmount = 0;

    if (paymentMethod === 'CASH') {
      if (paymentAmount < finalAmount) {
        throw new Error(
          `Nominal pembayaran tunai (Rp ${paymentAmount.toLocaleString('id-ID')}) kurang dari total belanja (Rp ${finalAmount.toLocaleString('id-ID')}).`
        );
      }
      changeAmount = paymentAmount - finalAmount;
    } else {
      // Non-cash (QRIS, TRANSFER, DEBIT) pas sesuai tagihan
      paymentAmount = finalAmount;
      changeAmount = 0;
    }

    // 6. Generate Invoice Unik
    const storeCodeClean = store.code.replace('STORE-', '').replace(/[^A-Za-z0-9]/g, '');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString();
    const invoiceNumber = `INV-${storeCodeClean}-${dateStr}-${randomHex}`;

    const saleId = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // 7. Simpan Transaksi Penjualan
    const newSale: Sale = {
      id: saleId,
      invoice_number: invoiceNumber,
      store_id: data.store_id,
      cashier_id: data.cashier_id,
      member_id: data.member_id || null,
      cash_session_id: data.cash_session_id || null,
      subtotal: totalSubtotal,
      discount_amount: totalDiscount,
      final_amount: finalAmount,
      total_cost: totalCostSnapshot,
      payment_status: 'PAID',
      sale_status: 'COMPLETED',
      idempotency_key: data.idempotency_key,
      points_redeemed: pointsToRedeem,
      points_earned: 0,
      perfume_tier: data.perfume_tier || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    globalState.sales.unshift(newSale);
    globalState.idempotencyKeys.add(data.idempotency_key);

    // 8. Simpan Sale Items & Eksekusi Potong Stok Atomik
    for (const pItem of preparedItems) {
      const saleItemId = `si-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newSaleItem: SaleItem = {
        id: saleItemId,
        sale_id: saleId,
        product_id: pItem.product_id,
        quantity: pItem.quantity,
        unit_price: pItem.unit_price,
        unit_cost: pItem.unit_cost,
        discount_amount: pItem.discount_amount,
        subtotal: pItem.subtotal,
        created_at: new Date().toISOString(),
        product: pItem.product,
      };
      globalState.saleItems.push(newSaleItem);

      // Mutasi stok jenis SALE (mengurangi stok toko, mempertahankan unit cost snapshot)
      await this.recordStockMovement({
        store_id: data.store_id,
        product_id: pItem.product_id,
        movement_type: 'SALE',
        quantity_delta: -pItem.quantity,
        cost_per_unit: pItem.unit_cost,
        reference_id: invoiceNumber,
        notes: `Penjualan Kasir POS: ${invoiceNumber}`,
        created_by: data.cashier_id,
      });
    }

    // 9. Simpan Record Pembayaran
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newPayment: Payment = {
      id: paymentId,
      sale_id: saleId,
      payment_method: paymentMethod,
      amount: paymentAmount,
      change_amount: changeAmount,
      payment_reference: data.payment.payment_reference || null,
      created_at: new Date().toISOString(),
    };
    globalState.payments.push(newPayment);

    // 10. Update Rekonsiliasi Laci Kasir (jika cash session aktif dan bayar CASH)
    if (data.cash_session_id && paymentMethod === 'CASH') {
      const activeSession = globalState.cashSessions.find((s) => s.id === data.cash_session_id);
      if (activeSession && activeSession.status === 'OPEN') {
        activeSession.total_sales_cash += finalAmount;
        activeSession.expected_cash += finalAmount;
      }
    }

    // 11. POTONG POIN REDEEM KE LEDGER (Jika ada penukaran poin)
    if (pointsToRedeem > 0 && data.member_id) {
      await this.recordPointTransaction({
        member_id: data.member_id,
        transaction_type: 'REDEEM',
        points_delta: -pointsToRedeem,
        reference_id: invoiceNumber,
        notes: `Penukaran ${pointsToRedeem} poin (Diskon: Rp ${pointDiscountValue.toLocaleString('id-ID')}) pada invoice ${invoiceNumber}`,
        created_by: data.cashier_id,
      });
    }

    // 12. TAMBAH POIN EARNED KE LEDGER (Jika Member & Nilai Belanja Memenuhi Syarat)
    // Berlaku kelipatan penuh (Math.floor): misal Rp 30.000 = 1.500 poin, Rp 45.000 tetap 1.500 poin, Rp 60.000 = 3.000 poin
    if (data.member_id && globalState.loyaltyConfig.is_active && finalAmount > 0) {
      const spendStep = globalState.loyaltyConfig.spend_per_point || 30000;
      const pointsPerStep = globalState.loyaltyConfig.points_per_step ?? 1500;
      const earned = Math.floor(finalAmount / spendStep) * pointsPerStep;
      if (earned > 0) {
        newSale.points_earned = earned;
        await this.recordPointTransaction({
          member_id: data.member_id,
          transaction_type: 'EARN',
          points_delta: earned,
          reference_id: invoiceNumber,
          notes: `Poin dari belanja Rp ${finalAmount.toLocaleString('id-ID')} pada invoice ${invoiceNumber}`,
          created_by: data.cashier_id,
        });
      }
    }

    // 13. Audit Log Penjualan
    await this.createAuditLog({
      action: 'SALE_COMPLETED',
      entity_name: 'sales',
      entity_id: saleId,
      new_data: {
        invoice_number: invoiceNumber,
        store_id: data.store_id,
        final_amount: finalAmount,
        total_cost: totalCostSnapshot,
        payment_method: paymentMethod,
        points_earned: newSale.points_earned,
        points_redeemed: newSale.points_redeemed,
      },
    });

    globalState.saveToFile();

    return (await this.getSaleById(saleId))!;
  },

  async getSales(options?: {
    store_id?: string;
    cashier_id?: string;
    limit?: number;
  }): Promise<Sale[]> {
    let list = [...globalState.sales];
    if (options?.store_id) {
      list = list.filter((s) => s.store_id === options.store_id);
    }
    if (options?.cashier_id) {
      list = list.filter((s) => s.cashier_id === options.cashier_id);
    }
    if (options?.limit) {
      list = list.slice(0, options.limit);
    }

    return list.map((sale) => {
      const items = globalState.saleItems
        .filter((it) => it.sale_id === sale.id)
        .map((it) => ({
          ...it,
          product: globalState.products.find((p) => p.id === it.product_id),
        }));

      const payments = globalState.payments.filter((p) => p.sale_id === sale.id);

      return {
        ...sale,
        store: globalState.stores.find((st) => st.id === sale.store_id),
        cashier: globalState.profiles.find((p) => p.id === sale.cashier_id),
        member: sale.member_id ? globalState.members.find((m) => m.id === sale.member_id) : null,
        void_requested_cashier: sale.void_requested_by ? globalState.profiles.find((p) => p.id === sale.void_requested_by) : null,
        void_approved_admin: sale.void_approved_by ? globalState.profiles.find((p) => p.id === sale.void_approved_by) : null,
        items,
        payments,
      };
    });
  },

  async getSaleById(id: string): Promise<Sale | null> {
    const sale = globalState.sales.find((s) => s.id === id);
    if (!sale) return null;

    const items = globalState.saleItems
      .filter((it) => it.sale_id === sale.id)
      .map((it) => ({
        ...it,
        product: globalState.products.find((p) => p.id === it.product_id),
      }));

    const payments = globalState.payments.filter((p) => p.sale_id === sale.id);

    return {
      ...sale,
      store: globalState.stores.find((st) => st.id === sale.store_id),
      cashier: globalState.profiles.find((p) => p.id === sale.cashier_id),
      member: sale.member_id ? globalState.members.find((m) => m.id === sale.member_id) : null,
      void_requested_cashier: sale.void_requested_by ? globalState.profiles.find((p) => p.id === sale.void_requested_by) : null,
      void_approved_admin: sale.void_approved_by ? globalState.profiles.find((p) => p.id === sale.void_approved_by) : null,
      items,
      payments,
    };
  },

  async getSaleByInvoice(invoiceNumber: string): Promise<Sale | null> {
    const sale = globalState.sales.find((s) => s.invoice_number === invoiceNumber);
    if (!sale) return null;
    return this.getSaleById(sale.id);
  },

  async requestSaleVoid(saleId: string, cashierId: string, reason: string): Promise<Sale> {
    const sale = globalState.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error(`Transaksi penjualan dengan ID '${saleId}' tidak ditemukan.`);
    if (sale.sale_status === 'VOIDED') {
      throw new Error(`Transaksi '${sale.invoice_number}' sudah dibatalkan sebelumnya.`);
    }
    if (sale.sale_status === 'VOID_PENDING') {
      throw new Error(`Transaksi '${sale.invoice_number}' sedang dalam proses menunggu persetujuan Super Admin.`);
    }

    sale.sale_status = 'VOID_PENDING';
    sale.void_reason = reason;
    sale.void_requested_by = cashierId;
    sale.void_requested_at = new Date().toISOString();
    sale.updated_at = new Date().toISOString();
    globalState.saveToFile();

    await this.createAuditLog({
      action: 'SALE_VOID_REQUESTED',
      entity_name: 'sales',
      entity_id: sale.id,
      user_id: cashierId,
      new_data: {
        invoice_number: sale.invoice_number,
        void_reason: reason,
        requested_by: cashierId,
      },
    });

    return (await this.getSaleById(saleId))!;
  },

  async approveSaleVoid(saleId: string, adminId: string, notes?: string): Promise<Sale> {
    const sale = globalState.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error(`Transaksi penjualan dengan ID '${saleId}' tidak ditemukan.`);
    if (sale.sale_status === 'VOIDED') {
      throw new Error(`Transaksi '${sale.invoice_number}' sudah dibatalkan sebelumnya.`);
    }

    // 1. Rollback Stok ke Inventori Toko
    const items = globalState.saleItems.filter((it) => it.sale_id === sale.id);
    for (const item of items) {
      await this.recordStockMovement({
        store_id: sale.store_id,
        product_id: item.product_id,
        movement_type: 'SALE_RETURN',
        quantity_delta: item.quantity,
        cost_per_unit: item.unit_cost,
        reference_id: sale.invoice_number,
        notes: `Rollback stok karena transaksi dibatalkan (VOID): ${sale.invoice_number} (Alasan: ${sale.void_reason || '-'})`,
        created_by: adminId,
      });
    }

    // 2. Koreksi Kas Laci jika pembayaran bernilai tunai (CASH)
    const payments = globalState.payments.filter((p) => p.sale_id === sale.id);
    const hasCash = payments.some((p) => p.payment_method === 'CASH');
    if (hasCash && sale.cash_session_id) {
      const session = globalState.cashSessions.find((s) => s.id === sale.cash_session_id);
      if (session) {
        session.total_sales_cash = Math.max(0, session.total_sales_cash - sale.final_amount);
        session.expected_cash = Math.max(0, session.expected_cash - sale.final_amount);
      }
    }

    // 3. Rollback Poin Loyalty jika ada
    if (sale.member_id) {
      if (sale.points_earned && sale.points_earned > 0) {
        await this.recordPointTransaction({
          member_id: sale.member_id,
          transaction_type: 'REVERSAL',
          points_delta: -sale.points_earned,
          reference_id: sale.invoice_number,
          notes: `Pembatalan poin reward karena nota dibatalkan: ${sale.invoice_number}`,
          created_by: adminId,
        });
      }
      if (sale.points_redeemed && sale.points_redeemed > 0) {
        await this.recordPointTransaction({
          member_id: sale.member_id,
          transaction_type: 'REVERSAL',
          points_delta: sale.points_redeemed,
          reference_id: sale.invoice_number,
          notes: `Pengembalian poin redeem karena nota dibatalkan: ${sale.invoice_number}`,
          created_by: adminId,
        });
      }
    }

    // 4. Update status Sale
    sale.sale_status = 'VOIDED';
    sale.payment_status = 'CANCELLED';
    sale.void_approved_by = adminId;
    sale.void_approved_at = new Date().toISOString();
    sale.void_notes = notes || null;
    sale.updated_at = new Date().toISOString();
    globalState.saveToFile();

    await this.createAuditLog({
      action: 'SALE_VOID_APPROVED',
      entity_name: 'sales',
      entity_id: sale.id,
      user_id: adminId,
      new_data: {
        invoice_number: sale.invoice_number,
        void_reason: sale.void_reason,
        approved_by: adminId,
        notes: notes || null,
      },
    });

    return (await this.getSaleById(saleId))!;
  },

  async rejectSaleVoid(saleId: string, adminId: string, notes?: string): Promise<Sale> {
    const sale = globalState.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error(`Transaksi penjualan dengan ID '${saleId}' tidak ditemukan.`);
    if (sale.sale_status !== 'VOID_PENDING') {
      throw new Error(`Transaksi '${sale.invoice_number}' tidak dalam status pengajuan batal.`);
    }

    sale.sale_status = 'COMPLETED';
    sale.void_notes = notes ? `Penolakan Batal: ${notes}` : 'Pengajuan pembatalan ditolak Super Admin.';
    sale.updated_at = new Date().toISOString();
    globalState.saveToFile();

    await this.createAuditLog({
      action: 'SALE_VOID_REJECTED',
      entity_name: 'sales',
      entity_id: sale.id,
      user_id: adminId,
      new_data: {
        invoice_number: sale.invoice_number,
        rejected_by: adminId,
        notes: notes || null,
      },
    });

    return (await this.getSaleById(saleId))!;
  },

  // ============================================================================
  // OPERATIONAL EXPENSES & FINANCIAL REPORTING (TAHAP 6)
  // ============================================================================

  async getExpenses(options?: {
    store_id?: string;
    category?: ExpenseCategory;
    startDate?: string;
    endDate?: string;
  }): Promise<Expense[]> {
    let list = [...globalState.expenses];

    if (options?.store_id) {
      list = list.filter((e) => e.store_id === options.store_id);
    }
    if (options?.category) {
      list = list.filter((e) => e.category === options.category);
    }
    const toExpenseDateKey = (raw: string) => {
      if (!raw) return '';
      if (raw.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
      try {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(raw));
      } catch {
        return raw.slice(0, 10);
      }
    };

    if (options?.startDate) {
      list = list.filter((e) => toExpenseDateKey(e.expense_date || e.created_at) >= options.startDate!);
    }
    if (options?.endDate) {
      list = list.filter((e) => toExpenseDateKey(e.expense_date || e.created_at) <= options.endDate!);
    }

    // Sort descending by date
    list.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());

    return list.map((e) => {
      const profile = e.created_by
        ? globalState.profiles.find((p) => p.id === e.created_by || p.full_name === e.created_by)
        : undefined;
      return {
        ...e,
        store: globalState.stores.find((st) => st.id === e.store_id),
        created_by_user: profile || (e.created_by ? ({
          id: e.created_by,
          full_name: e.created_by,
          role: e.created_by.toLowerCase().includes('kasir') ? 'CASHIER' : 'SUPER_ADMIN',
          email: '',
          assigned_store_id: e.store_id,
          is_active: true,
          is_locked: false,
          failed_login_attempts: 0,
          locked_at: null,
          created_at: e.created_at,
          updated_at: e.updated_at,
        } as UserProfile) : undefined),
      };
    });
  },

  async createExpense(data: {
    store_id: string;
    expense_date?: string;
    category: ExpenseCategory;
    description: string;
    amount: number;
    receipt_url?: string | null;
    funding_source?: 'CENTRAL' | 'STORE';
    created_by?: string | null;
  }): Promise<Expense> {
    const store = globalState.stores.find((st) => st.id === data.store_id);
    if (!store) {
      throw new Error(`Toko/Lokasi dengan ID '${data.store_id}' tidak ditemukan.`);
    }

    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Nominal biaya operasional harus berupa angka lebih dari 0.');
    }

    if (!data.description || !data.description.trim()) {
      throw new Error('Deskripsi pengeluaran operasional wajib diisi.');
    }

    const creatorProfile = data.created_by
      ? globalState.profiles.find((p) => p.id === data.created_by || p.full_name === data.created_by)
      : undefined;

    const fundingSource: 'CENTRAL' | 'STORE' =
      data.funding_source ||
      (creatorProfile?.role === 'SUPER_ADMIN' ? 'CENTRAL' : 'STORE');

    const expId = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Jika diinput oleh Super Admin (CENTRAL), otomatis potong Kas Utama Perusahaan
    // dan memotong saldo Total Setoran Berhasil Diterima (TIDAK memotong laci kasir cabang)
    if (fundingSource === 'CENTRAL') {
      await this.recordCompanyWalletTransaction({
        transaction_type: 'OPERATIONAL_EXPENSE',
        amount: -amount,
        category: data.category,
        reference_id: expId,
        description: `Biaya Operasional Pusat (${store.name}): ${data.description.trim()}`,
        operator: creatorProfile?.full_name || 'Super Admin Utama',
      });
    }

    const newExpense: Expense = {
      id: expId,
      store_id: data.store_id,
      expense_date: data.expense_date || new Date().toISOString().slice(0, 10),
      category: data.category,
      description: data.description.trim(),
      amount: amount,
      receipt_url: data.receipt_url || null,
      funding_source: fundingSource,
      created_by: data.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    globalState.expenses.unshift(newExpense);

    await this.createAuditLog({
      action: 'EXPENSE_RECORDED',
      entity_name: 'expenses',
      entity_id: newExpense.id,
      new_data: {
        store_id: newExpense.store_id,
        category: newExpense.category,
        amount: newExpense.amount,
        description: newExpense.description,
        funding_source: fundingSource,
      },
    });

    globalState.saveToFile();

    return {
      ...newExpense,
      store: { ...store },
    };
  },

  async getSuperAdminPendingNotifications(): Promise<{
    counts: {
      pending_deposits: number;
      pending_transfers: number;
      pending_purchases: number;
      pending_voids: number;
      total: number;
    };
    items: Array<{
      id: string;
      type: 'DEPOSIT' | 'TRANSFER' | 'PURCHASE' | 'VOID';
      title: string;
      subtitle: string;
      href: string;
      created_at: string;
    }>;
  }> {
    const pendingDeposits = (globalState.cashDeposits || []).filter(
      (d) => d.status === 'PENDING'
    );
    const pendingTransfers = (globalState.stockTransfers || []).filter(
      (t) => t.status === 'PENDING_APPROVAL' || t.status === 'RETURN_REQUESTED'
    );
    const pendingPurchases = (globalState.purchases || []).filter(
      (p) => p.status === 'PENDING_APPROVAL'
    );
    const pendingVoids = (globalState.sales || []).filter(
      (s) => s.sale_status === 'VOID_PENDING'
    );

    const items: Array<{
      id: string;
      type: 'DEPOSIT' | 'TRANSFER' | 'PURCHASE' | 'VOID';
      title: string;
      subtitle: string;
      href: string;
      created_at: string;
    }> = [];

    for (const d of pendingDeposits) {
      items.push({
        id: d.id,
        type: 'DEPOSIT',
        title: `Setor Kas: ${d.store_name || 'Cabang'}`,
        subtitle: `Rp ${(d.amount || 0).toLocaleString('id-ID')} • ${d.cashier_name || 'Kasir'}`,
        href: '/superadmin/deposits',
        created_at: d.created_at,
      });
    }

    for (const t of pendingTransfers) {
      const destStore = globalState.stores.find((s) => s.id === t.destination_store_id);
      const isReturn = t.status === 'RETURN_REQUESTED';
      items.push({
        id: t.id,
        type: 'TRANSFER',
        title: isReturn
          ? `Retur Mutasi: ${t.transfer_number}`
          : `Approval Mutasi: ${t.transfer_number}`,
        subtitle: `${destStore?.name || 'Cabang'} • ${isReturn ? 'Ditolak kasir, perlu keputusan' : 'Menunggu persetujuan'}`,
        href: '/superadmin/transfers',
        created_at: t.created_at,
      });
    }

    for (const p of pendingPurchases) {
      items.push({
        id: p.id,
        type: 'PURCHASE',
        title: `Acuan Belanja: ${p.po_number}`,
        subtitle: `Estimasi Rp ${(p.total_amount || 0).toLocaleString('id-ID')}`,
        href: '/superadmin/purchases',
        created_at: p.created_at,
      });
    }

    for (const s of pendingVoids) {
      const st = globalState.stores.find((x) => x.id === s.store_id);
      items.push({
        id: s.id,
        type: 'VOID',
        title: `Pengajuan Batal: ${s.invoice_number}`,
        subtitle: `${st?.name || 'Cabang'} • Rp ${(s.final_amount || 0).toLocaleString('id-ID')}`,
        href: '/cashier/history',
        created_at: s.updated_at || s.created_at,
      });
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const counts = {
      pending_deposits: pendingDeposits.length,
      pending_transfers: pendingTransfers.length,
      pending_purchases: pendingPurchases.length,
      pending_voids: pendingVoids.length,
      total:
        pendingDeposits.length +
        pendingTransfers.length +
        pendingPurchases.length +
        pendingVoids.length,
    };

    return {
      counts,
      items: items.slice(0, 12),
    };
  },

  async getCentralExpensesSummary(): Promise<{ total: number; count: number }> {
    const centralList = (globalState.expenses || []).filter((e) => isCentralExpense(e));
    const total = centralList.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { total, count: centralList.length };
  },

  async deleteExpense(id: string): Promise<boolean> {
    const index = globalState.expenses.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Biaya operasional dengan ID '${id}' tidak ditemukan.`);
    }

    const removed = globalState.expenses[index];
    globalState.expenses.splice(index, 1);

    // Jika biaya pusat dihapus, kembalikan saldo Kas Utama Perusahaan
    if (isCentralExpense(removed) && removed.amount > 0) {
      await this.recordCompanyWalletTransaction({
        transaction_type: 'ADJUSTMENT',
        amount: removed.amount,
        category: removed.category,
        reference_id: removed.id,
        description: `Pengembalian Saldo (Hapus Biaya Operasional Pusat): ${removed.description}`,
        operator: 'Super Admin Utama',
      });
    }

    await this.createAuditLog({
      action: 'EXPENSE_DELETED',
      entity_name: 'expenses',
      entity_id: id,
      new_data: { description: removed.description, amount: removed.amount },
    });

    globalState.saveToFile();

    return true;
  },

  /**
   * LAPORAN KEUANGAN OPERASIONAL RITEL:
   * - Penjualan Bersih = Gross Sales - Diskon
   * - Laba Kotor = Penjualan Bersih - HPP Barang Terjual (COGS Snapshot)
   * - Laba Operasional = Laba Kotor - Biaya Operasional Tercatat
   * - Nilai Persediaan = Saldo Stok Fisik x Moving Average HPP
   * - Perbandingan Finansial 3 Toko Cabang (Kendal Kota, Pegandon, Kaliwungu)
   */
  async getFinancialReport(options?: {
    startDate?: string;
    endDate?: string;
    store_id?: string;
  }): Promise<FinancialReportSummary> {
    // 1. Filter Sales
    let sales = globalState.sales.filter((s) => s.sale_status === 'COMPLETED');
    if (options?.store_id) {
      sales = sales.filter((s) => s.store_id === options.store_id);
    }
    if (options?.startDate) {
      sales = sales.filter((s) => s.created_at.slice(0, 10) >= options.startDate!);
    }
    if (options?.endDate) {
      sales = sales.filter((s) => s.created_at.slice(0, 10) <= options.endDate!);
    }

    // 2. Filter Expenses
    let expenses = [...globalState.expenses];
    if (options?.store_id) {
      expenses = expenses.filter((e) => e.store_id === options.store_id);
    }
    if (options?.startDate) {
      expenses = expenses.filter((e) => e.expense_date >= options.startDate!);
    }
    if (options?.endDate) {
      expenses = expenses.filter((e) => e.expense_date <= options.endDate!);
    }

    // 3. Hitung Angka Agregat Utama
    const totalGrossSales = sales.reduce((sum, s) => sum + s.subtotal, 0);
    const totalDiscounts = sales.reduce((sum, s) => sum + s.discount_amount, 0);
    const totalNetSales = sales.reduce((sum, s) => sum + s.final_amount, 0);
    const totalCogs = sales.reduce((sum, s) => sum + s.total_cost, 0);
    const grossProfit = totalNetSales - totalCogs;
    const grossProfitMarginPct = totalNetSales > 0 ? (grossProfit / totalNetSales) * 100 : 0;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netOperatingProfit = grossProfit - totalExpenses;

    // Nilai persediaan seluruh gudang dan cabang
    let balances = [...globalState.inventoryBalances];
    if (options?.store_id) {
      balances = balances.filter((b) => b.store_id === options.store_id);
    }
    const totalInventoryValue = balances.reduce(
      (sum, b) => sum + b.quantity * b.moving_avg_cost,
      0
    );

    // 4. Perhitungan Metrik Finansial per Cabang Toko
    const targetStores = options?.store_id
      ? globalState.stores.filter((st) => st.id === options.store_id)
      : globalState.stores;

    const storeMetrics: StoreFinancialMetric[] = targetStores.map((st) => {
      const stSales = sales.filter((s) => s.store_id === st.id);
      const stExpenses = expenses.filter((e) => e.store_id === st.id);
      const stBalances = globalState.inventoryBalances.filter((b) => b.store_id === st.id);

      const stGross = stSales.reduce((sum, s) => sum + s.subtotal, 0);
      const stDisc = stSales.reduce((sum, s) => sum + s.discount_amount, 0);
      const stNet = stSales.reduce((sum, s) => sum + s.final_amount, 0);
      const stCogs = stSales.reduce((sum, s) => sum + s.total_cost, 0);
      const stGrossProfit = stNet - stCogs;
      const stMargin = stNet > 0 ? (stGrossProfit / stNet) * 100 : 0;
      const stExp = stExpenses.reduce((sum, e) => sum + e.amount, 0);
      const stNetProfit = stGrossProfit - stExp;
      const stInvVal = stBalances.reduce((sum, b) => sum + b.quantity * b.moving_avg_cost, 0);

      return {
        store_id: st.id,
        store_name: st.name,
        store_code: st.code,
        gross_sales: stGross,
        discounts: stDisc,
        net_sales: stNet,
        cogs: stCogs,
        gross_profit: stGrossProfit,
        gross_profit_margin_pct: Math.round(stMargin * 100) / 100,
        expenses: stExp,
        net_operating_profit: stNetProfit,
        inventory_value: stInvVal,
        transaction_count: stSales.length,
      };
    });

    return {
      total_gross_sales: totalGrossSales,
      total_discounts: totalDiscounts,
      total_net_sales: totalNetSales,
      total_cogs: totalCogs,
      gross_profit: grossProfit,
      gross_profit_margin_pct: Math.round(grossProfitMarginPct * 100) / 100,
      total_expenses: totalExpenses,
      net_operating_profit: netOperatingProfit,
      total_inventory_value: totalInventoryValue,
      total_transactions: sales.length,
      store_metrics: storeMetrics,
    };
  },

  /**
   * PERINGATAN STOK MENIPIS (LOW STOCK ALERTS)
   */
  async getLowStockAlerts(storeId?: string): Promise<{
    product: Product;
    store: Store;
    current_stock: number;
    min_stock_alert: number;
    deficit: number;
  }[]> {
    let balances = [...globalState.inventoryBalances];
    if (storeId) {
      balances = balances.filter((b) => b.store_id === storeId);
    }

    const alerts: {
      product: Product;
      store: Store;
      current_stock: number;
      min_stock_alert: number;
      deficit: number;
    }[] = [];

    for (const bal of balances) {
      const product = globalState.products.find((p) => p.id === bal.product_id);
      const store = globalState.stores.find((st) => st.id === bal.store_id);

      if (product && store && bal.quantity <= product.min_stock_alert) {
        alerts.push({
          product,
          store,
          current_stock: bal.quantity,
          min_stock_alert: product.min_stock_alert,
          deficit: Math.max(0, product.min_stock_alert - bal.quantity),
        });
      }
    }

    return alerts;
  },

  // ============================================================================
  // STAGE 7: AUDIT, RECONCILIATION & DISASTER RECOVERY BACKUP
  // ============================================================================

  /**
   * REKONSILIASI KARTU STOK vs SALDO INVENTARIS SELURUH CABANG
   * Memastikan Saldo Fisik == Saldo Awal + Total Pergerakan Stok
   */
  async reconcileAllInventory(): Promise<{
    total_records: number;
    reconciled_count: number;
    discrepancy_count: number;
    details: {
      store_id: string;
      store_name: string;
      product_id: string;
      product_sku: string;
      product_name: string;
      balance_quantity: number;
      ledger_sum_quantity: number;
      difference: number;
      is_reconciled: boolean;
    }[];
  }> {
    const details = globalState.inventoryBalances.map((bal) => {
      const store = globalState.stores.find((st) => st.id === bal.store_id);
      const product = globalState.products.find((p) => p.id === bal.product_id);
      const movements = globalState.stockMovements.filter(
        (m) => m.store_id === bal.store_id && m.product_id === bal.product_id
      );
      const ledgerSum = movements.reduce((sum, m) => sum + m.quantity_delta, 0);
      const diff = bal.quantity - ledgerSum;

      return {
        store_id: bal.store_id,
        store_name: store?.name || 'Cabang',
        product_id: bal.product_id,
        product_sku: product?.sku || '',
        product_name: product?.name || 'Produk',
        balance_quantity: bal.quantity,
        ledger_sum_quantity: ledgerSum,
        difference: diff,
        is_reconciled: diff === 0,
      };
    });

    const reconciledCount = details.filter((d) => d.is_reconciled).length;
    return {
      total_records: details.length,
      reconciled_count: reconciledCount,
      discrepancy_count: details.length - reconciledCount,
      details,
    };
  },

  /**
   * REKONSILIASI POIN LOYALTY SELURUH MEMBER
   * Memastikan Saldo Member == Sum(points_delta) di Ledger
   */
  async reconcileAllMembers(): Promise<{
    total_members: number;
    reconciled_count: number;
    discrepancy_count: number;
    details: {
      member_id: string;
      name: string;
      phone: string;
      balance: number;
      ledger_sum: number;
      is_reconciled: boolean;
    }[];
  }> {
    const details = globalState.members.map((m) => {
      const txs = globalState.pointTransactions.filter((tx) => tx.member_id === m.id);
      const ledgerSum = txs.reduce((sum, tx) => sum + tx.points_delta, 0);
      return {
        member_id: m.id,
        name: m.name,
        phone: m.phone,
        balance: m.points_balance,
        ledger_sum: ledgerSum,
        is_reconciled: m.points_balance === ledgerSum,
      };
    });

    const reconciledCount = details.filter((d) => d.is_reconciled).length;
    return {
      total_members: details.length,
      reconciled_count: reconciledCount,
      discrepancy_count: details.length - reconciledCount,
      details,
    };
  },

  /**
   * REKONSILIASI SESI KASIR (LACI KAS)
   */
  async reconcileAllCashSessions(): Promise<{
    total_sessions: number;
    closed_sessions: number;
    balanced_sessions: number;
    discrepancy_count: number;
    sessions: CashSession[];
  }> {
    const closed = globalState.cashSessions.filter((s) => s.status === 'CLOSED');
    const balanced = closed.filter((s) => (s.cash_difference || 0) === 0);

    return {
      total_sessions: globalState.cashSessions.length,
      closed_sessions: closed.length,
      balanced_sessions: balanced.length,
      discrepancy_count: closed.length - balanced.length,
      sessions: [...globalState.cashSessions],
    };
  },

  /**
   * EXPORT SNAPSHOT DATABASE LENGKAP UNTUK PROSEDUR BACKUP & RESTORE
   */
  async exportBackupSnapshot(): Promise<{
    version: string;
    system: string;
    generated_at: string;
    record_counts: Record<string, number>;
    payload: any;
  }> {
    const payload = {
      stores: globalState.stores,
      products: globalState.products,
      categories: globalState.categories,
      profiles: globalState.profiles,
      suppliers: globalState.suppliers,
      inventoryBalances: globalState.inventoryBalances,
      stockMovements: globalState.stockMovements,
      stockTransfers: globalState.stockTransfers,
      purchases: globalState.purchases,
      members: globalState.members,
      sales: globalState.sales,
      saleItems: globalState.saleItems,
      payments: globalState.payments,
      pointTransactions: globalState.pointTransactions,
      expenses: globalState.expenses,
      cashSessions: globalState.cashSessions,
      auditLogs: globalState.auditLogs,
    };

    const recordCounts: Record<string, number> = {};
    for (const [key, value] of Object.entries(payload)) {
      recordCounts[key] = Array.isArray(value) ? value.length : 1;
    }

    await this.createAuditLog({
      action: 'BACKUP_SNAPSHOT_EXPORTED',
      entity_name: 'database_backup',
      entity_id: `backup-${Date.now()}`,
      new_data: recordCounts,
    });

    return {
      version: '1.0.0',
      system: 'BB Parfum Premium Management System',
      generated_at: new Date().toISOString(),
      record_counts: recordCounts,
      payload,
    };
  },

  // Test reset helper
  _resetForTesting(withInitialStock: boolean = true) {
    globalState.reset(withInitialStock, true);
  },

  async clearAllInventoryStock(): Promise<void> {
    for (const bal of globalState.inventoryBalances) {
      bal.quantity = 0;
      bal.last_updated_at = new Date().toISOString();
    }
    await this.createAuditLog({
      action: 'INVENTORY_STOCK_CLEARED',
      entity_name: 'inventory_balances',
      new_data: { message: 'Seluruh stok inventaris dikosongkan (0 pcs)' },
    });
  },

  async deleteProduct(id: string): Promise<void> {
    const index = globalState.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Produk dengan ID '${id}' tidak ditemukan.`);
    }
    const [deleted] = globalState.products.splice(index, 1);
    globalState.inventoryBalances = globalState.inventoryBalances.filter((b) => b.product_id !== id);
    await this.createAuditLog({
      action: 'PRODUCT_DELETE',
      entity_name: 'products',
      entity_id: id,
      old_data: { sku: deleted.sku, name: deleted.name },
    });
    globalState.saveToFile();
  },

  async wipeAllData(): Promise<void> {
    globalState.resetToCleanSlate();
  },

  async clearAllProducts(): Promise<void> {
    globalState.products = [];
    globalState.inventoryBalances = [];
    globalState.stockMovements = [];
    await this.createAuditLog({
      action: 'PRODUCT_CLEAR_ALL',
      entity_name: 'products',
      entity_id: 'ALL',
      new_data: { message: 'Seluruh produk & stok dikosongkan untuk input manual' },
    });
    globalState.saveToFile();
  },

  async loadSampleProducts(): Promise<void> {
    globalState.products = [...INITIAL_PRODUCTS];
    globalState.initInventory(false);
    await this.createAuditLog({
      action: 'PRODUCT_LOAD_SAMPLE',
      entity_name: 'products',
      entity_id: 'ALL',
      new_data: { count: INITIAL_PRODUCTS.length },
    });
    globalState.saveToFile();
  },

  async verifyUserCredentials(email: string, passwordPlain: string): Promise<UserProfile> {
    const user = await this.getUserProfileByEmail(email.trim());
    if (!user) {
      throw new Error('Email tidak terdaftar dalam sistem BB Parfum.');
    }
    if (!user.is_active) {
      throw new Error('Akun Anda dinonaktifkan oleh Administrator.');
    }

    // Pengecekan akun terkunci: Super Admin dikecualikan dari penguncian
    if (user.role !== 'SUPER_ADMIN' && user.is_locked) {
      throw new Error('Akun Anda telah TERKUNCI karena gagal login 3 kali. Hubungi Super Admin untuk membuka kunci akun.');
    }

    const expectedPass = globalState.passwords.get(user.id) || 'password123';
    if (!verifyPassword(passwordPlain, expectedPass)) {
      // Super Admin dikecualikan: tidak pernah terkunci
      if (user.role === 'SUPER_ADMIN') {
        throw new Error('Kata sandi yang Anda masukkan salah.');
      }

      // User non-superadmin: catat percobaan gagal
      const profile = globalState.profiles.find((p) => p.id === user.id);
      const attempts = ((profile?.failed_login_attempts) || 0) + 1;
      if (profile) {
        profile.failed_login_attempts = attempts;
        if (attempts >= 3) {
          profile.is_locked = true;
          profile.locked_at = new Date().toISOString();
        }
      }
      globalState.saveToFile();

      if (attempts >= 3) {
        await this.createAuditLog({
          action: 'USER_ACCOUNT_LOCKED',
          entity_name: 'user_profiles',
          entity_id: user.id,
          new_data: { email: user.email, role: user.role, failed_attempts: attempts, reason: '3_FAILED_LOGINS' },
        });
        throw new Error('Kata sandi salah. Akun Anda telah TERKUNCI karena gagal login 3 kali. Hubungi Super Admin untuk membuka kunci akun.');
      } else {
        const remaining = 3 - attempts;
        throw new Error(`Kata sandi yang Anda masukkan salah. Sisa kesempatan login: ${remaining} kali sebelum akun terkunci.`);
      }
    }

    // Login sukses: reset failed attempts jika sebelumnya ada
    const profile = globalState.profiles.find((p) => p.id === user.id);
    if (profile && (profile.failed_login_attempts || profile.is_locked)) {
      profile.failed_login_attempts = 0;
      profile.is_locked = false;
      profile.locked_at = null;
      globalState.saveToFile();
    }

    return user;
  },

  // ==========================================================================
  // DOMPET & KAS UTAMA PERUSAHAAN (COMPANY MASTER WALLET)
  // ==========================================================================
  async getCompanyWalletBalance(): Promise<number> {
    if (!Array.isArray(globalState.companyWalletTransactions) || globalState.companyWalletTransactions.length === 0) {
      if (!Array.isArray(globalState.companyWalletTransactions)) {
        globalState.companyWalletTransactions = [];
      }
      if (globalState.companyWalletTransactions.length === 0) {
        globalState.companyWalletTransactions.push({
          id: 'wtx-init-capital-001',
          transaction_type: 'CAPITAL_INJECTION',
          amount: 150000000,
          balance_after: 150000000,
          category: 'Modal Awal',
          reference_id: 'CAPITAL-INITIAL-001',
          description: 'Suntikan Modal Kas Awal Usaha dari Pemilik (Owner)',
          operator: 'Super Admin (Owner)',
          created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
        });
      }
    }
    return globalState.companyWalletTransactions[0].balance_after;
  },

  async getCompanyWalletTransactions(filters?: {
    type?: WalletTransactionType;
    limit?: number;
  }): Promise<CompanyWalletTransaction[]> {
    await this.getCompanyWalletBalance(); // Memastikan saldo awal terinisialisasi
    let list = [...(globalState.companyWalletTransactions || [])];
    if (filters?.type) {
      list = list.filter((t) => t.transaction_type === filters.type);
    }
    if (filters?.limit) {
      list = list.slice(0, filters.limit);
    }
    return list;
  },

  async recordCompanyWalletTransaction(params: {
    transaction_type: WalletTransactionType;
    amount: number; // positive = masuk, negative = keluar
    category?: string | null;
    reference_id?: string | null;
    description: string;
    operator?: string | null;
  }): Promise<CompanyWalletTransaction> {
    if (params.amount === 0) {
      throw new Error('Nominal transaksi kas tidak boleh Rp 0.');
    }

    const currentBalance = await this.getCompanyWalletBalance();
    const newBalance = currentBalance + params.amount;

    if (newBalance < 0) {
      throw new Error(
        `TRANSAKSI DITOLAK: Saldo kas utama tidak mencukupi. Saldo saat ini: Rp ${currentBalance.toLocaleString('id-ID')}, dibutuhkan pengeluaran: Rp ${Math.abs(params.amount).toLocaleString('id-ID')}.`
      );
    }

    const newTx: CompanyWalletTransaction = {
      id: `wtx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      transaction_type: params.transaction_type,
      amount: params.amount,
      balance_after: newBalance,
      category: params.category || null,
      reference_id: params.reference_id || null,
      description: params.description,
      operator: params.operator || 'Super Admin (Owner)',
      created_at: new Date().toISOString(),
    };

    globalState.companyWalletTransactions.unshift(newTx);

    await this.createAuditLog({
      action: 'WALLET_TRANSACTION',
      entity_name: 'company_wallet',
      entity_id: newTx.id,
      new_data: {
        type: newTx.transaction_type,
        amount: newTx.amount,
        balance_after: newBalance,
        desc: newTx.description,
        operator: newTx.operator,
      },
    });

    globalState.saveToFile();

    return newTx;
  },

  async getCompanyWalletSummary(): Promise<CompanyWalletSummary> {
    const balance = await this.getCompanyWalletBalance();
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalCapital = 0;
    let totalPurchases = 0;
    let totalOpex = 0;
    let totalStoreDeposits = 0;
    let totalWithdrawals = 0;

    for (const tx of globalState.companyWalletTransactions) {
      if (tx.amount > 0) {
        totalInflow += tx.amount;
      } else {
        totalOutflow += Math.abs(tx.amount);
      }

      switch (tx.transaction_type) {
        case 'CAPITAL_INJECTION':
          totalCapital += tx.amount;
          break;
        case 'PURCHASE_PAYMENT':
          totalPurchases += Math.abs(tx.amount);
          break;
        case 'OPERATIONAL_EXPENSE':
          totalOpex += Math.abs(tx.amount);
          break;
        case 'STORE_DEPOSIT':
          totalStoreDeposits += tx.amount;
          break;
        case 'OWNER_WITHDRAWAL':
          totalWithdrawals += Math.abs(tx.amount);
          break;
      }
    }

    return {
      balance,
      total_inflow: totalInflow,
      total_outflow: totalOutflow,
      total_capital: totalCapital,
      total_purchases: totalPurchases,
      total_opex: totalOpex,
      total_store_deposits: totalStoreDeposits,
      total_withdrawals: totalWithdrawals,
    };
  },

  async getStoreTransactionSummaries(options?: {
    storeId?: string;
    startDate?: string;
    endDate?: string;
    includeRecentSales?: boolean;
  }): Promise<StoreTransactionSummary[]> {
    const retailStores = options?.storeId
      ? globalState.stores.filter((s) => s.id === options.storeId)
      : globalState.stores.filter((s) => s.type === 'STORE');

    const summaries: StoreTransactionSummary[] = [];

    for (const store of retailStores) {
      let sales = globalState.sales.filter(
        (s) => s.store_id === store.id && s.sale_status === 'COMPLETED'
      );

      const toWibDateKey = (isoStr: string) => {
        try {
          return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(isoStr));
        } catch {
          return isoStr.slice(0, 10);
        }
      };

      if (options?.startDate) {
        sales = sales.filter((s) => toWibDateKey(s.created_at) >= options.startDate!);
      }
      if (options?.endDate) {
        sales = sales.filter((s) => toWibDateKey(s.created_at) <= options.endDate!);
      }

      sales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      let cashCount = 0;
      let cashAmount = 0;
      let qrisCount = 0;
      let qrisAmount = 0;

      for (const sale of sales) {
        const payments = globalState.payments.filter((p) => p.sale_id === sale.id);
        if (payments.length > 0) {
          for (const p of payments) {
            const netPaid =
              p.amount !== undefined && p.amount !== null
                ? Math.max(0, p.amount - (p.change_amount || 0))
                : sale.final_amount;
            if (p.payment_method === 'CASH') {
              cashCount++;
              cashAmount += netPaid;
            } else if (p.payment_method === 'QRIS') {
              qrisCount++;
              qrisAmount += netPaid;
            }
          }
        } else {
          cashCount++;
          cashAmount += sale.final_amount;
        }
      }

      const categoryMap: Record<
        string,
        {
          label: string;
          unit: string;
          total_quantity: number;
          total_amount: number;
          sales_set: Set<string>;
        }
      > = {
        BIBIT: {
          label: '🌿 Bibit Parfum Refill',
          unit: 'ml',
          total_quantity: 0,
          total_amount: 0,
          sales_set: new Set(),
        },
        BOTOL: {
          label: '🍾 Botol Parfum',
          unit: 'pcs',
          total_quantity: 0,
          total_amount: 0,
          sales_set: new Set(),
        },
        PELARUT: {
          label: '💧 Booster Lux / Pelarut',
          unit: 'pcs',
          total_quantity: 0,
          total_amount: 0,
          sales_set: new Set(),
        },
        READY_TO_WEAR: {
          label: '✨ Parfum Siap Pakai',
          unit: 'pcs',
          total_quantity: 0,
          total_amount: 0,
          sales_set: new Set(),
        },
      };

      for (const sale of sales) {
        const items = globalState.saleItems.filter((it) => it.sale_id === sale.id);
        for (const it of items) {
          const product = globalState.products.find((p) => p.id === it.product_id);
          const type = product?.product_type || 'BIBIT';
          if (!categoryMap[type]) {
            categoryMap[type] = {
              label: `📦 ${type}`,
              unit: product?.unit_name || 'item',
              total_quantity: 0,
              total_amount: 0,
              sales_set: new Set(),
            };
          }
          categoryMap[type].total_quantity += it.quantity;
          categoryMap[type].total_amount += it.subtotal;
          categoryMap[type].sales_set.add(sale.id);
        }
      }

      const categorySummary: CategorySalesSummary[] = Object.entries(categoryMap).map(
        ([cat, val]) => ({
          category: cat,
          label: val.label,
          unit: val.unit,
          total_quantity: val.total_quantity,
          total_amount: val.total_amount,
          transaction_count: val.sales_set.size,
        })
      );

      const availableCash = await this.getStoreAvailableCash(store.id);

      const recentSales: Sale[] = options?.includeRecentSales
        ? sales.map((sale) => {
            const items = globalState.saleItems
              .filter((it) => it.sale_id === sale.id)
              .map((it) => ({
                ...it,
                product: globalState.products.find((p) => p.id === it.product_id),
              }));
            const payments = globalState.payments.filter((p) => p.sale_id === sale.id);
            return {
              ...sale,
              store,
              cashier: globalState.profiles.find((p) => p.id === sale.cashier_id),
              member: sale.member_id
                ? globalState.members.find((m) => m.id === sale.member_id)
                : null,
              items,
              payments,
            };
          })
        : [];

      summaries.push({
        store_id: store.id,
        store_name: store.name,
        store_code: store.code,
        store_address: store.address,
        store_phone: store.phone,
        total_transactions: sales.length,
        total_net_sales: sales.reduce((sum, s) => sum + s.final_amount, 0),
        cash_summary: {
          count: cashCount,
          amount: cashAmount,
        },
        qris_summary: {
          count: qrisCount,
          amount: qrisAmount,
        },
        available_cash: availableCash,
        category_summary: categorySummary,
        recent_sales: recentSales,
      });
    }

    return summaries;
  },
};

export const db = repository;



