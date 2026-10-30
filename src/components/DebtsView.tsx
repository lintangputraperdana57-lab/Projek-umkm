import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft,
  X,
  CreditCard
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { formatRupiah, formatDateIndo, getCurrentDateString } from '../utils/formatters';
import { Debt, PaymentMethod } from '../types';

export const DebtsView: React.FC = () => {
  const { debts, addDebt, payDebt, deleteDebt } = useBookkeeping();

  const [filterType, setFilterType] = useState<string>(''); // '', 'receivable', 'payable'
  const [filterStatus, setFilterStatus] = useState<string>('unpaid'); // 'unpaid', 'paid', 'all'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'receivable' | 'payable'>('receivable');
  const [payTarget, setPayTarget] = useState<Debt | null>(null);

  // New Debt Form State
  const [contactName, setContactName] = useState('');
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Pay Form State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [payNotes, setPayNotes] = useState('');

  const todayStr = getCurrentDateString();

  const summary = useMemo(() => {
    const receivable = debts.filter(d => d.type === 'receivable' && d.status !== 'paid').reduce((a, b) => a + b.remainingAmount, 0);
    const payable = debts.filter(d => d.type === 'payable' && d.status !== 'paid').reduce((a, b) => a + b.remainingAmount, 0);
    return { receivable, payable, net: receivable - payable };
  }, [debts]);

  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      const matchType = filterType ? d.type === filterType : true;
      let matchStatus = true;
      if (filterStatus === 'unpaid') matchStatus = d.status !== 'paid';
      if (filterStatus === 'paid') matchStatus = d.status === 'paid';
      return matchType && matchStatus;
    });
  }, [debts, filterType, filterStatus]);

  const handleOpenAddModal = (type: 'receivable' | 'payable') => {
    setModalType(type);
    setIsAddModalOpen(true);
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !title.trim() || totalAmount <= 0) return;

    await addDebt({
      type: modalType,
      contactName: contactName.trim(),
      title: title.trim(),
      totalAmount,
      startDate: todayStr,
      dueDate,
      notes: notes.trim(),
    });

    setIsAddModalOpen(false);
    setContactName('');
    setTitle('');
    setTotalAmount(0);
    setNotes('');
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget || payAmount <= 0) return;

    await payDebt(payTarget.id, payAmount, paymentMethod, payNotes);
    setPayTarget(null);
    setPayAmount(0);
    setPayNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Utang & Piutang Usaha
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau hak tagih ke pelanggan, kewajiban bayar ke supplier, dan pengingat tanggal jatuh tempo.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenAddModal('payable')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Catat Utang Supplier
          </button>
          <button
            onClick={() => handleOpenAddModal('receivable')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Catat Piutang Pelanggan
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500 font-semibold">Piutang Pelanggan (Belum Lunas)</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-900"><ArrowDownLeft className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-900">{formatRupiah(summary.receivable)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Uang yang akan masuk ke kas</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500 font-semibold">Utang ke Pemasok (Harus Dibayar)</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600"><ArrowUpRight className="w-4 h-4" /></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600">{formatRupiah(summary.payable)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Kewajiban pengeluaran usaha</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500 font-semibold">Selisih Piutang - Utang</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-4 h-4" /></span>
          </div>
          <div className={`text-xl sm:text-2xl font-black ${summary.net >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {formatRupiah(summary.net)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summary.net >= 0 ? 'Aset piutang lebih besar' : 'Kewajiban utang lebih besar'}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('receivable')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'receivable' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Piutang Pelanggan
          </button>
          <button
            onClick={() => setFilterType('payable')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterType === 'payable' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Utang Pemasok
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 bg-white"
          >
            <option value="unpaid">Belum Lunas / Dicicil</option>
            <option value="paid">Sudah Lunas</option>
            <option value="all">Semua Status</option>
          </select>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Jenis</th>
                <th className="py-3.5 px-4">Nama Pihak</th>
                <th className="py-3.5 px-4">Perihal Tagihan</th>
                <th className="py-3.5 px-4">Jatuh Tempo</th>
                <th className="py-3.5 px-4 text-right">Total Awal</th>
                <th className="py-3.5 px-4 text-right">Sudah Dibayar</th>
                <th className="py-3.5 px-4 text-right">Sisa Tagihan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada catatan utang/piutang untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredDebts.map(d => {
                  const isRec = d.type === 'receivable';
                  const isOverdue = d.status !== 'paid' && d.dueDate < todayStr;
                  const isSoon = d.status !== 'paid' && d.dueDate >= todayStr && d.dueDate <= new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          isRec ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isRec ? 'Piutang (+)' : 'Utang (-)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {d.contactName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{d.title}</div>
                        {d.notes && <div className="text-[11px] text-slate-400">{d.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-700">{formatDateIndo(d.dueDate, 'short')}</div>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-rose-600 block">Lewat Jatuh Tempo</span>
                        )}
                        {isSoon && (
                          <span className="text-[10px] font-bold text-amber-600 block">Segera Jatuh Tempo</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {formatRupiah(d.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-600 font-semibold">
                        {formatRupiah(d.paidAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        <span className={d.remainingAmount > 0 ? (isRec ? 'text-blue-900' : 'text-rose-600') : 'text-emerald-600'}>
                          {formatRupiah(d.remainingAmount)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {d.status === 'paid' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Lunas
                          </span>
                        ) : d.status === 'partial' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Dicicil
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Belum Bayar
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {d.status !== 'paid' && (
                            <button
                              onClick={() => {
                                setPayTarget(d);
                                setPayAmount(d.remainingAmount);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-900 hover:bg-blue-800 text-white transition cursor-pointer"
                            >
                              Bayar Cicilan
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Hapus data utang/piutang ini?')) {
                                deleteDebt(d.id);
                              }
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL TAMBAH UTANG/PIUTANG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {modalType === 'receivable' ? 'Catat Piutang Pelanggan' : 'Catat Utang ke Supplier'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {modalType === 'receivable' ? 'Nama Pelanggan Berutang *' : 'Nama Supplier / Distributor *'}
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contoh: Toko Berkah / CV Mitra"
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul / Perihal Tagihan *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Nota katering, Pasokan beras 10 sak"
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Nominal (Rp) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={totalAmount || ''}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Jatuh Tempo *</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Termin kredit atau nomor bukti nota"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white font-bold ${
                    modalType === 'receivable' ? 'bg-blue-900' : 'bg-rose-600'
                  }`}
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BAYAR CICILAN */}
      {payTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Catat Pembayaran Cicilan</h3>
              <button onClick={() => setPayTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="text-slate-500">Perihal: <strong className="text-slate-900">{payTarget.title}</strong></div>
              <div className="text-slate-500">Pihak: <strong>{payTarget.contactName}</strong></div>
              <div className="text-slate-500">
                Sisa Tagihan: <strong className="text-rose-600">{formatRupiah(payTarget.remainingAmount)}</strong>
              </div>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Pembayaran (Rp) *</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full p-2 rounded-lg border border-slate-300 font-bold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="cash">Tunai (Cash)</option>
                  <option value="bank_transfer">Transfer Bank</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Bukti</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="No kwitansi / transfer"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold"
                >
                  Proses Bayar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
