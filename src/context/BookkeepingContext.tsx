import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  Transaction, 
  Category, 
  UserProfile, 
  Product,
  Debt,
  Customer,
  Supplier,
  Employee,
  EmployeeRole,
  ActiveStaffSession,
  DEFAULT_INCOME_CATEGORIES, 
  DEFAULT_EXPENSE_CATEGORIES,
  TransactionType,
  PaymentMethod,
  ScannedReceipt,
  QrisConfig
} from '../types';
import { getCurrentDateString } from '../utils/formatters';

interface BookkeepingContextType {
  transactions: Transaction[];
  categories: Category[];
  userProfile: UserProfile;
  products: Product[];
  debts: Debt[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  scannedReceipts: ScannedReceipt[];
  qrisConfig: QrisConfig;
  activeSession: ActiveStaffSession;
  accessCode: string;
  loading: boolean;
  isCloudSynced: boolean;
  syncing: boolean;
  error: string | null;
  clearError: () => void;
  // Transaction actions
  addTransaction: (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  // POS multi-item transaction
  createPosSale: (data: {
    items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }>;
    totalAmount: number;
    discount: number;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    changeAmount: number;
    customerName?: string;
    customerId?: string;
    isTempo?: boolean;
    dueDate?: string;
    notes?: string;
  }) => Promise<string | null>;
  // Product actions
  addProduct: (data: Omit<Product, 'id' | 'userId' | 'createdAt' | 'status'>) => Promise<boolean>;
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>) => Promise<boolean>;
  adjustStock: (id: string, type: 'in' | 'out' | 'set', qty: number, reason: string) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  // Debt actions
  addDebt: (data: Omit<Debt, 'id' | 'userId' | 'paidAmount' | 'remainingAmount' | 'status' | 'createdAt'>) => Promise<boolean>;
  payDebt: (debtId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => Promise<boolean>;
  deleteDebt: (debtId: string) => Promise<boolean>;
  // Customer actions
  addCustomer: (data: Omit<Customer, 'id' | 'userId' | 'totalReceivable'>) => Promise<boolean>;
  // Category actions
  addCategory: (data: Omit<Category, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
  updateCategory: (id: string, data: Partial<Omit<Category, 'id' | 'userId' | 'createdAt'>>) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  // Staff & Access Code actions
  updateAccessCode: (newCode: string) => Promise<boolean>;
  addEmployee: (data: Omit<Employee, 'id' | 'userId' | 'createdAt'>) => Promise<boolean>;
  updateEmployee: (id: string, data: Partial<Omit<Employee, 'id' | 'userId' | 'createdAt'>>) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  loginStaffWithAccessCode: (accessCode: string, pin: string, employeeId?: string) => { success: boolean; message: string; employee?: Employee };
  logoutStaffToOwner: () => void;
  // Profile actions
  updateUserProfile: (data: Partial<Omit<UserProfile, 'userId' | 'updatedAt'>>) => Promise<boolean>;
  // Receipt Scan actions
  saveScannedReceipt: (data: Omit<ScannedReceipt, 'id' | 'userId' | 'createdAt'>, createExpense?: boolean) => Promise<{ success: boolean; receiptId: string; transactionId?: string }>;
  deleteScannedReceipt: (id: string) => Promise<boolean>;
  // QRIS Merchant actions
  updateQrisConfig: (data: Partial<QrisConfig>) => Promise<boolean>;
  // Reset or seed sample data
  resetToSampleData: () => Promise<void>;
  resetToEmptyAccount: () => Promise<void>;
  // Computed metrics
  metrics: {
    totalIncome: number;
    totalExpense: number;
    cashBalance: number;
    netProfit: number;
    totalReceivable: number;
    totalPayable: number;
    lowStockCount: number;
    profitMarginPercent: number;
    targetProgressPercent: number;
  };
}

const BookkeepingContext = createContext<BookkeepingContextType | undefined>(undefined);

const LOCAL_STORAGE_TX_KEY = 'umkm_pro_transactions_data';
const LOCAL_STORAGE_CAT_KEY = 'umkm_pro_categories_data';
const LOCAL_STORAGE_PROFILE_KEY = 'umkm_pro_user_profile_data';
const LOCAL_STORAGE_PRODUCTS_KEY = 'umkm_pro_products_data';
const LOCAL_STORAGE_DEBTS_KEY = 'umkm_pro_debts_data';
const LOCAL_STORAGE_RECEIPTS_KEY = 'umkm_pro_scanned_receipts_data';
const LOCAL_STORAGE_QRIS_KEY = 'umkm_pro_qris_merchant_data';
const LOCAL_STORAGE_CUSTOMERS_KEY = 'umkm_pro_customers_data';
const LOCAL_STORAGE_EMPLOYEES_KEY = 'umkm_pro_employees_data';
const LOCAL_STORAGE_ACTIVE_SESSION_KEY = 'umkm_pro_active_session_data';

function generateSeedEmployees(userId: string): Employee[] {
  return [
    {
      id: 'emp_1',
      userId,
      name: 'Siti Rahma',
      role: 'cashier',
      pin: '1234',
      phone: '081299887766',
      status: 'active',
      createdAt: '2026-10-01T08:00:00.000Z'
    },
    {
      id: 'emp_2',
      userId,
      name: 'Dimas Saputra',
      role: 'staff',
      pin: '5678',
      phone: '085711223399',
      status: 'active',
      createdAt: '2026-10-05T09:00:00.000Z'
    },
    {
      id: 'emp_3',
      userId,
      name: 'Ahmad Fauzi',
      role: 'manager',
      pin: '9988',
      phone: '081377889900',
      status: 'active',
      createdAt: '2026-09-15T07:30:00.000Z'
    }
  ];
}

// Helper to generate seed transactions
function generateSeedTransactions(userId: string): Transaction[] {
  return [
    {
      id: 'tx_seed_1',
      userId,
      transactionNumber: 'TRX-202610-001',
      type: 'income',
      amount: 350000,
      category: 'Penjualan Produk',
      date: '2026-10-28',
      description: 'Pesanan sembako warung Bu Siti tempo',
      paymentMethod: 'receivable_payable',
      notes: 'Nota tempo jatuh tempo 5 Nov',
      customerName: 'Warung Bu Siti',
      items: [
        { productName: 'Beras Ramos Super 5kg', quantity: 2, unitPrice: 78000, subtotal: 156000 },
        { productName: 'Minyak Goreng Sawit 2L', quantity: 3, unitPrice: 36000, subtotal: 108000 },
        { productName: 'Gula Pasir Kristal Putih 1kg', quantity: 4, unitPrice: 17500, subtotal: 70000 },
        { productName: 'Sabun Cuci Piring Jeruk Nipis 780ml', quantity: 1, unitPrice: 16000, subtotal: 16000 }
      ],
      createdAt: '2026-10-28T08:30:00.000Z',
      updatedAt: '2026-10-28T08:30:00.000Z',
    },
    {
      id: 'tx_seed_2',
      userId,
      transactionNumber: 'TRX-202610-002',
      type: 'income',
      amount: 192000,
      category: 'Penjualan Produk',
      date: '2026-10-28',
      description: 'Penjualan tunai beras 2 sak & minyak 1 pouch',
      paymentMethod: 'cash',
      customerName: 'Ibu Hj. Fatimah',
      createdAt: '2026-10-28T10:15:00.000Z',
      updatedAt: '2026-10-28T10:15:00.000Z',
    },
    {
      id: 'tx_seed_3',
      userId,
      transactionNumber: 'TRX-202610-003',
      type: 'income',
      amount: 750000,
      category: 'Penjualan Produk',
      date: '2026-10-29',
      description: 'Paket katering makan siang kantor 25 box',
      paymentMethod: 'qris',
      customerName: 'CV Digital Mandiri (Kantor)',
      createdAt: '2026-10-29T11:45:00.000Z',
      updatedAt: '2026-10-29T11:45:00.000Z',
    },
    {
      id: 'tx_seed_4',
      userId,
      type: 'expense',
      amount: 275000,
      category: 'Operasional & Perlengkapan',
      date: '2026-10-27',
      description: 'Beli token listrik PLN toko sembako',
      paymentMethod: 'cash',
      createdAt: '2026-10-27T09:00:00.000Z',
      updatedAt: '2026-10-27T09:00:00.000Z',
    },
    {
      id: 'tx_seed_5',
      userId,
      type: 'expense',
      amount: 150000,
      category: 'Operasional & Perlengkapan',
      date: '2026-10-28',
      description: 'Plastik kresek, kantong beras & lakban',
      paymentMethod: 'cash',
      createdAt: '2026-10-28T14:30:00.000Z',
      updatedAt: '2026-10-28T14:30:00.000Z',
    },
    {
      id: 'tx_seed_6',
      userId,
      type: 'expense',
      amount: 1800000,
      category: 'Gaji Karyawan',
      date: '2026-10-25',
      description: 'Gaji asisten toko minggu ke-4',
      paymentMethod: 'bank_transfer',
      createdAt: '2026-10-25T17:00:00.000Z',
      updatedAt: '2026-10-25T17:00:00.000Z',
    }
  ];
}

function generateSeedProducts(userId: string): Product[] {
  return [
    {
      id: 'prod_1',
      userId,
      sku: 'SKU-BRS-01',
      name: 'Beras Ramos Super 5kg',
      categoryName: 'Bahan Pokok & Sembako',
      costPrice: 68000,
      sellingPrice: 78000,
      stock: 42,
      minStock: 10,
      unit: 'sak',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_2',
      userId,
      sku: 'SKU-MYK-02',
      name: 'Minyak Goreng Sawit 2 Liter',
      categoryName: 'Bahan Pokok & Sembako',
      costPrice: 31500,
      sellingPrice: 36000,
      stock: 28,
      minStock: 12,
      unit: 'pouch',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_3',
      userId,
      sku: 'SKU-GLA-03',
      name: 'Gula Pasir Kristal Putih 1kg',
      categoryName: 'Bahan Pokok & Sembako',
      costPrice: 14800,
      sellingPrice: 17500,
      stock: 35,
      minStock: 15,
      unit: 'kg',
      imageUrl: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_4',
      userId,
      sku: 'SKU-TLR-04',
      name: 'Telur Ayam Ras Segar 1kg',
      categoryName: 'Bahan Pokok & Sembako',
      costPrice: 26000,
      sellingPrice: 30000,
      stock: 8,
      minStock: 15,
      unit: 'kg',
      imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_5',
      userId,
      sku: 'SKU-KPO-05',
      name: 'Kopi Robusta Lampung 250g',
      categoryName: 'Makanan & Minuman',
      costPrice: 28000,
      sellingPrice: 38000,
      stock: 19,
      minStock: 8,
      unit: 'bungkus',
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_6',
      userId,
      sku: 'SKU-MIE-06',
      name: 'Mie Instan Kuah Soto (Dus isi 40)',
      categoryName: 'Makanan & Minuman',
      costPrice: 105000,
      sellingPrice: 122000,
      stock: 5,
      minStock: 8,
      unit: 'dus',
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_7',
      userId,
      sku: 'SKU-SBN-07',
      name: 'Sabun Cuci Piring Jeruk Nipis 780ml',
      categoryName: 'Perlengkapan & Kebersihan',
      costPrice: 13500,
      sellingPrice: 16500,
      stock: 24,
      minStock: 10,
      unit: 'pouch',
      imageUrl: 'https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?w=200&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ];
}

function generateSeedDebts(userId: string): Debt[] {
  return [
    {
      id: 'debt_1',
      userId,
      type: 'receivable',
      contactName: 'Warung Bu Siti',
      title: 'Piutang Nota Belanja Sembako #TRX-202610-001',
      totalAmount: 350000,
      paidAmount: 0,
      remainingAmount: 350000,
      startDate: '2026-10-28',
      dueDate: '2026-11-05',
      status: 'unpaid',
      notes: 'Jatuh tempo 5 November 2026',
      createdAt: '2026-10-28T08:30:00.000Z'
    },
    {
      id: 'debt_2',
      userId,
      type: 'receivable',
      contactName: 'CV Digital Mandiri (Kantor)',
      title: 'Piutang Katering Snack Box Seminar',
      totalAmount: 750000,
      paidAmount: 0,
      remainingAmount: 750000,
      startDate: '2026-10-22',
      dueDate: '2026-11-02',
      status: 'unpaid',
      notes: 'Faktur tagihan sudah dikirim via email',
      createdAt: '2026-10-22T09:00:00.000Z'
    },
    {
      id: 'debt_3',
      userId,
      type: 'payable',
      contactName: 'Distributor Sembako Makmur',
      title: 'Utang Kulakan Beras 20 Sak & Minyak 10 Dus',
      totalAmount: 2500000,
      paidAmount: 1250000,
      remainingAmount: 1250000,
      startDate: '2026-10-20',
      dueDate: '2026-11-04',
      status: 'partial',
      notes: 'Sudah dicicil 50%, sisa jatuh tempo 4 November',
      createdAt: '2026-10-20T10:00:00.000Z'
    },
    {
      id: 'debt_4',
      userId,
      type: 'payable',
      contactName: 'Grosir Sabun & Plastik Barokah',
      title: 'Utang Pasokan Kantong Kresek & Dus',
      totalAmount: 450000,
      paidAmount: 0,
      remainingAmount: 450000,
      startDate: '2026-10-24',
      dueDate: '2026-11-08',
      status: 'unpaid',
      notes: 'Faktur tempo 14 hari',
      createdAt: '2026-10-24T14:00:00.000Z'
    }
  ];
}

function generateSeedCustomers(userId: string): Customer[] {
  return [
    { id: 'cust_1', userId, name: 'Warung Bu Siti', phone: '081388776655', address: 'Jl. Flamboyan No. 12', totalReceivable: 350000 },
    { id: 'cust_2', userId, name: 'CV Digital Mandiri (Kantor)', phone: '082199887711', address: 'Gedung Wisma Niaga Lt. 3', totalReceivable: 750000 },
    { id: 'cust_3', userId, name: 'Ibu Hj. Fatimah', phone: '085711223344', address: 'Komplek Permata Indah B-14', totalReceivable: 0 },
    { id: 'cust_4', userId, name: 'Bpk. Hendra Gunawan', phone: '081900112233', address: 'Jl. Melati IV No. 8', totalReceivable: 0 },
  ];
}

function generateInitialCategories(userId: string): Category[] {
  const inc = DEFAULT_INCOME_CATEGORIES.map(c => ({ ...c, userId }));
  const exp = DEFAULT_EXPENSE_CATEGORIES.map(c => ({ ...c, userId }));
  return [...inc, ...exp];
}

const DEFAULT_QRIS_CONFIG: QrisConfig = {
  merchantName: 'PEMBUKUAN UMKM - BERKAH JAYA',
  nmid: 'ID1024300988771',
  pjpProvider: 'Bank Central Asia (BCA) / QRIS ASPI',
  city: 'JAKARTA SELATAN',
  postalCode: '12160',
  qrisImageUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=00020101021126610014ID.LINKAJA.WWW011893600918000000000002081024300951440014ID.CO.QRIS.WWW0215ID10243009887710303UME5204549953033605802ID5925TOKO%20SEMBAKO%20BERKAH%20JAYA6015JAKARTA%20SELATAN61051216062070703A016304A1B2',
  notes: 'Scan dengan BCA, Mandiri, BRI, BNI, GoPay, OVO, ShopeePay, Dana, LinkAja, atau m-Banking apa pun.',
  updatedAt: new Date().toISOString(),
  gateway: {
    provider: 'none',
    merchantId: '',
    clientKey: '',
    serverKey: '',
    isSandbox: true,
    isActive: false,
  }
};

function generateSeedReceipts(userId: string): ScannedReceipt[] {
  return [
    {
      id: 'scan_seed_1',
      userId,
      storeName: 'Grosir Sembako Rezeki Baru',
      date: '2026-10-27',
      items: [
        { id: 'item_1', name: 'Minyak Goreng Sania 2L (Dus)', quantity: 2, unitPrice: 210000, subtotal: 420000 },
        { id: 'item_2', name: 'Gula Kristal Gulaku 1kg (Karton)', quantity: 1, unitPrice: 320000, subtotal: 320000 },
        { id: 'item_3', name: 'Lakban Bening 2 Inch 100M', quantity: 3, unitPrice: 15000, subtotal: 45000 },
      ],
      totalAmount: 785000,
      tax: 0,
      discount: 0,
      expenseCategory: 'Bahan Baku & Stok',
      paymentMethod: 'cash',
      notes: 'Nota kulakan stok mingguan toko',
      imageUrl: 'https://images.unsplash.com/photo-1554415707-9e4966779836?w=600&auto=format&fit=crop&q=80',
      rawText: 'GROSIR SEMBAKO REZEKI BARU\nJl. Raya Pasar Minggu No. 88\n27-10-2026 14:15\n--------------------------------\n2x Minyak Sania 2L Dus @210.000 = 420.000\n1x Gula Gulaku Karton @320.000 = 320.000\n3x Lakban Bening 2 Inch @15.000 = 45.000\n--------------------------------\nTOTAL: Rp 785.000\nTUNAI: Rp 800.000\nKEMBALI: Rp 15.000\nTERIMA KASIH',
      convertedTransactionId: 'tx_seed_4',
      createdAt: '2026-10-27T14:20:00.000Z'
    }
  ];
}

export const BookkeepingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, effectiveUserId } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [scannedReceipts, setScannedReceipts] = useState<ScannedReceipt[]>([]);
  const [qrisConfig, setQrisConfig] = useState<QrisConfig>(DEFAULT_QRIS_CONFIG);
  const [activeSession, setActiveSession] = useState<ActiveStaffSession>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { isStaff: false, role: 'owner' };
  });
  const [suppliers] = useState<Supplier[]>([
    { id: 'sup_1', userId: effectiveUserId, name: 'Distributor Sembako Makmur', phone: '081122334455', address: 'Kawasan Industri Pulogadung', totalDebt: 1250000 },
    { id: 'sup_2', userId: effectiveUserId, name: 'Agen Telur Lestari Blitar', phone: '081299334411', address: 'Pasar Induk Kramat Jati', totalDebt: 0 },
    { id: 'sup_3', userId: effectiveUserId, name: 'Grosir Sabun & Plastik Barokah', phone: '087866554433', address: 'Jl. Daan Mogot KM 12', totalDebt: 450000 },
  ]);

