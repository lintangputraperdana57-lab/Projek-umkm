<?php
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];
$csrfToken = generateCsrfToken();

// Ambil daftar produk yang aktif & memiliki stok
$prodStmt = $pdo->prepare("SELECT * FROM products WHERE user_id = ? AND status = 'active' ORDER BY name ASC");
$prodStmt->execute([$userId]);
$products = $prodStmt->fetchAll();

// Ambil daftar pelanggan
$custStmt = $pdo->prepare("SELECT * FROM customers WHERE user_id = ? ORDER BY name ASC");
$custStmt->execute([$userId]);
$customers = $custStmt->fetchAll();

$pageTitle = 'Kasir Cepat POS (Point of Sale)';
$activePage = 'pos';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
require_once __DIR__ . '/../includes/navbar.php';
?>

<div style="margin-bottom: 1.25rem;">
    <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0;">Kasir & Penjualan Baru</h2>
    <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">Entri transaksi multi-item dengan update persediaan real-time</p>
</div>

<form id="posForm" action="../actions/transaction_action.php" method="POST">
    <input type="hidden" name="action" value="create_sale">
    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">
    <input type="hidden" id="posTotalAmountInput" name="total_amount" value="0">
    <input type="hidden" id="posChangeAmountInput" name="change_amount" value="0">

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem; align-items: start;">
        
        <!-- Kolom Kiri: Baris Item Transaksi -->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Item Belanja Produk</h3>
                <button type="button" onclick="addPosRow()" class="btn btn-sm btn-primary">
                    + Tambah Baris Item
                </button>
            </div>
            <div class="card-body" style="padding: 1rem;">
                <div class="table-responsive">
                    <table class="table" style="margin-bottom: 0;">
                        <thead>
                            <tr>
                                <th style="width: 38%;">Produk & Sisa Stok</th>
                                <th style="width: 14%;">Jumlah</th>
                                <th style="width: 20%;">Harga Satuan (Rp)</th>
                                <th style="width: 20%;">Subtotal</th>
                                <th style="width: 8%;"></th>
                            </tr>
                        </thead>
                        <tbody id="posItemsTbody">
                            <!-- Baris Pertama -->
                            <tr class="pos-item-row">
                                <td>
                                    <select name="product_id[]" class="form-select pos-product-select" onchange="onSelectProduct(this)" required>
                                        <option value="">-- Pilih Produk --</option>
                                        <?php foreach ($products as $p): ?>
                                            <option value="<?= $p['id'] ?>" data-price="<?= $p['selling_price'] ?>" data-stock="<?= $p['stock'] ?>" data-unit="<?= htmlspecialchars($p['unit']) ?>">
                                                <?= htmlspecialchars($p['name']) ?> (Stok: <?= $p['stock'] ?> <?= htmlspecialchars($p['unit']) ?>)
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </td>
                                <td>
                                    <input type="number" name="quantity[]" class="form-control item-qty" value="1" min="1" required>
                                </td>
                                <td>
                                    <input type="number" name="price[]" class="form-control item-price" value="0" min="0" step="100" required>
                                    <input type="hidden" name="item_discount[]" class="item-discount" value="0">
                                </td>
                                <td>
                                    <strong class="item-subtotal" style="color: var(--accent-blue);">Rp 0</strong>
                                </td>
                                <td>
                                    <button type="button" onclick="removePosRow(this)" class="btn btn-sm btn-danger" style="padding: 0.25rem 0.5rem;">&times;</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Template baris tersembunyi -->
                <template id="posRowTemplate">
                    <tr class="pos-item-row">
                        <td>
                            <select name="product_id[]" class="form-select pos-product-select" onchange="onSelectProduct(this)" required>
                                <option value="">-- Pilih Produk --</option>
                                <?php foreach ($products as $p): ?>
                                    <option value="<?= $p['id'] ?>" data-price="<?= $p['selling_price'] ?>" data-stock="<?= $p['stock'] ?>" data-unit="<?= htmlspecialchars($p['unit']) ?>">
                                        <?= htmlspecialchars($p['name']) ?> (Stok: <?= $p['stock'] ?> <?= htmlspecialchars($p['unit']) ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                        <td>
                            <input type="number" name="quantity[]" class="form-control item-qty" value="1" min="1" required>
                        </td>
                        <td>
                            <input type="number" name="price[]" class="form-control item-price" value="0" min="0" step="100" required>
                            <input type="hidden" name="item_discount[]" class="item-discount" value="0">
                        </td>
                        <td>
                            <strong class="item-subtotal" style="color: var(--accent-blue);">Rp 0</strong>
                        </td>
                        <td>
                            <button type="button" onclick="removePosRow(this)" class="btn btn-sm btn-danger" style="padding: 0.25rem 0.5rem;">&times;</button>
                        </td>
                    </tr>
                </template>
            </div>
        </div>

        <!-- Kolom Kanan: Ringkasan & Pembayaran -->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Pembayaran & Pelanggan</h3>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label class="form-label">Tanggal Transaksi</label>
                    <input type="date" name="date" class="form-control" value="<?= date('Y-m-d') ?>" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Pelanggan</label>
                    <select name="customer_id" class="form-select" onchange="onCustomerChange(this)">
                        <option value="">Pelanggan Umum (Tanpa Nama)</option>
                        <?php foreach ($customers as $c): ?>
                            <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['name']) ?> (<?= htmlspecialchars($c['phone'] ?? '-') ?>)</option>
                        <?php endforeach; ?>
                    </select>
                    <input type="hidden" name="customer_name" id="customer_name_input" value="">
                </div>

                <div class="form-group">
                    <label class="form-label">Metode Pembayaran</label>
                    <select name="payment_method" id="payment_method_select" class="form-select" onchange="checkPaymentMethod(this)">
                        <option value="cash">Tunai (Cash)</option>
                        <option value="bank_transfer">Transfer Bank (BCA / Mandiri / BRI)</option>
                        <option value="qris">QRIS (GoPay/ShopeePay/OVO)</option>
                        <option value="tempo">Tempo / Utang (Piutang Usaha)</option>
                    </select>
                </div>

                <div id="tempoDetails" style="display: none; padding: 0.75rem; background: var(--warning-light); border-radius: 8px; margin-bottom: 1rem;">
                    <label class="form-label" style="color: #92400e;">Tanggal Jatuh Tempo *</label>
                    <input type="date" name="due_date" class="form-control" value="<?= date('Y-m-d', strtotime('+7 days')) ?>">
                    <input type="hidden" name="payment_status" id="posPaymentStatusInput" value="paid">
                </div>

                <div class="form-group">
                    <label class="form-label">Diskon Transaksi (Rp)</label>
                    <input type="number" id="posGlobalDiscount" name="discount" class="form-control" value="0" min="0" step="500">
                </div>

                <!-- Total Kalkulasi Box -->
                <div style="background: var(--bg-body); border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                        <span>Subtotal:</span>
                        <span id="posSubtotalDisplay" style="font-weight: 600;">Rp 0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 800; color: #1e3a8a; border-top: 1px dashed var(--border); padding-top: 0.5rem; margin-top: 0.5rem;">
                        <span>Total Akhir:</span>
                        <span id="posGrandTotalDisplay" style="color: var(--accent-blue);">Rp 0</span>
                    </div>
                </div>

                <div class="form-group" id="paidAmountGroup">
                    <label class="form-label">Uang Diterima / Bayar (Rp)</label>
                    <input type="number" id="posPaidAmountInput" name="paid_amount" class="form-control" placeholder="0" min="0" step="500">
                </div>

                <div id="changeAmountBox" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f0fdf4; border-radius: 8px; margin-bottom: 1.25rem;">
                    <span style="font-size: 0.85rem; font-weight: 600; color: #166534;">Kembalian:</span>
                    <strong id="posChangeDisplay" style="font-size: 1.1rem; color: #16a34a;">Rp 0</strong>
                </div>

                <div class="form-group">
                    <label class="form-label">Catatan Nota</label>
                    <input type="text" name="notes" class="form-control" placeholder="Catatan pengiriman / instruksi">
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.85rem; font-size: 1rem;">
                    Proses & Cetak Struk &rarr;
                </button>
            </div>
        </div>

    </div>
