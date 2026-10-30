<?php
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];

// Filter
$search = trim($_GET['search'] ?? '');
$startDate = $_GET['start_date'] ?? date('Y-m-01');
$endDate = $_GET['end_date'] ?? date('Y-m-d');
$paymentStatus = $_GET['payment_status'] ?? '';

$query = "SELECT t.*, c.name as customer_name FROM transactions t LEFT JOIN customers c ON t.customer_id = c.id WHERE t.user_id = ? AND t.date BETWEEN ? AND ?";
$params = [$userId, $startDate, $endDate];

if (!empty($search)) {
    $query .= " AND (t.transaction_number LIKE ? OR c.name LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if (!empty($paymentStatus)) {
    $query .= " AND t.payment_status = ?";
    $params[] = $paymentStatus;
}

$query .= " ORDER BY t.created_at DESC";
$stmt = $pdo->prepare($query);
$stmt->execute($params);
$transactions = $stmt->fetchAll();

// Total Summary
$totalSum = 0;
foreach ($transactions as $t) {
    if ($t['status'] !== 'cancelled') {
        $totalSum += $t['total_amount'];
    }
}

$pageTitle = 'Riwayat Transaksi Penjualan';
$activePage = 'transactions';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
    <div>
        <h2 style="font-size: 1.2rem; font-weight: 800; margin: 0;">Riwayat Penjualan & Faktur</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Daftar transaksi, cetak ulang nota, dan kontrol pembatalan</p>
    </div>
    <div style="display: flex; gap: 0.5rem;">
        <a href="pos.php" class="btn btn-primary btn-sm">+ Transaksi Baru</a>
    </div>
</div>

<!-- Filter Bar -->
<div class="card" style="margin-bottom: 1.25rem;">
    <div class="card-body" style="padding: 1rem 1.25rem;">
        <form method="GET" action="transactions.php" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1.2fr auto auto; gap: 0.75rem; align-items: center;">
            <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="No. Transaksi / Pelanggan..." class="form-control">
            <input type="date" name="start_date" value="<?= htmlspecialchars($startDate) ?>" class="form-control" title="Dari Tanggal">
            <input type="date" name="end_date" value="<?= htmlspecialchars($endDate) ?>" class="form-control" title="Sampai Tanggal">
            <select name="payment_status" class="form-select">
                <option value="">Semua Status</option>
                <option value="paid" <?= $paymentStatus === 'paid' ? 'selected' : '' ?>>Lunas</option>
                <option value="unpaid" <?= $paymentStatus === 'unpaid' ? 'selected' : '' ?>>Belum Lunas (Tempo)</option>
            </select>
            <button type="submit" class="btn btn-navy btn-sm">Filter</button>
            <?php if (!empty($search) || !empty($paymentStatus)): ?>
                <a href="transactions.php" class="btn btn-secondary btn-sm">Reset</a>
            <?php endif; ?>
        </form>
    </div>
</div>

<!-- Tabel Transaksi -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Daftar Transaksi (<?= count($transactions) ?> Nota)</h3>
        <span style="font-size: 0.9rem; font-weight: 700; color: #16a34a;">
            Total Terfilter: <?= formatRupiah($totalSum) ?>
        </span>
    </div>
    <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>No. Faktur</th>
                        <th>Tanggal</th>
                        <th>Pelanggan</th>
                        <th>Metode Bayar</th>
                        <th>Diskon</th>
                        <th>Total Tagihan</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($transactions)): ?>
                        <tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">Tidak ada transaksi yang cocok dengan kriteria filter.</td></tr>
                    <?php else: ?>
                        <?php foreach ($transactions as $t): 
                            $isCancelled = $t['status'] === 'cancelled';
                        ?>
                        <tr style="<?= $isCancelled ? 'opacity: 0.5; text-decoration: line-through;' : '' ?>">
                            <td>
                                <strong style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--accent-blue);">
                                    <?= htmlspecialchars($t['transaction_number']) ?>
                                </strong>
                            </td>
                            <td><?= formatDateIndo($t['date']) ?></td>
                            <td><?= htmlspecialchars($t['customer_name'] ?? 'Pelanggan Umum') ?></td>
                            <td><span class="badge badge-navy"><?= strtoupper($t['payment_method']) ?></span></td>
                            <td><?= $t['discount'] > 0 ? '-' . formatRupiah($t['discount']) : '-' ?></td>
                            <td><strong style="color: #1e3a8a;"><?= formatRupiah($t['total_amount']) ?></strong></td>
                            <td>
                                <?php if ($isCancelled): ?>
                                    <span class="badge badge-danger">Dibatalkan</span>
                                <?php elseif ($t['payment_status'] === 'paid'): ?>
                                    <span class="badge badge-success">Lunas</span>
                                <?php else: ?>
                                    <span class="badge badge-warning">Tempo</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div style="display: flex; gap: 0.35rem;">
                                    <a href="receipt.php?id=<?= $t['id'] ?>" class="btn btn-sm btn-secondary" title="Cetak Nota">
                                        Struk
                                    </a>
                                    <?php if (!$isCancelled): ?>
                                    <a href="../actions/transaction_action.php?action=cancel&id=<?= $t['id'] ?>" onclick="return confirmDelete('Batalkan transaksi <?= $t['transaction_number'] ?>? Stok barang akan dikembalikan otomatis.')" class="btn btn-sm btn-danger" style="padding: 0.25rem 0.5rem;" title="Batalkan Transaksi">
                                        Batal
                                    </a>
                                    <?php endif; ?>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
