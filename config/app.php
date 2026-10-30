<?php
/**
 * Konfigurasi Utama Aplikasi Pembukuan UMKM
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Zona Waktu Indonesia Barat (WIB)
date_default_timezone_set('Asia/Jakarta');

define('APP_NAME', 'Pembukuan UMKM');
define('APP_VERSION', '1.0.0');
define('APP_URL', rtrim(getenv('APP_URL') ?: 'http://localhost:8000', '/'));

// Mode Aplikasi: 'development' atau 'production'
define('APP_ENV', getenv('APP_ENV') ?: 'development');

if (APP_ENV === 'development') {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    error_reporting(0);
}

// Lokasi Direktori
define('ROOT_PATH', dirname(__DIR__));
define('CONFIG_PATH', ROOT_PATH . '/config');
define('INCLUDES_PATH', ROOT_PATH . '/includes');
define('ACTIONS_PATH', ROOT_PATH . '/actions');
define('PAGES_PATH', ROOT_PATH . '/pages');
define('HELPERS_PATH', ROOT_PATH . '/helpers');
define('STORAGE_PATH', ROOT_PATH . '/storage');
define('UPLOADS_PATH', ROOT_PATH . '/uploads');

// Buat direktori storage dan uploads jika belum ada
if (!is_dir(STORAGE_PATH)) {
    @mkdir(STORAGE_PATH, 0775, true);
}
if (!is_dir(UPLOADS_PATH)) {
    @mkdir(UPLOADS_PATH, 0775, true);
}
