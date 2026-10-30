export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'cash' 
  | 'bank_transfer' 
  | 'qris' 
  | 'ewallet' 
  | 'receivable_payable' 
  | 'other';

export interface Transaction {
  id: string;
  userId: string;
  transactionNumber?: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptUrl?: string;
  receiptImage?: string;
  receiptScanId?: string;
  customerName?: string;
  items?: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ScannedReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ScannedReceipt {
  id: string;
  userId: string;
  storeName: string;
  date: string; // YYYY-MM-DD
  items: ScannedReceiptItem[];
  totalAmount: number;
  tax?: number;
  discount?: number;
  expenseCategory: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  imageUrl: string; // base64 or image URL
  rawText?: string;
  convertedTransactionId?: string;
  createdAt: string;
}

export interface QrisConfig {
  merchantName: string;
  nmid: string;
  pjpProvider: string; // e.g., 'Bank BCA', 'Bank BRI', 'GoPay', 'ShopeePay', 'Nobu'
  city: string;
  postalCode?: string;
  qrisImageUrl: string;
  notes?: string;
  updatedAt: string;
  gateway?: {
    provider: 'midtrans' | 'xendit' | 'none';
    merchantId?: string;
    clientKey?: string;
    serverKey?: string;
    isSandbox: boolean;
    isActive: boolean;
  };
}

export interface Product {
  id: string;
  userId: string;
  sku: string;
  name: string;
  categoryId?: string;
  categoryName?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  description?: string;
  imageUrl?: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'initial';
  quantity: number;
  beforeStock: number;
  afterStock: number;
  reason: string;
  date: string;
}

export interface Debt {
  id: string;
  userId: string;
  type: 'payable' | 'receivable'; // payable=utang supplier, receivable=piutang pelanggan
  contactName: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  startDate: string;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  address?: string;
  totalReceivable: number;
}

export interface Supplier {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  address?: string;
  totalDebt: number;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: string;
}

export type EmployeeRole = 'owner' | 'manager' | 'cashier' | 'staff';

export interface Employee {
  id: string;
  userId: string;
  name: string;
  role: EmployeeRole;
  pin: string; // 4-6 digit numeric PIN
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ActiveStaffSession {
  isStaff: boolean;
  employeeId?: string;
  employeeName?: string;
  role: EmployeeRole;
}

export interface UserProfile {
  userId: string;
  businessName: string;
  ownerName: string;
  businessPhone: string;
  businessAddress: string;
  monthlyProfitTarget: number;
  accessCode?: string; // Kode Akses Toko untuk login staf/karyawan (contoh: UMKM-9824)
  logoUrl?: string; // URL / path logo usaha
  updatedAt: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { label: string; icon: string; short: string }> = {
  cash: { label: 'Tunai (Cash)', icon: 'Banknote', short: 'Tunai' },
  bank_transfer: { label: 'Transfer Bank', icon: 'Building2', short: 'Transfer' },
  qris: { label: 'QRIS', icon: 'QrCode', short: 'QRIS' },
  ewallet: { label: 'E-Wallet (GoPay/OVO/ShopeePay)', icon: 'Smartphone', short: 'E-Wallet' },
  receivable_payable: { label: 'Hutang / Piutang (Tempo)', icon: 'FileText', short: 'Tempo' },
  other: { label: 'Lainnya', icon: 'CreditCard', short: 'Lainnya' },
};

export const DEFAULT_INCOME_CATEGORIES: Array<Omit<Category, 'userId'>> = [
  { id: 'cat_inc_1', name: 'Penjualan Produk', type: 'income', color: '#16a34a', icon: 'ShoppingBag', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_inc_2', name: 'Pendapatan Jasa', type: 'income', color: '#2563eb', icon: 'Wrench', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_inc_3', name: 'Modal Usaha', type: 'income', color: '#4f46e5', icon: 'Landmark', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_inc_4', name: 'Komisi & Cashback', type: 'income', color: '#059669', icon: 'Percent', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_inc_5', name: 'Pendapatan Lain-lain', type: 'income', color: '#0d9488', icon: 'PlusCircle', isDefault: true, createdAt: new Date().toISOString() },
];

export const DEFAULT_EXPENSE_CATEGORIES: Array<Omit<Category, 'userId'>> = [
  { id: 'cat_exp_1', name: 'Bahan Baku & Stok', type: 'expense', color: '#dc2626', icon: 'Package', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_2', name: 'Operasional & Perlengkapan', type: 'expense', color: '#ea580c', icon: 'Truck', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_3', name: 'Gaji Karyawan', type: 'expense', color: '#9333ea', icon: 'Users', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_4', name: 'Sewa Tempat / Kios', type: 'expense', color: '#c026d3', icon: 'Store', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_5', name: 'Listrik, Air & Internet', type: 'expense', color: '#e11d48', icon: 'Zap', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_6', name: 'Pemasaran & Promosi', type: 'expense', color: '#f59e0b', icon: 'Megaphone', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_7', name: 'Biaya Admin & Pajak', type: 'expense', color: '#64748b', icon: 'Receipt', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_8', name: 'Pengeluaran Pribadi (Prive)', type: 'expense', color: '#b45309', icon: 'Wallet', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'cat_exp_9', name: 'Biaya Lain-lain', type: 'expense', color: '#475569', icon: 'MoreHorizontal', isDefault: true, createdAt: new Date().toISOString() },
];
