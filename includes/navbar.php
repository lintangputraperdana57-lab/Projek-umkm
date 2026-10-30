<?php
$user = currentUser();
$flash = getFlashMessage();
?>
<div class="main-wrapper">
    <header class="topbar">
        <div class="topbar-left">
            <button id="sidebarToggle" class="btn btn-secondary btn-sm" style="display: none;">
                &#9776; Menu
            </button>
            <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin: 0;">
                <?= htmlspecialchars($pageTitle ?? 'Dashboard') ?>
            </h2>
        </div>

        <div class="topbar-right">
            <!-- Tombol Mode Gelap -->
            <button id="themeToggle" class="btn btn-secondary btn-sm" title="Ubah Tema Gelap/Terang">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                <span>Tema</span>
            </button>

            <!-- Transaksi Cepat POS -->
            <a href="pages/pos.php" class="btn btn-primary btn-sm">
                <span>+ Kasir POS</span>
            </a>

            <!-- Info Pengguna -->
            <div style="font-size: 0.825rem; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--success);"></span>
                <span><?= htmlspecialchars($user['name'] ?? 'Admin') ?></span>
            </div>
        </div>
    </header>

    <?php if ($flash): ?>
    <div style="padding: 1rem 1.5rem 0;">
        <div class="alert-auto-dismiss" style="padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; display: flex; justify-content: space-between; align-items: center; 
            <?= $flash['type'] === 'success' ? 'background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;' : 'background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;' ?>">
            <span><?= htmlspecialchars($flash['message']) ?></span>
            <span style="cursor: pointer;" onclick="this.parentElement.remove();">&times;</span>
        </div>
    </div>
    <?php endif; ?>

    <main class="content-body">
