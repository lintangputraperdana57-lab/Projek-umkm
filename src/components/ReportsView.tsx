import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Building2, 
  PieChart as PieChartIcon,
  CreditCard,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { 
  formatRupiah, 
  formatDateIndo, 
  getMonthNameIndo, 
  getCurrentDateString,
  exportTransactionsToCSV 
} from '../utils/formatters';
import { PAYMENT_METHOD_LABELS } from '../types';

export const ReportsView: React.FC = () => {
  const { transactions, userProfile } = useBookkeeping();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [reportType, setReportType] = useState<'pnl' | 'cashflow' | 'payment_method'>('pnl');

  // Filter transactions for chosen month and year
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const [yearStr, monthStr] = t.date.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      return year === selectedYear && month === selectedMonth;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Income items breakdown
  const incomeBreakdown = useMemo(() => {
    const incomes = monthlyTransactions.filter(t => t.type === 'income');
    const map = new Map<string, number>();
    let total = 0;
    incomes.forEach(t => {
      const amt = Number(t.amount) || 0;
      total += amt;
      map.set(t.category, (map.get(t.category) || 0) + amt);
    });
    return {
      items: Array.from(map.entries()).sort((a, b) => b[1] - a[1]),
      total,
    };
  }, [monthlyTransactions]);

  // Expense items breakdown (Separating COGS/Bahan Baku from Operational Expenses)
  const expenseBreakdown = useMemo(() => {
    const expenses = monthlyTransactions.filter(t => t.type === 'expense');
    let totalCogs = 0; // HPP (Bahan Baku & Stok)
    let totalOpex = 0; // Beban Operasional
    const cogsItems: Array<[string, number]> = [];
    const opexMap = new Map<string, number>();

    expenses.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.category.toLowerCase().includes('bahan baku') || t.category.toLowerCase().includes('stok')) {
        totalCogs += amt;
        cogsItems.push([t.description || t.category, amt]);
      } else {
        totalOpex += amt;
        opexMap.set(t.category, (opexMap.get(t.category) || 0) + amt);
      }
    });

    return {
      totalCogs,
      totalOpex,
      totalExpense: totalCogs + totalOpex,
      opexItems: Array.from(opexMap.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [monthlyTransactions]);

  // Gross profit & Net profit
  const grossProfit = incomeBreakdown.total - expenseBreakdown.totalCogs;
  const netProfit = grossProfit - expenseBreakdown.totalOpex;
  const netProfitMargin = incomeBreakdown.total > 0 ? (netProfit / incomeBreakdown.total) * 100 : 0;

  // Breakdown by Payment Method
  const paymentMethodSummary = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; net: number }>();
    
    monthlyTransactions.forEach(t => {
      const pm = t.paymentMethod || 'cash';
      if (!map.has(pm)) {
        map.set(pm, { income: 0, expense: 0, net: 0 });
      }
      const item = map.get(pm)!;
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        item.income += amt;
        item.net += amt;
      } else {
        item.expense += amt;
        item.net -= amt;
      }
    });

    return Array.from(map.entries());
  }, [monthlyTransactions]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      
      {/* Header & Controls (Hidden in Print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Laporan Keuangan & Laba Rugi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Laporan pembukuan berstandar UMKM Indonesia siap cetak & unduh
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportTransactionsToCSV(monthlyTransactions, `${userProfile.businessName}_${getMonthNameIndo(selectedMonth)}_${selectedYear}`)}
              disabled={monthlyTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Unduh CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-all shadow-xs active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Filters: Month, Year, and Report Type */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-900" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {getMonthNameIndo(i)}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Report Type Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setReportType('pnl')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportType === 'pnl' ? 'bg-blue-900 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Laba Rugi (P&L)
            </button>
            <button
              onClick={() => setReportType('cashflow')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportType === 'cashflow' ? 'bg-blue-900 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Arus Kas
            </button>
            <button
              onClick={() => setReportType('payment_method')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reportType === 'payment_method' ? 'bg-blue-900 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Metode Bayar
            </button>
          </div>

        </div>
      </div>

      {/* Printable Financial Statement Container */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
              {userProfile.businessName}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {userProfile.businessAddress || 'Unit Usaha Mikro Kecil & Menengah (UMKM)'}
            </p>
            {userProfile.businessPhone && (
              <p className="text-xs text-slate-500">
                Kontak: {userProfile.businessPhone} • Pemilik: {userProfile.ownerName}
              </p>
            )}
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            <span className="inline-block px-3 py-1 rounded bg-blue-50 text-blue-900 text-xs font-bold border border-blue-200 uppercase">
              {reportType === 'pnl' ? 'Laporan Laba Rugi' : reportType === 'cashflow' ? 'Laporan Arus Kas' : 'Rekap Metode Bayar'}
            </span>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              Periode: {getMonthNameIndo(selectedMonth)} {selectedYear}
            </p>
            <p className="text-[10px] text-slate-400">
              Dicetak pada: {formatDateIndo(getCurrentDateString(), 'medium')}
            </p>
          </div>
        </div>

        {/* REPORT CONTENT: 1. LABA RUGI (INCOME STATEMENT) */}
        {reportType === 'pnl' && (
          <div className="space-y-6">
            
            {/* 1. Pendapatan Usaha */}
            <div>
              <div className="bg-slate-100 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-800 flex justify-between">
                <span>1. PENDAPATAN OPERASIONAL</span>
                <span>JUMLAH (RP)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs mt-1">
                {incomeBreakdown.items.length === 0 ? (
                  <p className="py-3 text-slate-400 italic px-3">Tidak ada pendapatan di periode ini</p>
                ) : (
                  incomeBreakdown.items.map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between py-2 px-3 hover:bg-slate-50">
                      <span className="text-slate-700">{cat}</span>
                      <span className="font-mono font-medium text-slate-900">{formatRupiah(amt)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between py-2.5 px-3 bg-emerald-50/60 font-bold text-emerald-900">
                  <span>TOTAL PENDAPATAN (A)</span>
                  <span className="font-mono text-sm">{formatRupiah(incomeBreakdown.total)}</span>
                </div>
              </div>
            </div>

            {/* 2. Harga Pokok Penjualan / Bahan Baku */}
            <div>
              <div className="bg-slate-100 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-800 flex justify-between">
                <span>2. HARGA POKOK PENJUALAN / BAHAN BAKU (HPP)</span>
                <span>JUMLAH (RP)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs mt-1">
                <div className="flex justify-between py-2 px-3">
                  <span className="text-slate-700">Pembelian Bahan Baku, Kemasan & Stok Dagang</span>
                  <span className="font-mono font-medium text-slate-900">{formatRupiah(expenseBreakdown.totalCogs)}</span>
                </div>
                <div className="flex justify-between py-2.5 px-3 bg-slate-50 font-bold text-slate-800">
                  <span>TOTAL BEBAN POKOK (B)</span>
                  <span className="font-mono text-sm">{formatRupiah(expenseBreakdown.totalCogs)}</span>
                </div>
              </div>
            </div>

            {/* 3. Laba Kotor */}
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex justify-between items-center text-xs sm:text-sm font-bold text-blue-950">
              <span>LABA KOTOR (A - B)</span>
              <span className="font-mono text-base">{formatRupiah(grossProfit)}</span>
            </div>

            {/* 4. Beban Operasional Usaha */}
            <div>
              <div className="bg-slate-100 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-800 flex justify-between">
                <span>3. BEBAN OPERASIONAL USAHA</span>
                <span>JUMLAH (RP)</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs mt-1">
                {expenseBreakdown.opexItems.length === 0 ? (
                  <p className="py-3 text-slate-400 italic px-3">Tidak ada beban operasional lain di periode ini</p>
                ) : (
                  expenseBreakdown.opexItems.map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between py-2 px-3 hover:bg-slate-50">
                      <span className="text-slate-700">{cat}</span>
                      <span className="font-mono font-medium text-slate-900">{formatRupiah(amt)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between py-2.5 px-3 bg-rose-50/60 font-bold text-rose-900">
                  <span>TOTAL BEBAN OPERASIONAL (C)</span>
                  <span className="font-mono text-sm">{formatRupiah(expenseBreakdown.totalOpex)}</span>
                </div>
              </div>
            </div>

            {/* 5. Laba Bersih Akhir (Bottom Line) */}
            <div className={`p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              netProfit >= 0 ? 'bg-emerald-50 border-emerald-500 text-emerald-950' : 'bg-rose-50 border-rose-500 text-rose-950'
            }`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  {netProfit >= 0 ? 'LABA BERSIH OPERASIONAL (NET PROFIT)' : 'RUGI BERSIH OPERASIONAL'}
                </p>
                <p className="text-xs opacity-75">
                  Margin Laba Bersih: {netProfitMargin.toFixed(1)}% dari total omzet pendapatan
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-black font-mono tracking-tight">
                {formatRupiah(netProfit)}
              </p>
            </div>

          </div>
        )}

        {/* REPORT CONTENT: 2. ARUS KAS (CASH FLOW) */}
        {reportType === 'cashflow' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-700 uppercase">Total Kas Masuk</span>
                <p className="text-xl font-extrabold text-emerald-800 font-mono mt-1">
                  +{formatRupiah(incomeBreakdown.total)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-xs font-bold text-rose-700 uppercase">Total Kas Keluar</span>
                <p className="text-xl font-extrabold text-rose-800 font-mono mt-1">
                  -{formatRupiah(expenseBreakdown.totalExpense)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-xs font-bold text-blue-900 uppercase">Arus Kas Bersih (Net Cash)</span>
                <p className="text-xl font-extrabold text-blue-950 font-mono mt-1">
                  {formatRupiah(incomeBreakdown.total - expenseBreakdown.totalExpense)}
                </p>
              </div>
            </div>

            {/* Cash Flow Activity Table */}
            <div>
              <div className="bg-slate-100 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-800 flex justify-between">
                <span>Rincian Arus Kas Periode {getMonthNameIndo(selectedMonth)} {selectedYear}</span>
                <span>Nominal</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs mt-1">
                <div className="flex justify-between py-2 px-3 font-semibold text-slate-800">
                  <span>Arus Kas dari Aktivitas Penjualan & Jasa</span>
                  <span className="font-mono text-emerald-600">+{formatRupiah(incomeBreakdown.total)}</span>
                </div>
                <div className="flex justify-between py-2 px-3 font-semibold text-slate-800">
                  <span>Arus Kas untuk Belanja Stok & Bahan Baku</span>
                  <span className="font-mono text-rose-600">-{formatRupiah(expenseBreakdown.totalCogs)}</span>
                </div>
                <div className="flex justify-between py-2 px-3 font-semibold text-slate-800">
                  <span>Arus Kas untuk Biaya Operasional, Gaji, Sewa & Utilitas</span>
                  <span className="font-mono text-rose-600">-{formatRupiah(expenseBreakdown.totalOpex)}</span>
                </div>
                <div className="flex justify-between py-3 px-3 bg-slate-50 font-bold text-slate-900 border-t border-slate-300">
                  <span>KENAIKAN / (PENURUNAN) KAS BERSIH PERIODE INI</span>
                  <span className="font-mono text-sm">{formatRupiah(incomeBreakdown.total - expenseBreakdown.totalExpense)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT CONTENT: 3. METODE PEMBAYARAN */}
        {reportType === 'payment_method' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Rekapitulasi persebaran transaksi berdasarkan jalur pembayaran yang digunakan pelanggan dan pengeluaran usaha:
            </p>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 grid grid-cols-4">
                <span>Metode Pembayaran</span>
                <span className="text-right">Uang Masuk</span>
                <span className="text-right">Uang Keluar</span>
                <span className="text-right">Saldo Bersih</span>
              </div>

              {paymentMethodSummary.length === 0 ? (
                <p className="py-6 text-center text-slate-400 italic">Belum ada transaksi di bulan ini</p>
              ) : (
                paymentMethodSummary.map(([pm, val]) => {
                  const label = (PAYMENT_METHOD_LABELS as Record<string, { label: string }>)[pm]?.label || pm;
                  return (
                    <div key={pm} className="px-4 py-3 grid grid-cols-4 hover:bg-slate-50 items-center">
                      <span className="font-semibold text-slate-800">{label}</span>
                      <span className="text-right font-mono text-emerald-600 font-medium">
                        +{formatRupiah(val.income)}
                      </span>
                      <span className="text-right font-mono text-rose-600 font-medium">
                        -{formatRupiah(val.expense)}
                      </span>
                      <span className={`text-right font-mono font-bold ${
                        val.net >= 0 ? 'text-slate-900' : 'text-rose-600'
                      }`}>
                        {formatRupiah(val.net)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Official Sign-off Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-600">
          <div>
            <p>Disiapkan Oleh:</p>
            <div className="h-16 flex items-end justify-center font-bold text-slate-900">
              {userProfile.ownerName || 'Pemilik Usaha'}
            </div>
            <p className="text-[11px] text-slate-400">Bagian Keuangan / Pemilik</p>
          </div>
          <div>
            <p>Mengetahui / Disetujui:</p>
            <div className="h-16 flex items-end justify-center font-bold text-slate-900">
              {userProfile.businessName}
            </div>
            <p className="text-[11px] text-slate-400">Pimpinan Usaha</p>
          </div>
        </div>

      </div>

    </div>
  );
};
