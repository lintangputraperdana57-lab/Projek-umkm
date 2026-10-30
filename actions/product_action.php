<?php
/**
 * Action Handler: CRUD Produk & Persediaan
 */

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/functions.php';

requireAuth();

$pdo = Database::getConnection();
$user = currentUser();
$userId = $user['id'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

// Verifikasi CSRF pada request POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrfToken($_POST['csrf_token'] ?? '')) {
        setFlashMessage('error', 'Token keamanan CSRF tidak sah.');
        header('Location: ../pages/products.php');
        exit;
    }
}

// 1. Simpan Produk Baru
if ($action === 'create') {
    $sku = trim($_POST['sku'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $categoryId = !empty($_POST['category_id']) ? (int)$_POST['category_id'] : null;
    $costPrice = (float)($_POST['cost_price'] ?? 0);
    $sellingPrice = (float)($_POST['selling_price'] ?? 0);
    $stock = (int)($_POST['stock'] ?? 0);
    $minStock = (int)($_POST['min_stock'] ?? 5);
    $unit = trim($_POST['unit'] ?? 'pcs');
    $description = trim($_POST['description'] ?? '');

    if (empty($name)) {
        setFlashMessage('error', 'Nama produk wajib diisi.');
        header('Location: ../pages/products.php');
        exit;
    }

    // Generate SKU otomatis jika kosong
    if (empty($sku)) {
        $sku = 'SKU-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $name), 0, 3)) . '-' . rand(100, 999);
    }

    // Cek duplikasi SKU per user
    $checkSku = $pdo->prepare("SELECT id FROM products WHERE user_id = ? AND sku = ? LIMIT 1");
    $checkSku->execute([$userId, $sku]);
    if ($checkSku->fetch()) {
        setFlashMessage('error', "Kode SKU '$sku' sudah digunakan produk lain.");
        header('Location: ../pages/products.php');
        exit;
    }

    // Proses Upload Gambar Produk
    $imageUrl = trim($_POST['image_url'] ?? '');
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $fileTmp = $_FILES['image']['tmp_name'];
        $fileName = $_FILES['image']['name'];
        $fileSize = $_FILES['image']['size'];
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

        if (in_array($ext, $allowed) && $fileSize <= 3 * 1024 * 1024) {
            $uploadDir = UPLOADS_PATH . '/products';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0775, true);
            }
            $newFileName = 'prod_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            $destPath = $uploadDir . '/' . $newFileName;
            if (move_uploaded_file($fileTmp, $destPath)) {
                $imageUrl = 'uploads/products/' . $newFileName;
            }
        }
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO products (user_id, category_id, sku, name, description, cost_price, selling_price, stock, min_stock, unit, image_url, status)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
        $stmt->execute([$userId, $categoryId, $sku, $name, $description, $costPrice, $sellingPrice, $stock, $minStock, $unit, $imageUrl]);
        $productId = (int)$pdo->lastInsertId();

        // Catat stok awal ke mutasi
        if ($stock > 0) {
            $sm = $pdo->prepare("INSERT INTO stock_movements (user_id, product_id, movement_type, quantity, before_stock, after_stock, reason)
                                 VALUES (?, ?, 'initial', ?, 0, ?, 'Stok awal penambahan produk baru')");
            $sm->execute([$userId, $productId, $stock, $stock]);
        }

        $pdo->commit();
        addAuditLog($pdo, $userId, 'CREATE_PRODUCT', 'product', (string)$productId, "Menambahkan produk baru: $name ($sku)");
        setFlashMessage('success', "Produk '$name' berhasil ditambahkan!");
    } catch (Exception $e) {
        $pdo->rollBack();
        setFlashMessage('error', 'Gagal menambahkan produk: ' . $e->getMessage());
    }

    header('Location: ../pages/products.php');
    exit;
}

