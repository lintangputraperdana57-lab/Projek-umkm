import React, { useState } from 'react';
import { 
  Building2, 
  LogIn, 
  LogOut, 
  Plus, 
  Store, 
  User as UserIcon, 
  CheckCircle2, 
  RefreshCw,
  ShoppingCart,
  Package,
  FileText,
  Code2,
  KeyRound,
  ShieldCheck,
  Users,
  ScanLine,
  QrCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBookkeeping } from '../context/BookkeepingContext';
import { AccessCodeLoginModal } from './AccessCodeLoginModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddModal: (type?: 'income' | 'expense') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAddModal }) => {
  const { user, isDemoUser, signInWithGoogle, signOutUser, loading: authLoading } = useAuth();
  const { userProfile, activeSession, logoutStaffToOwner, accessCode } = useBookkeeping();
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs shrink-0 p-0.5">
                <img 
                  src={userProfile.logoUrl || "/assets/aistudio/IMG_4d986b3a-e230-4498-8258-4d16b82fa55c_91979bc8.jpg"} 
                  alt="Logo Pembukuan UMKM" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                    Pembukuan UMKM
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                    {userProfile.businessName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Kode Akses Toko: <strong className="font-mono text-blue-900 font-bold">{accessCode}</strong> &bull; POS & Keuangan UMKM
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 text-xs sm:text-sm">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Beranda
              </button>
              <button
                onClick={() => setActiveTab('pos')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'pos'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Kasir POS
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'products'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Produk & Stok
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Transaksi
              </button>
              <button
                onClick={() => setActiveTab('debts')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'debts'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Utang-Piutang
              </button>
              <button
                onClick={() => setActiveTab('scanner')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'scanner'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ScanLine className="w-3.5 h-3.5 text-blue-400" />
                Scan Nota
              </button>
              <button
                onClick={() => setActiveTab('qris')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'qris'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-red-500" />
                QRIS
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Laporan
              </button>
              <button
                onClick={() => setActiveTab('php_code')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'php_code'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Kode PHP & SQL
              </button>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              
              {/* Quick Add Income / Expense */}
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => onOpenAddModal('income')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pemasukan</span>
                </button>
                <button
                  onClick={() => onOpenAddModal('expense')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pengeluaran</span>
                </button>
              </div>

              {/* Staff Status or Login Button */}
              {activeSession.isStaff ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold truncate max-w-[100px] sm:max-w-[130px]">
                      {activeSession.employeeName}
                    </span>
                    <span className="text-[10px] uppercase font-extrabold bg-amber-200/80 px-1 py-0.2 rounded text-amber-950">
                      {activeSession.role}
                    </span>
                  </div>
                  <button
                    onClick={logoutStaffToOwner}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Keluar Shift (Kembali ke Mode Pemilik)"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Keluar Shift</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsStaffLoginOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                  title="Buka Login Karyawan dengan Kode Akses Toko"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-800" />
                  <span className="hidden sm:inline">Login Karyawan</span>
                </button>
              )}

              {/* User Account / Profile Button */}
              <button
                onClick={() => setActiveTab('settings')}
                className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Pengaturan Profil & Manajemen Karyawan"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center border border-blue-200">
                  {activeSession.isStaff ? activeSession.employeeName?.charAt(0) : userProfile.ownerName.charAt(0)}
                </div>
              </button>

            </div>

          </div>
        </div>

        {/* Banner Sesi Karyawan jika sedang aktif */}
        {activeSession.isStaff && (
          <div className="bg-amber-500 text-white text-xs px-4 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                <span>
                  Mode Shift Karyawan Aktif: <strong>{activeSession.employeeName}</strong> ({activeSession.role.toUpperCase()})
                </span>
              </div>
              <button
                onClick={logoutStaffToOwner}
                className="text-[11px] underline font-bold hover:text-amber-100 cursor-pointer"
              >
                Kembali ke Mode Pemilik Usaha
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Modal Login Karyawan / Kode Akses */}
      <AccessCodeLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        onSuccess={() => {
          setActiveTab('pos');
        }}
      />
    </>
  );
};

