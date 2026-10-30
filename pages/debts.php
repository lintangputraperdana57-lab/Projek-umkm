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
$status = $_GET['status'] ?? 'unpaid'; // default belum lunas

$query = "SELECT * FROM debts WHERE user_id = ?";
$params = [$userId];

if (!empty($type)) {
    $query .= " AND type = ?";
    $params[] = $type;
}

if ($status === 'unpaid') {
    $query .= " AND status IN ('unpaid', 'partial')";
} elseif ($status === 'paid') {
    $query .= " AND status = 'paid'";
}

$query .= " ORDER BY due_date ASC";
$stmt = $pdo->prepare($query);
$stmt->execute($params);
$debts = $stmt->fetchAll();

// Hitung total ringkasan
$totalPayable = 0;
$totalReceivable = 0;
$allStmt = $pdo->prepare("SELECT type, COALESCE(SUM(remaining_amount), 0) as total FROM debts WHERE user_id = ? AND status != 'paid' GROUP BY type");
$allStmt->execute([$userId]);
$summaries = $allStmt->fetchAll(PDO::FETCH_KEY_PAIR);
$totalReceivable = (float)($summaries['receivable'] ?? 0);
$totalPayable = (float)($summaries['payable'] ?? 0);

$today = date('Y-m-d');

$pageTitle = 'Manajemen Utang & Piutang';
$activePage = 'debts';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
    <div>
        <h2 style="font-size: 1.2rem; font-weight: 800; margin: 0;">Pengelolaan Utang & Piutang</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Pantau jatuh tempo penagihan piutang dan kewajiban pembayaran ke pemasok</p>
    </div>
    <div style="display: flex; gap: 0.5rem;">
        <button onclick="openAddDebtModal('payable')" class="btn btn-sm btn-danger">+ Catat Utang Pemasok</button>
        <button onclick="openAddDebtModal('receivable')" class="btn btn-sm btn-primary">+ Catat Piutang Pelanggan</button>
    </div>
</div>

<!-- Kartu Ringkasan -->
<div class="stat-grid" style="margin-bottom: 1.25rem;">
    <div class="stat-card">
        <span class="stat-title">Total Piutang Belum Tertagih</span>
        <div class="stat-value" style="color: #2563eb;"><?= formatRupiah($totalReceivable) ?></div>
        <div class="stat-meta">Hak tagih ke pelanggan</div>
    </div>
    <div class="stat-card">
        <span class="stat-title">Total Utang Belum Dibayar</span>
        <div class="stat-value" style="color: #dc2626;"><?= formatRupiah($totalPayable) ?></div>
        <div class="stat-meta">Kewajiban bayar ke supplier</div>
    </div>
    <div class="stat-card">
        <span class="stat-title">Posisi Selisih Piutang - Utang</span>
        <div class="stat-value" style="color: <?= ($totalReceivable - $totalPayable) >= 0 ? '#16a34a' : '#ea580c' ?>;">
            <?= formatRupiah($totalReceivable - $totalPayable) ?>
        </div>
        <div class="stat-meta"><?= ($totalReceivable >= $totalPayable) ? 'Surplus aset piutang' : 'Utang melebihi piutang' ?></div>
    </div>
</div>

<!-- Filter Bar -->
<div class="card" style="margin-bottom: 1.25rem;">
    <div class="card-body" style="padding: 1rem 1.25rem;">
        <form method="GET" action="debts.php" style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
            <select name="type" class="form-select" style="max-width: 250px;">
                <option value="">Semua (Utang & Piutang)</option>
                <option value="receivable" <?= $type === 'receivable' ? 'selected' : '' ?>>Hanya Piutang Pelanggan</option>
                <option value="payable" <?= $type === 'payable' ? 'selected' : '' ?>>Hanya Utang ke Supplier</option>
            </select>
            <select name="status" class="form-select" style="max-width: 200px;">
                <option value="unpaid" <?= $status === 'unpaid' ? 'selected' : '' ?>>Belum Lunas / Sebagian</option>
                <option value="paid" <?= $status === 'paid' ? 'selected' : '' ?>>Sudah Lunas</option>
                <option value="all" <?= $status === 'all' ? 'selected' : '' ?>>Semua Status</option>
            </select>
            <button type="submit" class="btn btn-navy btn-sm">Terapkan Filter</button>
            <?php if (!empty($type) || $status !== 'unpaid'): ?>
                <a href="debts.php" class="btn btn-secondary btn-sm">Reset</a>
            <?php endif; ?>
        </form>
    </div>
