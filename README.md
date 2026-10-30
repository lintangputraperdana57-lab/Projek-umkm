# Pembukuan UMKM 📊
> Sistem Pembukuan Keuangan, Persediaan Barang, Kasir POS Multi-Item, dan Manajemen Utang-Piutang UMKM Indonesia.

Dibangun dengan **PHP Native 8+ murni tanpa framework**, menggunakan **MySQL / MariaDB** dengan **PDO Prepared Statements**, arsitektur modular yang rapi dan aman, serta antarmuka modern **Light Pro** (Navy Blue & White) dengan dukungan mode gelap dan **PWA (Progressive Web App)** untuk kenyamanan operasional di smartphone Android dan desktop.

---

## 🌟 Fitur Utama Sistem

1. **Dashboard Eksekutif UMKM**
   - Kartu statistik: Saldo Kas Kumulatif, Total Pemasukan, Total Pengeluaran, dan Laba Bersih Aktual.
   - Peringatan dini stok menipis (di bawah batas minimum).
   - Pengingat jatuh tempo utang ke supplier & piutang pelanggan.
   - Produk terlaris dan riwayat transaksi terbaru.
   - Filter periode harian, mingguan, bulanan, dan tahunan.

2. **Kasir POS & Transaksi Multi-Item (Point of Sale)**
   - Entri transaksi dengan banyak produk dalam satu nota.
   - Nomor transaksi otomatis unik (`TRX-YYYYMM-XXXX`).
   - Kalkulasi otomatis: subtotal, diskon per item / nota, total bayar, dan uang kembalian.
   - Metode pembayaran: Tunai, Transfer Bank (BCA, Mandiri, BRI), QRIS, dan Tempo (Kredit).
   - Pengurangan stok barang seketika secara otomatis menggunakan **Database Transaction** (`beginTransaction`, `commit`, `rollBack`).
   - Cetak struk nota belanja siap pakai untuk printer thermal 58mm/80mm atau printer biasa.

3. **Modul Persediaan & Inventaris Barang**
   - CRUD Produk & Kategori lengkap.
   - Kode produk unik / SKU otomatis.
   - Kontrol harga modal (HPP), harga jual, dan margin laba.
   - Penyesuaian stok (*Stock Adjustment*) dengan pencatatan alasan (stok opname, barang rusak, retur).
   - Riwayat mutasi stok (`stock_movements`).

4. **Buku Kas & Keuangan Operasional**
   - Pencatatan pemasukan dan pengeluaran non-penjualan (listrik, gaji karyawan, sewa kios, modal awal).
   - Akun kas & rekening terpisah (Kas Utama, Bank BCA, Bank Mandiri, QRIS).
   - Kalkulasi laba rugi akurat tanpa menghitung transaksi ganda (*anti double-counting*).

5. **Utang-Piutang & Pengingat Jatuh Tempo**
   - Catat utang kewajiban bayar ke supplier dan piutang tagihan pelanggan.
   - Peringatan visual: Merah untuk lewat jatuh tempo, kuning untuk mendekati tempo (3 hari ke depan).
   - Pencatatan pembayaran cicilan sebagian maupun pelunasan penuh.
   - Sinkronisasi otomatis ke buku kas saat cicilan diterima/dibayar.

6. **Mitra Pelanggan & Pemasok (CRM)**
   - CRUD Pelanggan dan Pemasok.
   - Integrasi tautan langsung ke WhatsApp (`wa.me`).
   - Saldo piutang pelanggan dan utang pemasok terakumulasi otomatis.

7. **Laporan Keuangan & Ekspor CSV**
   - Laporan Laba Rugi Komprehensif (Pendapatan Penjualan, HPP Modal, Laba Kotor, Beban Operasional, Laba Bersih Akhir).
   - Valuasi aset persediaan (Ragam produk, fisik barang, nilai modal, dan potensi omzet).
   - Fitur Ekspor ke format CSV satu klik.
   - Tampilan cetak ramah kertas (*print-friendly*).

8. **Keamanan & Administrasi**
   - Password disimpan dengan enkripsi kuat `password_hash()` (Bcrypt).
   - Verifikasi otentikasi `password_verify()` dan regenerasi session ID.
   - Perlindungan serangan CSRF dengan validasi token acak pada setiap request form.
   - Sanitasi data input XSS (`htmlspecialchars`).
   - Pencatatan log aktivitas sistem penting (`audit_logs`).
   - Pencadangan (*backup*) database SQL langsung dari aplikasi.

