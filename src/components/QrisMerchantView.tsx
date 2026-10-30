import React, { useState, useRef } from 'react';
import { 
  QrCode, 
  Upload, 
  Download, 
  Printer, 
  Maximize2, 
  Settings, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  FileCode2, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  RefreshCw,
  Info,
  Smartphone,
  CreditCard,
  Lock
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { QrisConfig } from '../types';

export const QrisMerchantView: React.FC = () => {
  const { qrisConfig, updateQrisConfig, userProfile } = useBookkeeping();
  const [activeTab, setActiveTab] = useState<'display' | 'settings' | 'gateway'>('display');
  
  // Fullscreen Zoom Modal
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  
  // Edit Config Form
  const [merchantName, setMerchantName] = useState(qrisConfig.merchantName || userProfile.businessName);
  const [nmid, setNmid] = useState(qrisConfig.nmid || 'ID1024300988771');
  const [pjpProvider, setPjpProvider] = useState(qrisConfig.pjpProvider || 'Bank Central Asia (BCA)');
  const [city, setCity] = useState(qrisConfig.city || 'JAKARTA');
  const [postalCode, setPostalCode] = useState(qrisConfig.postalCode || '12160');
  const [notes, setNotes] = useState(qrisConfig.notes || '');
  const [qrisImagePreview, setQrisImagePreview] = useState(qrisConfig.qrisImageUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Gateway Simulation State
  const [gatewayProvider, setGatewayProvider] = useState<'none' | 'midtrans' | 'xendit'>(
    qrisConfig.gateway?.provider || 'none'
  );
  const [merchantId, setMerchantId] = useState(qrisConfig.gateway?.merchantId || '');
  const [clientKey, setClientKey] = useState(qrisConfig.gateway?.clientKey || '');
  const [serverKey, setServerKey] = useState(qrisConfig.gateway?.serverKey || '');
  const [isSandbox, setIsSandbox] = useState(qrisConfig.gateway?.isSandbox ?? true);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Handle upload custom QRIS image from gallery/device
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar QRIS (PNG, JPG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setQrisImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Save Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName.trim()) {
      alert('Nama merchant tidak boleh kosong.');
      return;
    }

    const payload: Partial<QrisConfig> = {
      merchantName: merchantName.trim().toUpperCase(),
      nmid: nmid.trim().toUpperCase(),
      pjpProvider: pjpProvider.trim(),
      city: city.trim().toUpperCase(),
      postalCode: postalCode.trim(),
      notes: notes.trim(),
      qrisImageUrl: qrisImagePreview,
      gateway: {
        provider: gatewayProvider,
        merchantId: merchantId.trim(),
        clientKey: clientKey.trim(),
        serverKey: serverKey.trim(),
        isSandbox,
        isActive: gatewayProvider !== 'none',
      }
    };

    await updateQrisConfig(payload);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('display');
    }, 1200);
  };

  // Print Standee
  const handlePrint = () => {
    window.print();
  };

  // Download QRIS Image
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrisConfig.qrisImageUrl;
    link.download = `QRIS_${(qrisConfig.merchantName || 'MERCHANT').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const webhookUrl = `${window.location.origin}/api/payment-webhook`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2 backdrop-blur-xs border border-blue-400/30">
              <QrCode className="w-3.5 h-3.5 text-blue-300" />
              <span>Standar Pembayaran Nasional Bank Indonesia</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              QRIS Merchant UMKM
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Tampilkan kode QRIS resmi toko Anda untuk menerima pembayaran non-tunai dari seluruh bank dan dompet digital (GoPay, OVO, ShopeePay, Dana, BCA, Mandiri, dll).
            </p>
          </div>

          {/* Navigation Pill */}
          <div className="flex items-center bg-white/10 p-1 rounded-xl backdrop-blur-xs border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('display')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'display'
                  ? 'bg-white text-blue-950 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Tampilan QRIS</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white text-blue-950 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan & Ganti QRIS</span>
            </button>
            <button
              onClick={() => setActiveTab('gateway')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'gateway'
                  ? 'bg-white text-blue-950 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gateway Resmi</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: DISPLAY STANDEE QRIS */}
      {activeTab === 'display' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Standee Card (Printable) */}
          <div className="lg:col-span-7 flex justify-center">
            <div 
              ref={printAreaRef}
              className="w-full max-w-md bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none print:max-w-none print:w-full"
            >
              
              {/* National QRIS Header */}
              <div className="bg-white p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    QR
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base tracking-wider leading-none">
                      QRIS
                    </h3>
                    <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight mt-0.5">
                      Quick Response Code Indonesian Standard
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-900 text-white uppercase tracking-wider">
                    GPN
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 uppercase">
                    ASPI
                  </span>
                </div>
              </div>

              {/* Merchant Identity */}
              <div className="px-6 pt-5 pb-3 text-center bg-slate-50/60 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                  {qrisConfig.merchantName || userProfile.businessName}
                </h2>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 text-[11px] text-slate-500 font-mono">
                  <span>NMID: <strong className="text-slate-800">{qrisConfig.nmid}</strong></span>
                  <span>&bull;</span>
                  <span>{qrisConfig.city} {qrisConfig.postalCode}</span>
                </div>
                <p className="text-[10px] text-blue-900 font-semibold mt-1">
                  Penyelenggara: {qrisConfig.pjpProvider}
                </p>
              </div>

              {/* QR Code Canvas / Image Display */}
              <div className="p-6 sm:p-8 flex flex-col items-center justify-center bg-white">
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md relative group">
                  <img 
                    src={qrisConfig.qrisImageUrl} 
                    alt="Kode QRIS Toko" 
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                  />
                  
                  {/* Hover Quick Zoom */}
                  <button
                    onClick={() => setIsFullscreenModalOpen(true)}
                    className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center rounded-xl cursor-pointer print:hidden"
                    title="Klik untuk perbesar layar penuh"
                  >
                    <Maximize2 className="w-8 h-8 mb-1" />
                    <span className="text-xs font-bold">Perbesar Layar Penuh</span>
                  </button>
                </div>

                <p className="text-xs font-extrabold text-slate-800 mt-4 tracking-wide text-center">
                  SATU QR UNTUK SEMUA PEMBAYARAN
                </p>
                <p className="text-[11px] text-slate-500 text-center max-w-xs mt-0.5">
                  Scan dengan m-Banking (BCA, BRI, Mandiri, BNI, BSI) atau E-Wallet (GoPay, OVO, ShopeePay, DANA, LinkAja).
                </p>
              </div>

              {/* Standee Table Tent Footer */}
              <div className="bg-slate-900 text-white p-3.5 text-center text-[10px] font-semibold tracking-wider flex items-center justify-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>TERDAFTAR & DIAWASI BANK INDONESIA</span>
              </div>

            </div>
          </div>

          {/* Action Sidebar & Cashier Tools */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            
            {/* Quick Action Buttons */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Aksi Cepat Meja Kasir
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setIsFullscreenModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-blue-50 text-blue-900 hover:bg-blue-100 transition font-bold text-xs cursor-pointer border border-blue-200"
                >
                  <Maximize2 className="w-5 h-5 text-blue-700" />
                  <span>Perbesar Layar</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 text-slate-800 hover:bg-slate-100 transition font-bold text-xs cursor-pointer border border-slate-200"
                >
                  <Download className="w-5 h-5 text-slate-700" />
                  <span>Unduh QRIS</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 text-slate-800 hover:bg-slate-100 transition font-bold text-xs cursor-pointer border border-slate-200"
                >
                  <Printer className="w-5 h-5 text-slate-700" />
                  <span>Cetak Standee</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('settings')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-300" />
                  <span>Ganti Gambar atau Edit Data QRIS</span>
                </button>
              </div>
            </div>

            {/* Compliance & Verification Notice */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Panduan Kepatuhan & Verifikasi Pembayaran</span>
              </div>
              
              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p>
                  <strong>Untuk QRIS Statis:</strong> Pelanggan memasukkan nominal belanja secara manual saat memindai di aplikasi m-banking mereka.
                </p>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Perhatian Kasir:</span>
                  </p>
                  <p>
                    Jangan menganggap pembayaran lunas hanya dari screenshot HP pembeli. Selalu minta bukti notifikasi mutasi masuk pada aplikasi perbankan / merchant resmi Anda (BCA Merchant, GoBiz, Livin' Merchant, dll).
                  </p>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ingin verifikasi otomatis tanpa cek manual kasir? Aktifkan integrasi <strong>Payment Gateway Resmi</strong> pada tab di atas.
                </p>
              </div>
            </div>

            {/* Merchant Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Identitas Merchant Terdaftar</span>
              </h4>
              <div className="divide-y divide-slate-100 text-slate-600">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Nama Merchant</span>
                  <span className="font-bold text-slate-900">{qrisConfig.merchantName}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">NMID</span>
                  <span className="font-mono font-bold text-blue-900">{qrisConfig.nmid}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">PJP Mitra</span>
                  <span className="font-medium text-slate-800">{qrisConfig.pjpProvider}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-500">Lokasi Usaha</span>
                  <span className="font-medium text-slate-800">{qrisConfig.city} {qrisConfig.postalCode}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: PENGATURAN & GANTI QRIS */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Pengaturan QRIS Merchant
            </h2>
            <p className="text-xs text-slate-500">
              Unggah gambar kode QRIS resmi toko Anda dan sesuaikan data merchant agar tercetak rapi di meja kasir.
            </p>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pengaturan QRIS berhasil diperbarui dan disimpan!</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4">
            
            {/* Upload QRIS Image */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gambar / Foto QR Code QRIS Anda *
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="w-32 h-32 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-xs">
                  <img 
                    src={qrisImagePreview} 
                    alt="Preview QRIS" 
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition cursor-pointer shadow-xs">
                    <Upload className="w-4 h-4" />
                    <span>Pilih Gambar QRIS dari HP / Galeri</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Bisa berupa screenshot dari m-Banking/merchant app atau foto fisik stiker QRIS Anda.
                  </p>
                </div>
              </div>
            </div>

            {/* Merchant Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Merchant / Usaha *
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Misal: TOKO BERKAH JAYA"
                className="w-full px-3 py-2 text-xs uppercase font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>

            {/* NMID & PJP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NMID (National Merchant ID) *
                </label>
                <input
                  type="text"
                  value={nmid}
                  onChange={(e) => setNmid(e.target.value)}
                  placeholder="ID1024300988771"
                  className="w-full px-3 py-2 text-xs font-mono font-bold text-blue-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penyelenggara Jasa Pembayaran (PJP)
                </label>
                <input
                  type="text"
                  value={pjpProvider}
                  onChange={(e) => setPjpProvider(e.target.value)}
                  placeholder="Contoh: Bank BCA, Mandiri, BRI, GoPay, Nobu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
                />
              </div>
            </div>

            {/* City & Postal Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kota / Wilayah Merchant
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="JAKARTA SELATAN"
                  className="w-full px-3 py-2 text-xs uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="12160"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('display')}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                Simpan Pengaturan QRIS
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 3: INTEGRASI PAYMENT GATEWAY RESMI */}
      {activeTab === 'gateway' && (
        <div className="max-w-3xl mx-auto space-y-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-900">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Integrasi Payment Gateway Resmi (QRIS Dinamis)
                </h2>
                <p className="text-xs text-slate-500">
                  Menerima pembayaran QRIS dengan nominal otomatis dan notifikasi webhook real-time tanpa perlu cek mutasi manual.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="w-4 h-4 text-blue-800" />
                <span>Kepatuhan Standar Pembayaran Bank Indonesia:</span>
              </div>
              <p>
                Aplikasi ini tidak menghasilkan QRIS statis manipulatif atau mengklaim status verifikasi palsu. Untuk otomatisasi penuh, Anda dapat mengintegrasikan API resmi dari Payment Gateway berlisensi Bank Indonesia (seperti <strong>Midtrans</strong> atau <strong>Xendit</strong>).
              </p>
            </div>

            {/* Provider Selector */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Penyedia Payment Gateway
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setGatewayProvider('none')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                      gatewayProvider === 'none'
                        ? 'border-blue-900 bg-blue-50/50 text-blue-950 ring-2 ring-blue-900/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <p className="font-extrabold">Standar / Manual</p>
                    <p className="text-[11px] font-normal text-slate-500 mt-0.5">QRIS Statis Toko</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGatewayProvider('midtrans')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                      gatewayProvider === 'midtrans'
                        ? 'border-blue-900 bg-blue-50/50 text-blue-950 ring-2 ring-blue-900/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <p className="font-extrabold text-blue-900">Midtrans Snap</p>
                    <p className="text-[11px] font-normal text-slate-500 mt-0.5">GoTo Financial / BCA</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGatewayProvider('xendit')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition cursor-pointer ${
                      gatewayProvider === 'xendit'
                        ? 'border-blue-900 bg-blue-50/50 text-blue-950 ring-2 ring-blue-900/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <p className="font-extrabold text-purple-900">Xendit Invoice</p>
                    <p className="text-[11px] font-normal text-slate-500 mt-0.5">QRIS Dinamis API</p>
                  </button>
                </div>
              </div>

              {gatewayProvider !== 'none' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Mode Lingkungan
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSandbox(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          isSandbox ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-500'
                        }`}
                      >
                        Sandbox / Uji Coba
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSandbox(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                          !isSandbox ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'text-slate-500'
                        }`}
                      >
                        Production / Live
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Merchant ID / Public Key
                      </label>
                      <input
                        type="text"
                        value={merchantId}
                        onChange={(e) => setMerchantId(e.target.value)}
                        placeholder="Contoh: G123456789"
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Client Key
                      </label>
                      <input
                        type="text"
                        value={clientKey}
                        onChange={(e) => setClientKey(e.target.value)}
                        placeholder="SB-Mid-client-XXXXX"
                        className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      URL Endpoint Webhook Notifikasi
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={webhookUrl}
                        className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(webhookUrl)}
                        className="px-3 py-1.5 rounded-lg bg-blue-900 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWebhook ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Tempel URL ini pada dashboard {gatewayProvider === 'midtrans' ? 'Midtrans MAP' : 'Xendit Dashboard'} di menu Webhooks/Callbacks.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition shadow cursor-pointer"
                >
                  Simpan Konfigurasi Gateway
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isFullscreenModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setIsFullscreenModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsFullscreenModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pt-2">
              <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-black uppercase tracking-wider border border-red-200">
                QRIS INDONESIA
              </span>
              <h3 className="text-base font-black text-slate-900 uppercase mt-2">
                {qrisConfig.merchantName || userProfile.businessName}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                NMID: {qrisConfig.nmid}
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-slate-900 shadow-inner flex items-center justify-center">
              <img 
                src={qrisConfig.qrisImageUrl} 
                alt="QRIS Toko" 
                className="w-64 h-64 object-contain"
              />
            </div>

            <p className="text-xs font-bold text-slate-800">
              Silakan Pindai dengan Kamera m-Banking atau E-Wallet
            </p>

            <button
              onClick={() => setIsFullscreenModalOpen(false)}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              Tutup Tampilan Penuh
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
