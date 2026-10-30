import React, { useState } from 'react';
import { 
  FileCode, 
  Database, 
  Copy, 
  Check, 
  Terminal, 
  Download, 
  Server, 
  ShieldCheck, 
  FolderTree,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface CodeFile {
  name: string;
  path: string;
  language: string;
  description: string;
  code: string;
}

const PHP_FILES: CodeFile[] = [
  {
    name: 'database.sql',
    path: 'database/database.sql',
    language: 'sql',
    description: 'Skema DDL MySQL 8+ lengkap dengan Primary Key, Foreign Key, DECIMAL(15,2), dan Indexing.',
    code: `-- Tabel Users, Businesses, Categories, Products, Stock Movements, Customers, Suppliers,
-- Transactions, Transaction Items, Financial Records, Debts, Debt Payments, Employees, Audit Logs
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NULL,
    role ENUM('owner', 'admin', 'cashier') DEFAULT 'owner',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NULL,
    sku VARCHAR(60) NOT NULL,
    name VARCHAR(150) NOT NULL,
    cost_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 5,
    unit VARCHAR(30) DEFAULT 'pcs',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transaction_number VARCHAR(50) NOT NULL,
    type ENUM('sale', 'purchase') NOT NULL,
    date DATE NOT NULL,
    customer_id INT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    discount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'qris', 'tempo') NOT NULL,
    payment_status ENUM('paid', 'partial', 'unpaid') NOT NULL,
    status ENUM('completed', 'cancelled') DEFAULT 'completed',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);`
  },
  {
    name: 'database.php',
    path: 'config/database.php',
    language: 'php',
    description: 'Koneksi PDO Prepared Statements ke MySQL/MariaDB dengan fallback cerdas ke SQLite lokal.',
    code: `<?php
require_once __DIR__ . '/app.php';

define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'umkm_pro');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            try {
                $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (PDOException $e) {
                // Fallback SQLite lokal otomatis jika MySQL offline
                self::$instance = self::connectSqlite();
            }
        }
        return self::$instance;
    }
}`
  },
  {
    name: 'transaction_action.php',
    path: 'actions/transaction_action.php',
    language: 'php',
    description: 'Pemrosesan Transaksi POS Multi-Item dengan Database Transaction & Pengurangan Stok Otomatis.',
    code: `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/functions.php';
requireAuth();

if ($action === 'create_sale') {
    try {
        $pdo->beginTransaction();
        $trxNumber = generateTransactionNumber($pdo, $userId, 'sale');

        // Loop multi-item, validasi stok, dan kurangi stok seketika
        foreach ($processedItems as $item) {
            $itemInsert->execute([...]);
            $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?")
                ->execute([$item['quantity'], $item['product_id']]);
        }

        // Catat ke Buku Kas & Piutang jika tempo
        if ($isTempo) {
            $pdo->prepare("INSERT INTO debts (...) VALUES (...)")->execute([...]);
        }

        $pdo->commit();
        header("Location: ../pages/receipt.php?id=$transactionId");
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        setFlashMessage('error', $e->getMessage());
    }
}`
  },
  {
    name: 'pos.php',
    path: 'pages/pos.php',
    language: 'php',
    description: 'Halaman Kasir POS Cepat Multi-Item dengan kalkulator JS otomatis dan cetak struk nota.',
    code: `<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/functions.php';
requireAuth();
// Memuat produk dan pelanggan untuk formulir kasir responsif
$products = $pdo->query("SELECT * FROM products WHERE status = 'active'")->fetchAll();
require_once __DIR__ . '/../includes/header.php';
// Render tabel transaksi interaktif, diskon, dan kembalian
?>`
  },
  {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    description: 'Panduan instalasi XAMPP, Laragon, MySQL, panduan impor database, dan skenario pengujian.',
    code: `# Pembukuan UMKM
Sistem Pembukuan Keuangan, Persediaan Barang, Kasir POS Multi-Item, dan Manajemen Utang-Piutang UMKM Indonesia.

1. Buka XAMPP Control Panel, aktifkan Apache dan MySQL.
2. Buat database baru bernama \`umkm_pro\`.
3. Impor \`database/database.sql\` dan \`database/seed.sql\`.
4. Jalankan \`php -S localhost:8000\` atau taruh di \`htdocs/pembukuan-umkm\`.
5. Login akun demo: \`admin@umkmpro.id\` / \`password123\`.`
  }
];

export const PhpCodeExplorerView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(PHP_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-6 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Server className="w-3.5 h-3.5" />
              PHP 8.2 Native + MySQL 8 / MariaDB
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Arsitektur & Berkas Kode PHP Native 8+
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Seluruh berkas kode PHP Native, modul aksi CRUD, proteksi CSRF, session auth, dan skema database SQL telah dibuat lengkap di dalam repositori ini, siap dijalankan di XAMPP, Laragon, Apache, atau cPanel.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <a
              href="/pembukuan_umkm_mediafire.zip"
              download="pembukuan_umkm_mediafire.zip"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition active:scale-95 cursor-pointer text-center"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Unduh ZIP untuk MediaFire</span>
            </a>
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/10 text-center">
              <div className="text-[10px] text-slate-300 font-semibold">Demo Akun PHP / MySQL:</div>
              <div className="text-xs font-mono font-bold text-blue-200 mt-0.5">admin@umkmpro.id</div>
              <div className="text-[10px] text-slate-400">Pass: password123</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: File Selector & Code Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Kolom Kiri: Daftar Berkas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider px-2 pb-2 border-b border-slate-100">
            <FolderTree className="w-4 h-4 text-blue-900" />
            Daftar Berkas Terpilih
          </div>

          <div className="space-y-1">
            {PHP_FILES.map(file => {
              const isSelected = selectedFile.name === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.name.endsWith('.sql') ? (
                      <Database className="w-4 h-4 shrink-0 text-amber-500" />
                    ) : file.name.endsWith('.md') ? (
                      <BookOpen className="w-4 h-4 shrink-0 text-emerald-500" />
                    ) : (
                      <FileCode className="w-4 h-4 shrink-0 text-blue-400" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold mb-1">
              Petunjuk Menjalankan di Terminal:
            </div>
            <div className="p-2.5 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono select-all">
              php -S localhost:8000
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Code Preview Box */}
        <div className="lg:col-span-3 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="ml-2 font-mono text-xs text-slate-300 font-bold">
                {selectedFile.path}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin Kode
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-slate-900/60 text-xs text-blue-300 border-b border-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{selectedFile.description}</span>
          </div>

          <pre className="p-5 overflow-x-auto text-xs font-mono leading-relaxed text-slate-200 max-h-[500px]">
            <code>{selectedFile.code}</code>
          </pre>
        </div>

      </div>

    </div>
  );
};
