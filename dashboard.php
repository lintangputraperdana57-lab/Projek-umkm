<?php
require_once __DIR__ . '/config/app.php';
require_once __DIR__ . '/helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];

// Filter Periode (default: bulan ini)
$period = $_GET['period'] ?? 'this_month';
$startDate = date('Y-m-01');
$endDate = date('Y-m-t');

if ($period === 'today') {
    $startDate = date('Y-m-d');
    $endDate = date('Y-m-d');
} elseif ($period === 'this_week') {
    $startDate = date('Y-m-d', strtotime('monday this week'));
    $endDate = date('Y-m-d', strtotime('sunday this week'));
} elseif ($period === 'this_year') {
    $startDate = date('Y-01-01');
    $endDate = date('Y-12-31');
}

// 1. Total Pemasukan Periode Ini
$stmtInc = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_records WHERE user_id = ? AND type = 'income' AND date BETWEEN ? AND ?");
$stmtInc->execute([$userId, $startDate, $endDate]);
$totalIncome = (float)$stmtInc->fetchColumn();

// 2. Total Pengeluaran Periode Ini
$stmtExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_records WHERE user_id = ? AND type = 'expense' AND date BETWEEN ? AND ?");
$stmtExp->execute([$userId, $startDate, $endDate]);
$totalExpense = (float)$stmtExp->fetchColumn();

// Laba Bersih
$netProfit = $totalIncome - $totalExpense;

// 3. Saldo Kas Kumulatif Keseluruhan
$stmtAllInc = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_records WHERE user_id = ? AND type = 'income'");
$stmtAllInc->execute([$userId]);
$allIncome = (float)$stmtAllInc->fetchColumn();

$stmtAllExp = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_records WHERE user_id = ? AND type = 'expense'");
$stmtAllExp->execute([$userId]);
$allExpense = (float)$stmtAllExp->fetchColumn();
$cashBalance = $allIncome - $allExpense;

// 4. Jumlah Transaksi Penjualan
$stmtTrx = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = ? AND date BETWEEN ? AND ?");
$stmtTrx->execute([$userId, $startDate, $endDate]);
$totalTransactions = (int)$stmtTrx->fetchColumn();

// 5. Total Utang (Payable) & Piutang (Receivable) Belum Lunas
$stmtDebt = $pdo->prepare("SELECT type, COALESCE(SUM(remaining_amount), 0) as total FROM debts WHERE user_id = ? AND status != 'paid' GROUP BY type");
$stmtDebt->execute([$userId]);
$debtsSummary = $stmtDebt->fetchAll(PDO::FETCH_KEY_PAIR);
$totalReceivable = (float)($debtsSummary['receivable'] ?? 0);
$totalPayable = (float)($debtsSummary['payable'] ?? 0);

// 6. Produk Stok Menipis (stok <= min_stock)
$stmtLowStock = $pdo->prepare("SELECT * FROM products WHERE user_id = ? AND stock <= min_stock AND status = 'active' ORDER BY stock ASC LIMIT 5");
$stmtLowStock->execute([$userId]);
$lowStockProducts = $stmtLowStock->fetchAll();

// 7. Transaksi Terbaru
$stmtRecent = $pdo->prepare("SELECT t.*, c.name as customer_name FROM transactions t LEFT JOIN customers c ON t.customer_id = c.id WHERE t.user_id = ? ORDER BY t.created_at DESC LIMIT 6");
$stmtRecent->execute([$userId]);
$recentTransactions = $stmtRecent->fetchAll();

// 8. Produk Terlaris
$stmtTopProducts = $pdo->prepare("SELECT ti.product_name, SUM(ti.quantity) as total_qty, SUM(ti.subtotal) as total_sales FROM transaction_items ti JOIN transactions t ON ti.transaction_id = t.id WHERE t.user_id = ? GROUP BY ti.product_name ORDER BY total_qty DESC LIMIT 5");
$stmtTopProducts->execute([$userId]);
$topProducts = $stmtTopProducts->fetchAll();

