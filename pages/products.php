<?php
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];
$csrfToken = generateCsrfToken();

// Filter & Pencarian
$search = trim($_GET['search'] ?? '');
$filterCategory = !empty($_GET['category_id']) ? (int)$_GET['category_id'] : null;

$query = "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.user_id = ?";
$params = [$userId];

if (!empty($search)) {
    $query .= " AND (p.name LIKE ? OR p.sku LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($filterCategory) {
    $query .= " AND p.category_id = ?";
    $params[] = $filterCategory;
}

$query .= " ORDER BY p.stock <= p.min_stock DESC, p.name ASC";
$stmt = $pdo->prepare($query);
$stmt->execute($params);
$products = $stmt->fetchAll();

// Ambil Kategori Produk untuk Dropdown
$catStmt = $pdo->prepare("SELECT * FROM categories WHERE user_id = ? AND type = 'product' ORDER BY name ASC");
$catStmt->execute([$userId]);
$categories = $catStmt->fetchAll();

$pageTitle = 'Produk & Manajemen Persediaan';
$activePage = 'products';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
    <div>
        <h2 style="font-size: 1.2rem; font-weight: 800; margin: 0;">Katalog Produk & Stok</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Kelola harga jual, harga modal, dan kontrol peringatan stok minimum</p>
    </div>
    <div style="display: flex; gap: 0.5rem;">
        <button onclick="document.getElementById('modalAddProduct').style.display = 'flex'" class="btn btn-primary btn-sm">
            + Tambah Produk Baru
        </button>
    </div>
</div>

<!-- Filter & Pencarian -->
<div class="card" style="margin-bottom: 1.25rem;">
    <div class="card-body" style="padding: 1rem 1.25rem;">
        <form method="GET" action="products.php" style="display: grid; grid-template-columns: 2fr 1.5fr auto auto; gap: 0.75rem; align-items: center;">
            <input type="text" name="search" value="<?= htmlspecialchars($search) ?>" placeholder="Cari nama produk atau kode SKU..." class="form-control">
            <select name="category_id" class="form-select">
                <option value="">Semua Kategori Produk</option>
                <?php foreach ($categories as $cat): ?>
                    <option value="<?= $cat['id'] ?>" <?= $filterCategory === (int)$cat['id'] ? 'selected' : '' ?>>
                        <?= htmlspecialchars($cat['name']) ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <button type="submit" class="btn btn-navy btn-sm">Filter</button>
            <?php if (!empty($search) || $filterCategory): ?>
                <a href="products.php" class="btn btn-secondary btn-sm">Reset</a>
            <?php endif; ?>
        </form>
    </div>
</div>

