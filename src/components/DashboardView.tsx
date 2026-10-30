import React, { useMemo } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Target, 
  Calendar, 
  Receipt, 
  ChevronRight, 
  Layers, 
  BarChart3,
  ArrowRight,
  ScanLine,
  QrCode
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { 
  formatRupiah, 
  formatDateIndo, 
  getCurrentDateString 
} from '../utils/formatters';
import { Transaction, PAYMENT_METHOD_LABELS } from '../types';

interface DashboardViewProps {
  onOpenAddModal: (type?: 'income' | 'expense') => void;
  onEditTransaction: (tx: Transaction) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddModal,
  onEditTransaction,
  setActiveTab,
}) => {
  const { transactions, userProfile, metrics } = useBookkeeping();

  const todayStr = getCurrentDateString();

  // Top 5 recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Expenses by Category calculation
  const categoryExpenseBreakdown = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExp = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const map = new Map<string, number>();
    expenses.forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + (Number(t.amount) || 0));
    });

    const list = Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { list: list.slice(0, 5), totalExp };
  }, [transactions]);

  // Trend data for the last 7 recorded days
  const chartData = useMemo(() => {
    // Group transactions by date
    const dateMap = new Map<string, { income: number; expense: number }>();
    
    // Get unique dates sorted
    const sortedDates = Array.from(new Set(transactions.map(t => t.date))).sort();
    const lastDates = sortedDates.slice(-7);

    lastDates.forEach(date => {
      dateMap.set(date, { income: 0, expense: 0 });
    });

    transactions.forEach(t => {
      if (dateMap.has(t.date)) {
        const item = dateMap.get(t.date)!;
        if (t.type === 'income') item.income += Number(t.amount) || 0;
        if (t.type === 'expense') item.expense += Number(t.amount) || 0;
      }
    });

    const entries = Array.from(dateMap.entries()).map(([date, values]) => ({
      date,
      displayDate: formatDateIndo(date, 'short'),
      ...values,
    }));

    const maxVal = Math.max(
      ...entries.map(e => Math.max(e.income, e.expense)),
      100000
    );

    return { entries, maxVal };
  }, [transactions]);

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Layers className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-blue-100 backdrop-blur-xs mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateIndo(todayStr, 'long')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {userProfile.businessName}
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
              Pantau kesehatan finansial usaha Anda secara berkala untuk menjaga arus kas tetap sehat dan menguntungkan.
            </p>
          </div>

          {/* Quick Action Buttons on Banner */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={() => onOpenAddModal('income')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
              <span>+ Pemasukan</span>
            </button>
            <button
              onClick={() => onOpenAddModal('expense')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>+ Pengeluaran</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Saldo Kas (Cash Balance) */}
        <div className="bg-white rounded-2xl p-5 border-2 border-blue-900/20 shadow-xs relative overflow-hidden group hover:border-blue-900 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saldo Kas
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-4 h-4 text-blue-200" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
            {formatRupiah(metrics.cashBalance)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Sisa dana likuid riil saat ini</span>
          </div>
        </div>

        {/* Card 2: Total Pemasukan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Total Pemasukan
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight font-mono">
            {formatRupiah(metrics.totalIncome)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-700 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Arus uang masuk</span>
          </div>
        </div>

        {/* Card 3: Total Pengeluaran */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden hover:border-rose-500 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Total Pengeluaran
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight font-mono">
            {formatRupiah(metrics.totalExpense)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-rose-700 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Arus biaya & belanja</span>
          </div>
        </div>

        {/* Card 4: Laba Bersih (Net Profit) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden hover:border-blue-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Laba Bersih
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              metrics.netProfit >= 0 ? 'bg-blue-100 text-blue-900' : 'bg-rose-100 text-rose-700'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
            metrics.netProfit >= 0 ? 'text-blue-950' : 'text-rose-600'
          }`}>
            {formatRupiah(metrics.netProfit)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
            <span className="font-semibold text-blue-900">
              Margin: {metrics.profitMarginPercent.toFixed(1)}%
            </span>
            <span className="text-slate-400">dari pemasukan</span>
          </div>
        </div>

      </div>

      {/* UMKM Operations Grid: POS Shortcut, Low Stock Alert & Utang Piutang */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Shortcut Kasir POS */}
        <div 
          onClick={() => setActiveTab('pos')}
          className="bg-linear-to-br from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-blue-100 uppercase">Kasir POS</span>
            <h4 className="font-bold text-sm mt-1">Buka Mesin Kasir</h4>
            <p className="text-[11px] text-blue-200">Multi-item & cetak</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Shortcut Scan Nota OCR */}
        <div 
          onClick={() => setActiveTab('scanner')}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-indigo-400 transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">AI Scanner</span>
            <h4 className="font-bold text-sm text-slate-900 mt-1">Scan Nota Fisik</h4>
            <p className="text-[11px] text-slate-500">OCR & catat otomatis</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ScanLine className="w-4 h-4" />
          </div>
        </div>

        {/* Shortcut QRIS Meja Kasir */}
        <div 
          onClick={() => setActiveTab('qris')}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-rose-400 transition cursor-pointer flex items-center justify-between group"
        >
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 uppercase">Non-Tunai</span>
            <h4 className="font-bold text-sm text-slate-900 mt-1">QRIS Merchant</h4>
            <p className="text-[11px] text-slate-500">Standee & perbesar</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <QrCode className="w-4 h-4" />
          </div>
        </div>

        {/* Warning Stok Menipis */}
        <div 
          onClick={() => setActiveTab('products')}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-amber-400 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Inventaris</span>
            <h4 className="font-bold text-sm text-slate-900 mt-1">
              {metrics.lowStockCount > 0 ? `${metrics.lowStockCount} Stok Tipis` : 'Stok Aman'}
            </h4>
            <p className="text-[11px] text-slate-500">Kelola katalog produk</p>
          </div>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${metrics.lowStockCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* Utang & Piutang Summary */}
        <div 
          onClick={() => setActiveTab('debts')}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-blue-400 transition cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 uppercase">Tempo</span>
            <div className="text-xs font-bold mt-1">
              <span className="text-blue-900 block truncate">Piutang: {formatRupiah(metrics.totalReceivable)}</span>
              <span className="text-rose-600 font-semibold block truncate">Utang: {formatRupiah(metrics.totalPayable)}</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Target Laba Bulanan Progress */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Target Laba Bersih Bulanan</h3>
              <p className="text-xs text-slate-500">
                Target: {formatRupiah(userProfile.monthlyProfitTarget || 10000000)} per bulan
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 self-start sm:self-auto">
            Tercapai {metrics.targetProgressPercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-700 to-indigo-600 transition-all duration-500"
            style={{ width: `${Math.min(metrics.targetProgressPercent, 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 font-medium">
          <span>Tercapai: {formatRupiah(Math.max(0, metrics.netProfit))}</span>
          <span>
            {metrics.netProfit >= (userProfile.monthlyProfitTarget || 10000000)
              ? 'Target Telah Tercapai! 🎉'
              : `Kurang: ${formatRupiah(Math.max(0, (userProfile.monthlyProfitTarget || 10000000) - metrics.netProfit))}`}
          </span>
        </div>
      </div>

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow Comparison Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">
                  Grafik Arus Kas (Pemasukan vs Pengeluaran)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-slate-600">Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-rose-500" />
                  <span className="text-slate-600">Pengeluaran</span>
                </div>
              </div>
            </div>

            {chartData.entries.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Belum ada data transaksi yang cukup untuk menampilkan grafik.
              </div>
            ) : (
              <div className="pt-4 pb-2">
                {/* Responsive SVG Bar Chart */}
                <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200 pb-2">
                  {chartData.entries.map((item, idx) => {
                    const incHeight = (item.income / chartData.maxVal) * 100;
                    const expHeight = (item.expense / chartData.maxVal) * 100;

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white text-[11px] rounded-lg p-2 shadow-lg pointer-events-none z-20 whitespace-nowrap">
                          <p className="font-bold text-slate-200">{item.date}</p>
                          <p className="text-emerald-400">Masuk: {formatRupiah(item.income)}</p>
                          <p className="text-rose-400">Keluar: {formatRupiah(item.expense)}</p>
                        </div>

                        {/* Bars */}
                        <div className="w-full flex items-end justify-center gap-1 h-44">
                          <div
                            style={{ height: `${Math.max(incHeight, 4)}%` }}
                            className="w-1/2 max-w-[20px] bg-emerald-500 hover:bg-emerald-600 rounded-t-sm transition-all"
                            title={`Pemasukan: ${formatRupiah(item.income)}`}
                          />
                          <div
                            style={{ height: `${Math.max(expHeight, 4)}%` }}
                            className="w-1/2 max-w-[20px] bg-rose-500 hover:bg-rose-600 rounded-t-sm transition-all"
                            title={`Pengeluaran: ${formatRupiah(item.expense)}`}
                          />
                        </div>

                        {/* Label */}
                        <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                          {item.displayDate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Menampilkan data mutasi 7 hari transaksi terakhir</span>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-blue-900 font-bold hover:underline flex items-center gap-1"
            >
              Lihat Laporan Lengkap
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top 5 Expense Categories Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Alokasi Pengeluaran Terbesar
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {formatRupiah(categoryExpenseBreakdown.totalExp)}
              </span>
            </div>

            {categoryExpenseBreakdown.list.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400">
                Belum ada data pengeluaran.
              </p>
            ) : (
              <div className="space-y-3.5">
                {categoryExpenseBreakdown.list.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[160px]">
                        {cat.name}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 font-mono">
                          {formatRupiah(cat.amount)}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-1">
                          ({cat.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-blue-900 transition-all duration-300"
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('transactions')}
              className="w-full py-2 text-center text-xs font-semibold text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Rincian Pengeluaran Selengkapnya &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Transaksi Terkini
            </h3>
            <p className="text-xs text-slate-500">
              Catatan mutasi pemasukan dan pengeluaran terbaru
            </p>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Semua Transaksi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada transaksi yang tercatat. Klik tombol di atas untuk mulai mencatat!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const payMethod = PAYMENT_METHOD_LABELS[tx.paymentMethod] || { short: tx.paymentMethod };

              return (
                <div 
                  key={tx.id} 
                  onClick={() => onEditTransaction(tx)}
                  className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isIncome ? (
                        <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {tx.description || (isIncome ? 'Pemasukan' : 'Pengeluaran')}
                        </span>
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {payMethod.short}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700">{tx.category}</span>
                        <span>•</span>
                        <span>{formatDateIndo(tx.date, 'short')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-sm sm:text-base font-extrabold font-mono ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                    </span>
                    <p className="text-[10px] text-slate-400 sm:hidden">
                      {payMethod.short}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
