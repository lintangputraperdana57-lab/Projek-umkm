<?php
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];
$csrfToken = generateCsrfToken();

// Simpan Pengaturan Profil Usaha
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_profile') {
    if (!verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        setFlashMessage('error', 'Token keamanan tidak valid.');
        header('Location: settings.php');
        exit;
    }

    $bizName = trim($_POST['business_name'] ?? '');
    $ownerName = trim($_POST['owner_name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $monthlyTarget = (float)($_POST['monthly_profit_target'] ?? 10000000);
    $footerNote = trim($_POST['receipt_footer_note'] ?? '');

    $upd = $pdo->prepare("UPDATE businesses SET business_name = ?, owner_name = ?, phone = ?, address = ?, monthly_profit_target = ?, receipt_footer_note = ? WHERE user_id = ?");
    $upd->execute([$bizName, $ownerName, $phone, $address, $monthlyTarget, $footerNote, $userId]);

    // Update nama user di tabel users dan sesi
    $pdo->prepare("UPDATE users SET name = ? WHERE id = ?")->execute([$ownerName, $userId]);
    $_SESSION['user_name'] = $ownerName;

    addAuditLog($pdo, $userId, 'UPDATE_PROFILE', 'business', (string)$userId, 'Memperbarui profil usaha & target laba');
    setFlashMessage('success', 'Profil usaha berhasil diperbarui!');
    header('Location: settings.php');
    exit;
}

// Download Backup Database
if (isset($_GET['download_backup']) && $_GET['download_backup'] == '1') {
    $driver = Database::getDriver();
    if ($driver === 'sqlite') {
        $file = STORAGE_PATH . '/database.sqlite';
        if (file_exists($file)) {
            header('Content-Type: application/x-sqlite3');
            header('Content-Disposition: attachment; filename="umkm_pro_backup_' . date('Ymd_His') . '.sqlite"');
            readfile($file);
            exit;
        }
    } else {
        // Ekspor SQL struktur
        header('Content-Type: application/sql');
        header('Content-Disposition: attachment; filename="umkm_pro_backup_' . date('Ymd_His') . '.sql"');
        readfile(ROOT_PATH . '/database/database.sql');
        exit;
    }
}

// Ambil Profil Usaha
$bStmt = $pdo->prepare("SELECT * FROM businesses WHERE user_id = ? LIMIT 1");
$bStmt->execute([$userId]);
$business = $bStmt->fetch();

// Ambil Audit Logs Terbaru
$aStmt = $pdo->prepare("SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10");
$aStmt->execute([$userId]);
$auditLogs = $aStmt->fetchAll();

$pageTitle = 'Pengaturan Usaha & Keamanan';
$activePage = 'settings';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<div style="margin-bottom: 1.25rem;">
    <h2 style="font-size: 1.2rem; font-weight: 800; margin: 0;">Pengaturan Sistem & Profil Bisnis</h2>
    <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Konfigurasi identitas usaha, catatan struk, cadangan database, dan log audit</p>
</div>

<div style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 1.25rem; align-items: start;">

    <!-- Form Profil Usaha -->
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Profil Usaha & Informasi Nota</h3>
        </div>
        <div class="card-body">
            <form action="settings.php" method="POST">
                <input type="hidden" name="action" value="update_profile">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">

                <div class="form-group">
                    <label class="form-label">Nama Usaha / Toko *</label>
                    <input type="text" name="business_name" class="form-control" value="<?= htmlspecialchars($business['business_name'] ?? '') ?>" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="form-group">
                        <label class="form-label">Nama Pemilik *</label>
                        <input type="text" name="owner_name" class="form-control" value="<?= htmlspecialchars($business['owner_name'] ?? $user['name']) ?>" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">No. Telepon / WhatsApp</label>
                        <input type="text" name="phone" class="form-control" value="<?= htmlspecialchars($business['phone'] ?? '') ?>">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Alamat Lengkap Usaha</label>
                    <textarea name="address" class="form-control" rows="2"><?= htmlspecialchars($business['address'] ?? '') ?></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">Target Laba Bersih Bulanan (Rp)</label>
                    <input type="number" name="monthly_profit_target" class="form-control" value="<?= (int)($business['monthly_profit_target'] ?? 15000000) ?>" min="0" step="500000">
                    <small style="color: var(--text-muted);">Digunakan untuk mengukur target indikator kinerja bulanan.</small>
                </div>

                <div class="form-group">
                    <label class="form-label">Pesan Footer Struk Nota</label>
                    <input type="text" name="receipt_footer_note" class="form-control" value="<?= htmlspecialchars($business['receipt_footer_note'] ?? 'Terima kasih atas kunjungan & kepercayaan Anda!') ?>">
                </div>

                <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">
                    Simpan Perubahan Profil
                </button>
            </form>
        </div>
    </div>

    <!-- Kolom Kanan: Backup Data & Audit Log -->
    <div>
        <!-- Backup Card -->
        <div class="card" style="margin-bottom: 1.25rem;">
            <div class="card-header">
                <h3 class="card-title">Cadangan Data (Backup)</h3>
            </div>
            <div class="card-body">
                <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 1rem;">
                    Amankan seluruh catatan keuangan, transaksi, dan stok usaha Anda. Unduh salinan database kapan pun untuk arsip.
                </p>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                    Driver Aktif: <strong><?= strtoupper(Database::getDriver()) ?></strong>
                </div>
                <a href="settings.php?download_backup=1" class="btn btn-navy" style="width: 100%;">
                    Unduh File Cadangan Database &darr;
                </a>
            </div>
        </div>

        <!-- Audit Log Ringkas -->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Log Audit Aktivitas Terbaru</h3>
            </div>
            <div class="card-body" style="padding: 0;">
                <div style="max-height: 320px; overflow-y: auto;">
                    <?php if (empty($auditLogs)): ?>
                        <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.8rem;">Belum ada catatan aktivitas.</div>
                    <?php else: ?>
                        <?php foreach ($auditLogs as $log): ?>
                        <div style="padding: 0.65rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.78rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                <span class="badge badge-navy" style="font-size: 0.65rem;"><?= htmlspecialchars($log['action']) ?></span>
                                <span style="color: var(--text-muted); font-size: 0.7rem;"><?= date('d/m/y H:i', strtotime($log['created_at'])) ?></span>
                            </div>
                            <div style="color: var(--text-main); font-weight: 500;"><?= htmlspecialchars($log['description']) ?></div>
                        </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
