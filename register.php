<?php
require_once __DIR__ . '/config/app.php';
require_once __DIR__ . '/helpers/functions.php';

if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

$flash = getFlashMessage();
$csrfToken = generateCsrfToken();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar Usaha Baru - Pembukuan UMKM</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="manifest" href="manifest.webmanifest">
    <style>
        .auth-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 1.5rem;
        }
        .auth-card {
            background-color: var(--bg-card);
            border-radius: 16px;
            width: 100%;
            max-width: 480px;
            padding: 2.25rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <h1 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">Registrasi Akun UMKM</h1>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Mulai pembukuan terstruktur dan rapi untuk usaha Anda</p>
            </div>

            <?php if ($flash): ?>
                <div style="padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.25rem;
                    <?= $flash['type'] === 'success' ? 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;' ?>">
                    <?= htmlspecialchars($flash['message']) ?>
                </div>
            <?php endif; ?>

            <form action="actions/auth_action.php" method="POST">
                <input type="hidden" name="action" value="register">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">

                <div class="form-group">
                    <label class="form-label" for="name">Nama Pemilik Usaha *</label>
                    <input type="text" id="name" name="name" class="form-control" placeholder="Contoh: Budi Pratama" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="business_name">Nama Usaha / Toko *</label>
                    <input type="text" id="business_name" name="business_name" class="form-control" placeholder="Contoh: Toko Berkah Sejahtera" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label" for="email">Alamat Email *</label>
                        <input type="email" id="email" name="email" class="form-control" placeholder="admin@toko.id" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="phone">Nomor Telepon / WA</label>
                        <input type="tel" id="phone" name="phone" class="form-control" placeholder="08123456789">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label" for="password">Kata Sandi *</label>
                        <input type="password" id="password" name="password" class="form-control" placeholder="Min. 6 digit" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password_confirm">Konfirmasi Sandi *</label>
                        <input type="password" id="password_confirm" name="password_confirm" class="form-control" placeholder="Ulangi sandi" required>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; margin-top: 0.75rem;">
                    Daftar Usaha Sekarang &rarr;
                </button>
            </form>

            <div style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
                Sudah memiliki akun? <a href="login.php" style="color: var(--accent-blue); font-weight: 600; text-decoration: none;">Masuk di Sini</a>
            </div>
        </div>
    </div>
</body>
</html>