9. **PWA (Progressive Web App)**
   - Dilengkapi `manifest.webmanifest` dan `service-worker.js`.
   - Responsif di layar HP Android (dengan navigasi bawah ergonomis) hingga laptop/desktop.

---

## 📁 Struktur Folder & Arsitektur Modular

```text
pembukuan-umkm-pro/
├── index.php                 # Router awal (mengarahkan ke dashboard atau login)
├── login.php                 # Halaman login dengan tombol akun demo cepat
├── register.php              # Halaman pendaftaran pemilik & usaha baru
├── dashboard.php             # Dashboard ringkasan analitik bisnis
├── logout.php                # Logout aman & penghancuran sesi
├── manifest.webmanifest      # PWA Web App Manifest
├── service-worker.js         # PWA Service Worker caching
├── config/
│   ├── app.php               # Konfigurasi aplikasi, timezone, error reporting
│   └── database.php          # Koneksi PDO MySQL 8+ & fallback SQLite otomatis
├── helpers/
│   └── functions.php         # CSRF, auth guard, formatting Rupiah, audit log
├── includes/
│   ├── header.php            # Header HTML, meta PWA, CSS
│   ├── navbar.php            # Navbar atas, tema toggle, notifikasi flash
│   ├── sidebar.php           # Sidebar navigasi desktop
│   └── footer.php            # Navigasi bawah Android & scripts
├── actions/
│   ├── auth_action.php       # Proses login, register, validasi sandi
│   ├── product_action.php    # Proses CRUD produk & penyesuaian stok
│   ├── transaction_action.php# Proses transaksi POS, multi-item, stok otomatis
│   ├── finance_action.php    # Proses mutasi kas & beban operasional
│   ├── debt_action.php       # Proses utang-piutang & pembayaran cicilan
│   └── customer_action.php   # Proses CRUD pelanggan & pemasok
├── pages/
│   ├── products.php          # Katalog persediaan & modal stok opname
│   ├── pos.php               # Kasir cepat transaksi penjualan multi-item
│   ├── receipt.php           # Nota cetak struk thermal / invoice
│   ├── transactions.php      # Riwayat faktur & pembatalan nota
│   ├── finances.php          # Buku kas & pengeluaran operasional
│   ├── debts.php             # Pantauan utang-piutang & pelunasan
│   ├── customers.php         # Buku kontak pelanggan & pemasok
│   ├── reports.php           # Laporan Laba/Rugi, valuasi stok, ekspor CSV
│   └── settings.php          # Profil toko, target bulanan, backup database
├── assets/
│   ├── css/style.css         # Styling Light Pro, Navy theme & Dark mode
│   └── js/app.js             # Kalkulator POS, tema switcher, PWA register
├── database/
│   ├── database.sql          # Skema DDL tabel MySQL lengkap
│   └── seed.sql              # Data demo siap pakai
├── storage/                  # Penyimpanan SQLite lokal & log
└── uploads/                  # Unggahan logo & bukti nota
```

---

## 🚀 Petunjuk Instalasi & Menjalankan Website

### Prasyarat Sistem
- **PHP**: Versi 8.0, 8.1, 8.2, atau 8.3+ (Ekstensi `pdo`, `pdo_mysql`, atau `pdo_sqlite`).
- **Database**: MySQL 8.0+ / MariaDB 10.4+ (atau SQLite bawaan).
- **Web Server**: Apache, Nginx, XAMPP, Laragon, atau PHP Built-in Server.

---

### Cara 1: Menjalankan Menggunakan XAMPP (Windows)
1. Unduh atau salin seluruh folder proyek ini ke dalam folder `htdocs` XAMPP:
   ```text
   C:\xampp\htdocs\pembukuan-umkm-pro
   ```
2. Buka **XAMPP Control Panel**, lalu aktifkan **Apache** dan **MySQL**.
3. Buka browser dan akses **phpMyAdmin**: `http://localhost/phpmyadmin`.
4. Buat database baru bernama `umkm_pro`.
5. Klik menu **Import**, pilih file `database/database.sql`, lalu klik **Go**.
6. (Opsional untuk data demo) Ulangi impor untuk file `database/seed.sql`.
7. Buka browser dan kunjungi:
   ```text
   http://localhost/pembukuan-umkm-pro/login.php
   ```

---

