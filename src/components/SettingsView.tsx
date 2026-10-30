import React, { useState } from 'react';
import { 
  Store, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Target, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Save, 
  Check, 
  AlertCircle,
  Tag,
  Download,
  KeyRound,
  Users,
  Copy,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react';
import { useBookkeeping } from '../context/BookkeepingContext';
import { useAuth } from '../context/AuthContext';
import { formatRupiah, parseRupiahInput } from '../utils/formatters';
import { Category, TransactionType, EmployeeRole } from '../types';

export const SettingsView: React.FC = () => {
  const { user, signInWithGoogle, signOutUser, loading: authLoading } = useAuth();
  const { 
    userProfile, 
    updateUserProfile, 
    categories, 
    addCategory, 
    deleteCategory,
    resetToSampleData,
    resetToEmptyAccount,
    transactions,
    isCloudSynced,
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    accessCode,
    updateAccessCode
  } = useBookkeeping();

  // Profile Form State
  const [businessName, setBusinessName] = useState(userProfile.businessName);
  const [ownerName, setOwnerName] = useState(userProfile.ownerName);
  const [businessPhone, setBusinessPhone] = useState(userProfile.businessPhone);
  const [businessAddress, setBusinessAddress] = useState(userProfile.businessAddress);
  const [monthlyTarget, setMonthlyTarget] = useState(userProfile.monthlyProfitTarget.toString());
  const [logoUrl, setLogoUrl] = useState(userProfile.logoUrl || '/assets/aistudio/IMG_4d986b3a-e230-4498-8258-4d16b82fa55c_91979bc8.jpg');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Employee & Access Code State
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState<EmployeeRole>('cashier');
  const [empPin, setEmpPin] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showPinMap, setShowPinMap] = useState<Record<string, boolean>>({});
  const [empError, setEmpError] = useState<string | null>(null);

  // New Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<TransactionType>('expense');
  const [newCatColor, setNewCatColor] = useState('#2563eb');
  const [catError, setCatError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const targetNum = parseRupiahInput(monthlyTarget);

    const success = await updateUserProfile({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      businessPhone: businessPhone.trim(),
      businessAddress: businessAddress.trim(),
      monthlyProfitTarget: targetNum || 10000000,
      logoUrl: logoUrl.trim() || '/assets/aistudio/IMG_4d986b3a-e230-4498-8258-4d16b82fa55c_91979bc8.jpg',
    });

    setIsSavingProfile(false);
    if (success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleGenerateNewCode = async () => {
    const randomCode = `UMKM-${Math.floor(1000 + Math.random() * 9000)}`;
    if (confirm(`Ganti Kode Akses Toko menjadi "${randomCode}"? Karyawan harus menggunakan kode baru ini untuk login.`)) {
      await updateAccessCode(randomCode);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError(null);
    if (!empName.trim()) {
      setEmpError('Nama karyawan wajib diisi.');
      return;
    }
    if (!empPin || empPin.length < 4) {
      setEmpError('PIN minimal 4 digit angka.');
      return;
    }

    const success = await addEmployee({
      name: empName.trim(),
      role: empRole,
      pin: empPin.trim(),
      phone: empPhone.trim() || undefined,
      status: 'active'
    });

    if (success) {
      setEmpName('');
      setEmpPin('');
      setEmpPhone('');
      setShowAddEmpModal(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    if (!newCatName.trim()) {
      setCatError('Nama kategori wajib diisi.');
      return;
    }

    const success = await addCategory({
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
      icon: 'Tag',
      isDefault: false,
    });

    if (success) {
      setNewCatName('');
      setShowCatModal(false);
    }
  };

  const handleExportJsonBackup = () => {
    const backupData = {
      profile: userProfile,
      categories,
      transactions,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Backup_Pembukuan_${userProfile.businessName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Pengaturan & Kategori UMKM
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Kelola profil usaha, target keuangan, kategori, dan autentikasi akun
        </p>
      </div>

      {/* Cloud & Security Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Penyimpanan Database & Autentikasi
              </h3>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                user ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {user ? 'Cloud Terhubung' : 'Mode Offline / Tamu'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user 
                ? `Terhubung dengan akun Google: ${user.email}. Data Anda diisolasi secara aman menggunakan Firebase Security Rules.`
                : 'Masuk dengan akun Google untuk mengamankan dan menyinkronkan seluruh pembukuan ke database awan.'}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {user ? (
            <button
              onClick={() => signOutUser()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              disabled={authLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-transform active:scale-95"
            >
              <LogIn className="w-4 h-4 text-blue-200" />
              <span>Masuk dengan Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Business Profile Form */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">
              Identitas Profil Usaha (UMKM)
            </h3>
          </div>
          {profileSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5" />
              <span>Perubahan Disimpan!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Logo Usaha Card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img 
                src={logoUrl || "/assets/aistudio/IMG_4d986b3a-e230-4498-8258-4d16b82fa55c_91979bc8.jpg"} 
                alt="Logo Bisnis" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/aistudio/IMG_4d986b3a-e230-4498-8258-4d16b82fa55c_91979bc8.jpg";
                }}
              />
            </div>
            <div className="flex-1 w-full space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Logo Usaha
              </label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="Path atau URL gambar logo"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <p className="text-[11px] text-slate-500">
                Logo resmi aktif ditampilkan pada bilah navigasi, struk kasir thermal POS, dan ikon sistem.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLogoUrl('/assets/aistudio/IMG_4d986b3a-e230-4498-8258-4d16b82fa55c_91979bc8.jpg')}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 shrink-0 font-medium"
            >
              Reset ke Logo Utama
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Usaha / Toko <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Contoh: Kopi Kenangan Senja, Toko Berkah"
                maxLength={100}
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pemilik Usaha
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Nama lengkap pemilik"
                maxLength={100}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp / Telepon Usaha
              </label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                maxLength={30}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Laba Bulanan (Rp)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatRupiah(parseRupiahInput(monthlyTarget), false)}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  placeholder="10.000.000"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lokasi Usaha
              </label>
              <textarea
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Alamat toko, kios, ruko, atau operasional..."
                rows={2}
                maxLength={250}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Employee & Store Access Code Section */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Kode Akses Toko & Karyawan
              </h3>
              <p className="text-xs text-slate-500">
                Karyawan dapat login di HP/tablet mereka menggunakan Kode Toko + PIN masing-masing tanpa kata sandi pemilik.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddEmpModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 rounded-xl shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Karyawan</span>
          </button>
        </div>

        {/* Store Access Code Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-300">
              Kode Akses Bisnis / Toko Anda
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-white">
                {accessCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold text-white transition flex items-center gap-1 cursor-pointer"
                title="Salin Kode Akses"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Tersalin!' : 'Salin'}</span>
              </button>
            </div>
            <p className="text-[11px] text-blue-200 mt-1 max-w-lg">
              Berikan kode toko ini ke kasir atau staf gudang. Di layar login, mereka cukup memilih tombol <strong>"Login Karyawan"</strong> lalu memasukkan kode ini dan PIN 4-digit mereka.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleGenerateNewCode}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-300" />
              <span>Ganti Kode Akses</span>
            </button>
          </div>
        </div>

        {/* Employees Table / Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Daftar Karyawan Aktif ({employees.length} Orang)
            </h4>
            <span className="text-[11px] text-slate-400">
              Peran: Kasir (POS saja) &bull; Staf (Stok saja) &bull; Manajer (Operasional)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {employees.map((emp) => {
              const isShowingPin = showPinMap[emp.id];
              const roleBadge = 
                emp.role === 'cashier' ? { label: 'Kasir', color: 'bg-blue-100 text-blue-900 border-blue-200' } :
                emp.role === 'manager' ? { label: 'Manajer', color: 'bg-purple-100 text-purple-900 border-purple-200' } :
                { label: 'Staf Gudang', color: 'bg-emerald-100 text-emerald-900 border-emerald-200' };

              return (
                <div 
                  key={emp.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 font-black text-sm flex items-center justify-center shrink-0 border border-blue-200">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">{emp.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          PIN: <strong className="text-slate-800">{isShowingPin ? emp.pin : '••••'}</strong>
                          <button
                            type="button"
                            onClick={() => setShowPinMap(prev => ({ ...prev, [emp.id]: !prev[emp.id] }))}
                            className="text-slate-400 hover:text-slate-600 ml-0.5 cursor-pointer"
                          >
                            {isShowingPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </span>
                        {emp.phone && (
                          <span>&bull; {emp.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateEmployee(emp.id, { status: emp.status === 'active' ? 'inactive' : 'active' })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        emp.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                      title="Klik untuk ubah status aktif"
                    >
                      {emp.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus karyawan ${emp.name}?`)) {
                          deleteEmployee(emp.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Hapus Karyawan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Kategori Transaksi UMKM
            </h3>
            <p className="text-xs text-slate-500">
              Daftar kategori pemasukan & pengeluaran untuk pengelompokan akun
            </p>
          </div>

          <button
            onClick={() => setShowCatModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 rounded-xl shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kategori</span>
          </button>
        </div>

        {/* Categories Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Income Categories */}
          <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/20">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-3">
              Kategori Pemasukan
            </span>
            <div className="flex flex-wrap gap-2">
              {categories.filter(c => c.type === 'income').map(cat => (
                <div 
                  key={cat.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-emerald-200 text-slate-800 shadow-2xs"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{cat.name}</span>
                  {!cat.isDefault && (
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="text-slate-400 hover:text-rose-600 ml-1"
                      title="Hapus Kategori"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="border border-rose-200 rounded-xl p-4 bg-rose-50/20">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-3">
              Kategori Pengeluaran
            </span>
            <div className="flex flex-wrap gap-2">
              {categories.filter(c => c.type === 'expense').map(cat => (
                <div 
                  key={cat.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-rose-200 text-slate-800 shadow-2xs"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>{cat.name}</span>
                  {!cat.isDefault && (
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="text-slate-400 hover:text-rose-600 ml-1"
                      title="Hapus Kategori"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Backup & Sample Data Utilities */}
      <div className="bg-slate-100/70 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Cadangan & Pemulihan Data
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Unduh seluruh riwayat pembukuan Anda sebagai file cadangan offline atau muat ulang sampel data awal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportJsonBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cadangan JSON</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Reset data ke sampel awal? Transaksi saat ini akan digantikan dengan data contoh UMKM.')) {
                resetToSampleData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Isi Data Sampel</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Kosongkan semua transaksi, produk, utang, dan riwayat menjadi NOL? Gunakan opsi ini jika ingin mulai pembukuan toko baru Anda sendiri secara mandiri.')) {
                resetToEmptyAccount();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 rounded-xl cursor-pointer"
            title="Reset data menjadi nol semua untuk mulai isi sendiri"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Nol (Mulai Sendiri)</span>
          </button>
        </div>
      </div>

      {/* Add Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Tambah Kategori Baru
            </h3>

            {catError && (
              <p className="text-xs text-rose-600 mb-2">{catError}</p>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Kemitraan Reseller..."
                  maxLength={60}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewCatType('income')}
                    className={`py-2 rounded-lg font-bold ${
                      newCatType === 'income' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatType('expense')}
                    className={`py-2 rounded-lg font-bold ${
                      newCatType === 'expense' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    Pengeluaran
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 rounded-xl"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Tambah Karyawan Baru
              </h3>
              <button 
                type="button"
                onClick={() => setShowAddEmpModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {empError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {empError}
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Karyawan *
                </label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Contoh: Rian Hidayat"
                  maxLength={60}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran / Hak Akses *
                </label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value as EmployeeRole)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                >
                  <option value="cashier">Kasir (Hanya Kasir POS & Nota Transaksi)</option>
                  <option value="staff">Staf Gudang (Hanya Kelola Produk & Stok)</option>
                  <option value="manager">Manajer (Akses Operasional Lengkap)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN Akses (4 Digit) *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={empPin}
                    onChange={(e) => setEmpPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    required
                    className="w-full px-3 py-2 text-xs font-mono font-bold tracking-widest text-center bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Kontak / WA
                  </label>
                  <input
                    type="tel"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900">
                Karyawan ini dapat login menggunakan <strong>Kode Akses Toko ({accessCode})</strong> dan <strong>PIN</strong> yang dibuat di atas.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
