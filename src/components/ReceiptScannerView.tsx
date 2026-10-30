import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  ScanLine, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  X, 
  Eye, 
  DollarSign, 
  Store, 
  Receipt as ReceiptIcon,
  RefreshCw,
  ExternalLink,
  ZoomIn,
  Check
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { ScannedReceipt, ScannedReceiptItem, PaymentMethod } from '../types';
import { formatRupiah, getCurrentDateString } from '../utils/formatters';
import { scanReceiptImage, OcrResult } from '../services/receiptOcrService';

export const ReceiptScannerView: React.FC = () => {
  const { 
    categories, 
    saveScannedReceipt, 
    deleteScannedReceipt, 
    scannedReceipts, 
    transactions 
  } = useBookkeeping();

  const [activeTab, setActiveTab] = useState<'scan' | 'history'>('scan');
  
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Image & OCR processing state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [isAiExtracted, setIsAiExtracted] = useState(false);

  // Editable Preview Form state
  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState(getCurrentDateString());
  const [items, setItems] = useState<ScannedReceiptItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<string>('Operasional & Perlengkapan');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [rawText, setRawText] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // History Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Available expense categories
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Recalculate total when items change
  const recalculateTotal = (updatedItems: ScannedReceiptItem[]) => {
    const total = updatedItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    setTotalAmount(total);
  };

  // Start back/environment camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser Anda tidak mendukung akses kamera langsung.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(err.message || 'Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
      setIsCameraActive(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    stopCamera();
    setSelectedImage(dataUrl);
    processOcr(dataUrl);
  };

  // Handle gallery file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      processOcr(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Trigger OCR analysis
  const processOcr = async (imageDataUrl: string) => {
    setIsScanning(true);
    setOcrSuccess(false);
    setSaveSuccessMsg(null);

    try {
      const result: OcrResult = await scanReceiptImage(imageDataUrl, 'image/jpeg');

      setStoreName(result.storeName || 'Toko / Vendor');
      setDate(result.date || getCurrentDateString());
      setItems(result.items || []);
      setTotalAmount(result.totalAmount || 0);
      setRawText(result.rawText || '');
      setIsAiExtracted(result.isAiExtracted);

      if (result.suggestedCategory) {
        const found = expenseCategories.find(c => c.name.toLowerCase() === result.suggestedCategory.toLowerCase());
        if (found) {
          setExpenseCategory(found.name);
        }
      }

      setOcrSuccess(true);
    } catch (err) {
      console.error('Error processing OCR:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Item table handlers
  const handleItemChange = (index: number, field: keyof ScannedReceiptItem, value: any) => {
    const updated = [...items];
    const target = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = Number(field === 'quantity' ? value : target.quantity) || 0;
      const p = Number(field === 'unitPrice' ? value : target.unitPrice) || 0;
      target.subtotal = q * p;
    }

    updated[index] = target;
    setItems(updated);
    recalculateTotal(updated);
  };

  const handleAddItem = () => {
    const newItem: ScannedReceiptItem = {
      id: 'item_' + Date.now(),
      name: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
    };
    const updated = [...items, newItem];
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    recalculateTotal(updated);
  };

  // Save to expense transaction and scanned receipts
  const handleSaveToExpense = async () => {
    if (!storeName.trim()) {
      alert('Nama toko / merchant harus diisi.');
      return;
    }
    if (totalAmount <= 0) {
      alert('Total nominal belanja harus lebih besar dari Rp 0.');
      return;
    }

    const receiptPayload = {
      storeName: storeName.trim(),
      date,
      items,
      totalAmount,
      expenseCategory,
      paymentMethod,
      notes,
      imageUrl: selectedImage || '',
      rawText,
    };

    const res = await saveScannedReceipt(receiptPayload, true);
    if (res.success) {
      setSaveSuccessMsg(`Berhasil dicatat ke Transaksi Pengeluaran (${formatRupiah(totalAmount)}) dan tersimpan di Riwayat Nota!`);
      // Reset form after 2.5s or switch to history
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setActiveTab('history');
      }, 1500);
    }
  };

  // Reset scan preview
  const handleResetScan = () => {
    setSelectedImage(null);
    setOcrSuccess(false);
    setItems([]);
    setStoreName('');
    setTotalAmount(0);
    setRawText('');
    setSaveSuccessMsg(null);
    stopCamera();
  };

  // Filtered receipts history
  const filteredReceipts = scannedReceipts.filter(receipt => {
    const matchSearch = searchQuery.trim() === '' || 
      receipt.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.items.some(it => it.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (receipt.notes && receipt.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStart = !startDate || receipt.date >= startDate;
    const matchEnd = !endDate || receipt.date <= endDate;

    return matchSearch && matchStart && matchEnd;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2 backdrop-blur-xs border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Smart AI Receipt Scanner & OCR</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Scan & Catat Nota Belanja
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Foto struk belanja dengan kamera HP atau unggah dari galeri. AI mengekstrak nama toko, tanggal, item barang, dan total pengeluaran secara otomatis.
            </p>
          </div>

          {/* Navigation Pill */}
          <div className="flex items-center bg-white/10 p-1 rounded-xl backdrop-blur-xs border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'scan'
                  ? 'bg-white text-blue-950 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>Pindai Nota Baru</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-blue-950 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Nota ({scannedReceipts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab 1: Pindai Nota Baru */}
      {activeTab === 'scan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Camera / Upload / Image Preview */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                <span>Sumber Gambar Nota</span>
                {selectedImage && (
                  <button
                    onClick={handleResetScan}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Ganti Foto</span>
                  </button>
                )}
              </h2>

              {/* Action Buttons: Kamera HP & Galeri */}
              {!selectedImage && !isCameraActive && (
                <div className="space-y-3">
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-blue-900 text-white font-bold text-sm shadow hover:bg-blue-800 transition cursor-pointer"
                  >
                    <Camera className="w-5 h-5 text-blue-300" />
                    <span>Buka Kamera HP</span>
                  </button>

                  <label className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-slate-50 text-slate-800 font-bold text-sm border-2 border-dashed border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition cursor-pointer">
                    <Upload className="w-5 h-5 text-slate-600" />
                    <span>Upload Gambar dari Galeri</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>

                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900">
                    <p className="font-semibold mb-0.5">Tips Hasil Scan Maksimal:</p>
                    <ul className="list-disc list-inside text-blue-800/90 space-y-0.5">
                      <li>Pastikan cahaya terang dan teks tidak buram.</li>
                      <li>Posisikan struk tegak lurus memenuhi bingkai kamera.</li>
                      <li>Nama toko dan total belanja harus tampak jelas.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Active Camera Viewfinder */}
              {isCameraActive && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-3/4 border-2 border-blue-500 shadow-inner flex items-center justify-center">
                    <video 
                      ref={videoRef} 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                    />

                    {/* Camera Guidance Overlay */}
                    <div className="absolute inset-4 border border-white/50 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                      <div className="flex justify-between text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded self-center backdrop-blur-xs">
                        Posisikan Nota di Dalam Kotak
                      </div>
                      <div className="w-full text-center text-[10px] text-white/80 bg-black/40 py-0.5 rounded backdrop-blur-xs">
                        Tahan HP stabil & tekan jepret
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow cursor-pointer text-sm"
                    >
                      <Camera className="w-5 h-5 text-blue-200" />
                      <span>Jepret Foto Nota</span>
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Selected Image Preview with Zoom Option */}
              {selectedImage && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-3/4 flex items-center justify-center group">
                    <img 
                      src={selectedImage} 
                      alt="Pratinjau Nota" 
                      className="w-full h-full object-contain"
                    />
                    
                    {/* Floating Zoom Button */}
                    <button
                      onClick={() => setPreviewModalImage(selectedImage)}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition shadow cursor-pointer"
                      title="Perbesar Gambar Nota"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>

                    {/* OCR Status Badge */}
                    {isScanning && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-2" />
                        <p className="font-bold text-sm">Membaca Teks Nota dengan AI...</p>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Mengekstrak nama toko, tanggal transaksi, daftar barang, dan total belanja.
                        </p>
                      </div>
                    )}
                  </div>

                  {ocrSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>
                        {isAiExtracted 
                          ? 'OCR Berhasil! Data nota telah diekstrak dengan Gemini AI.'
                          : 'OCR Berhasil! Silakan periksa atau sesuaikan data di samping.'}
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Raw Text Accordion (if available) */}
            {rawText && (
              <details className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs text-xs text-slate-600 group">
                <summary className="font-bold text-slate-800 cursor-pointer flex items-center justify-between">
                  <span>Lihat Teks Asli Hasil Pembacaan Nota</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">&#9662;</span>
                </summary>
                <pre className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] whitespace-pre-wrap text-slate-700 max-h-48 overflow-y-auto">
                  {rawText}
                </pre>
              </details>
            )}

          </div>

          {/* Right Column: Interactive Editable Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Preview & Edit Hasil Scan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Periksa atau koreksi data hasil pembacaan sebelum disimpan ke pembukuan pengeluaran.
                  </p>
                </div>
                {ocrSuccess && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Terbaca</span>
                  </span>
                )}
              </div>

              {saveSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {/* Form Fields: Toko & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-blue-900" />
                    <span>Nama Toko / Merchant *</span>
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Contoh: Grosir Berkah / SPBU Pertamina"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-900" />
                    <span>Tanggal Transaksi *</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
                  />
                </div>
              </div>

              {/* Itemized Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <ReceiptIcon className="w-3.5 h-3.5 text-blue-900" />
                    <span>Rincian Barang / Jasa pada Nota ({items.length} baris)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 hover:bg-blue-100 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Nama Barang</th>
                        <th className="py-2 px-2 w-16 text-center">Qty</th>
                        <th className="py-2 px-2 w-28 text-right">Harga Satuan</th>
                        <th className="py-2 px-3 w-28 text-right">Subtotal</th>
                        <th className="py-2 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                            Belum ada baris barang. Klik "+ Tambah Baris" atau unggah struk.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/70">
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                placeholder="Nama barang"
                                className="w-full px-2 py-1 text-xs rounded border border-slate-200 focus:outline-none focus:border-blue-900"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                className="w-full px-1.5 py-1 text-xs text-center rounded border border-slate-200 focus:outline-none focus:border-blue-900"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="number"
                                min="0"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                                className="w-full px-2 py-1 text-xs text-right rounded border border-slate-200 focus:outline-none focus:border-blue-900"
                              />
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-slate-800">
                              {formatRupiah(item.subtotal)}
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                                title="Hapus baris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Belanja & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Pengeluaran *
                  </label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium bg-white"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium bg-white"
                  >
                    <option value="cash">Tunai (Cash)</option>
                    <option value="bank_transfer">Transfer Bank</option>
                    <option value="qris">QRIS</option>
                    <option value="ewallet">E-Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Total Belanja (Rp) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">Dapat diedit</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-extrabold text-blue-950 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-700 mt-1">
                    {formatRupiah(totalAmount)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Pengeluaran (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Kulakan barang sembako untuk stok awal bulan"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Bersihkan Form
                </button>
                <button
                  type="button"
                  onClick={handleSaveToExpense}
                  disabled={totalAmount <= 0 || !storeName.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Simpan ke Transaksi Pengeluaran</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Main Tab 2: Riwayat Scan Nota */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          
          {/* Search & Date Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari toko, barang, atau catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Rentang:</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900"
                title="Tanggal Mulai"
              />
              <span className="text-slate-400 text-xs">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900"
                title="Tanggal Akhir"
              />
              {(startDate || endDate || searchQuery) && (
                <button
                  onClick={() => { setStartDate(''); setEndDate(''); setSearchQuery(''); }}
                  className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Receipts Grid / List */}
          {filteredReceipts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <ReceiptIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">Tidak ada riwayat scan nota</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || startDate || endDate 
                  ? 'Tidak ada hasil yang sesuai dengan kata kunci atau filter tanggal Anda.'
                  : 'Belum ada nota yang discan. Buka tab "Pindai Nota Baru" untuk mendokumentasikan nota fisik pertama Anda.'}
              </p>
              <button
                onClick={() => setActiveTab('scan')}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition cursor-pointer"
              >
                <ScanLine className="w-4 h-4" />
                <span>Pindai Nota Baru</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReceipts.map(receipt => (
                <div 
                  key={receipt.id} 
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header with thumbnail & store name */}
                    <div className="p-4 flex items-start gap-3 border-b border-slate-100">
                      <div 
                        onClick={() => receipt.imageUrl && setPreviewModalImage(receipt.imageUrl)}
                        className="w-16 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer relative group"
                        title="Klik untuk memperbesar gambar"
                      >
                        {receipt.imageUrl ? (
                          <>
                            <img 
                              src={receipt.imageUrl} 
                              alt={receipt.storeName} 
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ReceiptIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {receipt.storeName}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                            Pengeluaran
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{receipt.date}</span>
                        </p>
                        <p className="text-sm font-extrabold text-blue-950 mt-1">
                          {formatRupiah(receipt.totalAmount)}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {receipt.expenseCategory}
                        </span>
                      </div>
                    </div>

                    {/* Item lines summary */}
                    <div className="px-4 py-3 text-xs bg-slate-50/50 space-y-1">
                      <p className="text-[11px] font-bold text-slate-600 mb-1">
                        Barang ({receipt.items.length} item):
                      </p>
                      {receipt.items.slice(0, 3).map((item, idx) => (
                        <div key={item.id || idx} className="flex justify-between text-slate-700 text-[11px]">
                          <span className="truncate max-w-[180px]">{item.quantity}x {item.name}</span>
                          <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                        </div>
                      ))}
                      {receipt.items.length > 3 && (
                        <p className="text-[10px] text-slate-400 italic">
                          +{receipt.items.length - 3} item lainnya...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
                    {receipt.imageUrl && (
                      <button
                        onClick={() => setPreviewModalImage(receipt.imageUrl)}
                        className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Lampiran Foto</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Hapus arsip scan nota dari "${receipt.storeName}"?`)) {
                          deleteScannedReceipt(receipt.id);
                        }
                      }}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 p-1 cursor-pointer ml-auto"
                      title="Hapus dari riwayat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Lightbox Zoom Modal for Receipt Image */}
      {previewModalImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewModalImage(null)}
        >
          <div 
            className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ReceiptIcon className="w-4 h-4 text-blue-400" />
                <span>Foto Asli Lampiran Struk Nota</span>
              </span>
              <button
                onClick={() => setPreviewModalImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950/90">
              <img 
                src={previewModalImage} 
                alt="Lampiran Struk" 
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewModalImage(null)}
                className="px-4 py-1.5 rounded-xl bg-blue-900 text-white font-bold text-xs cursor-pointer"
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