<!-- Tabel Produk -->
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Daftar Inventaris (<?= count($products) ?> Produk)</h3>
    </div>
    <div class="card-body" style="padding: 0;">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th style="width: 50px;">Foto</th>
                        <th>Kode SKU</th>
                        <th>Nama Produk</th>
                        <th>Kategori</th>
                        <th>Harga Modal</th>
                        <th>Harga Jual</th>
                        <th>Margin Laba</th>
                        <th>Sisa Stok</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($products)): ?>
                        <tr>
                            <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                                Belum ada data produk. Klik "+ Tambah Produk Baru" untuk mulai mengisi persediaan.
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($products as $p): 
                            $profit = $p['selling_price'] - $p['cost_price'];
                            $margin = $p['selling_price'] > 0 ? round(($profit / $p['selling_price']) * 100, 1) : 0;
                            $isLow = $p['stock'] <= $p['min_stock'];
                            $imgSrc = !empty($p['image_url']) ? htmlspecialchars($p['image_url']) : '';
                        ?>
                        <tr>
                            <td>
                                <?php if ($imgSrc): ?>
                                    <img src="<?= $imgSrc ?>" alt="<?= htmlspecialchars($p['name']) ?>" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);">
                                <?php else: ?>
                                    <div style="width: 40px; height: 40px; border-radius: 8px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: bold;">
                                        &#128230;
                                    </div>
                                <?php endif; ?>
                            </td>
                            <td><span style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 600; color: var(--text-muted);"><?= htmlspecialchars($p['sku']) ?></span></td>
                            <td>
                                <strong><?= htmlspecialchars($p['name']) ?></strong>
                                <?php if ($isLow): ?>
                                    <span class="badge badge-danger" style="margin-left: 0.35rem;">Stok Menipis</span>
                                <?php endif; ?>
                            </td>
                            <td><span class="badge badge-navy"><?= htmlspecialchars($p['category_name'] ?? 'Umum') ?></span></td>
                            <td><?= formatRupiah($p['cost_price']) ?></td>
                            <td><strong style="color: #2563eb;"><?= formatRupiah($p['selling_price']) ?></strong></td>
                            <td>
                                <span style="font-size: 0.8rem; font-weight: 600; color: <?= $profit >= 0 ? '#16a34a' : '#dc2626' ?>;">
                                    +<?= formatRupiah($profit) ?> (<?= $margin ?>%)
                                </span>
                            </td>
                            <td>
                                <strong style="color: <?= $isLow ? '#dc2626' : 'var(--text-main)' ?>; font-size: 0.95rem;">
                                    <?= $p['stock'] ?>
                                </strong> 
                                <span style="font-size: 0.75rem; color: var(--text-muted);"><?= htmlspecialchars($p['unit']) ?></span>
                            </td>
                            <td>
                                <div style="display: flex; gap: 0.35rem;">
                                    <button onclick="openAdjustModal(<?= $p['id'] ?>, '<?= htmlspecialchars(addslashes($p['name'])) ?>', <?= $p['stock'] ?>, '<?= htmlspecialchars(addslashes($p['unit'])) ?>')" class="btn btn-sm btn-secondary" title="Sesuaikan Stok">
                                        Stok &plusmn;
                                    </button>
                                    <a href="../actions/product_action.php?action=delete&id=<?= $p['id'] ?>" onclick="return confirmDelete('Hapus produk <?= htmlspecialchars(addslashes($p['name'])) ?>?')" class="btn btn-sm btn-danger" style="padding: 0.35rem 0.5rem;" title="Hapus">
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

