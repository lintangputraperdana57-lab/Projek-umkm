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
    <title>Masuk - Pembukuan UMKM</title>
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
            max-width: 440px;
            padding: 2.25rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .demo-box {
            background-color: #eff6ff;
            border: 1px dashed #3b82f6;
            border-radius: 10px;
            padding: 0.85rem;
            margin-bottom: 1.25rem;
            font-size: 0.8rem;
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div style="text-align: center; margin-bottom: 1.75rem;">
                <div style="width: 48px; height: 48px; background: #2563eb; color: #fff; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.25rem; margin-bottom: 0.75rem;">
                    UP
                </div>
                <h1 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main);">Pembukuan UMKM</h1>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Masuk untuk mengelola keuangan & bisnis Anda</p>
            </div>

            <?php if ($flash): ?>
                <div style="padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.25rem;
                    <?= $flash['type'] === 'success' ? 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;' ?>">
                    <?= htmlspecialchars($flash['message']) ?>
                </div>
            <?php endif; ?>

            <!-- Tab Switcher: Owner vs Karyawan -->
            <div style="display: flex; background: #f1f5f9; border-radius: 10px; p-1; margin-bottom: 1.25rem; padding: 4px;">
                <button type="button" id="tabOwnerBtn" onclick="switchTab('owner')" style="flex: 1; padding: 0.5rem; font-size: 0.8rem; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    Pemilik Usaha
                </button>
                <button type="button" id="tabStaffBtn" onclick="switchTab('staff')" style="flex: 1; padding: 0.5rem; font-size: 0.8rem; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; background: transparent; color: #64748b;">
                    Karyawan / Kode Akses
                </button>
            </div>

            <!-- FORM 1: PEMILIK USAHA -->
            <div id="ownerSection">
                <!-- Kotak Demo Login Cepat -->
                <div class="demo-box">
                    <div style="font-weight: 700; margin-bottom: 0.25rem;">Akun Demo Pemilik:</div>
                    <div>Email: <strong>admin@umkmpro.id</strong></div>
                    <div>Password: <strong>password123</strong></div>
                    <button type="button" onclick="fillDemo()" class="btn btn-sm btn-secondary" style="margin-top: 0.5rem; width: 100%;">
                        Gunakan Akun Demo Pemilik
                    </button>
                </div>

                <form action="actions/auth_action.php" method="POST">
                    <input type="hidden" name="action" value="login">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">

                    <div class="form-group">
                        <label class="form-label" for="email">Alamat Email</label>
                        <input type="email" id="email" name="email" class="form-control" placeholder="nama@usaha.com" autofocus>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="password">Kata Sandi</label>
                        <input type="password" id="password" name="password" class="form-control" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;">
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; margin-top: 0.5rem;">
                        Masuk Sebagai Pemilik &rarr;
                    </button>
                </form>
            </div>

            <!-- FORM 2: KARYAWAN (KODE AKSES & PIN) -->
            <div id="staffSection" style="display: none;">
                <div class="demo-box" style="background-color: #f5f3ff; border-color: #8b5cf6; color: #5b21b6;">
                    <div style="font-weight: 700; margin-bottom: 0.25rem;">Pilihan Cepat Shift Karyawan:</div>
                    <div style="font-size: 0.75rem; margin-bottom: 0.4rem;">Kode Toko: <strong>UMKM-9824</strong></div>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        <button type="button" onclick="fillStaffDemo('UMKM-9824', '1234')" class="btn btn-sm" style="background: #fff; border: 1px solid #c4b5fd; color: #6d28d9; padding: 3px 8px; font-size: 0.75rem;">
                            Kasir: Siti (1234)
                        </button>
                        <button type="button" onclick="fillStaffDemo('UMKM-9824', '5678')" class="btn btn-sm" style="background: #fff; border: 1px solid #c4b5fd; color: #6d28d9; padding: 3px 8px; font-size: 0.75rem;">
                            Gudang: Dimas (5678)
                        </button>
                    </div>
                </div>

                <form action="actions/auth_action.php" method="POST">
                    <input type="hidden" name="action" value="staff_login">
                    <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">

                    <div class="form-group">
                        <label class="form-label" for="access_code">Kode Akses Toko / Usaha</label>
                        <input type="text" id="access_code" name="access_code" class="form-control" placeholder="UMKM-9824" style="text-transform: uppercase; font-family: monospace; font-weight: 700; letter-spacing: 1px;" required>
                        <small style="font-size: 0.75rem; color: var(--text-muted);">Minta kode toko ke pemilik usaha Anda</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="pin">PIN Akses Karyawan (4-6 Digit)</label>
                        <input type="password" id="pin" name="pin" maxlength="6" class="form-control" placeholder="••••" style="font-family: monospace; font-size: 1.1rem; letter-spacing: 3px;" required>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; margin-top: 0.5rem; background: #1e3a8a;">
                        Masuk Shift Karyawan &rarr;
                    </button>
                </form>
            </div>

            <div style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
                Belum punya akun usaha? <a href="register.php" style="color: var(--accent-blue); font-weight: 600; text-decoration: none;">Daftar Gratis</a>
            </div>
        </div>
    </div>

    <script>
        function switchTab(mode) {
            const ownerSec = document.getElementById('ownerSection');
            const staffSec = document.getElementById('staffSection');
            const ownerBtn = document.getElementById('tabOwnerBtn');
            const staffBtn = document.getElementById('tabStaffBtn');

            if (mode === 'staff') {
                ownerSec.style.display = 'none';
                staffSec.style.display = 'block';
                staffBtn.style.background = '#fff';
                staffBtn.style.color = '#0f172a';
                staffBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                ownerBtn.style.background = 'transparent';
                ownerBtn.style.color = '#64748b';
                ownerBtn.style.boxShadow = 'none';
                if (!document.getElementById('access_code').value) {
                    document.getElementById('access_code').value = 'UMKM-9824';
                }
            } else {
                ownerSec.style.display = 'block';
                staffSec.style.display = 'none';
                ownerBtn.style.background = '#fff';
                ownerBtn.style.color = '#0f172a';
                ownerBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                staffBtn.style.background = 'transparent';
                staffBtn.style.color = '#64748b';
                staffBtn.style.boxShadow = 'none';
            }
        }

        function fillDemo() {
            document.getElementById('email').value = 'admin@umkmpro.id';
            document.getElementById('password').value = 'password123';
        }

        function fillStaffDemo(code, pin) {
            document.getElementById('access_code').value = code;
            document.getElementById('pin').value = pin;
        }

        // Auto open staff tab if url param tab=staff
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tab') === 'staff') {
            switchTab('staff');
        }
    </script>
</body>
</html>
