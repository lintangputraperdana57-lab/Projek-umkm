import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  Calendar, 
  Download, 
  AlertTriangle 
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { Transaction, TransactionType, PaymentMethod, PAYMENT_METHOD_LABELS } from '../types';
import { formatRupiah, formatDateIndo, getCurrentDateString, exportTransactionsToCSV } from '../utils/formatters';

interface TransactionsViewProps {
  onOpenAddModal: (type?: 'income' | 'expense') => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddModal,
  onEditTransaction,
}) => {
  const { transactions, categories, deleteTransaction, userProfile } = useBookkeeping();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | '7days' | 'this_month' | 'custom'>('this_month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(getCurrentDateString());

  // Delete confirmation modal state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const today = getCurrentDateString();
    const now = new Date();

    return transactions.filter(tx => {
      // 1. Type
      if (selectedType !== 'all' && tx.type !== selectedType) return false;

      // 2. Category
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      // 3. Payment Method
      if (selectedPayment !== 'all' && tx.paymentMethod !== selectedPayment) return false;

      // 4. Period
      if (periodFilter === 'today') {
        if (tx.date !== today) return false;
      } else if (periodFilter === '7days') {
        const txDate = new Date(tx.date);
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (periodFilter === 'this_month') {
        const [year, month] = tx.date.split('-');
        if (parseInt(year) !== now.getFullYear() || parseInt(month) !== (now.getMonth() + 1)) {
          return false;
        }
      } else if (periodFilter === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      // 5. Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchDesc = (tx.description || '').toLowerCase().includes(query);
        const matchNotes = (tx.notes || '').toLowerCase().includes(query);
        const matchCat = tx.category.toLowerCase().includes(query);
        const matchAmount = tx.amount.toString().includes(query);
        if (!matchDesc && !matchNotes && !matchCat && !matchAmount) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [
    transactions,
    selectedType,
    selectedCategory,
    selectedPayment,
    periodFilter,
    customStartDate,
    customEndDate,
    searchQuery
  ]);

  // Group transactions by date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filteredTransactions.forEach(tx => {
      if (!map.has(tx.date)) {
        map.set(tx.date, []);
      }
      map.get(tx.date)!.push(tx);
    });
    return Array.from(map.entries());
  }, [filteredTransactions]);

  // Filtered Totals
  const { filteredIncome, filteredExpense, filteredNet } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') inc += Number(t.amount) || 0;
      if (t.type === 'expense') exp += Number(t.amount) || 0;
    });
    return {
      filteredIncome: inc,
      filteredExpense: exp,
      filteredNet: inc - exp
    };
  }, [filteredTransactions]);

  const confirmDelete = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    await deleteTransaction(txToDelete.id);
    setIsDeleting(false);
    setTxToDelete(null);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Daftar & Mutasi Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola seluruh transaksi kas pemasukan dan pengeluaran UMKM
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportTransactionsToCSV(filteredTransactions, userProfile.businessName)}
            disabled={filteredTransactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => onOpenAddModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi berdasarkan nama barang, jasa, kategori, atau catatan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          
          {/* Type Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === 'income' ? 'bg-emerald-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedType === 'expense' ? 'bg-rose-600 text-white shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengeluaran
            </button>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium pb-1 sm:pb-0">
            {[
              { id: 'this_month', label: 'Bulan Ini' },
              { id: '7days', label: '7 Hari Terakhir' },
              { id: 'today', label: 'Hari Ini' },
              { id: 'all', label: 'Semua Periode' },
              { id: 'custom', label: 'Kustom' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id as any)}
                className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  periodFilter === p.id 
                    ? 'bg-blue-900 text-white font-bold' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

        </div>

        {/* Custom Date Range & Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          
          {periodFilter === 'custom' && (
            <div className="sm:col-span-3 flex flex-wrap items-center gap-2 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs">
              <span className="font-semibold text-blue-900">Rentang Tanggal:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 bg-white border border-blue-300 rounded-lg"
              />
              <span className="text-blue-900">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 bg-white border border-blue-300 rounded-lg"
              />
            </div>
          )}

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-900"
            >
              <option value="all">Semua Metode Pembayaran</option>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([k, item]) => (
                <option key={k} value={k}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button if active */}
          {(selectedType !== 'all' || selectedCategory !== 'all' || selectedPayment !== 'all' || periodFilter !== 'this_month' || searchQuery) && (
            <div className="flex items-center justify-end">
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedCategory('all');
                  setSelectedPayment('all');
                  setPeriodFilter('this_month');
                  setSearchQuery('');
                }}
                className="text-xs text-blue-900 font-bold hover:underline"
              >
                Reset Semua Filter
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Filtered Summary Card */}
      <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pemasukan Terfilter</p>
            <p className="text-base sm:text-lg font-extrabold text-emerald-600 font-mono">
              +{formatRupiah(filteredIncome)}
            </p>
          </div>
          <div className="border-l border-slate-300 pl-6">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pengeluaran Terfilter</p>
            <p className="text-base sm:text-lg font-extrabold text-rose-600 font-mono">
              -{formatRupiah(filteredExpense)}
            </p>
          </div>
        </div>

        <div className="text-right sm:border-l sm:border-slate-300 sm:pl-6">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Selisih Kas Terfilter</p>
          <p className={`text-base sm:text-lg font-extrabold font-mono ${
            filteredNet >= 0 ? 'text-blue-950' : 'text-rose-600'
          }`}>
            {formatRupiah(filteredNet)}
          </p>
        </div>
      </div>

      {/* Transactions List Grouped by Date */}
      {groupedByDate.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Tidak Ada Transaksi</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tidak ditemukan transaksi yang cocok dengan filter atau kata kunci pencarian saat ini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([date, txs]) => {
            const dayIncome = txs
              .filter(t => t.type === 'income')
              .reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0);
            const dayExpense = txs
              .filter(t => t.type === 'expense')
              .reduce((sum, curr) => sum + (Number(curr.amount) || 0), 0);

            return (
              <div key={date} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                
                {/* Date Header */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-900" />
                    <span className="font-bold text-slate-800">
                      {formatDateIndo(date, 'long')}
                    </span>
                    <span className="text-slate-400">({txs.length} transaksi)</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    {dayIncome > 0 && (
                      <span className="text-emerald-700 font-semibold">
                        +{formatRupiah(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-rose-700 font-semibold">
                        -{formatRupiah(dayExpense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date Transactions Items */}
                <div className="divide-y divide-slate-100">
                  {txs.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const payMethod = PAYMENT_METHOD_LABELS[tx.paymentMethod] || { short: tx.paymentMethod };

                    return (
                      <div 
                        key={tx.id}
                        className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3 group"
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
                                {tx.description || (isIncome ? 'Pemasukan Kas' : 'Pengeluaran Kas')}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                {payMethod.short}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="font-semibold text-slate-700">{tx.category}</span>
                              {tx.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-slate-500 truncate max-w-xs">{tx.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className={`text-sm sm:text-base font-extrabold font-mono ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                              title="Ubah Transaksi"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTxToDelete(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hapus Transaksi?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Catatan transaksi <span className="font-semibold text-slate-800">"{txToDelete.description || txToDelete.category}"</span> sebesar <span className="font-bold text-slate-900">{formatRupiah(txToDelete.amount)}</span> akan dihapus permanen.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