// 2. Perbarui Produk
if ($action === 'update') {
    $id = (int)($_POST['id'] ?? 0);
    $sku = trim($_POST['sku'] ?? '');
    $name = trim($_POST['name'] ?? '');
    $categoryId = !empty($_POST['category_id']) ? (int)$_POST['category_id'] : null;
    $costPrice = (float)($_POST['cost_price'] ?? 0);
    $sellingPrice = (float)($_POST['selling_price'] ?? 0);
    $minStock = (int)($_POST['min_stock'] ?? 5);
    $unit = trim($_POST['unit'] ?? 'pcs');
    $description = trim($_POST['description'] ?? '');
    $imageUrl = trim($_POST['image_url'] ?? '');

    // Cek upload file gambar baru jika ada
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $fileTmp = $_FILES['image']['tmp_name'];
        $fileName = $_FILES['image']['name'];
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (in_array($ext, $allowed)) {
            $uploadDir = UPLOADS_PATH . '/products';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0775, true);
            }
            $newFileName = 'prod_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
            if (move_uploaded_file($fileTmp, $uploadDir . '/' . $newFileName)) {
                $imageUrl = 'uploads/products/' . $newFileName;
            }
        }
    }

    if (!empty($imageUrl)) {
        $stmt = $pdo->prepare("UPDATE products SET sku = ?, name = ?, category_id = ?, cost_price = ?, selling_price = ?, min_stock = ?, unit = ?, description = ?, image_url = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$sku, $name, $categoryId, $costPrice, $sellingPrice, $minStock, $unit, $description, $imageUrl, $id, $userId]);
    } else {
        $stmt = $pdo->prepare("UPDATE products SET sku = ?, name = ?, category_id = ?, cost_price = ?, selling_price = ?, min_stock = ?, unit = ?, description = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$sku, $name, $categoryId, $costPrice, $sellingPrice, $minStock, $unit, $description, $id, $userId]);
    }

    addAuditLog($pdo, $userId, 'UPDATE_PRODUCT', 'product', (string)$id, "Memperbarui info produk: $name");
    setFlashMessage('success', "Data produk '$name' berhasil diperbarui.");
    header('Location: ../pages/products.php');
    exit;
}

// 3. Penyesuaian Stok (Stock Adjustment)
if ($action === 'adjust_stock') {
    $id = (int)($_POST['id'] ?? 0);
    $adjType = $_POST['adjustment_type'] ?? 'in'; // 'in', 'out', 'set'
    $qty = abs((int)($_POST['quantity'] ?? 0));
    $reason = trim($_POST['reason'] ?? 'Penyesuaian stok berkala');

    $prodStmt = $pdo->prepare("SELECT * FROM products WHERE id = ? AND user_id = ? LIMIT 1");
    $prodStmt->execute([$id, $userId]);
    $prod = $prodStmt->fetch();

    if (!$prod) {
        setFlashMessage('error', 'Produk tidak ditemukan.');
        header('Location: ../pages/products.php');
        exit;
    }

    $beforeStock = (int)$prod['stock'];
    $afterStock = $beforeStock;

    if ($adjType === 'in') {
        $afterStock = $beforeStock + $qty;
    } elseif ($adjType === 'out') {
        $afterStock = max(0, $beforeStock - $qty);
    } elseif ($adjType === 'set') {
        $afterStock = $qty;
    }

    try {
        $pdo->beginTransaction();

        $update = $pdo->prepare("UPDATE products SET stock = ? WHERE id = ? AND user_id = ?");
        $update->execute([$afterStock, $id, $userId]);

        $movement = $pdo->prepare("INSERT INTO stock_movements (user_id, product_id, movement_type, quantity, before_stock, after_stock, reason)
                                   VALUES (?, ?, 'adjustment', ?, ?, ?, ?)");
        $diff = $afterStock - $beforeStock;
        $movement->execute([$userId, $id, $diff, $beforeStock, $afterStock, $reason]);

        $pdo->commit();
        addAuditLog($pdo, $userId, 'ADJUST_STOCK', 'product', (string)$id, "Penyesuaian stok {$prod['name']}: dari $beforeStock ke $afterStock. Alasan: $reason");
        setFlashMessage('success', "Stok {$prod['name']} berhasil diperbarui menjadi $afterStock {$prod['unit']}.");
    } catch (Exception $e) {
        $pdo->rollBack();
        setFlashMessage('error', 'Gagal menyesuaikan stok: ' . $e->getMessage());
    }

    header('Location: ../pages/products.php');
    exit;
}

// 4. Hapus Produk
if ($action === 'delete') {
    $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $userId]);

    addAuditLog($pdo, $userId, 'DELETE_PRODUCT', 'product', (string)$id, "Menghapus produk ID $id");
    setFlashMessage('success', 'Produk berhasil dihapus.');
    header('Location: ../pages/products.php');
    exit;
}

header('Location: ../pages/products.php');
exit;
