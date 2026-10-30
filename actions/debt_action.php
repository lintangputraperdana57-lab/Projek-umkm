<?php
/**
 * Action Handler: Manajemen Utang & Piutang Usaha
 * Pencatatan, Cicilan Pembayaran, dan Update Sisa Saldo
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
        header('Location: ../pages/debts.php');
        exit;
    }
}

// 1. Simpan Utang / Piutang Baru
if ($action === 'create') {
    $type = $_POST['type'] ?? 'receivable'; // 'payable' (utang) or 'receivable' (piutang)
    $contactName = trim($_POST['contact_name'] ?? '');
    $title = trim($_POST['title'] ?? '');
    $totalAmount = (float)($_POST['total_amount'] ?? 0);
    $startDate = $_POST['start_date'] ?? date('Y-m-d');
    $dueDate = $_POST['due_date'] ?? date('Y-m-d', strtotime('+14 days'));
    $notes = trim($_POST['notes'] ?? '');

    if (empty($contactName) || empty($title) || $totalAmount <= 0) {
        setFlashMessage('error', 'Nama pihak, judul utang/piutang, dan nominal wajib diisi.');
        header('Location: ../pages/debts.php');
        exit;
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO debts (user_id, type, contact_name, title, total_amount, paid_amount, remaining_amount, start_date, due_date, status, notes)
                               VALUES (?, ?, ?, ?, ?, 0.00, ?, ?, ?, 'unpaid', ?)");
        $stmt->execute([$userId, $type, $contactName, $title, $totalAmount, $totalAmount, $startDate, $dueDate, $notes]);
        $debtId = (int)$pdo->lastInsertId();

        $label = ($type === 'payable') ? 'Utang ke Pemasok' : 'Piutang Pelanggan';
        addAuditLog($pdo, $userId, 'CREATE_DEBT', 'debt', (string)$debtId, "Catat $label: $contactName - $title (" . formatRupiah($totalAmount) . ")");
        setFlashMessage('success', "$label berhasil dicatat ke sistem!");
    } catch (Exception $e) {
        setFlashMessage('error', 'Gagal mencatat utang/piutang: ' . $e->getMessage());
    }

    header('Location: ../pages/debts.php');
    exit;
}

// 2. Bayar Cicilan atau Pelunasan
if ($action === 'pay') {
    $debtId = (int)($_POST['debt_id'] ?? 0);
    $amount = (float)($_POST['amount'] ?? 0);
    $paymentDate = $_POST['payment_date'] ?? date('Y-m-d');
    $paymentMethod = $_POST['payment_method'] ?? 'cash';
    $notes = trim($_POST['notes'] ?? '');

    if ($amount <= 0) {
        setFlashMessage('error', 'Nominal pembayaran harus lebih besar dari 0.');
        header('Location: ../pages/debts.php');
        exit;
    }

    try {
        $pdo->beginTransaction();

        $dStmt = $pdo->prepare("SELECT * FROM debts WHERE id = ? AND user_id = ? FOR UPDATE");
        $dStmt->execute([$debtId, $userId]);
        $debt = $dStmt->fetch();

        if (!$debt) {
            throw new Exception("Data utang/piutang tidak ditemukan.");
        }

        if ($debt['status'] === 'paid') {
            throw new Exception("Utang/piutang ini sudah lunas sebelumnya.");
        }

        $newPaid = $debt['paid_amount'] + $amount;
        $newRemaining = max(0, $debt['total_amount'] - $newPaid);
        $newStatus = ($newRemaining <= 0) ? 'paid' : 'partial';

        // Update Tabel Debts
        $updateDebt = $pdo->prepare("UPDATE debts SET paid_amount = ?, remaining_amount = ?, status = ? WHERE id = ?");
        $updateDebt->execute([$newPaid, $newRemaining, $newStatus, $debtId]);

        // Simpan ke Riwayat Pembayaran
        $insPayment = $pdo->prepare("INSERT INTO debt_payments (debt_id, user_id, amount, payment_date, payment_method, notes)
                                     VALUES (?, ?, ?, ?, ?, ?)");
        $insPayment->execute([$debtId, $userId, $amount, $paymentDate, $paymentMethod, $notes]);

        // Masukkan ke buku kas:
        // Jika type 'receivable' (piutang dibayar pelanggan) -> uang masuk (income)
        // Jika type 'payable' (utang dibayar ke supplier) -> uang keluar (expense)
        $finType = ($debt['type'] === 'receivable') ? 'income' : 'expense';
        $finDesc = ($debt['type'] === 'receivable') ? "Penerimaan cicilan piutang: {$debt['contact_name']}" : "Pembayaran utang ke: {$debt['contact_name']}";
        $insFin = $pdo->prepare("INSERT INTO financial_records (user_id, type, amount, date, payment_method, description, is_operational)
                                 VALUES (?, ?, ?, ?, ?, ?, 1)");
        $insFin->execute([$userId, $finType, $amount, $paymentDate, $paymentMethod, $finDesc]);

        $pdo->commit();
        addAuditLog($pdo, $userId, 'PAY_DEBT', 'debt', (string)$debtId, "Pembayaran " . formatRupiah($amount) . " untuk {$debt['title']} ({$debt['contact_name']})");
        setFlashMessage('success', "Pembayaran sebesar " . formatRupiah($amount) . " berhasil dicatat. Status sekarang: " . strtoupper($newStatus));
    } catch (Exception $e) {
        $pdo->rollBack();
        setFlashMessage('error', 'Gagal memproses pembayaran: ' . $e->getMessage());
    }

    header('Location: ../pages/debts.php');
    exit;
}

// 3. Hapus Catatan Utang / Piutang
if ($action === 'delete') {
    $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
    $stmt = $pdo->prepare("DELETE FROM debts WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $userId]);

    addAuditLog($pdo, $userId, 'DELETE_DEBT', 'debt', (string)$id, "Menghapus catatan utang/piutang ID $id");
    setFlashMessage('success', 'Catatan utang/piutang berhasil dihapus.');
    header('Location: ../pages/debts.php');
    exit;
}

header('Location: ../pages/debts.php');
exit;
