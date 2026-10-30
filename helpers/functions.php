<?php
/**
 * Helper Functions - Pembukuan UMKM
 * Keamanan, Format Data, dan Utilitas
 */

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';

// Cek status autentikasi
function isLoggedIn(): bool {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

// Dapatkan data user yang sedang login
function currentUser(): ?array {
    if (!isLoggedIn()) {
        return null;
    }
    return [
        'id' => $_SESSION['user_id'],
        'name' => $_SESSION['user_name'] ?? 'Pengguna',
        'email' => $_SESSION['user_email'] ?? '',
        'role' => $_SESSION['user_role'] ?? 'owner',
    ];
}

// Proteksi halaman (guard)
function requireAuth(string $redirect = 'login.php'): void {
    if (!isLoggedIn()) {
        setFlashMessage('error', 'Silakan login terlebih dahulu untuk mengakses sistem.');
        header("Location: $redirect");
        exit;
    }
}

// Proteksi hak akses role
function requireRole(array $allowedRoles): void {
    requireAuth();
    $role = $_SESSION['user_role'] ?? '';
    if (!in_array($role, $allowedRoles)) {
        setFlashMessage('error', 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.');
        header('Location: dashboard.php');
        exit;
    }
}

// CSRF Protection
function generateCsrfToken(): string {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrfToken(?string $token): bool {
    if (empty($token) || empty($_SESSION['csrf_token'])) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

// Flash Messages
function setFlashMessage(string $type, string $message): void {
    $_SESSION['flash_message'] = [
        'type' => $type, // 'success', 'error', 'warning', 'info'
        'message' => $message,
    ];
}

function getFlashMessage(): ?array {
    if (isset($_SESSION['flash_message'])) {
        $flash = $_SESSION['flash_message'];
        unset($_SESSION['flash_message']);
        return $flash;
    }
    return null;
}

// Format Rupiah
function formatRupiah(float|int|string|null $amount, bool $withSymbol = true): string {
    $num = (float)($amount ?? 0);
    $formatted = number_format($num, 0, ',', '.');
    return $withSymbol ? 'Rp ' . $formatted : $formatted;
}

// Format Tanggal Indonesia (contoh: 29 Oktober 2026)
function formatDateIndo(string $date, bool $withDay = false): string {
    if (empty($date)) return '-';
    $timestamp = strtotime($date);
    if (!$timestamp) return $date;

    $months = [
        1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    $days = [
        'Sunday' => 'Minggu', 'Monday' => 'Senin', 'Tuesday' => 'Selasa',
        'Wednesday' => 'Rabu', 'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu'
    ];

    $d = date('j', $timestamp);
    $m = $months[(int)date('n', $timestamp)];
    $y = date('Y', $timestamp);

    if ($withDay) {
        $dayName = $days[date('l', $timestamp)] ?? '';
        return "$dayName, $d $m $y";
    }
    return "$d $m $y";
}

// Sanitasi Input
function sanitize(mixed $data): mixed {
    if (is_array($data)) {
        return array_map('sanitize', $data);
    }
    return htmlspecialchars(trim((string)$data), ENT_QUOTES, 'UTF-8');
}

// Audit Log Helper
function addAuditLog(PDO $pdo, int $userId, string $action, string $entityType, ?string $entityId, string $description): void {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description, ip_address, created_at)
                               VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$userId, $action, $entityType, $entityId, $description, $ip]);
    } catch (Exception $e) {
        error_log("Gagal menulis audit log: " . $e->getMessage());
    }
}

// Generate Nomor Transaksi Otomatis (TRX-YYYYMM-XXXX)
function generateTransactionNumber(PDO $pdo, int $userId, string $type = 'sale'): string {
    $prefix = ($type === 'sale') ? 'TRX' : 'BUY';
    $yearMonth = date('Ym');
    $pattern = "$prefix-$yearMonth-%";

    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM transactions WHERE user_id = ? AND transaction_number LIKE ?");
    $stmt->execute([$userId, $pattern]);
    $count = (int)$stmt->fetchColumn() + 1;

    return sprintf("%s-%s-%04d", $prefix, $yearMonth, $count);
}

// JSON Output Helper
function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}