$pageTitle = 'Dashboard Ringkasan Bisnis';
$activePage = 'dashboard';
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/sidebar.php';
require_once __DIR__ . '/includes/navbar.php';
?>

<!-- Filter Periode -->
<div class="card" style="margin-bottom: 1.25rem;">
    <div class="card-body" style="padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
        <div>
            <span style="font-size: 0.825rem; color: var(--text-muted);">Periode Analisis:</span>
            <strong style="margin-left: 0.25rem;"><?= formatDateIndo($startDate) ?> s/d <?= formatDateIndo($endDate) ?></strong>
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <a href="dashboard.php?period=today" class="btn btn-sm <?= $period === 'today' ? 'btn-primary' : 'btn-secondary' ?>">Hari Ini</a>
            <a href="dashboard.php?period=this_week" class="btn btn-sm <?= $period === 'this_week' ? 'btn-primary' : 'btn-secondary' ?>">Minggu Ini</a>
            <a href="dashboard.php?period=this_month" class="btn btn-sm <?= $period === 'this_month' ? 'btn-primary' : 'btn-secondary' ?>">Bulan Ini</a>
            <a href="dashboard.php?period=this_year" class="btn btn-sm <?= $period === 'this_year' ? 'btn-primary' : 'btn-secondary' ?>">Tahun Ini</a>
        </div>
    </div>
</div>

<!-- Kartu Statistik Utama -->
<div class="stat-grid">
    <div class="stat-card">
        <div class="stat-card-header">
            <span class="stat-title">Saldo Kas Saat Ini</span>
            <div class="stat-icon" style="background: #eff6ff; color: #2563eb;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            </div>
        </div>
        <div class="stat-value" style="color: #1e3a8a;"><?= formatRupiah($cashBalance) ?></div>
        <div class="stat-meta">Total akumulasi kas & rekening</div>
    </div>

    <div class="stat-card">
        <div class="stat-card-header">
            <span class="stat-title">Total Pemasukan</span>
            <div class="stat-icon" style="background: #f0fdf4; color: #16a34a;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            </div>
        </div>
        <div class="stat-value" style="color: #16a34a;"><?= formatRupiah($totalIncome) ?></div>
        <div class="stat-meta"><?= $totalTransactions ?> transaksi penjualan</div>
    </div>

    <div class="stat-card">
        <div class="stat-card-header">
            <span class="stat-title">Total Pengeluaran</span>
            <div class="stat-icon" style="background: #fef2f2; color: #dc2626;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
            </div>
        </div>
        <div class="stat-value" style="color: #dc2626;"><?= formatRupiah($totalExpense) ?></div>
        <div class="stat-meta">Biaya stok & operasional</div>
    </div>

    <div class="stat-card">
        <div class="stat-card-header">
            <span class="stat-title">Laba Bersih Usaha</span>
            <div class="stat-icon" style="background: <?= $netProfit >= 0 ? '#f0fdf4' : '#fef2f2' ?>; color: <?= $netProfit >= 0 ? '#16a34a' : '#dc2626' ?>;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
            </div>
        </div>
        <div class="stat-value" style="color: <?= $netProfit >= 0 ? '#16a34a' : '#dc2626' ?>;"><?= formatRupiah($netProfit) ?></div>
        <div class="stat-meta"><?= $netProfit >= 0 ? 'Surplus Laba' : 'Defisit Pengeluaran' ?></div>
    </div>
</div>

