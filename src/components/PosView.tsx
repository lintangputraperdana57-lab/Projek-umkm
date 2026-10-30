import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  User, 
  Clock, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { formatRupiah, getCurrentDateString, formatDateIndo } from '../utils/formatters';
import { PaymentMethod } from '../types';

interface PosItemRow {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export const PosView: React.FC = () => {
  const { products, customers, createPosSale, userProfile } = useBookkeeping();

  const [items, setItems] = useState<PosItemRow[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      quantity: 1,
      unitPrice: products[0]?.sellingPrice || 0,
      subtotal: products[0]?.sellingPrice || 0,
    }
  ]);

  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [isTempo, setIsTempo] = useState<boolean>(false);
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Receipt Modal State
  const [lastReceipt, setLastReceipt] = useState<{
    trxNumber: string;
    items: PosItemRow[];
    total: number;
    discount: number;
    paid: number;
    change: number;
    customer: string;
    date: string;
  } | null>(null);

  // Subtotal and Total calculations
  const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const changeAmount = (paidAmount > totalAmount && !isTempo) ? paidAmount - totalAmount : 0;

  const handleProductSelect = (index: number, pId: string) => {
    const prod = products.find(p => p.id === pId);
    if (!prod) return;
    const updated = [...items];
    updated[index] = {
      productId: prod.id,
      productName: prod.name,
      quantity: 1,
      unitPrice: prod.sellingPrice,
      subtotal: prod.sellingPrice,
    };
    setItems(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const q = Math.max(1, qty);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      quantity: q,
      subtotal: q * updated[index].unitPrice,
    };
    setItems(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const p = Math.max(0, price);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      unitPrice: p,
      subtotal: updated[index].quantity * p,
    };
    setItems(updated);
  };

  const handleAddRow = () => {
    const firstP = products[0];
    setItems([
      ...items,
      {
        productId: firstP?.id || '',
        productName: firstP?.name || '',
        quantity: 1,
        unitPrice: firstP?.sellingPrice || 0,
        subtotal: firstP?.sellingPrice || 0,
      }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.productId)) {
      alert('Pilih produk untuk semua baris transaksi.');
      return;
    }

    const effectivePaid = isTempo ? 0 : (paidAmount === 0 ? totalAmount : paidAmount);

    const trxNum = await createPosSale({
      items,
      totalAmount,
      discount,
      paymentMethod: isTempo ? 'receivable_payable' : paymentMethod,
      paidAmount: effectivePaid,
      changeAmount: Math.max(0, effectivePaid - totalAmount),
      customerName: customerName || 'Pelanggan Umum',
      customerId,
      isTempo,
      dueDate,
      notes,
    });

    if (trxNum) {
      setLastReceipt({
        trxNumber: trxNum,
        items,
        total: totalAmount,
        discount,
        paid: effectivePaid,
        change: Math.max(0, effectivePaid - totalAmount),
        customer: customerName || 'Pelanggan Umum',
        date: getCurrentDateString(),
      });

      // Reset form
      setItems([{
        productId: products[0]?.id || '',
        productName: products[0]?.name || '',
        quantity: 1,
        unitPrice: products[0]?.sellingPrice || 0,
        subtotal: products[0]?.sellingPrice || 0,
      }]);
      setDiscount(0);
      setPaidAmount(0);
      setCustomerName('');
      setNotes('');
      setIsTempo(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Kasir Cepat POS & Penjualan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
              Multi-Item
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Transaksi penjualan dengan kalkulasi langsung, pengurangan stok otomatis, dan cetak struk nota.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitSale} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Tabel Barang / Item */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Daftar Barang Belanja ({items.length} Item)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-900 text-white hover:bg-blue-800 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Baris
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-3 w-5/12">Pilih Produk</th>
                    <th className="pb-3 w-2/12">Jumlah</th>
                    <th className="pb-3 w-2/12">Harga (Rp)</th>
                    <th className="pb-3 w-2/12">Subtotal</th>
                    <th className="pb-3 w-1/12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row, idx) => {
                    const selProd = products.find(p => p.id === row.productId);
                    const isLow = selProd && selProd.stock <= selProd.minStock;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-2">
                            {selProd?.imageUrl ? (
                              <img
                                src={selProd.imageUrl}
                                alt={selProd.name}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                <ShoppingCart className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <select
                                value={row.productId}
                                onChange={(e) => handleProductSelect(idx, e.target.value)}
                                className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                                required
                              >
                                <option value="">-- Pilih Produk --</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (Stok: {p.stock} {p.unit})
                                  </option>
                                ))}
                              </select>
                              {isLow && (
                                <div className="text-[10px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Stok tersisa {selProd.stock} {selProd.unit}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || 1)}
                            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 text-center focus:ring-2 focus:ring-blue-900 focus:outline-none"
                            required
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={row.unitPrice}
                            onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 text-right focus:ring-2 focus:ring-blue-900 focus:outline-none"
                            required
                          />
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-slate-800">
                          {formatRupiah(row.subtotal)}
                        </td>
                        <td className="py-3 pl-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            disabled={items.length === 1}
                            className={`p-1.5 rounded-lg transition ${
                              items.length === 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-rose-500 hover:bg-rose-50 cursor-pointer'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Subtotal Box */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Subtotal Barang ({items.length} item)</span>
              <span className="font-bold text-slate-900 text-base">{formatRupiah(subtotal)}</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Pembayaran & Pelanggan */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-900" />
              Rincian Pembayaran
            </h3>

            {/* Pelanggan */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pelanggan (Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Bu Siti / Umum"
                    className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  />
                  <select
                    onChange={(e) => {
                      const c = customers.find(cust => cust.id === e.target.value);
                      if (c) {
                        setCustomerName(c.name);
                        setCustomerId(c.id);
                      }
                    }}
                    className="text-xs rounded-lg border border-slate-300 bg-slate-50 px-2"
                  >
                    <option value="">Daftar</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Metode Bayar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const val = e.target.value as PaymentMethod;
                    setPaymentMethod(val);
                    if (val === 'receivable_payable') {
                      setIsTempo(true);
                    } else {
                      setIsTempo(false);
                    }
                  }}
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 bg-white focus:ring-2 focus:ring-blue-900 focus:outline-none"
                >
                  <option value="cash">Tunai (Cash)</option>
                  <option value="bank_transfer">Transfer Bank (BCA / Mandiri / BRI)</option>
                  <option value="qris">QRIS (GoPay/ShopeePay/OVO)</option>
                  <option value="receivable_payable">Tempo / Piutang (Kredit)</option>
                </select>
              </div>

              {/* Tempo Due Date */}
              {isTempo && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <label className="block text-xs font-bold text-amber-900">
                    Tanggal Jatuh Tempo Piutang *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-amber-300 p-1.5 bg-white"
                    required
                  />
                </div>
              )}

              {/* Diskon */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diskon Transaksi (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 text-right focus:ring-2 focus:ring-blue-900 focus:outline-none"
                />
              </div>

              {/* Total Box */}
              <div className="p-4 rounded-xl bg-blue-900 text-white space-y-1 mt-3">
                <div className="text-xs text-blue-200">Total Akhir Tagihan:</div>
                <div className="text-2xl font-black">{formatRupiah(totalAmount)}</div>
              </div>

              {/* Uang Diterima & Kembalian */}
              {!isTempo && (
                <div className="space-y-2 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Uang Diterima / Bayar (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={paidAmount || ''}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      placeholder={totalAmount.toString()}
                      className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 p-2 text-right font-bold focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-semibold">
                    <span>Kembalian:</span>
                    <span className="font-extrabold text-base">{formatRupiah(changeAmount)}</span>
                  </div>
                </div>
              )}

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Nota
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              Proses & Cetak Struk
            </button>
          </div>
        </div>

      </form>

      {/* MODAL STRUK CETAK THERMAL */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center mx-auto mb-2 p-1 shadow-xs">
                <img 
                  src={userProfile.logoUrl || "/assets/aistudio/IMG_4d986b3a-e230-4498-8258-4d16b82fa55c_91979bc8.jpg"} 
                  alt="Logo Toko" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h4 className="font-black text-slate-900 text-base">{userProfile.businessName}</h4>
              <p className="text-[11px] text-slate-500">{userProfile.businessAddress}</p>
              <p className="text-[11px] text-slate-500">Telp: {userProfile.businessPhone}</p>
            </div>

            <div className="text-xs space-y-1 font-mono text-slate-700">
              <div className="flex justify-between">
                <span>No: {lastReceipt.trxNumber}</span>
                <span>{formatDateIndo(lastReceipt.date, 'short')}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir: {userProfile.ownerName}</span>
                <span>Plg: {lastReceipt.customer}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-2 font-mono text-xs">
              {lastReceipt.items.map((it, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-bold text-slate-900">{it.productName}</div>
                  <div className="flex justify-between text-slate-600">
                    <span>{it.quantity} x {formatRupiah(it.unitPrice)}</span>
                    <span>{formatRupiah(it.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-xs font-mono space-y-1">
              {lastReceipt.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(lastReceipt.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>{formatRupiah(lastReceipt.total)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Bayar:</span>
                <span>{formatRupiah(lastReceipt.paid)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Kembali:</span>
                <span>{formatRupiah(lastReceipt.change)}</span>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-dashed border-slate-300">
              Terima Kasih Atas Kunjungan Anda!
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-800"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                type="button"
                onClick={() => setLastReceipt(null)}
                className="py-2 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