### Cara 2: Menjalankan Cepat dengan PHP Built-in Server (Linux / macOS / Windows Terminal)
Aplikasi telah dilengkapi fitur **koneksi cerdas ganda**: Jika MySQL belum aktif di laptop Anda, sistem secara otomatis mengaktifkan database SQLite lokal di `storage/database.sqlite` sehingga Anda dapat langsung menjalankannya tanpa konfigurasi rumit:

```bash
# Jalankan web server bawaan PHP di root proyek
php -S localhost:8000
```
Buka browser dan buka: `http://localhost:8000/login.php`.

---

### Cara 3: Menggunakan Konfigurasi MySQL Kustom via Environment Variables
Jika menggunakan kredensial MySQL selain default (`localhost`, `root`, tanpa password), Anda dapat mengatur environment variables atau mengedit `config/database.php`:
```bash
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_NAME=umkm_pro
export DB_USER=root
export DB_PASS=rahasia123
php -S localhost:8000
```

---

## 🔑 Akun Demo Siap Pakai

Sistem telah menyediakan data demo siap pakai:
- **Email**: `admin@umkmpro.id`
- **Kata Sandi**: `password123`
- **Peran**: Pemilik Usaha (*Owner*)
- **Nama Usaha**: Toko Sembako & Katering Berkah Jaya

Tersedia tombol satu klik **"Gunakan Akun Demo"** di halaman login untuk pengujian instan.

---

## 🧪 Panduan Daftar Pengujian Fitur

1. **Pengujian Autentikasi & Keamanan:**
   - Masuk menggunakan tombol cepat akun demo di `login.php`.
   - Coba masukkan password salah: Sistem menampilkan pesan peringatan aman.
   - Daftarkan akun toko baru di `register.php`: Pastikan password dienkripsi dengan `password_hash()` di database.
   - Coba akses `dashboard.php` setelah logout: Sistem menolak akses dan mengarahkan kembali ke login.

2. **Pengujian Kasir POS & Stok Otomatis:**
   - Masuk ke menu **Kasir (POS)**.
   - Pilih produk (misal: "Beras Ramos Super 5kg") sebanyak 2 sak.
   - Tambah baris item kedua (misal: "Minyak Goreng Sawit 2L") sebanyak 1 pouch.
   - Perhatikan subtotal dan total terhitung seketika tanpa reload.
   - Masukkan nominal pembayaran dan periksa kalkulasi kembalian.
   - Klik **"Proses & Cetak Struk"**: Sistem menerbitkan nomor transaksi baru, mencatat uang ke buku kas, mencetak nota thermal, dan stok produk otomatis berkurang secara akurat.

3. **Pengujian Penyesuaian Stok (Stock Opname):**
   - Buka menu **Produk & Stok**.
   - Klik tombol **"Stok ±"** pada salah satu produk.
   - Masukkan jumlah penambahan/pengurangan beserta alasan (contoh: "Stok opname bulanan").
   - Simpan: Stok baru terupdate dan riwayat tercatat di mutasi.

4. **Pengujian Utang & Piutang:**
   - Buka menu **Utang & Piutang**.
   - Perhatikan indikator warna peringatan jatuh tempo.
   - Klik **"Bayar Cicilan"** pada salah satu tagihan, masukkan nominal (misal Rp 200.000).
   - Simpan: Sisa utang/piutang otomatis berkurang dan nominal cicilan tercatat di buku kas.

5. **Pengujian Laporan & Ekspor:**
   - Buka menu **Laporan Keuangan**.
   - Periksa perhitungan Laba Bersih = Pendapatan Penjualan - HPP Modal Barang - Beban Operasional.
   - Klik tombol **"Ekspor CSV"**: File spreadsheet terunduh dengan data riil dari database.
   - Klik **"Cetak Laporan"**: Tampilan printer A4 otomatis tersusun rapi.

6. **Pengujian Responsivitas Mobile Android & Tema Gelap:**
   - Buka DevTools browser (F12) lalu pilih mode simulasi ponsel (Galaxy S20 atau iPhone).
   - Periksa navigasi mobile bawah yang nyaman diakses ibu jari.
   - Klik tombol **"Tema"** di navbar untuk beralih antara tema Light Pro dan Mode Gelap.

---

## 🛡️ Standar Lisensi & Keamanan
Aplikasi ini dirancang sesuai standar keamanan OWASP:
- Bebas SQL Injection melalui PDO Prepared Statements.
- Perlindungan XSS melalui fungsi sanitasi entitas HTML.
- Perlindungan Cross-Site Request Forgery (CSRF).
- Pemisahan isolasi data multi-user antar pemilik usaha.
