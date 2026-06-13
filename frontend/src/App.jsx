import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
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
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   const [isMobile, setIsMobile] = useState(false);
   const location = useLocation();
   const navigate = useNavigate();

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
      <div className="flex h-screen overflow-hidden" style={{ background: '#fffbf5' }}>
          <Sidebar 
            onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            isMobileMenuOpen={isMobileMenuOpen} 
          />

          <main 
            className="flex-1 overflow-y-auto min-w-0" 
            style={{ 
              background: '#fffbf5',
              paddingTop: isMobile ? '70px' : '0' 
            }}
          >
            <div 
              className="mx-auto" 
              style={{ 
                padding: isMobile ? '16px' : '32px 40px',
                maxWidth: '1600px'
              }}
            >
              <Routes>
                <Route path="/" element={
                  <Dashboard
                    receipts={receipts}
                    onSelectReceipt={setSelectedReceipt}
                    onNavigate={(path) => navigate(path)}
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
    </ThemeProvider>
  );
}

const STATUS_MAP = {
  completed:  { label: 'Verified',    bg: '#dcfce7', color: '#15803d', dot: '#22c55e' },
  processing: { label: 'Processing',  bg: '#fef9c3', color: '#a16207', dot: '#eab308' },
  pending:    { label: 'Pending',     bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  failed:     { label: 'Failed',      bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
};

const ReceiptDetailModal = ({ receipt, onClose }) => {
  const [imgError, setImgError] = React.useState(false);
  const status = STATUS_MAP[receipt.ocr_status] || STATUS_MAP.pending;

  const amount = receipt.ocr_data?.amount
    ? Number(receipt.ocr_data.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })
    : null;

  const rows = [
    receipt.ocr_data?.reference && { label: 'Reference', value: receipt.ocr_data.reference, mono: true },
    receipt.ocr_data?.date      && { label: 'Date',      value: receipt.ocr_data.date },
    { label: 'Category', value: receipt.category?.replace(/_/g, ' ') || 'Unsorted', cap: true },
    { label: 'Account',  value: receipt.account_holder || 'Unassigned' },
    receipt.ocr_status === 'completed' && receipt.batch && {
      label: 'Batch',
      value: receipt.batch.final_batch_number || receipt.batch.name || receipt.batch.batch_number,
      mono: true,
      highlight: true,
    },
  ].filter(Boolean);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,10,5,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'rdmIn 0.2s cubic-bezier(0.16,1,0.3,1) both',
      }}
    >
      <style>{`
        @keyframes rdmIn {
          from { opacity:0; transform:scale(0.97) translateY(8px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
      `}</style>

      {/* Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '900px',
          overflow: 'hidden',
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.06)',
          fontFamily: "'Inter', system-ui, sans-serif",
          display: 'flex',
          flexDirection: 'row'
        }}
      >
        {/* ── Left: Image ── */}
        <div style={{
          flex: '1 1 50%',
          background: 'linear-gradient(135deg, #fff7ed 0%, #fffbf5 100%)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '450px'
        }}>
          {!imgError ? (
            <img
              src={getApiUrl(`/api/receipts/${receipt.id}/image`)}
              alt="Receipt"
              crossOrigin="anonymous"
              onError={() => setImgError(true)}
              style={{
                maxHeight: '400px', 
                maxWidth: '100%',
                objectFit: 'contain', 
                borderRadius: '12px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                border: '1px solid rgba(251,146,60,0.2)',
              }}
            />
          ) : (
            <div style={{
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '10px',
              color: '#c2410c', 
              opacity: 0.6,
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Image unavailable</span>
            </div>
          )}
        </div>

        {/* ── Right: Details ── */}
        <div style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff'
        }}>
          {/* ── Top bar ── */}
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Receipt icon */}
              <div style={{
                width: '36px', 
                height: '36px', 
                borderRadius: '10px',
                background: '#fff7ed', 
                border: '1px solid rgba(251,146,60,0.2)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
                  <path d="M16 8H8M16 12H8M13 16H8"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Receipt Details
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                  #{String(receipt.id).slice(-8).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Status + close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                padding: '5px 12px', 
                borderRadius: '100px',
                background: status.bg, 
                color: status.color,
                fontSize: '11px', 
                fontWeight: 700, 
                letterSpacing: '0.02em',
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: status.dot, display: 'inline-block', flexShrink: 0 }} />
                {status.label}
              </div>
              <button
                onClick={onClose}
                style={{
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0', 
                  background: '#f8fafc',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer', 
                  color: '#64748b', 
                  transition: 'all 0.15s', 
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#dc2626'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Amount highlight (if present) ── */}
          {amount && (
            <div style={{
              margin: '0', 
              padding: '20px 24px',
              background: '#fff7ed', 
              borderBottom: '1px solid rgba(251,146,60,0.15)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#c2410c', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Amount
              </span>
              <span style={{
                fontSize: '26px', 
                fontWeight: 800, 
                color: '#c2410c',
                fontFamily: 'monospace', 
                letterSpacing: '-0.03em',
              }}>
                ₱{amount}
              </span>
            </div>
          )}

          {/* ── Detail rows ── */}
          <div style={{ 
            padding: '8px 0 0',
            flex: '1 1 auto'
          }}>
            {rows.map((row, i) => (
              <div key={i} style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '14px 24px',
                borderBottom: i < rows.length - 1 ? '1px solid #f8fafc' : 'none',
                background: row.highlight ? '#fff7ed' : 'transparent',
              }}>
                <span style={{
                  fontSize: '11px', 
                  fontWeight: 600,
                  color: row.highlight ? '#c2410c' : '#94a3b8',
                  letterSpacing: '0.05em', 
                  textTransform: 'uppercase',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                }}>
                  {row.highlight && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  )}
                  {row.label}
                </span>
                <span style={{
                  fontSize: '14px', 
                  fontWeight: row.highlight ? 700 : 600,
                  color: row.highlight ? '#ea580c' : '#0f172a',
                  fontFamily: row.mono ? 'monospace' : 'inherit',
                  textTransform: row.cap ? 'capitalize' : 'none',
                  letterSpacing: row.mono ? '0.03em' : 'normal',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Footer ── */}
          <div style={{ 
            padding: '16px 24px 20px', 
            borderTop: '1px solid #f1f5f9', 
            display: 'flex', 
            gap: '10px' 
          }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, 
                padding: '12px', 
                borderRadius: '12px',
                border: '1px solid rgba(251,146,60,0.25)', 
                background: '#fff7ed',
                color: '#c2410c', 
                fontSize: '14px', 
                fontWeight: 600,
                cursor: 'pointer', 
                transition: 'all 0.15s',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffedd5'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.25)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