</div>

<!-- Tabel Utang & Piutang -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Daftar Tagihan & Kewajiban (<?= count($debts) ?> Catatan)</h3>
    </div>
    <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Jenis</th>
                        <th>Nama Kontak</th>
                        <th>Judul Tagihan</th>
                        <th>Jatuh Tempo</th>
                        <th>Total Awal</th>
                        <th>Sudah Dibayar</th>
                        <th>Sisa Saldo</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($debts)): ?>
                        <tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">Tidak ada data utang/piutang yang sesuai filter.</td></tr>
                    <?php else: ?>
                        <?php foreach ($debts as $d): 
                            $isRec = $d['type'] === 'receivable';
                            $isOverdue = ($d['status'] !== 'paid') && ($d['due_date'] < $today);
                            $isDueSoon = ($d['status'] !== 'paid') && ($d['due_date'] >= $today && $d['due_date'] <= date('Y-m-d', strtotime('+3 days')));
                        ?>
                        <tr>
                            <td>
                                <span class="badge <?= $isRec ? 'badge-info' : 'badge-danger' ?>">
                                    <?= $isRec ? 'Piutang (+)' : 'Utang (-)' ?>
                                </span>
                            </td>
                            <td><strong><?= htmlspecialchars($d['contact_name']) ?></strong></td>
                            <td>
                                <?= htmlspecialchars($d['title']) ?>
                                <?php if ($d['notes']): ?>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($d['notes']) ?></div>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div><?= formatDateIndo($d['due_date']) ?></div>
                                <?php if ($isOverdue): ?>
                                    <span class="badge badge-danger" style="font-size: 0.7rem;">Lewat Jatuh Tempo</span>
                                <?php elseif ($isDueSoon): ?>
                                    <span class="badge badge-warning" style="font-size: 0.7rem;">Segera Jatuh Tempo</span>
                                <?php endif; ?>
                            </td>
                            <td><?= formatRupiah($d['total_amount']) ?></td>
                            <td><span style="color: #16a34a; font-weight: 600;"><?= formatRupiah($d['paid_amount']) ?></span></td>
                            <td>
                                <strong style="color: <?= $d['remaining_amount'] > 0 ? '#dc2626' : '#16a34a' ?>; font-size: 0.95rem;">
                                    <?= formatRupiah($d['remaining_amount']) ?>
                                </strong>
                            </td>
                            <td>
                                <?php if ($d['status'] === 'paid'): ?>
                                    <span class="badge badge-success">Lunas</span>
                                <?php elseif ($d['status'] === 'partial'): ?>
                                    <span class="badge badge-warning">Dicicil</span>
                                <?php else: ?>
                                    <span class="badge badge-danger">Belum Bayar</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div style="display: flex; gap: 0.35rem;">
                                    <?php if ($d['status'] !== 'paid'): ?>
                                    <button onclick="openPayModal(<?= $d['id'] ?>, '<?= htmlspecialchars(addslashes($d['title'])) ?>', '<?= htmlspecialchars(addslashes($d['contact_name'])) ?>', <?= $d['remaining_amount'] ?>)" class="btn btn-sm btn-primary">
                                        Bayar Cicilan
                                    </button>
                                    <?php endif; ?>
                                    <a href="../actions/debt_action.php?action=delete&id=<?= $d['id'] ?>" onclick="return confirmDelete('Hapus data tagihan ini?')" class="btn btn-sm btn-danger" style="padding: 0.25rem 0.5rem;" title="Hapus">
                                        &times;
                                    </a>
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

