/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { BookkeepingProvider, useBookkeeping } from './context/BookkeepingContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { ProductsView } from './components/ProductsView';
import { TransactionsView } from './components/TransactionsView';
import { DebtsView } from './components/DebtsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { PhpCodeExplorerView } from './components/PhpCodeExplorerView';
import { ReceiptScannerView } from './components/ReceiptScannerView';
import { QrisMerchantView } from './components/QrisMerchantView';
import { TransactionModal } from './components/TransactionModal';
import { Transaction, TransactionType } from './types';
import { Loader2, AlertCircle, X } from 'lucide-react';

function AppContent() {
  const { loading, error, clearError } = useBookkeeping();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('income');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleOpenAddModal = (type: TransactionType = 'income') => {
    setEditingTransaction(null);
    setModalInitialType(type);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalInitialType(tx.type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-md p-2 flex items-center justify-center">
            <img 
              src="/assets/aistudio/IMG_4d986b3a-e230-4498-8258-4d16b82fa55c_91979bc8.jpg" 
              alt="Logo Pembukuan UMKM" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-blue-900 text-white p-1 rounded-full shadow">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-200" />
          </div>
        </div>
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          Menyiapkan Pembukuan UMKM...
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Memuat data arus kas, stok produk, dan utang-piutang
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 pb-16 md:pb-0">
      
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAddModal={handleOpenAddModal} 
      />

      {/* Global Error Banner if any */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 w-full">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button onClick={clearError} className="text-rose-500 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main View Body */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <DashboardView 
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleEditTransaction}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'pos' && (
          <PosView />
        )}

        {activeTab === 'products' && (
          <ProductsView />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView 
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activeTab === 'debts' && (
          <DebtsView />
        )}

        {activeTab === 'reports' && (
          <ReportsView />
        )}

        {activeTab === 'scanner' && (
          <ReceiptScannerView />
        )}

        {activeTab === 'qris' && (
          <QrisMerchantView />
        )}

        {activeTab === 'php_code' && (
          <PhpCodeExplorerView />
        )}

        {activeTab === 'settings' && (
          <SettingsView />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAddModal={() => handleOpenAddModal('income')} 
      />

      {/* Add / Edit Transaction Modal */}
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingTransaction={editingTransaction}
        initialType={modalInitialType}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BookkeepingProvider>
        <AppContent />
      </BookkeepingProvider>
    </AuthProvider>
  );
}
