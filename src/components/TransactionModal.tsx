import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Tag, 
  CreditCard, 
  FileText, 
  PlusCircle, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { 
  Transaction, 
  TransactionType, 
  PaymentMethod, 
  PAYMENT_METHOD_LABELS 
} from '../types';
import { 
  formatRupiah, 
  parseRupiahInput, 
  getCurrentDateString 
} from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  initialType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
  initialType = 'income',
}) => {
  const { categories, addTransaction, updateTransaction, addCategory } = useBookkeeping();

  const [type, setType] = useState<TransactionType>(initialType);
  const [rawAmount, setRawAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(getCurrentDateString());
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick category creation state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setRawAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description || '');
      setPaymentMethod(editingTransaction.paymentMethod || 'cash');
      setNotes(editingTransaction.notes || '');
    } else {
      setType(initialType);
      setRawAmount('');
      setDate(getCurrentDateString());
      setDescription('');
      setPaymentMethod('cash');
      setNotes('');
      // Auto-select first matching category
      const available = categories.filter(c => c.type === initialType);
      if (available.length > 0) {
        setCategory(available[0].name);
      } else {
        setCategory('');
      }
    }
    setFormError(null);
  }, [editingTransaction, initialType, isOpen]);

  // When type changes in create mode, default to first category of that type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const available = categories.filter(c => c.type === newType);
    if (available.length > 0) {
      setCategory(available[0].name);
    } else {
      setCategory('');
    }
  };

  const handleAmountAdd = (addValue: number) => {
    const current = parseRupiahInput(rawAmount);
    setRawAmount((current + addValue).toString());
  };

  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const success = await addCategory({
      name: newCatName.trim(),
      type,
      color: type === 'income' ? '#16a34a' : '#dc2626',
      icon: 'Tag',
      isDefault: false,
    });
    if (success) {
      setCategory(newCatName.trim());
      setNewCatName('');
      setShowAddCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numericAmount = parseRupiahInput(rawAmount);
    if (numericAmount <= 0) {
      setFormError('Nominal transaksi harus lebih besar dari Rp 0.');
      return;
    }

    if (!category.trim()) {
      setFormError('Silakan pilih kategori transaksi.');
      return;
    }

    if (!date) {
      setFormError('Silakan tentukan tanggal transaksi.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingTransaction) {
        const success = await updateTransaction(editingTransaction.id, {
          type,
          amount: numericAmount,
          category,
          date,
          description,
          paymentMethod,
          notes,
        });
        if (success) onClose();
      } else {
        const success = await addTransaction({
          type,
          amount: numericAmount,
          category,
          date,
          description: description || (type === 'income' ? 'Pemasukan Kas' : 'Pengeluaran Kas'),
          paymentMethod,
          notes,
          receiptUrl: '',
        });
        if (success) onClose();
      }
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentAmountNum = parseRupiahInput(rawAmount);
  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {editingTransaction ? 'Ubah Catatan Transaksi' : 'Catat Transaksi Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              Catat mutasi arus kas UMKM dengan rapi dan akurat
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Error Message */}
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Type Selector (Pemasukan vs Pengeluaran) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Pemasukan (+)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                <span>Pengeluaran (-)</span>
              </button>
            </div>
          </div>

          {/* Amount Input with Rupiah format */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Transaksi (Rp) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="text-slate-500 font-bold text-base">Rp</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={rawAmount ? formatRupiah(currentAmountNum, false) : ''}
                onChange={(e) => setRawAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-lg sm:text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 font-mono"
                required
              />
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: '+10rb', val: 10000 },
                { label: '+50rb', val: 50000 },
                { label: '+100rb', val: 100000 },
                { label: '+500rb', val: 50000 },
                { label: '+1 Jt', val: 1000000 },
              ].map(chip => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => handleAmountAdd(chip.val)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 active:scale-95 transition-transform"
                >
                  {chip.label}
                </button>
              ))}
              {currentAmountNum > 0 && (
                <button
                  type="button"
                  onClick={() => setRawAmount('')}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-xs font-semibold text-blue-800 hover:text-blue-900 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{showAddCategory ? 'Batal' : '+ Kategori Baru'}</span>
              </button>
            </div>

            {showAddCategory ? (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 mb-2">
                <span className="text-xs font-medium text-blue-900">Buat Kategori {type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Baru:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Contoh: Kemitraan, Listrik Cabang 2..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddCategory}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-900 text-white rounded-lg hover:bg-blue-800"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            ) : null}

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900"
              required
            >
              <option value="" disabled>-- Pilih Kategori --</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Nama Barang / Jasa
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Penjualan 10 botol kopi susu, belanja beras..."
              maxLength={250}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nomor resi, nama vendor / pembeli, rincian pembayaran..."
              rows={2}
              maxLength={500}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : editingTransaction ? 'Perbarui Data' : 'Simpan Transaksi'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
