-- ============================================================================
-- PEMBUKUAN UMKM PRO - SEED DATA (DATA DEMO)
-- Akun Login:
-- Email: admin@umkmpro.id
-- Password: password123
-- (Hash: $2y$10$wKz0b0v9Nn1U5QvW9kQhXe8GvJ6Z7l0cW3z8rXkCgG2y7tL4eB2hO)
-- ============================================================================

-- 1. Insert Demo User (password123)
INSERT INTO users (id, name, email, password, phone, role, status, created_at)
VALUES (
    1,
    'Budi Pratama',
    'admin@umkmpro.id',
    '$2y$10$Q7iMv62Uj.sYg9w9lJp.feqH0X5F8rV/zG.9/2aWjH9K7w3sW3t4e',
    '081234567890',
    'owner',
    'active',
    NOW()
) ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Business Profile
INSERT INTO businesses (id, user_id, business_name, owner_name, phone, address, currency, access_code, monthly_profit_target, receipt_footer_note)
VALUES (
    1,
    1,
    'Toko Sembako & Katering Berkah Jaya',
    'Budi Pratama',
    '081234567890',
    'Jl. Merdeka No. 45, Kebayoran Baru, Jakarta Selatan',
    'IDR',
    'UMKM-9824',
    15000000.00,
    'Terima kasih atas kunjungan & kepercayaan Anda! Barang yang sudah dibeli tidak dapat ditukar kecuali ada perjanjian.'
) ON DUPLICATE KEY UPDATE business_name=VALUES(business_name);

-- 3. Insert Categories
INSERT INTO categories (id, user_id, name, type, color, icon, is_default) VALUES
(1, 1, 'Bahan Pokok & Sembako', 'product', '#2563eb', 'package', 1),
(2, 1, 'Makanan & Minuman', 'product', '#16a34a', 'shopping-bag', 1),
(3, 1, 'Perlengkapan & Kebersihan', 'product', '#0891b2', 'sparkles', 1),
(4, 1, 'Penjualan Ritel & Toko', 'income', '#16a34a', 'shopping-cart', 1),
(5, 1, 'Pesanan Katering Kantor', 'income', '#059669', 'utensils', 1),
(6, 1, 'Pendapatan Lain-lain', 'income', '#0284c7', 'wallet', 1),
(7, 1, 'Kulakan / Belanja Stok', 'expense', '#dc2626', 'truck', 1),
(8, 1, 'Operasional & Listrik', 'expense', '#ea580c', 'zap', 1),
(9, 1, 'Gaji Karyawan', 'expense', '#9333ea', 'users', 1),
(10, 1, 'Sewa Tempat & Kebersihan', 'expense', '#e11d48', 'home', 1);

