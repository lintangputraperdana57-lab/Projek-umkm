<?php
/**
 * Action Handler: CRUD Pelanggan & Pemasok (Suppliers)
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
        setFlashMessage('error', 'Token keamanan CSRF tidak valid.');
        header('Location: ../pages/customers.php');
        exit;
    }
}

// 1. Tambah Pelanggan
if ($action === 'create_customer') {
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $notes = trim($_POST['notes'] ?? '');

    if (empty($name)) {
        setFlashMessage('error', 'Nama pelanggan wajib diisi.');
        header('Location: ../pages/customers.php');
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO customers (user_id, name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $name, $phone, $email, $address, $notes]);

    addAuditLog($pdo, $userId, 'CREATE_CUSTOMER', 'customer', (string)$pdo->lastInsertId(), "Menambahkan pelanggan: $name");
    setFlashMessage('success', "Pelanggan '$name' berhasil ditambahkan!");
    header('Location: ../pages/customers.php');
    exit;
}

// 2. Tambah Pemasok (Supplier)
if ($action === 'create_supplier') {
    $name = trim($_POST['name'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $address = trim($_POST['address'] ?? '');
    $notes = trim($_POST['notes'] ?? '');

    if (empty($name)) {
        setFlashMessage('error', 'Nama pemasok / supplier wajib diisi.');
        header('Location: ../pages/customers.php?tab=suppliers');
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO suppliers (user_id, name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $name, $phone, $email, $address, $notes]);

    addAuditLog($pdo, $userId, 'CREATE_SUPPLIER', 'supplier', (string)$pdo->lastInsertId(), "Menambahkan pemasok: $name");
    setFlashMessage('success', "Pemasok '$name' berhasil ditambahkan!");
    header('Location: ../pages/customers.php?tab=suppliers');
    exit;
}

// 3. Hapus Pelanggan
if ($action === 'delete_customer') {
    $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
    $pdo->prepare("DELETE FROM customers WHERE id = ? AND user_id = ?")->execute([$id, $userId]);
    setFlashMessage('success', 'Data pelanggan berhasil dihapus.');
    header('Location: ../pages/customers.php');
    exit;
}

// 4. Hapus Pemasok
if ($action === 'delete_supplier') {
    $id = (int)($_POST['id'] ?? $_GET['id'] ?? 0);
    $pdo->prepare("DELETE FROM suppliers WHERE id = ? AND user_id = ?")->execute([$id, $userId]);
    setFlashMessage('success', 'Data pemasok berhasil dihapus.');
    header('Location: ../pages/customers.php?tab=suppliers');
    exit;
}

header('Location: ../pages/customers.php');
exit;
