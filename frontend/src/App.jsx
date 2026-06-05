import React, { useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import { TransactionEntryModal as TransactionModal } from './components/Transactions/TransactionsPage';
import Sidebar from './components/Sidebar';
import TransactionsPage from './components/Transactions/TransactionsPage';
import BatchCheckerPage from './components/BatchChecker/BatchCheckerPage';
import SettingsPage from './pages/SettingsPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { getApiUrl } from './apiConfig';

function App() {
   const [receipts, setReceipts] = useState([]);
   const [selectedReceipt, setSelectedReceipt] = useState(null);
   const [showTransactionModal, setShowTransactionModal] = useState(false);
   const location = useLocation();

  // Load receipts on mount
  useEffect(() => {
    fetch(getApiUrl(`/api/receipts?t=${Date.now()}`), { cache: 'no-store' })
      .then(res => res.ok ? res.json() : [])
      .then(data => setReceipts(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => {});
  }, []);

  // Mark receipt as matched in local state after a transaction is created
  const handleTransactionCreated = (_transaction, receiptId) => {
    if (!receiptId) return;
    setReceipts(prev =>
      prev.map(r => r.id === receiptId ? { ...r, match_status: 'matched' } : r)
    );
  };

  // Update account_holder in local state when assigned from a card
  const handleAccountAssigned = (updatedReceipt) => {
    setReceipts(prev =>
      prev.map(r => r.id === updatedReceipt.id ? { ...r, account_holder: updatedReceipt.account_holder } : r)
    );
  };

  const moveReceipt = (receiptId, targetColumn) => {
     fetch(getApiUrl(`/api/receipts/${receiptId}`), {
       method: 'PATCH',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ category: targetColumn }),
     }).then(() => {
       setReceipts(prev =>
         prev.map(r => r.id === receiptId ? { ...r, category: targetColumn } : r)
       );
     });
   };

   return (
    <ThemeProvider>
      <DndProvider backend={HTML5Backend}>
        <div className="flex h-screen bg-[#fffbf5] overflow-hidden">

          <Sidebar />

          <main className="flex-1 overflow-y-auto min-w-0 bg-[#fffbf5]">
            <div className="px-8 py-10">
              <div className="max-w-[1600px] mx-auto">
                <Routes>
                  <Route path="/" element={
                    <Dashboard
                      receipts={receipts}
                      onMoveReceipt={moveReceipt}
                      onSelectReceipt={setSelectedReceipt}
                      onCreateTransaction={(receipt) => {
                        setSelectedReceipt(receipt);
                        setShowTransactionModal(true);
                      }}
                      onAccountAssigned={handleAccountAssigned}
                    />
                  } />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/batch" element={<BatchCheckerPage />} />
                  <Route path="/batch/:batchId" element={<BatchCheckerPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/messages" element={<div className="text-orange-950 p-10">Messages coming soon...</div>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </main>
        </div>

        {selectedReceipt && !showTransactionModal && (
          <ReceiptDetailModal
            receipt={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        )}

        {showTransactionModal && selectedReceipt && (
          <TransactionModal
            receipt={selectedReceipt}
            onClose={() => {
              setShowTransactionModal(false);
              setSelectedReceipt(null);
            }}
            onTransactionCreated={handleTransactionCreated}
          />
        )}
      </DndProvider>
    </ThemeProvider>
  );
}

const ReceiptDetailModal = ({ receipt, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white border border-orange-100 rounded-[32px] w-full max-w-lg shadow-2xl shadow-orange-900/10 overflow-hidden font-sans">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-orange-50">
          <div>
            <h2 className="text-[16px] font-black text-orange-950 uppercase tracking-wider">Receipt Details</h2>
            <p className="text-[10px] text-orange-400 mt-1 font-bold uppercase tracking-[0.2em]">{receipt.id}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="bg-orange-50/30 flex items-center justify-center p-8 border-b border-orange-50">
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src={getApiUrl(`/api/receipts/${receipt.id}/image`)}
              alt="Receipt"
              className="max-h-72 object-contain rounded-2xl shadow-2xl relative border-2 border-orange-100"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* Details */}
        <div className="px-8 py-6 space-y-4">
          {[
            { label: 'Status', value: receipt.ocr_status, status: true },
            receipt.ocr_data?.reference && { label: 'Reference', value: receipt.ocr_data.reference, mono: true },
            receipt.ocr_data?.amount    && { label: 'Amount',    value: `₱${Number(receipt.ocr_data.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, accent: true },
            receipt.ocr_data?.date      && { label: 'Date',      value: receipt.ocr_data.date },
            { label: 'Category', value: receipt.category?.replace('_', ' ') || 'unsorted', capitalize: true },
            { label: 'Account', value: receipt.account_holder || 'Unassigned', badge: true },
          ].filter(Boolean).map((row, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-orange-50 last:border-0">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">{row.label}</span>
              <span className={`text-[13px] font-bold ${
                row.accent ? 'text-orange-600 font-black text-lg' :
                row.status ? 'bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest' :
                row.badge ? 'bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest' :
                row.mono  ? 'font-mono text-orange-900' :
                row.capitalize ? 'capitalize text-orange-950' :
                'text-orange-950'
              }`}>{row.value}</span>
            </div>
          ))}
        </div>

        <div className="px-8 pb-8 pt-2">
          <button onClick={onClose}
            className="w-full py-4 bg-orange-50 border border-orange-100 hover:bg-orange-100 text-orange-600 hover:text-orange-800 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-sm">
            Dismiss Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
