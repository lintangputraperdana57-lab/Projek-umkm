/**
 * PEMBUKUAN UMKM PRO - CLIENT-SIDE SCRIPT
 * PWA Service Worker, Theme Toggle, POS Kalkulasi & Interaksi
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inisialisasi Mode Gelap / Terang
  initTheme();

  // 2. Inisialisasi PWA Service Worker
  initServiceWorker();

  // 3. Auto dismiss flash message
  initFlashMessages();

  // 4. Inisialisasi Form Kalkulator POS jika ada
  initPosCalculator();
});

function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('umkm_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('umkm_theme', newTheme);
    });
  }
}

function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('PWA Service Worker registered:', reg.scope))
      .catch(err => console.log('Service Worker failed:', err));
  }
}

function initFlashMessages() {
  const alerts = document.querySelectorAll('.alert-auto-dismiss');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.4s ease';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 400);
    }, 4500);
  });
}

function initPosCalculator() {
  const posContainer = document.getElementById('posForm');
  if (!posContainer) return;

  function recalculateTotal() {
    let subtotal = 0;
    const rows = document.querySelectorAll('.pos-item-row');
    rows.forEach(row => {
      const qty = parseFloat(row.querySelector('.item-qty')?.value || 0);
      const price = parseFloat(row.querySelector('.item-price')?.value || 0);
      const disc = parseFloat(row.querySelector('.item-discount')?.value || 0);
      const itemSubtotal = Math.max(0, (qty * price) - disc);
      
      const subtotalLabel = row.querySelector('.item-subtotal');
      if (subtotalLabel) {
        subtotalLabel.textContent = formatRupiahJs(itemSubtotal);
      }
      subtotal += itemSubtotal;
    });

    const globalDiscount = parseFloat(document.getElementById('posGlobalDiscount')?.value || 0);
    const finalTotal = Math.max(0, subtotal - globalDiscount);

    const subtotalDisplay = document.getElementById('posSubtotalDisplay');
    const grandTotalDisplay = document.getElementById('posGrandTotalDisplay');
    const totalInput = document.getElementById('posTotalAmountInput');

    if (subtotalDisplay) subtotalDisplay.textContent = formatRupiahJs(subtotal);
    if (grandTotalDisplay) grandTotalDisplay.textContent = formatRupiahJs(finalTotal);
    if (totalInput) totalInput.value = finalTotal;

    // Hitung kembalian
    const paidAmount = parseFloat(document.getElementById('posPaidAmountInput')?.value || 0);
    const changeDisplay = document.getElementById('posChangeDisplay');
    const changeInput = document.getElementById('posChangeAmountInput');
    const change = Math.max(0, paidAmount - finalTotal);

    if (changeDisplay) changeDisplay.textContent = formatRupiahJs(change);
    if (changeInput) changeInput.value = change;
  }

  posContainer.addEventListener('input', recalculateTotal);
  recalculateTotal();
}

function formatRupiahJs(num) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
}

// Konfirmasi hapus data
function confirmDelete(message = 'Apakah Anda yakin ingin menghapus data ini?') {
  return confirm(message);
}
