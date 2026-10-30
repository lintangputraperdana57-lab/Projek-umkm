<?php
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];
$csrfToken = generateCsrfToken();

// Filter
$type = $_GET['type'] ?? '';
$startDate = $_GET['start_date'] ?? date('Y-m-01');
$endDate = $_GET['end_date'] ?? date('Y-m-d');

$query = "SELECT f.*, c.name as category_name FROM financial_records f LEFT JOIN categories c ON f.category_id = c.id WHERE f.user_id = ? AND f.date BETWEEN ? AND ?";
$params = [$userId, $startDate, $endDate];

if (!empty($type)) {
    $query .= " AND f.type = ?";
    $params[] = $type;
}

$query .= " ORDER BY f.date DESC, f.id DESC";
$stmt = $pdo->prepare($query);
$stmt->execute($params);
$records = $stmt->fetchAll();

// Hitung total ringkasan terfilter
$totalInc = 0;
$totalExp = 0;
foreach ($records as $r) {
    if ($r['type'] === 'income') {
        $totalInc += (float)$r['amount'];
    } else {
        $totalExp += (float)$r['amount'];
    }
}
$diff = $totalInc - $totalExp;

// Ambil kategori income & expense
$cStmt = $pdo->prepare("SELECT * FROM categories WHERE user_id = ? AND type IN ('income', 'expense') ORDER BY type ASC, name ASC");
$cStmt->execute([$userId]);
$categories = $cStmt->fetchAll();

$pageTitle = 'Buku Kas & Catatan Keuangan';
$activePage = 'finances';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
    <div>
        <h2 style="font-size: 1.2rem; font-weight: 800; margin: 0;">Buku Kas, Mutasi & Biaya</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Pencatatan arus kas operasional, belanja perlengkapan, modal usaha, dan gaji</p>
    </div>
    <div style="display: flex; gap: 0.5rem;">
        <button onclick="openFinanceModal('expense')" class="btn btn-sm btn-danger">+ Catat Pengeluaran</button>
        <button onclick="openFinanceModal('income')" class="btn btn-sm btn-primary">+ Catat Pemasukan</button>
    </div>
</div>

<!-- Ringkasan Filter Card -->
<div class="stat-grid" style="margin-bottom: 1.25rem;">
    <div class="stat-card">
        <span class="stat-title">Pemasukan Kas (Periode)</span>
        <div class="stat-value" style="color: #16a34a;"><?= formatRupiah($totalInc) ?></div>
        <div class="stat-meta">Arus kas masuk terverifikasi</div>
    </div>
    <div class="stat-card">
        <span class="stat-title">Pengeluaran Biaya (Periode)</span>
        <div class="stat-value" style="color: #dc2626;"><?= formatRupiah($totalExp) ?></div>
        <div class="stat-meta">Operasional & belanja stok</div>
    </div>
    <div class="stat-card">
        <span class="stat-title">Surplus / Defisit Kas</span>
        <div class="stat-value" style="color: <?= $diff >= 0 ? '#1e3a8a' : '#dc2626' ?>;"><?= formatRupiah($diff) ?></div>
        <div class="stat-meta"><?= $diff >= 0 ? 'Arus kas surplus' : 'Arus kas defisit' ?></div>
    </div>
</div>

<!-- Filter Bar -->
<div class="card" style="margin-bottom: 1.25rem;">
    <div class="card-body" style="padding: 1rem 1.25rem;">
        <form method="GET" action="finances.php" style="display: grid; grid-template-columns: 1.5fr 1fr 1fr auto auto; gap: 0.75rem; align-items: center;">
            <select name="type" class="form-select">
                <option value="">Semua Aliran Kas (Pemasukan & Pengeluaran)</option>
                <option value="income" <?= $type === 'income' ? 'selected' : '' ?>>Hanya Pemasukan</option>
                <option value="expense" <?= $type === 'expense' ? 'selected' : '' ?>>Hanya Pengeluaran</option>
            </select>
            <input type="date" name="start_date" value="<?= htmlspecialchars($startDate) ?>" class="form-control" title="Dari Tanggal">
            <input type="date" name="end_date" value="<?= htmlspecialchars($endDate) ?>" class="form-control" title="Sampai Tanggal">
            <button type="submit" class="btn btn-navy btn-sm">Filter</button>
            <?php if (!empty($type) || $startDate !== date('Y-m-01')): ?>
                <a href="finances.php" class="btn btn-secondary btn-sm">Reset</a>
            <?php endif; ?>
        </form>
    </div>
</div>

