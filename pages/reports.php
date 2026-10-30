<?php
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];

// Filter Tanggal
$startDate = $_GET['start_date'] ?? date('Y-m-01');
$endDate = $_GET['end_date'] ?? date('Y-m-d');
$reportType = $_GET['report_type'] ?? 'profit_loss'; // 'profit_loss', 'sales', 'cashflow', 'inventory'

// Ekspor CSV jika diminta
if (isset($_GET['export_csv']) && $_GET['export_csv'] == '1') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=Laporan_UMKM_Pro_' . date('Ymd_His') . '.csv');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['Laporan Pembukuan UMKM']);
    fputcsv($output, ['Periode', $startDate . ' s/d ' . $endDate]);
    fputcsv($output, []);

    if ($reportType === 'profit_loss') {
        // Data Laba Rugi
        $sStmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount), 0) as omzet, COALESCE(SUM(total_cost), 0) as hpp FROM transactions WHERE user_id = ? AND status != 'cancelled' AND date BETWEEN ? AND ?");
        $sStmt->execute([$userId, $startDate, $endDate]);
        $sData = $sStmt->fetch();
        $omzet = (float)$sData['omzet'];
        $hpp = (float)$sData['hpp'];
        $grossProfit = $omzet - $hpp;

        $eStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_records WHERE user_id = ? AND type = 'expense' AND date BETWEEN ? AND ?");
        $eStmt->execute([$userId, $startDate, $endDate]);
        $opex = (float)$eStmt->fetchColumn();
        $net = $grossProfit - $opex;

        fputcsv($output, ['Komponen Laba Rugi', 'Nominal (Rp)']);
        fputcsv($output, ['Pendapatan Penjualan (Omzet)', $omzet]);
        fputcsv($output, ['Harga Pokok Penjualan (HPP)', $hpp]);
        fputcsv($output, ['Laba Kotor (Gross Profit)', $grossProfit]);
        fputcsv($output, ['Beban Operasional Usaha', $opex]);
        fputcsv($output, ['LABA BERSIH (NET PROFIT)', $net]);
    } else {
        // Ekspor Transaksi
        $txStmt = $pdo->prepare("SELECT transaction_number, date, total_amount, payment_method, payment_status FROM transactions WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC");
        $txStmt->execute([$userId, $startDate, $endDate]);
        fputcsv($output, ['No Faktur', 'Tanggal', 'Total (Rp)', 'Metode', 'Status']);
        while ($row = $txStmt->fetch()) {
            fputcsv($output, [$row['transaction_number'], $row['date'], $row['total_amount'], $row['payment_method'], $row['payment_status']]);
        }
    }
    fclose($output);
    exit;
}

// 1. Data Laporan Laba Rugi
$sStmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount), 0) as omzet, COALESCE(SUM(total_cost), 0) as hpp FROM transactions WHERE user_id = ? AND status != 'cancelled' AND date BETWEEN ? AND ?");
$sStmt->execute([$userId, $startDate, $endDate]);
$salesSummary = $sStmt->fetch();
$totalOmzet = (float)$salesSummary['omzet'];
$totalHpp = (float)$salesSummary['hpp'];
$grossProfit = $totalOmzet - $totalHpp;

// Beban Operasional dari buku kas
$opStmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM financial_records WHERE user_id = ? AND type = 'expense' AND is_operational = 1 AND date BETWEEN ? AND ?");
$opStmt->execute([$userId, $startDate, $endDate]);
$operationalExpense = (float)$opStmt->fetchColumn();

$netIncome = $grossProfit - $operationalExpense;

// Rincian Beban per Kategori
$catExpStmt = $pdo->prepare("SELECT c.name, COALESCE(SUM(f.amount), 0) as total FROM financial_records f LEFT JOIN categories c ON f.category_id = c.id WHERE f.user_id = ? AND f.type = 'expense' AND f.date BETWEEN ? AND ? GROUP BY c.name ORDER BY total DESC");
$catExpStmt->execute([$userId, $startDate, $endDate]);
$expenseBreakdown = $catExpStmt->fetchAll();

// 2. Data Nilai Persediaan Stok
$invStmt = $pdo->prepare("SELECT COUNT(*) as total_items, SUM(stock) as total_qty, SUM(stock * cost_price) as asset_cost, SUM(stock * selling_price) as asset_sales FROM products WHERE user_id = ? AND status = 'active'");
$invStmt->execute([$userId]);
$inventory = $invStmt->fetch();

$pageTitle = 'Laporan Keuangan & Laba Rugi';
$activePage = 'reports';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
    <div>
        <h2 style="font-size: 1.2rem; font-weight: 800; margin: 0;">Laporan Akuntansi & Analisis Usaha</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Kalkulasi Laba/Rugi aktual, HPP, beban operasional, dan nilai aset persediaan</p>
    </div>
    <div style="display: flex; gap: 0.5rem;">
        <a href="reports.php?start_date=<?= $startDate ?>&end_date=<?= $endDate ?>&report_type=<?= $reportType ?>&export_csv=1" class="btn btn-sm btn-navy">
            Ekspor CSV
        </a>
        <button onclick="window.print()" class="btn btn-sm btn-secondary">
            Cetak Laporan
        </button>
    </div>
</div>