  const DEFAULT_APP_LOGO = '/assets/aistudio/IMG_4d986b3a-e230-4498-8258-4d16b82fa55c_91979bc8.jpg';

  const [userProfile, setUserProfile] = useState<UserProfile>({
    userId: effectiveUserId,
    businessName: 'Toko Sembako & Katering Berkah Jaya',
    ownerName: 'Budi Pratama',
    businessPhone: '0812-3456-7890',
    businessAddress: 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan',
    monthlyProfitTarget: 15000000,
    accessCode: 'UMKM-9824',
    logoUrl: DEFAULT_APP_LOGO,
    updatedAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Load and hydrate
  useEffect(() => {
    try {
      const storedTx = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
      if (storedTx) setTransactions(JSON.parse(storedTx));
      else {
        const seed = generateSeedTransactions(effectiveUserId);
        setTransactions(seed);
        localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(seed));
      }

      const storedProds = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
      if (storedProds) setProducts(JSON.parse(storedProds));
      else {
        const seed = generateSeedProducts(effectiveUserId);
        setProducts(seed);
        localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(seed));
      }

      const storedDebts = localStorage.getItem(LOCAL_STORAGE_DEBTS_KEY);
      if (storedDebts) setDebts(JSON.parse(storedDebts));
      else {
        const seed = generateSeedDebts(effectiveUserId);
        setDebts(seed);
        localStorage.setItem(LOCAL_STORAGE_DEBTS_KEY, JSON.stringify(seed));
      }

      const storedCusts = localStorage.getItem(LOCAL_STORAGE_CUSTOMERS_KEY);
      if (storedCusts) setCustomers(JSON.parse(storedCusts));
      else {
        const seed = generateSeedCustomers(effectiveUserId);
        setCustomers(seed);
        localStorage.setItem(LOCAL_STORAGE_CUSTOMERS_KEY, JSON.stringify(seed));
      }

      const storedEmployees = localStorage.getItem(LOCAL_STORAGE_EMPLOYEES_KEY);
      if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
      else {
        const seed = generateSeedEmployees(effectiveUserId);
        setEmployees(seed);
        localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(seed));
      }

      const storedReceipts = localStorage.getItem(LOCAL_STORAGE_RECEIPTS_KEY);
      if (storedReceipts) setScannedReceipts(JSON.parse(storedReceipts));
      else {
        const seed = generateSeedReceipts(effectiveUserId);
        setScannedReceipts(seed);
        localStorage.setItem(LOCAL_STORAGE_RECEIPTS_KEY, JSON.stringify(seed));
      }

      const storedQris = localStorage.getItem(LOCAL_STORAGE_QRIS_KEY);
      if (storedQris) setQrisConfig(JSON.parse(storedQris));
      else {
        setQrisConfig(DEFAULT_QRIS_CONFIG);
        localStorage.setItem(LOCAL_STORAGE_QRIS_KEY, JSON.stringify(DEFAULT_QRIS_CONFIG));
      }

      const storedCats = localStorage.getItem(LOCAL_STORAGE_CAT_KEY);
      if (storedCats) setCategories(JSON.parse(storedCats));
      else {
        const initCats = generateInitialCategories(effectiveUserId);
        setCategories(initCats);
        localStorage.setItem(LOCAL_STORAGE_CAT_KEY, JSON.stringify(initCats));
      }

      const storedProfile = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (!parsed.accessCode) parsed.accessCode = 'UMKM-9824';
        if (!parsed.logoUrl) parsed.logoUrl = DEFAULT_APP_LOGO;
        setUserProfile(parsed);
      }
    } catch (err) {
      console.error('Local data load error:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  const saveProducts = (prods: Product[]) => {
    setProducts(prods);
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(prods));
  };

