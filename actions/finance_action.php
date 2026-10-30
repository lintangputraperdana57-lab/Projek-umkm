<?php
/**
 * Action Handler: Pencatatan Keuangan, Mutasi Kas, & Biaya Operasional
 */

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        setFlashMessage('error', 'Token keamanan CSRF tidak valid.');
        header('Location: ../pages/finances.php');
        exit;
    }
}

// 1. Simpan Catatan Keuangan Baru
if ($action === 'create') {
    $type = $_POST['type'] ?? 'expense'; // 'income' or 'expense'
    $categoryId = !empty($_POST['category_id']) ? (int)$_POST['category_id'] : null;
    $amount = (float)($_POST['amount'] ?? 0);
    $date = $_POST['date'] ?? date('Y-m-d');
    $paymentMethod = $_POST['payment_method'] ?? 'cash';
    $accountName = trim($_POST['account_name'] ?? 'Kas Utama');
    $description = trim($_POST['description'] ?? '');
    $notes = trim($_POST['notes'] ?? '');
    $isOperational = isset($_POST['is_operational']) ? 1 : 0;

    if ($amount <= 0 || empty($description)) {
        setFlashMessage('error', 'Nominal harus lebih dari 0 dan keterangan wajib diisi.');
        header('Location: ../pages/finances.php');
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO financial_records (user_id, category_id, type, amount, date, payment_method, account_name, description, notes, is_operational)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $categoryId, $type, $amount, $date, $paymentMethod, $accountName, $description, $notes, $isOperational]);
        $recordId = (int)$pdo->lastInsertId();

        $label = ($type === 'income') ? 'Pemasukan' : 'Pengeluaran';
        addAuditLog($pdo, $userId, 'CREATE_FINANCE', 'finance', (string)$recordId, "Pencatatan $label: $description sebesar " . formatRupiah($amount));
        setFlashMessage('success', "Catatan $label berhasil disimpan ke buku kas!");
    } catch (Exception $e) {
        setFlashMessage('error', 'Gagal menyimpan catatan: ' . $e->getMessage());
    }

    header('Location: ../pages/finances.php');
    exit;
}

// 2. Hapus Catatan Keuangan
if ($action === 'delete') {
    $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
    $stmt = $pdo->prepare("DELETE FROM financial_records WHERE id = ? AND user_id = ? AND transaction_id IS NULL");
    $stmt->execute([$id, $userId]);

    addAuditLog($pdo, $userId, 'DELETE_FINANCE', 'finance', (string)$id, "Menghapus catatan keuangan ID $id");
    setFlashMessage('success', 'Catatan keuangan berhasil dihapus.');
    header('Location: ../pages/finances.php');
    exit;
}

header('Location: ../pages/finances.php');
exit;