-- 4. Insert Products
INSERT INTO products (id, user_id, category_id, sku, name, description, cost_price, selling_price, stock, min_stock, unit, image_url, status) VALUES
(1, 1, 1, 'SKU-BRS-01', 'Beras Ramos Super 5kg', 'Beras pulen kualitas premium tanpa pemutih', 68000.00, 78000.00, 42, 10, 'sak', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', 'active'),
(2, 1, 1, 'SKU-MYK-02', 'Minyak Goreng Sawit 2 Liter', 'Minyak goreng kemasan pouch jernih', 31500.00, 36000.00, 28, 12, 'pouch', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80', 'active'),
(3, 1, 1, 'SKU-GLA-03', 'Gula Pasir Kristal Putih 1kg', 'Gula tebu murni manis alami', 14800.00, 17500.00, 35, 15, 'kg', 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=400&q=80', 'active'),
(4, 1, 1, 'SKU-TLR-04', 'Telur Ayam Ras Segar 1kg', 'Telur ayam segar negeri isi 16-17 butir', 26000.00, 30000.00, 8, 15, 'kg', 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=400&q=80', 'active'), -- Stok menipis
(5, 1, 2, 'SKU-KPO-05', 'Kopi Robusta Lampung 250g', 'Biji kopi sangrai aroma harum mantap', 28000.00, 38000.00, 19, 8, 'bungkus', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', 'active'),
(6, 1, 2, 'SKU-MIE-06', 'Mie Instan Kuah Soto (Dus isi 40)', 'Satu dus mie instan kuah soto lezat', 105000.00, 122000.00, 5, 8, 'dus', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&q=80', 'active'), -- Stok menipis
(7, 1, 3, 'SKU-SBN-07', 'Sabun Cuci Piring Jeruk Nipis 780ml', 'Cairan pencuci piring anti lemak membandel', 13500.00, 16500.00, 24, 10, 'pouch', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', 'active');

-- 5. Insert Customers
INSERT INTO customers (id, user_id, name, phone, email, address, total_receivable, notes) VALUES
(1, 1, 'Warung Bu Siti', '081388776655', 'busiti@gmail.com', 'Jl. Flamboyan No. 12', 350000.00, 'Langganan beli sembako mingguan tempo'),
(2, 1, 'CV Digital Mandiri (Kantor)', '082199887711', 'purchasing@digitalmandiri.co.id', 'Gedung Wisma Niaga Lt. 3', 750000.00, 'Order katering makan siang karyawan'),
(3, 1, 'Ibu Hj. Fatimah', '085711223344', 'fatimah.hajjah@yahoo.com', 'Komplek Permata Indah B-14', 0.00, 'Pembayaran selalu cash saat antar'),
(4, 1, 'Bpk. Hendra Gunawan', '081900112233', 'hendra.gunawan@gmail.com', 'Jl. Melati IV No. 8', 0.00, 'Pelanggan ritel eceran');

-- 6. Insert Suppliers
INSERT INTO suppliers (id, user_id, name, phone, email, address, total_debt, notes) VALUES
(1, 1, 'Distributor Sembako Makmur', '081122334455', 'order@sembakomakmur.com', 'Kawasan Industri Pulogadung Blok C', 1250000.00, 'Suplai beras, gula, minyak - termin 14 hari'),
(2, 1, 'Agen Telur Lestari Blitar', '081299334411', 'telurlestari@gmail.com', 'Pasar Induk Kramat Jati Kios A-9', 0.00, 'Suplai telur segar setiap 3 hari'),
(3, 1, 'Grosir Sabun & Plastik Barokah', '087866554433', 'grosirbarokah@gmail.com', 'Jl. Raya Daan Mogot KM 12', 450000.00, 'Suplai perlengkapan kebersihan & kantong');

-- 7. Insert Transactions & Items
INSERT INTO transactions (id, user_id, transaction_number, type, date, customer_id, subtotal, discount, total_amount, total_cost, payment_method, payment_status, paid_amount, change_amount, status, notes) VALUES
(1, 1, 'TRX-202610-001', 'sale', '2026-10-28', 1, 350000.00, 0.00, 350000.00, 290000.00, 'tempo', 'unpaid', 0.00, 0.00, 'completed', 'Pesanan sembako warung Bu Siti tempo jatuh tempo 5 Nov'),
(2, 1, 'TRX-202610-002', 'sale', '2026-10-28', 3, 192000.00, 0.00, 192000.00, 161000.00, 'cash', 'paid', 200000.00, 8000.00, 'completed', 'Beli beras 1 sak dan minyak 1 pouch'),
(3, 1, 'TRX-202610-003', 'sale', '2026-10-29', 2, 750000.00, 0.00, 750000.00, 480000.00, 'qris', 'paid', 750000.00, 0.00, 'completed', 'Paket katering makan siang kantor 25 box'),
(4, 1, 'TRX-202610-004', 'sale', '2026-10-29', 4, 114000.00, 0.00, 114000.00, 94000.00, 'bank_transfer', 'paid', 114000.00, 0.00, 'completed', 'Beli kopi 2 bungkus dan sabun');

INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, unit_price, cost_price, discount, subtotal) VALUES
(1, 1, 'Beras Ramos Super 5kg', 2, 78000.00, 68000.00, 0.00, 156000.00),
(1, 2, 'Minyak Goreng Sawit 2 Liter', 3, 36000.00, 31500.00, 0.00, 108000.00),
(1, 3, 'Gula Pasir Kristal Putih 1kg', 4, 17500.00, 14800.00, 0.00, 70000.00),
(1, 7, 'Sabun Cuci Piring Jeruk Nipis 780ml', 1, 16000.00, 13500.00, 0.00, 16000.00),
(2, 1, 'Beras Ramos Super 5kg', 2, 78000.00, 68000.00, 0.00, 156000.00),
(2, 2, 'Minyak Goreng Sawit 2 Liter', 1, 36000.00, 31500.00, 0.00, 36000.00),
(4, 5, 'Kopi Robusta Lampung 250g', 2, 38000.00, 28000.00, 0.00, 76000.00),
(4, 7, 'Sabun Cuci Piring Jeruk Nipis 780ml', 2, 19000.00, 13500.00, 0.00, 38000.00);

-- 8. Insert Financial Records (Buku Kas & Pengeluaran)
INSERT INTO financial_records (user_id, category_id, transaction_id, type, amount, date, payment_method, account_name, description, is_operational) VALUES
(1, 4, 2, 'income', 192000.00, '2026-10-28', 'cash', 'Kas Toko', 'Penjualan tunai sembako eceran', 1),
(1, 5, 3, 'income', 750000.00, '2026-10-29', 'qris', 'Rekening BCA', 'Pembayaran QRIS Katering CV Digital Mandiri', 1),
(1, 4, 4, 'income', 114000.00, '2026-10-29', 'bank_transfer', 'Rekening Mandiri', 'Transfer bank belanja kopi & sabun', 1),
(1, 8, NULL, 'expense', 275000.00, '2026-10-27', 'cash', 'Kas Toko', 'Bayar token listrik PLN toko sembako', 1),
(1, 8, NULL, 'expense', 150000.00, '2026-10-28', 'cash', 'Kas Toko', 'Beli plastik kresek & lakban pengemasan', 1),
(1, 9, NULL, 'expense', 1800000.00, '2026-10-25', 'bank_transfer', 'Rekening BCA', 'Gaji asisten toko minggu ke-4', 1);

-- 9. Insert Debts & Receivables
INSERT INTO debts (id, user_id, type, contact_name, customer_id, supplier_id, transaction_id, title, total_amount, paid_amount, remaining_amount, start_date, due_date, status, notes) VALUES
(1, 1, 'receivable', 'Warung Bu Siti', 1, NULL, 1, 'Piutang Nota Belanja Sembako #TRX-202610-001', 350000.00, 0.00, 350000.00, '2026-10-28', '2026-11-05', 'unpaid', 'Jatuh tempo 5 November 2026'),
(2, 1, 'receivable', 'CV Digital Mandiri (Kantor)', 2, NULL, NULL, 'Piutang Katering Snack Box Seminar', 750000.00, 0.00, 750000.00, '2026-10-22', '2026-11-02', 'unpaid', 'Faktur tagihan katering sudah dikirim via email'),
(3, 1, 'payable', 'Distributor Sembako Makmur', NULL, 1, NULL, 'Utang Kulakan Beras 20 Sak & Minyak 10 Dus', 2500000.00, 1250000.00, 1250000.00, '2026-10-20', '2026-11-04', 'partial', 'Sudah dicicil 50%, sisa jatuh tempo 4 November'),
(4, 1, 'payable', 'Grosir Sabun & Plastik Barokah', NULL, 3, NULL, 'Utang Pasokan Kantong Kresek & Dus', 450000.00, 0.00, 450000.00, '2026-10-24', '2026-11-08', 'unpaid', 'Faktur tempo 14 hari');

-- 10. Insert Debt Payments
INSERT INTO debt_payments (debt_id, user_id, amount, payment_date, payment_method, notes) VALUES
(3, 1, 1250000.00, '2026-10-25', 'bank_transfer', 'Cicilan pertama via transfer Mandiri');

-- 11. Insert Employees
INSERT INTO employees (user_id, name, email, phone, role, pin_code, status) VALUES
(1, 'Siti Rahma', 'siti.kasir@umkmpro.id', '081299887766', 'cashier', '1234', 'active'),
(1, 'Dimas Saputra', 'dimas.gudang@umkmpro.id', '085711223399', 'staff', '5678', 'active'),
(1, 'Ahmad Fauzi', 'fauzi.manager@umkmpro.id', '081377889900', 'manager', '9988', 'active');

-- 12. Insert Audit Logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES
(1, 'LOGIN', 'auth', '1', 'Pengguna Budi Pratama berhasil login ke sistem', '127.0.0.1'),
(1, 'CREATE_TRANSACTION', 'transaction', 'TRX-202610-003', 'Menerbitkan transaksi penjualan katering kantor Rp 750.000', '127.0.0.1'),
(1, 'UPDATE_STOCK', 'product', 'SKU-TLR-04', 'Peringatan stok menipis: Telur Ayam Ras tersisa 8 kg', '127.0.0.1');
