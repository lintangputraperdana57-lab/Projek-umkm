<?php
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];
$csrfToken = generateCsrfToken();

$tab = $_GET['tab'] ?? 'customers'; // 'customers' or 'suppliers'
$search = trim($_GET['search'] ?? '');

if ($tab === 'suppliers') {
    $q = "SELECT * FROM suppliers WHERE user_id = ?";
    $params = [$userId];
    if (!empty($search)) {
        $q .= " AND (name LIKE ? OR phone LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    $q .= " ORDER BY name ASC";
    $stmt = $pdo->prepare($q);
    $stmt->execute($params);
    $suppliers = $stmt->fetchAll();
} else {
    $q = "SELECT * FROM customers WHERE user_id = ?";
    $params = [$userId];
    if (!empty($search)) {
        $q .= " AND (name LIKE ? OR phone LIKE ?)";
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    $q .= " ORDER BY name ASC";
    $stmt = $pdo->prepare($q);
    $stmt->execute($params);
    $customers = $stmt->fetchAll();
}

$pageTitle = 'Pelanggan & Pemasok Mitra Usaha';
$activePage = 'customers';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
    <div>
        <h2 style="font-size: 1.2rem; font-weight: 800; margin: 0;">Kontak Mitra & Pelanggan</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Kelola data pembeli setia dan distributor pemasok barang usaha Anda</p>
    </div>
    <div style="display: flex; gap: 0.5rem;">
        <?php if ($tab === 'suppliers'): ?>
            <button onclick="document.getElementById('modalAddSupplier').style.display = 'flex'" class="btn btn-primary btn-sm">+ Tambah Pemasok</button>
        <?php else: ?>
            <button onclick="document.getElementById('modalAddCustomer').style.display = 'flex'" class="btn btn-primary btn-sm">+ Tambah Pelanggan</button>
        <?php endif; ?>
    </div>
</div>

<!-- Tabs Switcher -->
<div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
    <a href="customers.php?tab=customers" class="btn btn-sm <?= $tab === 'customers' ? 'btn-navy' : 'btn-secondary' ?>">
        Pelanggan (Customers)
    </a>
    <a href="customers.php?tab=suppliers" class="btn btn-sm <?= $tab === 'suppliers' ? 'btn-navy' : 'btn-secondary' ?>">
        Pemasok (Suppliers / Distributor)
    </a>
</div>

<!-- Search Bar -->
<div class="card" style="margin-bottom: 1.25rem;">
    <div class="card-body" style="padding: 1rem 1.25rem;">
        <form method="GET" action="customers.php" style="display: flex; gap: 0.75rem; align-items: center;">
            <input type="hidden" name="tab" value="<?= htmlspecialchars($tab) ?>">
            <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Cari nama atau no HP..." class="form-control">
            <button type="submit" class="btn btn-navy btn-sm">Cari</button>
            <?php if (!empty($search)): ?>
                <a href="customers.php?tab=<?= $tab ?>" class="btn btn-secondary btn-sm">Reset</a>
            <?php endif; ?>
        </form>
    </div>
</div>

<!-- Table Data -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">
            <?= $tab === 'suppliers' ? 'Daftar Distributor Pemasok' : 'Daftar Pelanggan Setia' ?>
        </h3>
    </div>
    <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nama Kontak</th>
                        <th>No. Telepon / WhatsApp</th>
                        <th>Email</th>
                        <th>Alamat</th>
                        <th><?= $tab === 'suppliers' ? 'Total Utang Usaha' : 'Total Piutang' ?></th>
                        <th>Catatan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ($tab === 'suppliers'): ?>
                        <?php if (empty($suppliers)): ?>
                            <tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada data pemasok.</td></tr>
                        <?php else: ?>
                            <?php foreach ($suppliers as $s): ?>
                            <tr>
                                <td><strong><?= htmlspecialchars($s['name']) ?></strong></td>
                                <td>
                                    <?php if ($s['phone']): ?>
                                        <a href="https://wa.me/<?= preg_replace('/[^0-9]/', '', $s['phone']) ?>" target="_blank" style="color: var(--accent-blue); text-decoration: none; font-weight: 600;">
                                            <?= htmlspecialchars($s['phone']) ?> &rarr;
                                        </a>
                                    <?php else: ?> - <?php endif; ?>
                                </td>
                                <td><?= htmlspecialchars($s['email'] ?? '-') ?></td>
                                <td><?= htmlspecialchars($s['address'] ?? '-') ?></td>
                                <td><strong style="color: #dc2626;"><?= formatRupiah($s['total_debt']) ?></strong></td>
                                <td><span style="font-size: 0.8rem; color: var(--text-muted);"><?= htmlspecialchars($s['notes'] ?? '-') ?></span></td>
                                <td>
                                    <a href="../actions/customer_action.php?action=delete_supplier&id=<?= $s['id'] ?>" onclick="return confirmDelete('Hapus pemasok ini?')" class="btn btn-sm btn-danger" style="padding: 0.25rem 0.5rem;">&times;</a>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    <?php else: ?>
                        <?php if (empty($customers)): ?>
                            <tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada data pelanggan.</td></tr>
                        <?php else: ?>
                            <?php foreach ($customers as $c): ?>
                            <tr>
                                <td><strong><?= htmlspecialchars($c['name']) ?></strong></td>
                                <td>
                                    <?php if ($c['phone']): ?>
                                        <a href="https://wa.me/<?= preg_replace('/[^0-9]/', '', $c['phone']) ?>" target="_blank" style="color: var(--accent-blue); text-decoration: none; font-weight: 600;">
                                            <?= htmlspecialchars($c['phone']) ?> &rarr;
                                        </a>
                                    <?php else: ?> - <?php endif; ?>
                                </td>
                                <td><?= htmlspecialchars($c['email'] ?? '-') ?></td>
                                <td><?= htmlspecialchars($c['address'] ?? '-') ?></td>
                                <td><strong style="color: #2563eb;"><?= formatRupiah($c['total_receivable']) ?></strong></td>
                                <td><span style="font-size: 0.8rem; color: var(--text-muted);"><?= htmlspecialchars($c['notes'] ?? '-') ?></span></td>
                                <td>
                                    <a href="../actions/customer_action.php?action=delete_customer&id=<?= $c['id'] ?>" onclick="return confirmDelete('Hapus pelanggan ini?')" class="btn btn-sm btn-danger" style="padding: 0.25rem 0.5rem;">&times;</a>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modal Tambah Pelanggan -->
<div id="modalAddCustomer" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; align-items: center; justify-content: center; padding: 1rem;">
    <div style="background: var(--bg-card); width: 100%; max-width: 440px; border-radius: 14px; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Tambah Pelanggan Baru</h3>
            <button onclick="document.getElementById('modalAddCustomer').style.display = 'none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>
        <form action="../actions/customer_action.php" method="POST">
            <input type="hidden" name="action" value="create_customer">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">

            <div class="form-group">
                <label class="form-label">Nama Pelanggan / Toko Langganan *</label>
                <input type="text" name="name" class="form-control" placeholder="Contoh: Bu Siti / CV Digital" required>
            </div>
            <div class="form-group">
                <label class="form-label">Nomor WhatsApp</label>
                <input type="tel" name="phone" class="form-control" placeholder="08123456789">
            </div>
            <div class="form-group">
                <label class="form-label">Alamat Lengkap</label>
                <input type="text" name="address" class="form-control" placeholder="Alamat pengiriman pesanan">
            </div>
            <div class="form-group">
                <label class="form-label">Catatan Tambahan</label>
                <input type="text" name="notes" class="form-control" placeholder="Catatan preferensi atau tempo">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="button" onclick="document.getElementById('modalAddCustomer').style.display = 'none'" class="btn btn-secondary">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Pelanggan</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal Tambah Pemasok -->
<div id="modalAddSupplier" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; align-items: center; justify-content: center; padding: 1rem;">
    <div style="background: var(--bg-card); width: 100%; max-width: 440px; border-radius: 14px; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Tambah Pemasok (Supplier)</h3>
            <button onclick="document.getElementById('modalAddSupplier').style.display = 'none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>
        <form action="../actions/customer_action.php" method="POST">
            <input type="hidden" name="action" value="create_supplier">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">

            <div class="form-group">
                <label class="form-label">Nama Pemasok / Distributor *</label>
                <input type="text" name="name" class="form-control" placeholder="Contoh: Distributor Sembako Makmur" required>
            </div>
            <div class="form-group">
                <label class="form-label">Nomor Kontak / Sales</label>
                <input type="tel" name="phone" class="form-control" placeholder="0811223344">
            </div>
            <div class="form-group">
                <label class="form-label">Alamat Gudang Pemasok</label>
                <input type="text" name="address" class="form-control" placeholder="Kawasan industri atau pasar">
            </div>
            <div class="form-group">
                <label class="form-label">Catatan Tambahan</label>
                <input type="text" name="notes" class="form-control" placeholder="Jadwal suplai, termin kredit">
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="button" onclick="document.getElementById('modalAddSupplier').style.display = 'none'" class="btn btn-secondary">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Pemasok</button>
            </div>
        </form>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