<!-- Tabel Catatan Keuangan -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Mutasi Kas (<?= count($records) ?> Catatan)</h3>
    </div>
    <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Kategori</th>
                        <th>Keterangan Transaksi</th>
                        <th>Akun / Dompet</th>
                        <th>Metode</th>
                        <th>Nominal</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($records)): ?>
                        <tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada catatan keuangan untuk filter ini.</td></tr>
                    <?php else: ?>
                        <?php foreach ($records as $r): 
                            $isInc = $r['type'] === 'income';
                        ?>
                        <tr>
                            <td><?= formatDateIndo($r['date']) ?></td>
                            <td><span class="badge <?= $isInc ? 'badge-success' : 'badge-danger' ?>"><?= htmlspecialchars($r['category_name'] ?? ($isInc ? 'Pemasukan' : 'Pengeluaran')) ?></span></td>
                            <td>
                                <strong><?= htmlspecialchars($r['description']) ?></strong>
                                <?php if ($r['notes']): ?>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($r['notes']) ?></div>
                                <?php endif; ?>
                            </td>
                            <td><?= htmlspecialchars($r['account_name'] ?? 'Kas Toko') ?></td>
                            <td><span class="badge badge-navy"><?= strtoupper($r['payment_method']) ?></span></td>
                            <td>
                                <strong style="color: <?= $isInc ? '#16a34a' : '#dc2626' ?>; font-size: 0.95rem;">
                                    <?= $isInc ? '+' : '-' ?> <?= formatRupiah($r['amount']) ?>
                                </strong>
                            </td>
                            <td>
                                <?php if (empty($r['transaction_id'])): ?>
                                    <a href="../actions/finance_action.php?action=delete&id=<?= $r['id'] ?>" onclick="return confirmDelete('Hapus catatan <?= htmlspecialchars(addslashes($r['description'])) ?>?')" class="btn btn-sm btn-danger" style="padding: 0.25rem 0.5rem;" title="Hapus">
                                        &times;
                                    </a>
                                <?php else: ?>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">Otomatis Nota</span>
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

<!-- Modal Catat Keuangan -->
<div id="modalFinance" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; align-items: center; justify-content: center; padding: 1rem;">
    <div style="background: var(--bg-card); width: 100%; max-width: 480px; border-radius: 14px; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 id="financeModalTitle" style="font-size: 1.15rem; font-weight: 700;">Catat Transaksi Kas</h3>
            <button onclick="document.getElementById('modalFinance').style.display = 'none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>

        <form action="../actions/finance_action.php" method="POST">
            <input type="hidden" name="action" value="create">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">
            <input type="hidden" id="finance_type" name="type" value="expense">

            <div class="form-group">
                <label class="form-label">Keterangan Transaksi *</label>
                <input type="text" name="description" class="form-control" placeholder="Contoh: Bayar listrik PLN, Gaji karyawan, Beli ATK" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                    <label class="form-label">Nominal (Rp) *</label>
                    <input type="number" name="amount" class="form-control" placeholder="0" min="1000" step="500" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Tanggal</label>
                    <input type="date" name="date" class="form-control" value="<?= date('Y-m-d') ?>" required>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                    <label class="form-label">Kategori</label>
                    <select name="category_id" class="form-select">
                        <option value="">-- Pilih Kategori --</option>
                        <?php foreach ($categories as $cat): ?>
                            <option value="<?= $cat['id'] ?>"><?= htmlspecialchars($cat['name']) ?> (<?= strtoupper($cat['type']) ?>)</option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Akun Kas / Rekening</label>
                    <select name="account_name" class="form-select">
                        <option value="Kas Utama">Kas Utama (Tunai)</option>
                        <option value="Bank BCA">Bank BCA</option>
                        <option value="Bank Mandiri">Bank Mandiri</option>
                        <option value="Bank BRI">Bank BRI</option>
                        <option value="Dompet QRIS">Dompet QRIS / E-Wallet</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Metode Pembayaran</label>
                <select name="payment_method" class="form-select">
                    <option value="cash">Tunai (Cash)</option>
                    <option value="bank_transfer">Transfer Bank</option>
                    <option value="qris">QRIS / E-Wallet</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Catatan Tambahan</label>
                <input type="text" name="notes" class="form-control" placeholder="No referensi nota transfer atau bukti pembayaran">
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="button" onclick="document.getElementById('modalFinance').style.display = 'none'" class="btn btn-secondary">Batal</button>
                <button type="submit" id="financeSubmitBtn" class="btn btn-primary">Simpan Catatan</button>
            </div>
        </form>
    </div>
</div>

<script>
function openFinanceModal(type) {
    document.getElementById('finance_type').value = type;
    const isInc = type === 'income';
    document.getElementById('financeModalTitle').textContent = isInc ? 'Catat Pemasukan Kas Baru' : 'Catat Pengeluaran Kas Baru';
    const btn = document.getElementById('financeSubmitBtn');
    btn.textContent = isInc ? 'Simpan Pemasukan' : 'Simpan Pengeluaran';
    btn.className = isInc ? 'btn btn-primary' : 'btn btn-danger';
    document.getElementById('modalFinance').style.display = 'flex';
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