  const saveDebts = (d: Debt[]) => {
    setDebts(d);
    localStorage.setItem(LOCAL_STORAGE_DEBTS_KEY, JSON.stringify(d));
  };

  const saveCustomers = (c: Customer[]) => {
    setCustomers(c);
    localStorage.setItem(LOCAL_STORAGE_CUSTOMERS_KEY, JSON.stringify(c));
  };

  const saveEmployees = (list: Employee[]) => {
    setEmployees(list);
    localStorage.setItem(LOCAL_STORAGE_EMPLOYEES_KEY, JSON.stringify(list));
  };

  const saveTransactions = (txList: Transaction[]) => {
    setTransactions(txList);
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(txList));
  };

  const accessCode = userProfile.accessCode || 'UMKM-9824';

  const updateAccessCode = async (newCode: string): Promise<boolean> => {
    const clean = newCode.trim().toUpperCase() || 'UMKM-9824';
    const updated = { ...userProfile, accessCode: clean, updatedAt: new Date().toISOString() };
    setUserProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    return true;
  };

  const addEmployee = async (data: Omit<Employee, 'id' | 'userId' | 'createdAt'>): Promise<boolean> => {
    const newEmp: Employee = {
      ...data,
      id: 'emp_' + Date.now().toString(36),
      userId: effectiveUserId,
      createdAt: new Date().toISOString()
    };
    const updated = [...employees, newEmp];
    saveEmployees(updated);
    return true;
  };

  const updateEmployee = async (id: string, data: Partial<Omit<Employee, 'id' | 'userId' | 'createdAt'>>): Promise<boolean> => {
    const updated = employees.map(emp => emp.id === id ? { ...emp, ...data } : emp);
    saveEmployees(updated);
    return true;
  };

  const deleteEmployee = async (id: string): Promise<boolean> => {
    const updated = employees.filter(emp => emp.id !== id);
    saveEmployees(updated);
    return true;
  };

  const loginStaffWithAccessCode = (
    inputAccessCode: string, 
    inputPin: string, 
    employeeId?: string
  ): { success: boolean; message: string; employee?: Employee } => {
    const cleanStoreCode = inputAccessCode.trim().toUpperCase();
    const currentStoreCode = accessCode.trim().toUpperCase();
    
    // Check store access code
    if (cleanStoreCode !== currentStoreCode) {
      return { 
        success: false, 
        message: `Kode Akses Usaha "${inputAccessCode}" tidak ditemukan atau salah. Pastikan huruf besar dan angka sesuai (contoh: ${accessCode}).` 
      };
    }

    // Find employee
    let targetEmployee: Employee | undefined;
    if (employeeId) {
      targetEmployee = employees.find(e => e.id === employeeId);
    } else {
      targetEmployee = employees.find(e => e.pin === inputPin && e.status === 'active');
    }

    if (!targetEmployee) {
      return { 
        success: false, 
        message: 'Karyawan dengan PIN tersebut tidak ditemukan.' 
      };
    }

    if (targetEmployee.pin !== inputPin) {
      return { 
        success: false, 
        message: 'PIN Akses Karyawan salah. Periksa kembali PIN Anda.' 
      };
    }

    if (targetEmployee.status !== 'active') {
      return { 
        success: false, 
        message: `Akun karyawan "${targetEmployee.name}" sedang dinonaktifkan.` 
      };
    }

    const session: ActiveStaffSession = {
      isStaff: true,
      employeeId: targetEmployee.id,
      employeeName: targetEmployee.name,
      role: targetEmployee.role
    };

    setActiveSession(session);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY, JSON.stringify(session));

    return { 
      success: true, 
      message: `Berhasil login shift: ${targetEmployee.name} (${targetEmployee.role.toUpperCase()})`,
      employee: targetEmployee 
    };
  };

  const logoutStaffToOwner = () => {
    const ownerSession: ActiveStaffSession = { isStaff: false, role: 'owner' };
    setActiveSession(ownerSession);
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SESSION_KEY, JSON.stringify(ownerSession));
  };

  // Transaction CRUD
  const addTransaction = async (data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    setError(null);
    if (!data.amount || data.amount <= 0) {
      setError('Nominal harus lebih besar dari Rp 0.');
      return false;
    }
    const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const nowIso = new Date().toISOString();
    const newTx: Transaction = {
      ...data,
      id,
      userId: effectiveUserId,
      transactionNumber: data.transactionNumber || `TRX-${new Date().toISOString().slice(0,7).replace('-','')}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    saveTransactions([newTx, ...transactions]);
    return true;
  };

  const updateTransaction = async (id: string, updates: Partial<Omit<Transaction, 'id' | 'userId' | 'createdAt'>>): Promise<boolean> => {
    setError(null);
    const updatedList = transactions.map(t => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    saveTransactions(updatedList);
    return true;
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    setError(null);
    const updatedList = transactions.filter(t => t.id !== id);
    saveTransactions(updatedList);
    return true;
  };

  // POS Sale (Multi-item, stock reduction, debt creation if tempo)
  const createPosSale = async (data: {
    items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }>;
    totalAmount: number;
    discount: number;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    changeAmount: number;
    customerName?: string;
    customerId?: string;
    isTempo?: boolean;
    dueDate?: string;
    notes?: string;
  }): Promise<string | null> => {
    setError(null);
    if (!data.items || data.items.length === 0) {
      setError('Minimal 1 item barang dalam nota.');
      return null;
    }

    const trxNumber = `TRX-${new Date().toISOString().slice(0,7).replace('-','')}-${String(transactions.length + 1).padStart(4, '0')}`;
    const id = 'tx_' + Date.now();
    const nowIso = new Date().toISOString();

    // 1. Kurangi stok produk
    const updatedProds = products.map(p => {
      const match = data.items.find(i => i.productId === p.id);
      if (match) {
        return { ...p, stock: Math.max(0, p.stock - match.quantity) };
      }
      return p;
    });
    saveProducts(updatedProds);

    // 2. Simpan Transaksi Penjualan
    const newTx: Transaction = {
      id,
      userId: effectiveUserId,
      transactionNumber: trxNumber,
      type: 'income',
      amount: data.totalAmount,
      category: 'Penjualan Produk',
      date: getCurrentDateString(),
      description: `Penjualan ${data.items.length} item (${data.items.map(i => `${i.productName} (${i.quantity})`).join(', ')})`,
      paymentMethod: data.paymentMethod,
      customerName: data.customerName || 'Pelanggan Umum',
      items: data.items,
      notes: data.notes || '',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    saveTransactions([newTx, ...transactions]);

    // 3. Jika Tempo, catat Piutang
    if (data.isTempo || data.paymentMethod === 'receivable_payable') {
      const newDebt: Debt = {
        id: 'debt_' + Date.now(),
        userId: effectiveUserId,
        type: 'receivable',
        contactName: data.customerName || 'Pelanggan Nota ' + trxNumber,
        title: `Piutang Nota ${trxNumber}`,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        remainingAmount: Math.max(0, data.totalAmount - data.paidAmount),
        startDate: getCurrentDateString(),
        dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: data.paidAmount > 0 ? 'partial' : 'unpaid',
        notes: data.notes || 'Penjualan tempo',
        createdAt: nowIso
      };
      saveDebts([newDebt, ...debts]);
    }

    return trxNumber;
  };

  // Product Actions
  const addProduct = async (data: Omit<Product, 'id' | 'userId' | 'createdAt' | 'status'>): Promise<boolean> => {
    const id = 'prod_' + Date.now();
    const sku = data.sku || 'SKU-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newProd: Product = {
      ...data,
      id,
      sku,
      userId: effectiveUserId,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    saveProducts([newProd, ...products]);
    return true;
  };

  const updateProduct = async (id: string, data: Partial<Omit<Product, 'id' | 'userId' | 'createdAt'>>): Promise<boolean> => {
    const updated = products.map(p => (p.id === id ? { ...p, ...data } : p));
    saveProducts(updated);
    return true;
  };

  const adjustStock = async (id: string, type: 'in' | 'out' | 'set', qty: number, reason: string): Promise<boolean> => {
    const updated = products.map(p => {
      if (p.id === id) {
        let newStock = p.stock;
        if (type === 'in') newStock += qty;
        else if (type === 'out') newStock = Math.max(0, newStock - qty);
        else if (type === 'set') newStock = qty;
        return { ...p, stock: newStock };
      }
      return p;
    });
    saveProducts(updated);
    return true;
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    const updated = products.filter(p => p.id !== id);
    saveProducts(updated);
    return true;
  };

  // Debt Actions
  const addDebt = async (data: Omit<Debt, 'id' | 'userId' | 'paidAmount' | 'remainingAmount' | 'status' | 'createdAt'>): Promise<boolean> => {
    const id = 'debt_' + Date.now();
    const newDebt: Debt = {
      ...data,
      id,
      userId: effectiveUserId,
      paidAmount: 0,
      remainingAmount: data.totalAmount,
      status: 'unpaid',
      createdAt: new Date().toISOString()
    };
    saveDebts([newDebt, ...debts]);
    return true;
  };

  const payDebt = async (debtId: string, amount: number, paymentMethod: PaymentMethod, notes?: string): Promise<boolean> => {
    const target = debts.find(d => d.id === debtId);
    if (!target) return false;

    const newPaid = target.paidAmount + amount;
    const newRem = Math.max(0, target.totalAmount - newPaid);
    const newStatus: 'paid' | 'partial' = newRem <= 0 ? 'paid' : 'partial';

    const updatedDebts = debts.map(d => (d.id === debtId ? { ...d, paidAmount: newPaid, remainingAmount: newRem, status: newStatus } : d));
    saveDebts(updatedDebts);

    // Tambahkan ke buku kas
    const nowIso = new Date().toISOString();
    const txType: TransactionType = target.type === 'receivable' ? 'income' : 'expense';
    const txDesc = target.type === 'receivable' 
      ? `Pelunasan/Cicilan piutang: ${target.contactName} (${target.title})`
      : `Pembayaran utang ke: ${target.contactName} (${target.title})`;

    const finTx: Transaction = {
      id: 'tx_debt_' + Date.now(),
      userId: effectiveUserId,
      type: txType,
      amount,
      category: target.type === 'receivable' ? 'Penjualan Produk' : 'Bahan Baku & Stok',
      date: getCurrentDateString(),
      description: txDesc,
      paymentMethod,
      notes: notes || 'Pembayaran tempo',
      createdAt: nowIso,
      updatedAt: nowIso
    };
    saveTransactions([finTx, ...transactions]);
    return true;
  };

  const deleteDebt = async (debtId: string): Promise<boolean> => {
    const updated = debts.filter(d => d.id !== debtId);
    saveDebts(updated);
    return true;
  };

  // Customer Actions
  const addCustomer = async (data: Omit<Customer, 'id' | 'userId' | 'totalReceivable'>): Promise<boolean> => {
    const id = 'cust_' + Date.now();
    const newCust: Customer = { ...data, id, userId: effectiveUserId, totalReceivable: 0 };
    saveCustomers([newCust, ...customers]);
    return true;
  };

  // Category Actions
  const addCategory = async (data: Omit<Category, 'id' | 'userId' | 'createdAt'>): Promise<boolean> => {
    const id = 'cat_' + Date.now();
    const newCat: Category = { ...data, id, userId: effectiveUserId, isDefault: false, createdAt: new Date().toISOString() };
    setCategories([...categories, newCat]);
    return true;
  };

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'userId' | 'createdAt'>>): Promise<boolean> => {
    setCategories(categories.map(c => (c.id === id ? { ...c, ...updates } : c)));
    return true;
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    setCategories(categories.filter(c => c.id !== id));
    return true;
  };

  const updateUserProfile = async (data: Partial<Omit<UserProfile, 'userId' | 'updatedAt'>>): Promise<boolean> => {
    const updated = { ...userProfile, ...data, updatedAt: new Date().toISOString() };
    setUserProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(updated));
    return true;
  };

  const resetToSampleData = async () => {
    const seedTx = generateSeedTransactions(effectiveUserId);
    const seedProds = generateSeedProducts(effectiveUserId);
    const seedD = generateSeedDebts(effectiveUserId);
    const seedC = generateSeedCustomers(effectiveUserId);
    const seedEmp = generateSeedEmployees(effectiveUserId);
    const initCats = generateInitialCategories(effectiveUserId);
    saveTransactions(seedTx);
    saveProducts(seedProds);
    saveDebts(seedD);
    saveCustomers(seedC);
    saveEmployees(seedEmp);
    setCategories(initCats);
    logoutStaffToOwner();
  };

  const saveScannedReceipt = async (
    data: Omit<ScannedReceipt, 'id' | 'userId' | 'createdAt'>, 
    createExpense: boolean = true
  ): Promise<{ success: boolean; receiptId: string; transactionId?: string }> => {
    try {
      setError(null);
      const receiptId = 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const nowIso = new Date().toISOString();
      let transactionId: string | undefined = undefined;

      if (createExpense) {
        transactionId = 'tx_' + Date.now();
        const expenseTx: Transaction = {
          id: transactionId,
          userId: effectiveUserId,
          transactionNumber: `TRX-${data.date.slice(0, 7).replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
          type: 'expense',
          amount: data.totalAmount,
          category: data.expenseCategory || 'Operasional & Perlengkapan',
          date: data.date || getCurrentDateString(),
          description: `Pembelian / Belanja di ${data.storeName}${data.items.length ? ` (${data.items.length} item)` : ''}`,
          paymentMethod: data.paymentMethod || 'cash',
          notes: data.notes || `Lampiran struk nota: ${data.storeName}`,
          receiptUrl: data.imageUrl,
          receiptImage: data.imageUrl,
          receiptScanId: receiptId,
          items: data.items.map(item => ({
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        saveTransactions([expenseTx, ...transactions]);
      }

      const newReceipt: ScannedReceipt = {
        ...data,
        id: receiptId,
        userId: effectiveUserId,
        convertedTransactionId: transactionId,
        createdAt: nowIso,
      };

      const updatedReceipts = [newReceipt, ...scannedReceipts];
      setScannedReceipts(updatedReceipts);
      localStorage.setItem(LOCAL_STORAGE_RECEIPTS_KEY, JSON.stringify(updatedReceipts));

      return { success: true, receiptId, transactionId };
    } catch (err: any) {
      console.error('Save scanned receipt error:', err);
      setError('Gagal menyimpan hasil scan nota.');
      return { success: false, receiptId: '' };
    }
  };

  const deleteScannedReceipt = async (id: string): Promise<boolean> => {
    try {
      const updated = scannedReceipts.filter(r => r.id !== id);
      setScannedReceipts(updated);
      localStorage.setItem(LOCAL_STORAGE_RECEIPTS_KEY, JSON.stringify(updated));
      return true;
    } catch (err) {
      return false;
    }
  };

  const updateQrisConfig = async (data: Partial<QrisConfig>): Promise<boolean> => {
    try {
      const updated: QrisConfig = {
        ...qrisConfig,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      setQrisConfig(updated);
      localStorage.setItem(LOCAL_STORAGE_QRIS_KEY, JSON.stringify(updated));
      return true;
    } catch (err) {
      return false;
    }
  };

  const resetToEmptyAccount = async () => {
    saveTransactions([]);
    saveProducts([]);
    saveDebts([]);
    saveCustomers([]);
    saveEmployees([]);
    setScannedReceipts([]);
    localStorage.setItem(LOCAL_STORAGE_RECEIPTS_KEY, JSON.stringify([]));
    
    const freshProfile: UserProfile = {
      userId: effectiveUserId,
      businessName: 'Toko Baru Saya',
      ownerName: 'Pemilik Toko',
      businessPhone: '',
      businessAddress: '',
      monthlyProfitTarget: 10000000,
      accessCode: 'UMKM-' + Math.floor(1000 + Math.random() * 9000),
      logoUrl: DEFAULT_APP_LOGO,
      updatedAt: new Date().toISOString(),
    };
    setUserProfile(freshProfile);
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(freshProfile));
    logoutStaffToOwner();
  };

  // Metrics
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') totalIncome += amt;
      else if (tx.type === 'expense') totalExpense += amt;
    });

    const netProfit = totalIncome - totalExpense;
    const cashBalance = netProfit;
    const profitMarginPercent = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const target = userProfile.monthlyProfitTarget || 15000000;
    const targetProgressPercent = target > 0 ? Math.min(Math.round((netProfit / target) * 100), 200) : 0;

    const totalReceivable = debts.filter(d => d.type === 'receivable' && d.status !== 'paid').reduce((acc, c) => acc + c.remainingAmount, 0);
    const totalPayable = debts.filter(d => d.type === 'payable' && d.status !== 'paid').reduce((acc, c) => acc + c.remainingAmount, 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

    return {
      totalIncome,
      totalExpense,
      cashBalance,
      netProfit,
      totalReceivable,
      totalPayable,
      lowStockCount,
      profitMarginPercent,
      targetProgressPercent,
    };
  }, [transactions, debts, products, userProfile.monthlyProfitTarget]);

  return (
    <BookkeepingContext.Provider
      value={{
        transactions,
        categories,
        userProfile,
        products,
        debts,
        customers,
        suppliers,
        employees,
        scannedReceipts,
        qrisConfig,
        activeSession,
        accessCode,
        loading,
        isCloudSynced,
        syncing,
        error,
        clearError,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        createPosSale,
        addProduct,
        updateProduct,
        adjustStock,
        deleteProduct,
        addDebt,
        payDebt,
        deleteDebt,
        addCustomer,
        addCategory,
        updateCategory,
        deleteCategory,
        updateAccessCode,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        loginStaffWithAccessCode,
        logoutStaffToOwner,
        updateUserProfile,
        saveScannedReceipt,
        deleteScannedReceipt,
        updateQrisConfig,
        resetToSampleData,
        resetToEmptyAccount,
        metrics,
      }}
    >
      {children}
    </BookkeepingContext.Provider>
  );
};

export function useBookkeeping() {
  const context = useContext(BookkeepingContext);
  if (!context) {
    throw new Error('useBookkeeping must be used within a BookkeepingProvider');
  }
  return context;
}