<!-- Filter Bar -->
<div class="card" style="margin-bottom: 1.25rem;">
    <div class="card-body" style="padding: 1rem 1.25rem;">
        <form method="GET" action="reports.php" style="display: grid; grid-template-columns: 1.5fr 1fr 1fr auto auto; gap: 0.75rem; align-items: center;">
            <select name="report_type" class="form-select">
                <option value="profit_loss" <?= $reportType === 'profit_loss' ? 'selected' : '' ?>>Laporan Laba Rugi (Komprehensif)</option>
                <option value="cashflow" <?= $reportType === 'cashflow' ? 'selected' : '' ?>>Laporan Aliran Arus Kas</option>
            </select>
            <input type="date" name="start_date" value="<?= htmlspecialchars($startDate) ?>" class="form-control" title="Dari Tanggal">
            <input type="date" name="end_date" value="<?= htmlspecialchars($endDate) ?>" class="form-control" title="Sampai Tanggal">
            <button type="submit" class="btn btn-navy btn-sm">Tampilkan</button>
            <?php if ($startDate !== date('Y-m-01') || $endDate !== date('Y-m-d')): ?>
                <a href="reports.php" class="btn btn-secondary btn-sm">Bulan Ini</a>
            <?php endif; ?>
        </form>
    </div>
</div>

<!-- LAPORAN LABA RUGI FORMAL -->
<div class="card">
    <div class="card-header" style="text-align: center; display: block; border-bottom: 2px solid var(--border);">
        <h3 style="font-size: 1.2rem; font-weight: 800; margin: 0;">LAPORAN LABA RUGI (INCOME STATEMENT)</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin: 4px 0 0;">
            Periode: <?= formatDateIndo($startDate) ?> s/d <?= formatDateIndo($endDate) ?>
        </p>
    </div>
    <div class="card-body">
        
        <!-- BAGIAN 1: PENDAPATAN & HPP -->
        <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e3a8a; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; margin-bottom: 0.75rem;">
                I. PENDAPATAN USAHA (REVENUE)
            </h4>
            <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; font-size: 0.9rem;">
                <span>Total Penjualan Barang & Layanan (Gross Sales)</span>
                <strong><?= formatRupiah($totalOmzet) ?></strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; font-size: 0.9rem; color: #dc2626;">
                <span>Harga Pokok Penjualan (HPP / Biaya Modal Barang)</span>
                <strong>- <?= formatRupiah($totalHpp) ?></strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.6rem 0; border-top: 1px solid var(--border); font-size: 1rem; font-weight: 700; color: #16a34a; background: #f0fdf4; padding-left: 0.5rem; padding-right: 0.5rem; border-radius: 6px; margin-top: 0.4rem;">
                <span>LABA KOTOR (GROSS PROFIT)</span>
                <span><?= formatRupiah($grossProfit) ?></span>
            </div>
        </div>

        <!-- BAGIAN 2: BEBAN OPERASIONAL -->
        <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e3a8a; border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; margin-bottom: 0.75rem;">
                II. BEBAN OPERASIONAL (OPERATIONAL EXPENSES)
            </h4>
            <?php if (empty($expenseBreakdown)): ?>
                <div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem 0;">Tidak ada catatan beban operasional pada periode ini.</div>
            <?php else: ?>
                <?php foreach ($expenseBreakdown as $eb): ?>
                <div style="display: flex; justify-content: space-between; padding: 0.4rem 0; font-size: 0.9rem;">
                    <span><?= htmlspecialchars($eb['name'] ?? 'Beban Operasional Umum') ?></span>
                    <span><?= formatRupiah($eb['total']) ?></span>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
            <div style="display: flex; justify-content: space-between; padding: 0.6rem 0; border-top: 1px solid var(--border); font-size: 0.95rem; font-weight: 700; color: #dc2626; margin-top: 0.4rem;">
                <span>TOTAL BEBAN OPERASIONAL</span>
                <span><?= formatRupiah($operationalExpense) ?></span>
            </div>
        </div>

        <!-- BAGIAN 3: LABA BERSIH AKHIR -->
        <div style="border-top: 2px solid #0f172a; padding-top: 1rem; margin-top: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: <?= $netIncome >= 0 ? '#eff6ff' : '#fef2f2' ?>; border-radius: 10px; border: 1px solid <?= $netIncome >= 0 ? '#bfdbfe' : '#fecaca' ?>;">
                <div>
                    <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
                        HASIL LABA BERSIH USAHA (NET PROFIT)
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                        Laba Kotor dikurangi Total Beban Operasional
                    </div>
                </div>
                <div style="font-size: 1.6rem; font-weight: 800; color: <?= $netIncome >= 0 ? '#1e3a8a' : '#dc2626' ?>;">
                    <?= formatRupiah($netIncome) ?>
                </div>
            </div>
        </div>

    </div>
</div>

<!-- NILAI ASET PERSEDIAAN STOK -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Valuasi Aset Persediaan Barang Saat Ini</h3>
    </div>
    <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div style="padding: 1rem; background: var(--bg-body); border-radius: 8px;">
                <div style="font-size: 0.75rem; color: var(--text-muted);">Total Ragam Produk</div>
                <div style="font-size: 1.25rem; font-weight: 800;"><?= $inventory['total_items'] ?? 0 ?> Jenis</div>
            </div>
            <div style="padding: 1rem; background: var(--bg-body); border-radius: 8px;">
                <div style="font-size: 0.75rem; color: var(--text-muted);">Total Fisik Persediaan</div>
                <div style="font-size: 1.25rem; font-weight: 800;"><?= $inventory['total_qty'] ?? 0 ?> Item</div>
            </div>
            <div style="padding: 1rem; background: var(--bg-body); border-radius: 8px;">
                <div style="font-size: 0.75rem; color: var(--text-muted);">Nilai Modal Stok (HPP)</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #2563eb;"><?= formatRupiah($inventory['asset_cost'] ?? 0) ?></div>
            </div>
            <div style="padding: 1rem; background: var(--bg-body); border-radius: 8px;">
                <div style="font-size: 0.75rem; color: var(--text-muted);">Potensi Omzet Penjualan</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #16a34a;"><?= formatRupiah($inventory['asset_sales'] ?? 0) ?></div>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
