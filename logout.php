<?php
require_once __DIR__ . '/config/app.php';
require_once __DIR__ . '/helpers/functions.php';

if (isLoggedIn()) {
    $pdo = Database::getConnection();
    addAuditLog($pdo, $_SESSION['user_id'], 'LOGOUT', 'auth', (string)$_SESSION['user_id'], 'User keluar dari sesi aplikasi');
    
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
}

header('Location: login.php');
exit;