<!-- Modal Tambah Produk -->
<div id="modalAddProduct" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; align-items: center; justify-content: center; padding: 1rem;">
    <div style="background: var(--bg-card); width: 100%; max-width: 520px; border-radius: 14px; padding: 1.5rem; max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Tambah Produk Baru</h3>
            <button onclick="document.getElementById('modalAddProduct').style.display = 'none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>

        <form action="../actions/product_action.php" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="action" value="create">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">

            <div class="form-group">
                <label class="form-label">Nama Produk *</label>
                <input type="text" name="name" class="form-control" placeholder="Contoh: Beras Rojo Lele 5kg" required>
            </div>

            <!-- Upload Gambar Produk -->
            <div class="form-group" style="padding: 0.75rem; background: var(--bg-body); border-radius: 8px; border: 1px dashed var(--border);">
                <label class="form-label" style="margin-bottom: 0.25rem;">Foto / Gambar Produk</label>
                <input type="file" name="image" id="prodImageFile" accept="image/png, image/jpeg, image/jpg, image/webp" class="form-control" style="font-size: 0.8rem;" onchange="previewUploadImage(this)">
                <div id="uploadPreviewWrapper" style="display: none; margin-top: 0.5rem; align-items: center; gap: 0.75rem;">
                    <img id="uploadPreviewImg" src="#" alt="Pratinjau" style="width: 55px; height: 55px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border);">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Foto siap diunggah</span>
                </div>
                <div style="margin-top: 0.5rem;">
                    <input type="url" name="image_url" placeholder="Atau tempel link URL foto web (opsional)" class="form-control" style="font-size: 0.8rem;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                    <label class="form-label">Kode SKU (Opsional)</label>
                    <input type="text" name="sku" class="form-control" placeholder="Otomatis jika kosong">
                </div>
                <div class="form-group">
                    <label class="form-label">Kategori</label>
                    <select name="category_id" class="form-select">
                        <option value="">Pilih Kategori</option>
                        <?php foreach ($categories as $cat): ?>
                            <option value="<?= $cat['id'] ?>"><?= htmlspecialchars($cat['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                    <label class="form-label">Harga Beli / Modal (Rp) *</label>
                    <input type="number" name="cost_price" class="form-control" placeholder="0" min="0" step="100" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Harga Jual (Rp) *</label>
                    <input type="number" name="selling_price" class="form-control" placeholder="0" min="0" step="100" required>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
                <div class="form-group">
                    <label class="form-label">Jumlah Stok Awal</label>
                    <input type="number" name="stock" class="form-control" value="10" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Batas Stok Min.</label>
                    <input type="number" name="min_stock" class="form-control" value="5" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Satuan</label>
                    <input type="text" name="unit" class="form-control" value="pcs">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Deskripsi / Catatan Produk</label>
                <textarea name="description" class="form-control" rows="2" placeholder="Keterangan tambahan barang..."></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
                <button type="button" onclick="document.getElementById('modalAddProduct').style.display = 'none'" class="btn btn-secondary">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Produk</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal Penyesuaian Stok (Adjustment) -->
<div id="modalAdjustStock" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; align-items: center; justify-content: center; padding: 1rem;">
    <div style="background: var(--bg-card); width: 100%; max-width: 440px; border-radius: 14px; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Penyesuaian Stok Barang</h3>
            <button onclick="document.getElementById('modalAdjustStock').style.display = 'none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
        </div>

        <form action="../actions/product_action.php" method="POST">
            <input type="hidden" name="action" value="adjust_stock">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">
            <input type="hidden" id="adjust_id" name="id">

            <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg-body); border-radius: 8px;">
                <div style="font-size: 0.8rem; color: var(--text-muted);">Produk yang Disesuaikan:</div>
                <strong id="adjust_name" style="font-size: 0.95rem;">-</strong>
                <div style="font-size: 0.8rem; margin-top: 0.25rem;">Sisa Stok Saat Ini: <span id="adjust_current" style="font-weight: 700; color: #2563eb;">-</span></div>
            </div>

            <div class="form-group">
                <label class="form-label">Jenis Penyesuaian</label>
                <select name="adjustment_type" class="form-select">
                    <option value="in">Tambah Stok Masuk (+)</option>
                    <option value="out">Kurang Stok Keluar / Rusak (-)</option>
                    <option value="set">Atur Ulang Total Stok (=)</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Jumlah</label>
                <input type="number" name="quantity" class="form-control" min="1" value="1" required>
            </div>

            <div class="form-group">
                <label class="form-label">Alasan Penyesuaian *</label>
                <input type="text" name="reason" class="form-control" placeholder="Contoh: Stok opname bulanan, barang rusak, retur" required>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem;">
                <button type="button" onclick="document.getElementById('modalAdjustStock').style.display = 'none'" class="btn btn-secondary">Batal</button>
                <button type="submit" class="btn btn-primary">Simpan Stok</button>
            </div>
        </form>
    </div>
</div>

<script>
function openAdjustModal(id, name, currentStock, unit) {
    document.getElementById('adjust_id').value = id;
    document.getElementById('adjust_name').textContent = name;
    document.getElementById('adjust_current').textContent = currentStock + ' ' + unit;
    document.getElementById('modalAdjustStock').style.display = 'flex';
}

function previewUploadImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('uploadPreviewImg');
            const wrapper = document.getElementById('uploadPreviewWrapper');
            preview.src = e.target.result;
            wrapper.style.display = 'flex';
        };
        reader.readAsDataURL(input.files[0]);
    }
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
