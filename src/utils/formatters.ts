import { Transaction } from '../types';

/**
 * Format number to Indonesian Rupiah currency format
 * Example: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number, withPrefix = true): string {
  const safeAmount = isNaN(amount) ? 0 : Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(safeAmount);

  return withPrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Parse input string to positive number
 */
export function parseRupiahInput(value: string): number {
  if (!value) return 0;
  // Remove non-digit characters
  const cleanStr = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleanStr, 10);
  return isNaN(parsed) ? 0 : parsed;
}

const MONTH_NAMES_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT_INDO = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAY_NAMES_INDO = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export function getMonthNameIndo(monthIndex: number, short = false): string {
  return short ? MONTH_SHORT_INDO[monthIndex] || '' : MONTH_NAMES_INDO[monthIndex] || '';
}

/**
 * Format YYYY-MM-DD to Indonesian human-friendly date
 */
export function formatDateIndo(dateStr: string, formatType: 'short' | 'medium' | 'long' = 'medium'): string {
  if (!dateStr) return '-';
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('T')[0].split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);

    const dateObj = new Date(year, month, day);
    if (isNaN(dateObj.getTime())) return dateStr;

    if (formatType === 'short') {
      return `${day} ${MONTH_SHORT_INDO[month]}`;
    }
    if (formatType === 'medium') {
      return `${day} ${MONTH_SHORT_INDO[month]} ${year}`;
    }
    // long format: Kamis, 29 Oktober 2026
    const dayName = DAY_NAMES_INDO[dateObj.getDay()];
    return `${dayName}, ${day} ${MONTH_NAMES_INDO[month]} ${year}`;
  } catch {
    return dateStr;
  }
}

export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Export transactions to standard Indonesian CSV for Excel
 */
export function exportTransactionsToCSV(transactions: Transaction[], businessName: string): void {
  const headers = ['ID Transaksi', 'Tanggal', 'Tipe', 'Kategori', 'Nominal (Rp)', 'Metode Pembayaran', 'Keterangan', 'Catatan'];
  
  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
    `"${t.category}"`,
    t.amount,
    `"${t.paymentMethod}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [
    `"Laporan Pembukuan - ${businessName}"`,
    `"Diekspor pada: ${new Date().toLocaleString('id-ID')}"`,
    '',
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Pembukuan_${businessName.replace(/\s+/g, '_')}_${getCurrentDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