<!-- Modal Tambah Utang / Piutang -->
<div id="modalAddDebt" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; align-items: center; justify-content: center; padding: 1rem;">
    <div style="background: var(--bg-card); width: 100%; max-width: 480px; border-radius: 14px; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 id="debtModalTitle" style="font-size: 1.15rem; font-weight: 700;">Catat Utang / Piutang</h3>
            <button onclick="document.getElementById('modalAddDebt').style.display = 'none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>

        <form action="../actions/debt_action.php" method="POST">
            <input type="hidden" name="action" value="create">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">
            <input type="hidden" id="debt_type" name="type" value="receivable">

            <div class="form-group">
                <label class="form-label" id="contactLabel">Nama Pelanggan / Pihak Berutang *</label>
                <input type="text" name="contact_name" class="form-control" placeholder="Contoh: Toko Berkah / Ibu Siti" required>
            </div>

            <div class="form-group">
                <label class="form-label">Judul / Perihal Tagihan *</label>
                <input type="text" name="title" class="form-control" placeholder="Contoh: Nota pesanan katering, Pasokan beras 20 sak" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                    <label class="form-label">Total Nominal (Rp) *</label>
                    <input type="number" name="total_amount" class="form-control" placeholder="0" min="1000" step="500" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Tanggal Jatuh Tempo *</label>
                    <input type="date" name="due_date" class="form-control" value="<?= date('Y-m-d', strtotime('+14 days')) ?>" required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Catatan Tambahan</label>
                <textarea name="notes" class="form-control" rows="2" placeholder="Keterangan termin / syarat pembayaran..."></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="button" onclick="document.getElementById('modalAddDebt').style.display = 'none'" class="btn btn-secondary">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Data</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal Pembayaran Cicilan -->
<div id="modalPayDebt" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; align-items: center; justify-content: center; padding: 1rem;">
    <div style="background: var(--bg-card); width: 100%; max-width: 440px; border-radius: 14px; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Catat Pembayaran Cicilan</h3>
            <button onclick="document.getElementById('modalPayDebt').style.display = 'none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>

        <form action="../actions/debt_action.php" method="POST">
            <input type="hidden" name="action" value="pay">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">
            <input type="hidden" id="pay_debt_id" name="debt_id">

            <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-body); border-radius: 8px;">
                <div style="font-size: 0.8rem; color: var(--text-muted);">Perihal Tagihan:</div>
                <strong id="pay_title" style="font-size: 0.95rem;">-</strong>
                <div style="font-size: 0.8rem; margin-top: 0.25rem;">Pihak Terkait: <span id="pay_contact" style="font-weight: 600;">-</span></div>
                <div style="font-size: 0.8rem; margin-top: 0.25rem;">Sisa Tagihan: <span id="pay_remaining" style="font-weight: 700; color: #dc2626;">-</span></div>
            </div>

            <div class="form-group">
                <label class="form-label">Nominal Pembayaran (Rp) *</label>
                <input type="number" id="pay_amount" name="amount" class="form-control" placeholder="0" min="1000" step="500" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                    <label class="form-label">Tanggal Bayar</label>
                    <input type="date" name="payment_date" class="form-control" value="<?= date('Y-m-d') ?>" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Metode Bayar</label>
                    <select name="payment_method" class="form-select">
                        <option value="cash">Tunai (Cash)</option>
                        <option value="bank_transfer">Transfer Bank</option>
                        <option value="qris">QRIS</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Catatan Pembayaran</label>
                <input type="text" name="notes" class="form-control" placeholder="No bukti transfer atau nomor kwitansi">
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="button" onclick="document.getElementById('modalPayDebt').style.display = 'none'" class="btn btn-secondary">Batal</button>
                <button type="submit" class="btn btn-primary">Proses Pembayaran</button>
            </div>
        </form>
    </div>
</div>

<script>
function openAddDebtModal(type) {
    document.getElementById('debt_type').value = type;
    const isRec = type === 'receivable';
    document.getElementById('debtModalTitle').textContent = isRec ? 'Catat Piutang Pelanggan' : 'Catat Utang ke Pemasok';
    document.getElementById('contactLabel').textContent = isRec ? 'Nama Pelanggan yang Berutang *' : 'Nama Pemasok / Supplier *';
    document.getElementById('modalAddDebt').style.display = 'flex';
}

function openPayModal(id, title, contact, remaining) {
    document.getElementById('pay_debt_id').value = id;
    document.getElementById('pay_title').textContent = title;
    document.getElementById('pay_contact').textContent = contact;
    document.getElementById('pay_remaining').textContent = 'Rp ' + Number(remaining).toLocaleString('id-ID');
    document.getElementById('pay_amount').value = remaining;
    document.getElementById('modalPayDebt').style.display = 'flex';
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
