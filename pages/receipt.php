<?php
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];
$id = (int)($_GET['id'] ?? 0);

// Ambil Transaksi
$stmt = $pdo->prepare("SELECT t.*, c.name as customer_name, c.phone as customer_phone FROM transactions t LEFT JOIN customers c ON t.customer_id = c.id WHERE t.id = ? AND t.user_id = ? LIMIT 1");
$stmt->execute([$id, $userId]);
$trx = $stmt->fetch();

if (!$trx) {
    die("Transaksi tidak ditemukan.");
}

// Ambil Items
$iStmt = $pdo->prepare("SELECT * FROM transaction_items WHERE transaction_id = ?");
$iStmt->execute([$id]);
$items = $iStmt->fetchAll();

// Ambil Profil Usaha
$bStmt = $pdo->prepare("SELECT * FROM businesses WHERE user_id = ? LIMIT 1");
$bStmt->execute([$userId]);
$business = $bStmt->fetch();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk Nota #<?= htmlspecialchars($trx['transaction_number']) ?></title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            background-color: #f1f5f9;
            margin: 0;
            padding: 20px;
            color: #000;
        }
        .receipt-container {
            max-width: 380px;
            margin: 0 auto;
            background: #fff;
            padding: 20px;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
        }
        .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 13px;
        }
        .actions-bar {
            max-width: 380px;
            margin: 15px auto 0;
            display: flex;
            gap: 10px;
        }
        .btn {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            font-family: sans-serif;
            text-align: center;
            text-decoration: none;
            display: inline-block;
        }
        .btn-print { background: #2563eb; color: #fff; }
        .btn-back { background: #e2e8f0; color: #1e293b; }
        @media print {
            body { padding: 0; background: #fff; }
            .receipt-container { box-shadow: none; max-width: 100%; width: 100%; }
            .actions-bar { display: none; }
        }
    </style>
</head>
<body>

<div class="receipt-container">
    <div class="text-center">
        <h2 style="margin: 0; font-size: 16px;"><?= htmlspecialchars($business['business_name'] ?? 'Toko UMKM Pro') ?></h2>
        <div style="font-size: 11px; margin-top: 4px;"><?= htmlspecialchars($business['address'] ?? 'Indonesia') ?></div>
        <div style="font-size: 11px;">Telp: <?= htmlspecialchars($business['phone'] ?? '-') ?></div>
    </div>

    <div class="divider"></div>

    <div style="font-size: 12px;">
        <div style="display: flex; justify-content: space-between;">
            <span>No: <?= htmlspecialchars($trx['transaction_number']) ?></span>
            <span><?= date('d/m/Y H:i', strtotime($trx['created_at'])) ?></span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>Kasir: <?= htmlspecialchars($user['name']) ?></span>
            <span>Plg: <?= htmlspecialchars($trx['customer_name'] ?? 'Umum') ?></span>
        </div>
    </div>

    <div class="divider"></div>

    <!-- Daftar Items -->
    <?php foreach ($items as $item): ?>
        <div style="font-size: 12px; margin-bottom: 6px;">
            <div style="font-weight: bold;"><?= htmlspecialchars($item['product_name']) ?></div>
            <div style="display: flex; justify-content: space-between;">
                <span><?= $item['quantity'] ?> x <?= number_format($item['unit_price'], 0, ',', '.') ?></span>
                <span><?= number_format($item['subtotal'], 0, ',', '.') ?></span>
            </div>
        </div>
    <?php endforeach; ?>

    <div class="divider"></div>

    <!-- Kalkulasi -->
    <div style="font-size: 12px;">
        <div class="item-row">
            <span>Subtotal:</span>
            <span><?= number_format($trx['subtotal'], 0, ',', '.') ?></span>
        </div>
        <?php if ($trx['discount'] > 0): ?>
        <div class="item-row">
            <span>Diskon:</span>
            <span>-<?= number_format($trx['discount'], 0, ',', '.') ?></span>
        </div>
        <?php endif; ?>
        <div class="item-row" style="font-weight: bold; font-size: 14px;">
            <span>TOTAL:</span>
            <span>Rp <?= number_format($trx['total_amount'], 0, ',', '.') ?></span>
        </div>
        <div class="item-row">
            <span>Metode:</span>
            <span><?= strtoupper($trx['payment_method']) ?> (<?= $trx['payment_status'] === 'paid' ? 'LUNAS' : 'TEMPO' ?>)</span>
        </div>
        <div class="item-row">
            <span>Bayar:</span>
            <span>Rp <?= number_format($trx['paid_amount'], 0, ',', '.') ?></span>
        </div>
        <div class="item-row">
            <span>Kembalian:</span>
            <span>Rp <?= number_format($trx['change_amount'], 0, ',', '.') ?></span>
        </div>
    </div>

    <div class="divider"></div>

    <div class="text-center" style="font-size: 11px;">
        <?= htmlspecialchars($business['receipt_footer_note'] ?? 'Terima Kasih Atas Kunjungan Anda!') ?>
    </div>
</div>

<div class="actions-bar">
    <button onclick="window.print()" class="btn btn-print">Cetak Struk (Print)</button>
    <a href="pos.php" class="btn btn-back">Kembali ke Kasir</a>
</div>

</body>
</html>
