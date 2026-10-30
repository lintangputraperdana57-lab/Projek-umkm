import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  SlidersHorizontal, 
  Trash2, 
  TrendingUp, 
  Boxes,
  CheckCircle2,
  X,
  Image as ImageIcon,
  Upload,
  Maximize2
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { formatRupiah } from '../utils/formatters';
import { Product } from '../types';

export const ProductsView: React.FC = () => {
  const { products, addProduct, adjustStock, deleteProduct } = useBookkeeping();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCat, setNewProdCat] = useState('Bahan Pokok & Sembako');
  const [newProdCost, setNewProdCost] = useState(0);
  const [newProdSelling, setNewProdSelling] = useState(0);
  const [newProdStock, setNewProdStock] = useState(10);
  const [newProdMin, setNewProdMin] = useState(5);
  const [newProdUnit, setNewProdUnit] = useState('pcs');
  const [newProdImage, setNewProdImage] = useState<string>('');
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; name: string } | null>(null);

  // Adjustment Form State
  const [adjType, setAdjType] = useState<'in' | 'out' | 'set'>('in');
  const [adjQty, setAdjQty] = useState<number>(1);
  const [adjReason, setAdjReason] = useState<string>('Stok opname berkala');

  const categoriesList = useMemo(() => {
    return Array.from(new Set(products.map(p => p.categoryName || 'Umum')));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory ? (p.categoryName || 'Umum') === filterCategory : true;
      return matchSearch && matchCat;
    });
  }, [products, search, filterCategory]);

  const totalValuation = useMemo(() => {
    const cost = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);
    const potentialSales = products.reduce((acc, p) => acc + (p.stock * p.sellingPrice), 0);
    const lowStock = products.filter(p => p.stock <= p.minStock).length;
    return { cost, potentialSales, lowStock };
  }, [products]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar. Maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewProdImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    await addProduct({
      name: newProdName.trim(),
      sku: newProdSku.trim() || undefined as any,
      categoryName: newProdCat,
      costPrice: newProdCost,
      sellingPrice: newProdSelling,
      stock: newProdStock,
      minStock: newProdMin,
      unit: newProdUnit,
      imageUrl: newProdImage.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setNewProdName('');
    setNewProdSku('');
    setNewProdCost(0);
    setNewProdSelling(0);
    setNewProdImage('');
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    await adjustStock(adjustTarget.id, adjType, adjQty, adjReason);
    setAdjustTarget(null);
    setAdjQty(1);
    setAdjReason('Stok opname berkala');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header & Valuation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Katalog Produk & Persediaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau stok barang, harga modal, harga jual, dan peringatan batas stok minimum.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk Baru
        </button>
      </div>

      {/* 3 Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Total Ragam Produk</div>
          <div className="text-xl font-black text-slate-900">{products.length} Jenis Produk</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Nilai Aset Modal Stok</div>
          <div className="text-xl font-black text-blue-900">{formatRupiah(totalValuation.cost)}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Peringatan Stok Menipis</div>
          <div className={`text-xl font-black ${totalValuation.lowStock > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {totalValuation.lowStock} Produk Perlu Restok
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk atau SKU..."
            className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 bg-white w-full sm:w-auto"
        >
          <option value="">Semua Kategori</option>
          {categoriesList.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Tabel Produk */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Foto</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Nama Produk</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4 text-right">Harga Modal</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-right">Margin Laba</th>
                <th className="py-3.5 px-4 text-center">Sisa Stok</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const profit = p.sellingPrice - p.costPrice;
                  const marginPct = p.sellingPrice > 0 ? Math.round((profit / p.sellingPrice) * 100) : 0;
                  const isLow = p.stock <= p.minStock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 text-center">
                        {p.imageUrl ? (
                          <div 
                            className="relative group w-11 h-11 mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-2xs cursor-pointer bg-slate-50"
                            onClick={() => setPreviewPhoto({ url: p.imageUrl!, name: p.name })}
                            title="Klik untuk perbesar foto"
                          >
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Maximize2 className="w-3.5 h-3.5 text-white drop-shadow" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-11 h-11 mx-auto rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200/80">
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 font-semibold">
                        {p.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        {isLow && (
                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            Stok Tipis
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {p.categoryName || 'Umum'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {formatRupiah(p.costPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-blue-900">
                        {formatRupiah(p.sellingPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-emerald-600 font-bold text-xs">
                        +{formatRupiah(profit)} ({marginPct}%)
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block font-extrabold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {p.stock}
                        </span>{' '}
                        <span className="text-[11px] text-slate-400">{p.unit}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setAdjustTarget(p)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Sesuaikan Stok"
                          >
                            Stok &plusmn;
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus produk ${p.name}?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition"
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

      {/* MODAL TAMBAH PRODUK */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Tambah Produk Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Contoh: Beras Rojo Lele 5kg"
                  className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode SKU</label>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="Otomatis jika kosong"
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Beli / Modal (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newProdCost || ''}
                    onChange={(e) => setNewProdCost(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newProdSelling || ''}
                    onChange={(e) => setNewProdSelling(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-center"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batas Min.</label>
                  <input
                    type="number"
                    min="1"
                    value={newProdMin}
                    onChange={(e) => setNewProdMin(parseInt(e.target.value) || 1)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-center"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 text-center"
                  />
                </div>
              </div>

              {/* FOTO PRODUK */}
              <div className="pt-1 border-t border-slate-100">
                <label className="block font-semibold text-slate-700 mb-1">
                  Foto Produk (Opsional)
                </label>
                <div className="flex items-start gap-3">
                  {newProdImage ? (
                    <div className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                      <img
                        src={newProdImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setNewProdImage('')}
                        className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs font-bold"
                        title="Hapus foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-700 bg-slate-50/70 hover:bg-blue-50/50 flex flex-col items-center justify-center cursor-pointer transition shrink-0 group">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-700" />
                      <span className="text-[10px] text-slate-500 group-hover:text-blue-800 font-semibold mt-1">
                        Pilih Foto
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      value={newProdImage}
                      onChange={(e) => setNewProdImage(e.target.value)}
                      placeholder="Atau tempel link gambar / URL..."
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] text-slate-400 self-center">Pilihan cepat:</span>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80')}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Beras
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80')}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Kopi
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=400&q=80')}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Telur
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&q=80')}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Roti/Kue
                      </button>
                    </div>
                  </div>
                </div>
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
                  className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL PREVIEW FOTO */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                {previewPhoto.name}
              </h3>
              <button 
                onClick={() => setPreviewPhoto(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center max-h-[70vh]">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.name}
                className="w-full h-auto max-h-[65vh] object-contain rounded-lg"
              />
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENYESUAIAN STOK */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Penyesuaian Stok Barang</h3>
              <button onClick={() => setAdjustTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="text-slate-500">Nama Produk:</div>
              <div className="font-bold text-slate-900 text-sm">{adjustTarget.name}</div>
              <div className="text-slate-500">
                Stok Saat Ini: <strong className="text-blue-900">{adjustTarget.stock} {adjustTarget.unit}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aksi Penyesuaian</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="in">Tambah Stok Masuk (+)</option>
                  <option value="out">Kurang Stok Keluar / Rusak (-)</option>
                  <option value="set">Atur Ulang Total Stok (=)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jumlah</label>
                <input
                  type="number"
                  min="1"
                  value={adjQty}
                  onChange={(e) => setAdjQty(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Penyesuaian *</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Contoh: Stok opname, barang expired, retur"
                  className="w-full p-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold"
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
