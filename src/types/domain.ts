// ============================================================================
// Domain Entities and Business Types
// BB Parfum Premium Management System
// ============================================================================

export type UserRole = 'SUPER_ADMIN' | 'LOGISTICS' | 'CASHIER';

export type StoreType = 'WAREHOUSE' | 'STORE';

export interface Store {
  id: string;
  code: string;
  name: string;
  type: StoreType;
  address: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  assigned_store_id?: string | null;
  is_active: boolean;
  is_locked?: boolean;
  failed_login_attempts?: number;
  locked_at?: string | null;
  created_at: string;
  updated_at: string;
  assigned_store?: Store | null;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export type ProductType = 'BIBIT' | 'PELARUT' | 'BOTOL' | 'READY_TO_WEAR';

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category_id?: string;
  size_ml: number;
  scent_type: string;
  top_notes?: string;
  middle_notes?: string;
  base_notes?: string;
  base_price: number;
  min_stock_alert: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: ProductCategory;
  product_type?: ProductType;
  unit_name?: string; // 'ml', 'gram', 'botol', 'pcs'
  is_blendable?: boolean; // True jika bibit parfum bisa dicampur/diracik
}

export interface InventoryBalance {
  id: string;
  store_id: string;
  product_id: string;
  quantity: number;
  moving_avg_cost: number;
  last_updated_at: string;
  product?: Product;
  store?: Store;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  role?: string;
  store_id?: string;
  action: string;
  entity_name: string;
  entity_id?: string;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export type StockMovementType =
  | 'PURCHASE_RECEIPT'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'SALE'
  | 'SALE_RETURN'
  | 'ADJUSTMENT'
  | 'STOCK_OPNAME';

export interface StockMovement {
  id: string;
  store_id: string;
  product_id: string;
  movement_type: StockMovementType;
  reference_id?: string | null;
  quantity_delta: number;
  cost_per_unit: number;
  balance_after: number;
  moving_avg_cost_after: number;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  product?: Product;
  store?: Store;
}

export interface StockCount {
  id: string;
  store_id: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  notes?: string | null;
  conducted_by: string;
  completed_at?: string | null;
  created_at: string;
  items?: StockCountItem[];
}

export interface StockCountItem {
  id: string;
  stock_count_id: string;
  product_id: string;
  system_quantity: number;
  physical_quantity: number;
  difference_quantity: number;
  cost_per_unit: number;
  notes?: string | null;
  product?: Product;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PurchaseStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ORDERED'
  | 'RECEIVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'DRAFT';

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
  product?: Product;
}

export interface Purchase {
  id: string;
  po_number: string;
  supplier_id: string;
  destination_store_id: string;
  status: PurchaseStatus;
  total_amount: number;
  notes?: string | null;
  ordered_at?: string | null;
  received_at?: string | null;
  received_by?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  destination_store?: Store;
  items?: PurchaseItem[];
}

export type StockTransferStatus =
  | 'PENDING_APPROVAL'
  | 'PENDING_SHIPMENT'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REJECTED'
  | 'CANCELLED';

export interface StockTransferItem {
  id: string;
  stock_transfer_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  product?: Product;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  source_store_id: string;
  destination_store_id: string;
  status: StockTransferStatus;
  notes?: string | null;
  shipped_at?: string | null;
  received_at?: string | null;
  shipped_by?: string | null;
  received_by?: string | null;
  receiving_notes?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  return_requested_by?: string | null;
  return_requested_at?: string | null;
  return_reason?: string | null;
  return_approved_by?: string | null;
  return_approved_at?: string | null;
  return_admin_notes?: string | null;
  created_at: string;
  source_store?: Store;
  destination_store?: Store;
  items?: StockTransferItem[];
}

// ============================================================================
// POS, Cash Session, Sales & Payment Types
// ============================================================================

export type CashSessionStatus = 'OPEN' | 'CLOSED';

export interface CashSession {
  id: string;
  store_id: string;
  cashier_id: string;
  opening_cash: number;
  closing_cash?: number | null;
  total_sales_cash: number;
  expected_cash: number;
  actual_cash?: number | null;
  actual_closing_cash?: number | null;
  difference?: number | null;
  cash_difference?: number | null;
  status: CashSessionStatus;
  opened_at: string;
  closed_at?: string | null;
  notes?: string | null;
  created_at: string;
  total_expenses?: number;
  total_deposits?: number;
  store?: Store;
  cashier?: UserProfile;
}

export type CashDepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CashDepositMethod = 'CASH_HANDOVER' | 'BANK_TRANSFER';

export interface CashDeposit {
  id: string;
  store_id: string;
  store_name: string;
  cashier_id: string;
  cashier_name: string;
  amount: number;
  status: CashDepositStatus;
  deposit_method: CashDepositMethod;
  bank_name?: string | null;
  notes?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  store?: Store;
}

export interface PosLockStatus {
  is_locked: boolean;
  reason?: string;
  lock_type?: 'PENDING_DEPOSIT' | 'PENDING_VOID' | 'BOTH' | null;
  pending_deposit?: CashDeposit;
  pending_void?: Sale;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  points_balance: number;
  tier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';
export type PaymentStatus = 'PAID' | 'REFUNDED' | 'CANCELLED';
export type SaleStatus = 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'VOID_PENDING' | 'VOIDED';
export type PerfumeTier = 'Standard' | 'Premium' | 'Luxury' | 'Primescent';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  discount_amount: number;
  subtotal: number;
  created_at: string;
  product?: Product;
}

export interface Payment {
  id: string;
  sale_id: string;
  payment_method: PaymentMethod;
  amount: number;
  change_amount: number;
  payment_reference?: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  store_id: string;
  cashier_id: string;
  member_id?: string | null;
  cash_session_id?: string | null;
  subtotal: number;
  discount_amount: number;
  final_amount: number;
  total_cost: number;
  payment_status: PaymentStatus;
  sale_status: SaleStatus;
  idempotency_key: string;
  points_earned?: number;
  points_redeemed?: number;
  perfume_tier?: PerfumeTier | string | null;
  notes?: string | null;
  void_reason?: string | null;
  void_requested_by?: string | null;
  void_requested_at?: string | null;
  void_approved_by?: string | null;
  void_approved_at?: string | null;
  void_notes?: string | null;
  void_requested_cashier?: UserProfile | null;
  void_approved_admin?: UserProfile | null;
  created_at: string;
  updated_at: string;
  store?: Store;
  cashier?: UserProfile;
  member?: Member | null;
  items?: SaleItem[];
  payments?: Payment[];
}

// ============================================================================
// Loyalty Points Ledger & Settings Types
// ============================================================================

export type PointTransactionType = 'EARN' | 'REDEEM' | 'REVERSAL' | 'ADJUSTMENT';

export interface PointTransaction {
  id: string;
  member_id: string;
  transaction_type: PointTransactionType;
  points_delta: number;
  balance_after: number;
  reference_id?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  member?: Member;
}

export interface LoyaltyConfig {
  spend_per_point: number; // Nominal belanja per 1x kelipatan (default: 30000 -> setiap kelipatan Rp 30.000)
  points_per_step?: number; // Jumlah poin yang didapat per 1x kelipatan belanja (default: 1500 -> 1.500 poin)
  point_value_idr: number; // Nilai tukar 1 poin ke rupiah (default: 1 -> 1 poin bernilai Rp 1, 1.500 poin = Rp 1.500)
  min_redeem_points: number; // Minimal poin untuk dapat ditukarkan (default: 1500)
  is_active: boolean;
}

export interface AppSetting {
  key: string;
  value: any;
  description?: string;
  updated_by?: string | null;
  updated_at: string;
}

// ============================================================================
// Operational Expenses & Financial Reporting Types
// ============================================================================

export type ExpenseCategory =
  | 'SALARY'
  | 'UTILITIES'
  | 'RENT'
  | 'PACKAGING'
  | 'MARKETING'
  | 'MAINTENANCE'
  | 'SUPPLIES'
  | 'OTHER';

export interface Expense {
  id: string;
  store_id: string;
  expense_date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  receipt_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  store?: Store;
  created_by_user?: UserProfile;
}

export interface StoreFinancialMetric {
  store_id: string;
  store_name: string;
  store_code: string;
  gross_sales: number;
  discounts: number;
  net_sales: number;
  cogs: number;
  gross_profit: number;
  gross_profit_margin_pct: number;
  expenses: number;
  net_operating_profit: number;
  inventory_value: number;
  transaction_count: number;
}

export interface FinancialReportSummary {
  total_gross_sales: number;
  total_discounts: number;
  total_net_sales: number;
  total_cogs: number;
  gross_profit: number;
  gross_profit_margin_pct: number;
  total_expenses: number;
  net_operating_profit: number;
  total_inventory_value: number;
  total_transactions: number;
  store_metrics: StoreFinancialMetric[];
}

export type WalletTransactionType =
  | 'CAPITAL_INJECTION'
  | 'PURCHASE_PAYMENT'
  | 'OPERATIONAL_EXPENSE'
  | 'STORE_DEPOSIT'
  | 'OWNER_WITHDRAWAL'
  | 'ADJUSTMENT';

export interface CompanyWalletTransaction {
  id: string;
  transaction_type: WalletTransactionType;
  amount: number; // positive = masuk, negative = keluar
  balance_after: number;
  category?: string | null;
  reference_id?: string | null;
  description: string;
  operator: string;
  created_at: string;
}

export interface CompanyWalletSummary {
  balance: number;
  total_inflow: number;
  total_outflow: number;
  total_capital: number;
  total_purchases: number;
  total_opex: number;
  total_store_deposits: number;
  total_withdrawals: number;
}

export interface CategorySalesSummary {
  category: string;
  label: string;
  unit: string;
  total_quantity: number;
  total_amount: number;
  transaction_count: number;
}

export interface StoreTransactionSummary {
  store_id: string;
  store_name: string;
  store_code: string;
  store_address?: string;
  store_phone?: string;
  total_transactions: number;
  total_net_sales: number;
  cash_summary: {
    count: number;
    amount: number;
  };
  qris_summary: {
    count: number;
    amount: number;
  };
  available_cash: number;
  category_summary: CategorySalesSummary[];
  recent_sales?: Sale[];
}