</form>

<script>
function onSelectProduct(selectElem) {
    const option = selectElem.options[selectElem.selectedIndex];
    const price = option.getAttribute('data-price') || 0;
    const row = selectElem.closest('.pos-item-row');
    const priceInput = row.querySelector('.item-price');
    if (priceInput) {
        priceInput.value = price;
    }
    const event = new Event('input', { bubbles: true });
    selectElem.dispatchEvent(event);
}

function addPosRow() {
    const template = document.getElementById('posRowTemplate');
    const clone = template.content.cloneNode(true);
    document.getElementById('posItemsTbody').appendChild(clone);
}

function removePosRow(buttonElem) {
    const tbody = document.getElementById('posItemsTbody');
    if (tbody.querySelectorAll('.pos-item-row').length > 1) {
        buttonElem.closest('.pos-item-row').remove();
        const event = new Event('input', { bubbles: true });
        document.getElementById('posForm').dispatchEvent(event);
    } else {
        alert('Minimal harus ada 1 baris item transaksi.');
    }
}

function checkPaymentMethod(selectElem) {
    const isTempo = selectElem.value === 'tempo';
    document.getElementById('tempoDetails').style.display = isTempo ? 'block' : 'none';
    document.getElementById('posPaymentStatusInput').value = isTempo ? 'unpaid' : 'paid';
    if (isTempo) {
        document.getElementById('posPaidAmountInput').value = 0;
        document.getElementById('changeAmountBox').style.display = 'none';
    } else {
        document.getElementById('changeAmountBox').style.display = 'flex';
    }
}

function onCustomerChange(selectElem) {
    const name = selectElem.options[selectElem.selectedIndex].text;
    document.getElementById('customer_name_input').value = selectElem.value ? name : '';
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
