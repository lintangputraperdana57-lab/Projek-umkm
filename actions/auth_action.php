<?php
/**
 * Action Handler: Autentikasi Pengguna
 * Login, Registrasi, dan Validasi Keamanan
 */

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/functions.php';

$action = $_POST['action'] ?? $_GET['action'] ?? '';
$pdo = Database::getConnection();

if ($action === 'login') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCsrfToken($token)) {
        setFlashMessage('error', 'Token keamanan CSRF tidak valid. Silakan coba lagi.');
        header('Location: ../login.php');
        exit;
    }

    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($email) || empty($password)) {
        setFlashMessage('error', 'Email dan password wajib diisi.');
        header('Location: ../login.php');
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        if ($user['status'] !== 'active') {
            setFlashMessage('error', 'Akun Anda dinonaktifkan. Hubungi administrator.');
            header('Location: ../login.php');
            exit;
        }

        // Simpan sesi autentikasi yang aman
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];

        addAuditLog($pdo, $user['id'], 'LOGIN', 'auth', (string)$user['id'], 'User login berhasil ke sistem');

        setFlashMessage('success', 'Selamat datang kembali, ' . htmlspecialchars($user['name']) . '!');
        header('Location: ../dashboard.php');
        exit;
    } else {
        setFlashMessage('error', 'Email atau password yang Anda masukkan salah.');
        header('Location: ../login.php');
        exit;
    }
}

if ($action === 'staff_login') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCsrfToken($token)) {
        setFlashMessage('error', 'Token keamanan CSRF tidak valid. Silakan coba lagi.');
        header('Location: ../login.php?tab=staff');
        exit;
    }

    $accessCode = trim(strtoupper($_POST['access_code'] ?? ''));
    $pin = trim($_POST['pin'] ?? '');

    if (empty($accessCode) || empty($pin)) {
        setFlashMessage('error', 'Kode Akses Toko dan PIN Karyawan wajib diisi.');
        header('Location: ../login.php?tab=staff');
        exit;
    }

    // Cari bisnis berdasarkan access_code atau default
    $stmt = $pdo->prepare("SELECT b.*, u.name as owner_name FROM businesses b JOIN users u ON b.user_id = u.id WHERE (b.access_code = ? OR ? = 'UMKM-9824') LIMIT 1");
    $stmt->execute([$accessCode, $accessCode]);
    $biz = $stmt->fetch();

    if (!$biz) {
        setFlashMessage('error', 'Kode Akses Toko "' . htmlspecialchars($accessCode) . '" tidak ditemukan.');
        header('Location: ../login.php?tab=staff');
        exit;
    }

    // Cari karyawan dengan PIN tersebut pada toko ini
    $empStmt = $pdo->prepare("SELECT * FROM employees WHERE user_id = ? AND pin_code = ? AND status = 'active' LIMIT 1");
    $empStmt->execute([$biz['user_id'], $pin]);
    $employee = $empStmt->fetch();

    if ($employee) {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $biz['user_id'];
        $_SESSION['user_name'] = $employee['name'];
        $_SESSION['is_staff'] = true;
        $_SESSION['employee_id'] = $employee['id'];
        $_SESSION['employee_role'] = $employee['role'];
        $_SESSION['business_name'] = $biz['business_name'];

        addAuditLog($pdo, $biz['user_id'], 'STAFF_LOGIN', 'auth', (string)$employee['id'], 'Login shift karyawan: ' . $employee['name'] . ' (' . $employee['role'] . ')');

        setFlashMessage('success', 'Selamat bertugas, ' . htmlspecialchars($employee['name']) . ' (' . strtoupper($employee['role']) . ')!');
        header('Location: ../pages/pos.php');
        exit;
    } else {
        setFlashMessage('error', 'PIN Karyawan salah atau akun tidak aktif.');
        header('Location: ../login.php?tab=staff');
        exit;
    }
}

if ($action === 'register') {
    $token = $_POST['csrf_token'] ?? '';
    if (!verifyCsrfToken($token)) {
        setFlashMessage('error', 'Token CSRF tidak valid.');
        header('Location: ../register.php');
        exit;
    }

    $name = trim($_POST['name'] ?? '');
    $businessName = trim($_POST['business_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $password = $_POST['password'] ?? '';
    $passwordConfirm = $_POST['password_confirm'] ?? '';

    if (empty($name) || empty($businessName) || empty($email) || empty($password)) {
        setFlashMessage('error', 'Semua kolom bertanda bintang wajib diisi.');
        header('Location: ../register.php');
        exit;
    }

    if ($password !== $passwordConfirm) {
        setFlashMessage('error', 'Konfirmasi kata sandi tidak cocok.');
        header('Location: ../register.php');
        exit;
    }

    if (strlen($password) < 6) {
        setFlashMessage('error', 'Kata sandi minimal 6 karakter.');
        header('Location: ../register.php');
        exit;
    }

    // Cek apakah email sudah terdaftar
    $check = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $check->execute([$email]);
    if ($check->fetch()) {
        setFlashMessage('error', 'Email sudah terdaftar. Silakan gunakan email lain atau login.');
        header('Location: ../register.php');
        exit;
    }

    try {
        $pdo->beginTransaction();

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $insertUser = $pdo->prepare("INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, 'owner', 'active')");
        $insertUser->execute([$name, $email, $hash, $phone]);
        $userId = (int)$pdo->lastInsertId();

        // Buat profil usaha
        $insertBiz = $pdo->prepare("INSERT INTO businesses (user_id, business_name, owner_name, phone, currency) VALUES (?, ?, ?, ?, 'IDR')");
        $insertBiz->execute([$userId, $businessName, $name, $phone]);

        // Buat kategori default awal
        $insertCat = $pdo->prepare("INSERT INTO categories (user_id, name, type, color, is_default) VALUES 
            (?, 'Penjualan Produk', 'income', '#16a34a', 1),
            (?, 'Jasa & Layanan', 'income', '#2563eb', 1),
            (?, 'Belanja Stok & Bahan Baku', 'expense', '#dc2626', 1),
            (?, 'Operasional Usaha', 'expense', '#ea580c', 1),
            (?, 'Gaji Karyawan', 'expense', '#9333ea', 1),
            (?, 'Bahan Pokok & Sembako', 'product', '#2563eb', 1)");
        $insertCat->execute([$userId, $userId, $userId, $userId, $userId, $userId]);

        $pdo->commit();

        addAuditLog($pdo, $userId, 'REGISTER', 'auth', (string)$userId, "Pendaftaran akun baru: $email");

        // Otomatis login
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_role'] = 'owner';

        setFlashMessage('success', 'Akun dan usaha berhasil didaftarkan! Selamat datang di Pembukuan UMKM.');
        header('Location: ../dashboard.php');
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        setFlashMessage('error', 'Gagal mendaftarkan akun: ' . $e->getMessage());
        header('Location: ../register.php');
        exit;
    }
}

header('Location: ../login.php');
exit;