<!-- Ringkasan Utang-Piutang & Peringatan Stok -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
    <!-- Utang Piutang -->
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Status Utang & Piutang Berjalan</h3>
            <a href="pages/debts.php" class="btn btn-sm btn-secondary">Kelola &rarr;</a>
        </div>
        <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem; background: var(--bg-body); border-radius: 8px; margin-bottom: 0.75rem;">
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Piutang Pelanggan (Belum Diterima)</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #2563eb;"><?= formatRupiah($totalReceivable) ?></div>
                </div>
                <span class="badge badge-info">Tagihan Masuk</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.85rem; background: var(--bg-body); border-radius: 8px;">
                <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Utang ke Pemasok (Harus Dibayar)</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: #dc2626;"><?= formatRupiah($totalPayable) ?></div>
                </div>
                <span class="badge badge-danger">Kewajiban</span>
            </div>
        </div>
    </div>

    <!-- Peringatan Stok Menipis -->
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Peringatan Stok Menipis</h3>
            <a href="pages/products.php" class="btn btn-sm btn-secondary">Semua Stok &rarr;</a>
        </div>
        <div class="card-body" style="padding: 0.75rem 1rem;">
            <?php if (empty($lowStockProducts)): ?>
                <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
                    Semua stok produk dalam kondisi aman di atas batas minimum.
                </div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Produk</th>
                                <th>Sisa Stok</th>
                                <th>Batas Min.</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($lowStockProducts as $p): ?>
                            <tr>
                                <td><strong><?= htmlspecialchars($p['name']) ?></strong><br><small style="color: var(--text-muted);"><?= htmlspecialchars($p['sku']) ?></small></td>
                                <td><span class="badge badge-danger"><?= $p['stock'] ?> <?= htmlspecialchars($p['unit']) ?></span></td>
                                <td><?= $p['min_stock'] ?> <?= htmlspecialchars($p['unit']) ?></td>
                                <td><a href="pages/products.php?action=edit&id=<?= $p['id'] ?>" class="btn btn-sm btn-secondary">Tambah</a></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Transaksi Terbaru & Produk Terlaris -->
<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem;">
    <!-- Transaksi Terbaru -->
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Transaksi Penjualan Terbaru</h3>
            <a href="pages/transactions.php" class="btn btn-sm btn-secondary">Lihat Semua &rarr;</a>
        </div>
        <div class="card-body" style="padding: 0;">
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>No. Transaksi</th>
                            <th>Tanggal</th>
                            <th>Pelanggan</th>
                            <th>Metode</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($recentTransactions)): ?>
                            <tr><td colspan="6" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Belum ada transaksi pada periode ini.</td></tr>
                        <?php else: ?>
                            <?php foreach ($recentTransactions as $t): ?>
                            <tr>
                                <td><a href="pages/receipt.php?id=<?= $t['id'] ?>" style="font-weight: 600; color: var(--accent-blue); text-decoration: none;"><?= htmlspecialchars($t['transaction_number']) ?></a></td>
                                <td><?= formatDateIndo($t['date']) ?></td>
                                <td><?= htmlspecialchars($t['customer_name'] ?? 'Pelanggan Umum') ?></td>
                                <td><span class="badge badge-navy"><?= strtoupper($t['payment_method']) ?></span></td>
                                <td><strong><?= formatRupiah($t['total_amount']) ?></strong></td>
                                <td>
                                    <?php if ($t['payment_status'] === 'paid'): ?>
                                        <span class="badge badge-success">Lunas</span>
                                    <?php else: ?>
                                        <span class="badge badge-warning">Tempo</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Produk Terlaris -->
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Produk Terlaris</h3>
        </div>
        <div class="card-body">
            <?php if (empty($topProducts)): ?>
                <div style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 1.5rem;">Belum ada data penjualan produk.</div>
            <?php else: ?>
                <?php foreach ($topProducts as $idx => $tp): ?>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0; border-bottom: 1px solid var(--border);">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span style="font-weight: 800; color: var(--accent-blue); width: 20px;">#<?= $idx + 1 ?></span>
                        <div>
                            <div style="font-weight: 600; font-size: 0.85rem;"><?= htmlspecialchars($tp['product_name']) ?></div>
                            <div style="font-size: 0.75rem; color: var(--text-muted);"><?= $tp['total_qty'] ?> terjual</div>
                        </div>
                    </div>
                    <div style="font-weight: 700; font-size: 0.85rem;"><?= formatRupiah($tp['total_sales']) ?></div>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
