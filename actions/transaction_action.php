<?php
/**
 * Action Handler: Transaksi Penjualan & Pembelian (Multi-Item)
 * Menggunakan Database Transaction & Update Stok Otomatis
 */

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        setFlashMessage('error', 'Token keamanan CSRF tidak sah.');
        header('Location: ../pages/pos.php');
        exit;
    }
}

// 1. Simpan Transaksi Penjualan Baru (POS)
if ($action === 'create_sale') {
    $date = $_POST['date'] ?? date('Y-m-d');
    $customerId = !empty($_POST['customer_id']) ? (int)$_POST['customer_id'] : null;
    $customerName = trim($_POST['customer_name'] ?? '');
    $paymentMethod = $_POST['payment_method'] ?? 'cash';
    $paymentStatus = $_POST['payment_status'] ?? 'paid';
    $discount = (float)($_POST['discount'] ?? 0);
    $paidAmount = (float)($_POST['paid_amount'] ?? 0);
    $notes = trim($_POST['notes'] ?? '');

    $itemProductIds = $_POST['product_id'] ?? [];
    $itemQuantities = $_POST['quantity'] ?? [];
    $itemPrices = $_POST['price'] ?? [];
    $itemDiscounts = $_POST['item_discount'] ?? [];

    if (empty($itemProductIds)) {
        setFlashMessage('error', 'Transaksi harus memiliki minimal 1 item produk.');
        header('Location: ../pages/pos.php');
        exit;
    }

    try {
        $pdo->beginTransaction();

        $trxNumber = generateTransactionNumber($pdo, $userId, 'sale');
        $subtotal = 0;
        $totalCost = 0;
        $processedItems = [];

        // Hitung dan validasi seluruh item produk
        for ($i = 0; $i < count($itemProductIds); $i++) {
            $pId = (int)$itemProductIds[$i];
            $qty = max(1, (int)($itemQuantities[$i] ?? 1));
            $unitPrice = (float)($itemPrices[$i] ?? 0);
            $itemDisc = (float)($itemDiscounts[$i] ?? 0);

            // Ambil info produk dari database
            $pStmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND user_id = ? FOR UPDATE");
            $pStmt->execute([$pId, $userId]);
            $product = $pStmt->fetch();

            if (!$product) {
                throw new Exception("Produk baris ke-" . ($i + 1) . " tidak valid.");
            }

            // Validasi kecukupan stok jika produk aktif
            if ($product['stock'] < $qty) {
                throw new Exception("Stok produk '{$product['name']}' tidak mencukupi (Tersisa: {$product['stock']} {$product['unit']}, Diminta: $qty).");
            }

            $lineSubtotal = max(0, ($qty * $unitPrice) - $itemDisc);
            $costPrice = (float)$product['cost_price'];
            $subtotal += $lineSubtotal;
            $totalCost += ($costPrice * $qty);

            $processedItems[] = [
                'product_id' => $pId,
                'product_name' => $product['name'],
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'cost_price' => $costPrice,
                'discount' => $itemDisc,
                'subtotal' => $lineSubtotal,
                'current_stock' => $product['stock'],
            ];
        }

        $totalAmount = max(0, $subtotal - $discount);
        $changeAmount = ($paymentStatus === 'paid' && $paidAmount > $totalAmount) ? ($paidAmount - $totalAmount) : 0;
        if ($paymentStatus === 'paid' && $paidAmount == 0) {
            $paidAmount = $totalAmount;
        }

        // Simpan Header Transaksi
        $tStmt = $pdo->prepare("INSERT INTO transactions (user_id, transaction_number, type, date, customer_id, subtotal, discount, total_amount, total_cost, payment_method, payment_status, paid_amount, change_amount, status, notes)
                                VALUES (?, ?, 'sale', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)");
        $tStmt->execute([$userId, $trxNumber, $date, $customerId, $subtotal, $discount, $totalAmount, $totalCost, $paymentMethod, $paymentStatus, $paidAmount, $changeAmount, $notes]);
        $transactionId = (int)$pdo->lastInsertId();

        // Simpan Item Transaksi & Kurangi Stok
        $itemInsert = $pdo->prepare("INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, unit_price, cost_price, discount, subtotal)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stockUpdate = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND user_id = ?");
        $smInsert = $pdo->prepare("INSERT INTO stock_movements (user_id, product_id, movement_type, quantity, before_stock, after_stock, reason, reference_id)
                                  VALUES (?, ?, 'out', ?, ?, ?, ?, ?)");

        foreach ($processedItems as $item) {
            $itemInsert->execute([$transactionId, $item['product_id'], $item['product_name'], $item['quantity'], $item['unit_price'], $item['cost_price'], $item['discount'], $item['subtotal']]);
            $stockUpdate->execute([$item['quantity'], $item['product_id'], $userId]);
            
            $afterStock = $item['current_stock'] - $item['quantity'];
            $smInsert->execute([$userId, $item['product_id'], $item['quantity'], $item['current_stock'], $afterStock, "Penjualan Nota $trxNumber", $trxNumber]);
        }

        // Catat ke Buku Kas (Financial Record) jika pembayaran lunas / parsial
        if ($paidAmount > 0) {
            $fStmt = $pdo->prepare("INSERT INTO financial_records (user_id, transaction_id, type, amount, date, payment_method, description, is_operational)
                                    VALUES (?, ?, 'income', ?, ?, ?, ?, 1)");
            $fStmt->execute([$userId, $transactionId, $paidAmount, $date, $paymentMethod, "Penjualan Nota $trxNumber"]);
        }

        // Jika Tempo / Belum Lunas, catat Piutang (Receivable)
        if ($paymentStatus !== 'paid' || $paidAmount < $totalAmount) {
            $remaining = $totalAmount - $paidAmount;
            $dueDate = !empty($_POST['due_date']) ? $_POST['due_date'] : date('Y-m-d', strtotime('+7 days'));
            $cName = !empty($customerName) ? $customerName : 'Pelanggan Nota ' . $trxNumber;

            $dStmt = $pdo->prepare("INSERT INTO debts (user_id, type, contact_name, customer_id, transaction_id, title, total_amount, paid_amount, remaining_amount, start_date, due_date, status, notes)
                                    VALUES (?, 'receivable', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $statusDebt = ($paidAmount > 0) ? 'partial' : 'unpaid';
            $dStmt->execute([$userId, $cName, $customerId, $transactionId, "Piutang Nota $trxNumber", $totalAmount, $paidAmount, $remaining, $date, $dueDate, $statusDebt, "Sisa tagihan penjualan tempo"]);

            // Update piutang customer jika ada customer_id
            if ($customerId) {
                $custUp = $pdo->prepare("UPDATE customers SET total_receivable = total_receivable + ? WHERE id = ? AND user_id = ?");
                $custUp->execute([$remaining, $customerId, $userId]);
            }
        }

        $pdo->commit();
        addAuditLog($pdo, $userId, 'CREATE_TRANSACTION', 'transaction', $trxNumber, "Penjualan $trxNumber sebesar " . formatRupiah($totalAmount));
        setFlashMessage('success', "Transaksi $trxNumber berhasil disimpan!");
        header("Location: ../pages/receipt.php?id=$transactionId");
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        setFlashMessage('error', 'Gagal memproses transaksi: ' . $e->getMessage());
        header('Location: ../pages/pos.php');
        exit;
    }
}

// 2. Batalkan Transaksi (Rollback Stok & Keuangan)
if ($action === 'cancel') {
    $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
    
    try {
        $pdo->beginTransaction();

        $tStmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ? FOR UPDATE");
        $tStmt->execute([$id, $userId]);
        $trx = $tStmt->fetch();

        if (!$trx || $trx['status'] === 'cancelled') {
            throw new Exception("Transaksi tidak valid atau sudah dibatalkan sebelumnya.");
        }

        // Kembalikan stok item
        $itemsStmt = $pdo->prepare("SELECT * FROM transaction_items WHERE transaction_id = ?");
        $itemsStmt->execute([$id]);
        $items = $itemsStmt->fetchAll();

        foreach ($items as $item) {
            if ($item['product_id']) {
                $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ? AND user_id = ?")
                    ->execute([$item['quantity'], $item['product_id'], $userId]);
            }
        }

        // Hapus catatan kas
        $pdo->prepare("DELETE FROM financial_records WHERE transaction_id = ? AND user_id = ?")->execute([$id, $userId]);

        // Tandai status cancelled
        $pdo->prepare("UPDATE transactions SET status = 'cancelled' WHERE id = ? AND user_id = ?")->execute([$id, $userId]);

        $pdo->commit();
        addAuditLog($pdo, $userId, 'CANCEL_TRANSACTION', 'transaction', $trx['transaction_number'], "Membatalkan transaksi {$trx['transaction_number']}");
        setFlashMessage('success', "Transaksi {$trx['transaction_number']} berhasil dibatalkan dan stok dikembalikan.");
    } catch (Exception $e) {
        $pdo->rollBack();
        setFlashMessage('error', 'Gagal membatalkan transaksi: ' . $e->getMessage());
    }

    header('Location: ../pages/transactions.php');
    exit;
}

header('Location: ../pages/transactions.php');
exit;
