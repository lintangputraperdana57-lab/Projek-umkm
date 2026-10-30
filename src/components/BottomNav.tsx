import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  ReceiptText, 
  FileText, 
  ScanLine, 
  QrCode, 
  MoreHorizontal,
  BarChart3,
  Settings,
  X
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* Expandable More Menu Sheet */}
      {isMoreMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div 
            className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 space-y-4 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Menu Lengkap Pembukuan UMKM
              </span>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <button
                onClick={() => handleSelectTab('products')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  activeTab === 'products' ? 'bg-blue-50 border-blue-900 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Package className="w-6 h-6 mb-1.5 text-blue-800" />
                <span>Stok Produk</span>
              </button>

              <button
                onClick={() => handleSelectTab('debts')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  activeTab === 'debts' ? 'bg-blue-50 border-blue-900 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <FileText className="w-6 h-6 mb-1.5 text-amber-600" />
                <span>Utang Piutang</span>
              </button>

              <button
                onClick={() => handleSelectTab('reports')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  activeTab === 'reports' ? 'bg-blue-50 border-blue-900 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <BarChart3 className="w-6 h-6 mb-1.5 text-emerald-600" />
                <span>Laporan Kas</span>
              </button>

              <button
                onClick={() => handleSelectTab('settings')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  activeTab === 'settings' ? 'bg-blue-50 border-blue-900 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Settings className="w-6 h-6 mb-1.5 text-slate-600" />
                <span>Pengaturan</span>
              </button>

              <button
                onClick={() => handleSelectTab('scanner')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  activeTab === 'scanner' ? 'bg-blue-50 border-blue-900 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <ScanLine className="w-6 h-6 mb-1.5 text-indigo-600" />
                <span>Scan Nota</span>
              </button>

              <button
                onClick={() => handleSelectTab('qris')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  activeTab === 'qris' ? 'bg-blue-50 border-blue-900 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <QrCode className="w-6 h-6 mb-1.5 text-rose-600" />
                <span>QRIS Toko</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200 px-1 py-1 bottom-nav shadow-lg">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          
          {/* Beranda */}
          <button
            onClick={() => handleSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">Beranda</span>
          </button>

          {/* Kasir POS */}
          <button
            onClick={() => handleSelectTab('pos')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'pos' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1.5 rounded-full ${activeTab === 'pos' ? 'bg-blue-900 text-white' : 'text-slate-500'}`}>
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5">POS</span>
          </button>

          {/* Scan Nota */}
          <button
            onClick={() => handleSelectTab('scanner')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'scanner' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'scanner' ? 'bg-blue-100 text-blue-900' : 'text-slate-500'}`}>
              <ScanLine className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5">Scan Nota</span>
          </button>

          {/* QRIS */}
          <button
            onClick={() => handleSelectTab('qris')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'qris' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'qris' ? 'bg-red-100 text-red-700' : 'text-slate-500'}`}>
              <QrCode className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5">QRIS</span>
          </button>

          {/* Transaksi */}
          <button
            onClick={() => handleSelectTab('transactions')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              activeTab === 'transactions' ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ReceiptText className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-0.5">Transaksi</span>
          </button>

          {/* Menu Lainnya */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
              ['products', 'debts', 'reports', 'settings'].includes(activeTab) ? 'text-blue-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Lainnya</span>
          </button>

        </div>
      </div>
    </>
  );
};
