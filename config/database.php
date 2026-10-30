<?php
/**
 * Konfigurasi Koneksi Database PDO (MySQL 8+ / MariaDB dengan Fallback SQLite)
 */

require_once __DIR__ . '/app.php';

// Konfigurasi Database MySQL
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'umkm_pro');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

class Database {
    private static ?PDO $instance = null;
    private static string $driverUsed = 'mysql';

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $preferDriver = getenv('DB_DRIVER') ?: 'auto';

            if ($preferDriver === 'sqlite') {
                self::$instance = self::connectSqlite();
                self::$driverUsed = 'sqlite';
                return self::$instance;
            }

            try {
                // Coba koneksi ke MySQL/MariaDB menggunakan PDO
                $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_TIMEOUT            => 3,
                ];
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
                self::$driverUsed = 'mysql';
            } catch (PDOException $e) {
                // Jika MySQL offline atau belum diatur dan mode auto, gunakan SQLite lokal agar aplikasi tetap langsung jalan
                if ($preferDriver === 'auto' || $preferDriver === 'mysql') {
                    error_log("Peringatan MySQL: " . $e->getMessage() . ". Mengalihkan ke SQLite lokal...");
                    self::$instance = self::connectSqlite();
                    self::$driverUsed = 'sqlite';
                } else {
                    die("Koneksi Database Gagal: " . $e->getMessage());
                }
            }
        }
        return self::$instance;
    }

    public static function getDriver(): string {
        return self::$driverUsed;
    }

    private static function connectSqlite(): PDO {
        $sqliteFile = STORAGE_PATH . '/database.sqlite';
        $isNew = !file_exists($sqliteFile);
        $pdo = new PDO("sqlite:" . $sqliteFile, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec("PRAGMA foreign_keys = ON;");

        if ($isNew) {
            self::initSqliteSchema($pdo);
        }
        return $pdo;
    }

    private static function initSqliteSchema(PDO $pdo): void {
        $schema = <<<SQL
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            phone TEXT,
            role TEXT DEFAULT 'owner',
            status TEXT DEFAULT 'active',
            remember_token TEXT,
            reset_token TEXT,
            reset_expires_at TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS businesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            business_name TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            logo_path TEXT,
            currency TEXT DEFAULT 'IDR',
            monthly_profit_target REAL DEFAULT 15000000.00,
            receipt_footer_note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            color TEXT DEFAULT '#2563eb',
            icon TEXT DEFAULT 'tag',
            is_default INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category_id INTEGER,
            sku TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            cost_price REAL DEFAULT 0.00,
            selling_price REAL DEFAULT 0.00,
            stock INTEGER DEFAULT 0,
            min_stock INTEGER DEFAULT 5,
            unit TEXT DEFAULT 'pcs',
            image_url TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            movement_type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            before_stock INTEGER NOT NULL,
            after_stock INTEGER NOT NULL,
            reason TEXT NOT NULL,
            reference_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            total_receivable REAL DEFAULT 0.00,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            total_debt REAL DEFAULT 0.00,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            transaction_number TEXT NOT NULL,
            type TEXT NOT NULL,
            date DATE NOT NULL,
            customer_id INTEGER,
            supplier_id INTEGER,
            subtotal REAL DEFAULT 0.00,
            discount REAL DEFAULT 0.00,
            total_amount REAL DEFAULT 0.00,
            total_cost REAL DEFAULT 0.00,
            payment_method TEXT DEFAULT 'cash',
            payment_status TEXT DEFAULT 'paid',
            paid_amount REAL DEFAULT 0.00,
            change_amount REAL DEFAULT 0.00,
            status TEXT DEFAULT 'completed',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS transaction_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            cost_price REAL DEFAULT 0.00,
            discount REAL DEFAULT 0.00,
            subtotal REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS financial_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category_id INTEGER,
            transaction_id INTEGER,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            date DATE NOT NULL,
            payment_method TEXT DEFAULT 'cash',
            account_name TEXT DEFAULT 'Kas Utama',
            description TEXT NOT NULL,
            notes TEXT,
            is_operational INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS debts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            contact_name TEXT NOT NULL,
            customer_id INTEGER,
            supplier_id INTEGER,
            transaction_id INTEGER,
            title TEXT NOT NULL,
            total_amount REAL NOT NULL,
            paid_amount REAL DEFAULT 0.00,
            remaining_amount REAL NOT NULL,
            start_date DATE NOT NULL,
            due_date DATE NOT NULL,
            status TEXT DEFAULT 'unpaid',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS debt_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            debt_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            payment_date DATE NOT NULL,
            payment_method TEXT DEFAULT 'cash',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            role TEXT DEFAULT 'cashier',
            pin_code TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT,
            description TEXT NOT NULL,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
SQL;
        $pdo->exec($schema);

        // Masukkan data awal demo
        $passHash = password_hash('password123', PASSWORD_BCRYPT);
        $userStmt = $pdo->prepare("INSERT INTO users (id, name, email, password, phone, role, status) VALUES (1, 'Budi Pratama', 'admin@umkmpro.id', ?, '081234567890', 'owner', 'active')");
        $userStmt->execute([$passHash]);

        $pdo->exec("INSERT INTO businesses (id, user_id, business_name, owner_name, phone, address, currency, monthly_profit_target, receipt_footer_note)
            VALUES (1, 1, 'Toko Sembako & Katering Berkah Jaya', 'Budi Pratama', '081234567890', 'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan', 'IDR', 15000000.00, 'Terima kasih atas kunjungan & kepercayaan Anda!')");

        $pdo->exec("INSERT INTO categories (id, user_id, name, type, color, icon, is_default) VALUES
            (1, 1, 'Bahan Pokok & Sembako', 'product', '#2563eb', 'package', 1),
            (2, 1, 'Makanan & Minuman', 'product', '#16a34a', 'shopping-bag', 1),
            (3, 1, 'Perlengkapan & Kebersihan', 'product', '#0891b2', 'sparkles', 1),
            (4, 1, 'Penjualan Ritel & Toko', 'income', '#16a34a', 'shopping-cart', 1),
            (5, 1, 'Pesanan Katering Kantor', 'income', '#059669', 'utensils', 1),
            (6, 1, 'Pendapatan Lain-lain', 'income', '#0284c7', 'wallet', 1),
            (7, 1, 'Kulakan / Belanja Stok', 'expense', '#dc2626', 'truck', 1),
            (8, 1, 'Operasional & Listrik', 'expense', '#ea580c', 'zap', 1),
            (9, 1, 'Gaji Karyawan', 'expense', '#9333ea', 'users', 1),
            (10, 1, 'Sewa Tempat & Kebersihan', 'expense', '#e11d48', 'home', 1)");

        $pdo->exec("INSERT INTO products (id, user_id, category_id, sku, name, description, cost_price, selling_price, stock, min_stock, unit, status) VALUES
            (1, 1, 1, 'SKU-BRS-01', 'Beras Ramos Super 5kg', 'Beras pulen kualitas premium tanpa pemutih', 68000.00, 78000.00, 42, 10, 'sak', 'active'),
            (2, 1, 1, 'SKU-MYK-02', 'Minyak Goreng Sawit 2 Liter', 'Minyak goreng kemasan pouch jernih', 31500.00, 36000.00, 28, 12, 'pouch', 'active'),
            (3, 1, 1, 'SKU-GLA-03', 'Gula Pasir Kristal Putih 1kg', 'Gula tebu murni manis alami', 14800.00, 17500.00, 35, 15, 'kg', 'active'),
            (4, 1, 1, 'SKU-TLR-04', 'Telur Ayam Ras Segar 1kg', 'Telur ayam segar negeri isi 16-17 butir', 26000.00, 30000.00, 8, 15, 'kg', 'active'),
            (5, 1, 2, 'SKU-KPO-05', 'Kopi Robusta Lampung 250g', 'Biji kopi sangrai aroma harum mantap', 28000.00, 38000.00, 19, 8, 'bungkus', 'active'),
            (6, 1, 2, 'SKU-MIE-06', 'Mie Instan Kuah Soto (Dus isi 40)', 'Satu dus mie instan kuah soto lezat', 105000.00, 122000.00, 5, 8, 'dus', 'active'),
            (7, 1, 3, 'SKU-SBN-07', 'Sabun Cuci Piring Jeruk Nipis 780ml', 'Cairan pencuci piring anti lemak membandel', 13500.00, 16500.00, 24, 10, 'pouch', 'active')");

        $pdo->exec("INSERT INTO customers (id, user_id, name, phone, email, address, total_receivable, notes) VALUES
            (1, 1, 'Warung Bu Siti', '081388776655', 'busiti@gmail.com', 'Jl. Flamboyan No. 12', 350000.00, 'Langganan beli sembako mingguan tempo'),
            (2, 1, 'CV Digital Mandiri (Kantor)', '082199887711', 'purchasing@digitalmandiri.co.id', 'Gedung Wisma Niaga Lt. 3', 750000.00, 'Order katering makan siang karyawan'),
            (3, 1, 'Ibu Hj. Fatimah', '085711223344', 'fatimah.hajjah@yahoo.com', 'Komplek Permata Indah B-14', 0.00, 'Pembayaran selalu cash'),
            (4, 1, 'Bpk. Hendra Gunawan', '081900112233', 'hendra.gunawan@gmail.com', 'Jl. Melati IV No. 8', 0.00, 'Pelanggan eceran')");

        $pdo->exec("INSERT INTO suppliers (id, user_id, name, phone, email, address, total_debt, notes) VALUES
            (1, 1, 'Distributor Sembako Makmur', '081122334455', 'order@sembakomakmur.com', 'Kawasan Industri Pulogadung Blok C', 1250000.00, 'Suplai beras, gula, minyak - termin 14 hari'),
            (2, 1, 'Agen Telur Lestari Blitar', '081299334411', 'telurlestari@gmail.com', 'Pasar Induk Kramat Jati Kios A-9', 0.00, 'Suplai telur segar setiap 3 hari'),
            (3, 1, 'Grosir Sabun & Plastik Barokah', '087866554433', 'grosirbarokah@gmail.com', 'Jl. Raya Daan Mogot KM 12', 450000.00, 'Suplai perlengkapan kebersihan & kantong')");

        $pdo->exec("INSERT INTO debts (id, user_id, type, contact_name, customer_id, supplier_id, title, total_amount, paid_amount, remaining_amount, start_date, due_date, status, notes) VALUES
            (1, 1, 'receivable', 'Warung Bu Siti', 1, NULL, 'Piutang Nota Belanja Sembako', 350000.00, 0.00, 350000.00, '2026-10-28', '2026-11-05', 'unpaid', 'Jatuh tempo 5 November 2026'),
            (2, 1, 'receivable', 'CV Digital Mandiri (Kantor)', 2, NULL, 'Piutang Katering Snack Box Seminar', 750000.00, 0.00, 750000.00, '2026-10-22', '2026-11-02', 'unpaid', 'Faktur tagihan sudah dikirim via email'),
            (3, 1, 'payable', 'Distributor Sembako Makmur', NULL, 1, 'Utang Kulakan Beras 20 Sak & Minyak', 2500000.00, 1250000.00, 1250000.00, '2026-10-20', '2026-11-04', 'partial', 'Sudah dicicil 50%, sisa jatuh tempo 4 November'),
            (4, 1, 'payable', 'Grosir Sabun & Plastik Barokah', NULL, 3, 'Utang Pasokan Kantong Kresek & Dus', 450000.00, 0.00, 450000.00, '2026-10-24', '2026-11-08', 'unpaid', 'Faktur tempo 14 hari')");

        $pdo->exec("INSERT INTO financial_records (user_id, category_id, type, amount, date, payment_method, account_name, description, is_operational) VALUES
            (1, 4, 'income', 192000.00, '2026-10-28', 'cash', 'Kas Toko', 'Penjualan tunai sembako eceran', 1),
            (1, 5, 'income', 750000.00, '2026-10-29', 'qris', 'Rekening BCA', 'Pembayaran QRIS Katering CV Digital Mandiri', 1),
            (1, 4, 'income', 114000.00, '2026-10-29', 'bank_transfer', 'Rekening Mandiri', 'Transfer bank belanja kopi & sabun', 1),
            (1, 8, 'expense', 275000.00, '2026-10-27', 'cash', 'Kas Toko', 'Bayar token listrik PLN toko sembako', 1),
            (1, 8, 'expense', 150000.00, '2026-10-28', 'cash', 'Kas Toko', 'Beli plastik kresek & lakban pengemasan', 1),
            (1, 9, 'expense', 1800000.00, '2026-10-25', 'bank_transfer', 'Rekening BCA', 'Gaji asisten toko minggu ke-4', 1)");
    }
}
