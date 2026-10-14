import { useState, useEffect, useRef } from 'react';
import WorkspacePageHeader from '../WorkspacePageHeader';
import './TransactionsPage.css';
import { getApiUrl } from '../../apiConfig';
import { playTransactionSound } from '../../utils/sound';

const ACCOUNTS = ['Kristine', 'Nixie', 'Babilyn'];

// Batch color palette (5 colors cycling - Light mode friendly)
const BATCH_COLORS = [
  { bg: '#fdf4ff', border: '#f5d0fe', text: '#a21caf' },  // Fuchsia
  { bg: '#eff6ff', border: '#dbeafe', text: '#1d4ed8' },  // Blue
  { bg: '#f0fdf4', border: '#dcfce7', text: '#15803d' },  // Green
  { bg: '#fff7ed', border: '#ffedd5', text: '#c2410c' },  // Orange
  { bg: '#fff1f2', border: '#ffe4e6', text: '#be123c' },  // Rose
];

const getBatchColor = (batchNumber) => {
  if (!batchNumber) return null;
  // Extract numeric part from batch number (e.g., "B-001" -> 1)
  const numMatch = batchNumber.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0], 10) : 1;
  return BATCH_COLORS[Math.abs(num - 1) % BATCH_COLORS.length];
};

const fmt = (n) =>
  Number(n ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const EMPTY_FORM = () => ({
  transaction_date: new Date().toISOString().split('T')[0],
  entry_type: 'credit',
  amount: '',
  label: '',
  opening_balance: '',
});

// ─── Modern Icons ─────────────────────────────────────────────────────────────
const Icon = {
  Plus: ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  ArrowUp: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  ArrowDown: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  ),
  Wallet: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  Balance: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Calendar: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  File: ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Trash: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Edit: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Alert: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

// ─── Metric Card Component ────────────────────────────────────────────────────
function MetricCard({ label, value, icon: IconComponent, color = "neutral" }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${color}`}>
        <IconComponent />
      </div>
      <div className="metric-content">
        <p className="metric-label">{label}</p>
        <div className="metric-value">₱{fmt(value)}</div>
      </div>
    </div>
  );
}

// ─── Modal Component ──────────────────────────────────────────────────────────
export function TransactionEntryModal({ onClose, receipt, onTransactionCreated }) {
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    account: 'Account 1',
    amount: receipt?.ocr_data?.amount || '',
    label: receipt?.ocr_data?.reference || '',
    source_type: receipt?.category === 'gcash' ? 'gcash' : 'others',
    denominations: {}
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (receipt?.ocr_data?.amount) {
      const denominations = suggestDenominations(receipt.ocr_data.amount);
      setFormData(prev => ({ 
        ...prev, 
        amount: receipt.ocr_data.amount, 
        label: prev.label || receipt.ocr_data.reference || '',
        denominations 
      }));
    }
  }, [receipt]);

  const suggestDenominations = (amount) => {
    const denominations = {};
    let remaining = parseFloat(amount) || 0;
    if (remaining >= 1000) { denominations['1000'] = Math.floor(remaining / 1000); remaining %= 1000; }
    if (remaining >= 500)  { denominations['500']  = Math.floor(remaining / 500);  remaining %= 500; }
    if (remaining >= 100)  { denominations['100']  = Math.floor(remaining / 100); }
    return denominations;
  };

  const calculateFee = (amount) => {
    const n = parseFloat(amount) || 0;
    if (n < 500) return 5;
    return Math.floor(n / 1000) * 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = { 
      ...formData, 
      reference: null, // Combine into label
      receipt_id: receipt?.id 
    };
    try {
      const response = await fetch(getApiUrl('/api/transactions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const transaction = await response.json();
        // Play sound based on entry type (defaults to credit in modal)
        playTransactionSound(transaction.entry_type || 'credit');
        // If we're on the transactions page, the parent will handle refresh via polling or we could refresh manually
        if (onTransactionCreated) onTransactionCreated(transaction, receipt?.id);
        onClose();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create transaction.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const fee = calculateFee(formData.amount);
  const netAmount = (parseFloat(formData.amount) || 0) - fee;

  return (
    <div className="tx-modal fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-300">
      <div className="modal-container bg-white border border-orange-200 rounded-[24px] p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-orange-900/10 text-orange-950 relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-orange-900">New transaction</h2>
            <p className="text-[13px] text-orange-700/60 mt-1 uppercase tracking-wider font-semibold">Record a new receipt activity</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-3">
            <Icon.Alert /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" style={{ padding: 0 }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-orange-800/60 uppercase tracking-wider mb-2 ml-1">Date</label>
              <input type="date" value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-orange-800/60 uppercase tracking-wider mb-2 ml-1">Account</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value})} className="input-field appearance-none cursor-pointer">
                <option value="Account 1" className="bg-white">Account 1</option>
                <option value="Account 2" className="bg-white">Account 2</option>
                <option value="Account 3" className="bg-white">Account 3</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-orange-800/60 uppercase tracking-wider mb-2 ml-1">Source Type</label>
              <div className="toggle-group">
                <button type="button" onClick={() => setFormData({...formData, source_type: 'gcash'})} className={`toggle-button ${formData.source_type === 'gcash' ? 'active' : ''}`}>GCASH</button>
                <button type="button" onClick={() => setFormData({...formData, source_type: 'others'})} className={`toggle-button ${formData.source_type === 'others' ? 'active danger' : ''}`}>OTHERS</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-orange-800/60 uppercase tracking-wider mb-2 ml-1">Amount</label>
              <div className="amount-input-container">
                <span className="amount-prefix" aria-hidden="true">₱</span>
                <input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  const denominations = suggestDenominations(amount);
                  setFormData({...formData, amount, denominations});
                }} className="input-field amount-input" style={{ fontSize: '24px', fontWeight: 'bold' }} required />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-orange-800/60 uppercase tracking-wider mb-2 ml-1">Reference / Label</label>
              <input type="text" value={formData.label} onChange={(e) => setFormData({...formData, label: e.target.value})} placeholder="e.g. 50238 / Int" className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-[10px] font-bold text-green-700/60 uppercase tracking-widest mb-1">Fee (Calculated)</span>
              <span className="text-xl font-bold text-green-600 font-mono">₱{fee.toFixed(2)}</span>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-[10px] font-bold text-orange-700/60 uppercase tracking-widest mb-1">Net Amount</span>
              <span className="text-xl font-bold text-orange-600 font-mono">₱{netAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-orange-50/50 border border-orange-100 rounded-[20px] p-6">
            <label className="block text-[11px] font-bold text-orange-800/60 uppercase tracking-wider mb-4 ml-1">Suggested Denominations</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(formData.denominations).map(([denom, count]) => (
                <div key={denom} className="bg-white border border-orange-100 p-3 rounded-xl text-center shadow-sm">
                  <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">₱{denom}</div>
                  <div className="text-lg font-bold text-orange-900 font-mono">×{count}</div>
                </div>
              ))}
              {Object.keys(formData.denominations).length === 0 && (
                <div className="col-span-3 py-4 text-center">
                  <p className="text-[12px] text-orange-300 italic">Enter an amount to see suggestions</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3.5 border border-orange-200 text-orange-600 font-bold text-[13px] uppercase tracking-wider rounded-xl hover:bg-orange-50 transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="cta-button">
              {submitting ? 'Processing...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
// Recompute running_balance on every row and meta totals from local state.
// Rows are sorted oldest→newest for the running balance walk, then we restore
// the requested display order (asc or desc).
const recomputeBalances = (txns, openingBal, sortOrder = 'desc') => {
  const ob = parseFloat(openingBal ?? 0);
  const n = txns.length;
  const indices = new Array(n);
  for (let i = 0; i < n; i++) {
    const t = txns[i];
    indices[i] = {
      idx: i,
      ts: new Date(t.transaction_date).getTime(),
      id: t.id ?? 0
    };
  }
  indices.sort((a, b) => {
    const d = a.ts - b.ts;
    return d !== 0 ? d : a.id - b.id;
  });

  let running = ob;
  let totalCredit = 0;
  let totalDebit = 0;
  const result = new Array(n);
  for (let k = 0; k < n; k++) {
    const src = indices[k];
    const t = txns[src.idx];
    const amt = parseFloat(t.amount ?? 0);
    if (t.entry_type === 'credit') { running += amt; totalCredit += amt; }
    else                           { running -= amt; totalDebit  += amt; }
    t.running_balance = running;
    result[k] = t;
  }

  if (sortOrder !== 'asc') {
    result.reverse();
  }

  const meta = {
    opening_balance: ob,
    total_credit:    totalCredit,
    total_debit:     totalDebit,
    current_balance: running,
  };
  return { transactions: result, meta };
};

function PrintRangeDialog({ range, onChange, onClose, onPrint }) {
  const dialogRef = useRef(null);
  useEffect(() => { dialogRef.current.showModal(); }, []);
  return <dialog className="tx-print-dialog tx-modal" ref={dialogRef} aria-labelledby="print-dialog-title" onCancel={onClose}>
    <div className="tx-print-heading"><div><span>YOUR LEDGER, READY TO SHARE</span><h2 id="print-dialog-title">Print transactions</h2></div><button className="tx-print-close" aria-label="Close print options" onClick={onClose}>×</button></div>
    <p>Choose an optional date range for your report across all accounts.</p>
    <form onSubmit={event => { event.preventDefault(); onPrint(); }}>
      <label htmlFor="print-start">From date</label><input id="print-start" className="input-field" type="date" value={range.startDate} max={range.endDate || undefined} onChange={event => onChange(previous => ({ ...previous, startDate: event.target.value }))} />
      <label htmlFor="print-end">To date</label><input id="print-end" className="input-field" type="date" value={range.endDate} min={range.startDate || undefined} onChange={event => onChange(previous => ({ ...previous, endDate: event.target.value }))} />
      <div className="tx-print-note">Leave both dates empty to include all transactions.</div><div className="tx-print-actions"><button className="print-button" type="button" onClick={onClose}>Cancel</button><button className="cta-button" type="submit">Print report</button></div>
    </form>
  </dialog>;
}

export default function TransactionsPage() {
  const [activeAccount, setActiveAccount] = useState(ACCOUNTS[0]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forms, setForms] = useState(() => Object.fromEntries(ACCOUNTS.map(a => [a, EMPTY_FORM()])));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionMeta, setTransactionMeta] = useState({
    opening_balance: 0,
    total_credit: 0,
    total_debit: 0,
    current_balance: 0,
  });
  const [reportData, setReportData] = useState({ accounts: {}, completed_batches: [], can_print: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDateRange, setPrintDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = forms[activeAccount] || EMPTY_FORM();
  const setForm = (updater) => setForms(prev => {
    const cur = prev[activeAccount] || EMPTY_FORM();
    return { ...prev, [activeAccount]: typeof updater === 'function' ? updater(cur) : updater };
  });

  const fetchTransactions = async () => {
    if (!activeAccount) return;
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({
        account_holder: activeAccount,
        sort_order: sortOrder,
        t: String(Date.now()),
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const response = await fetch(getApiUrl(`/api/transactions?${params.toString()}`), { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load transactions');
      const data = await response.json();
      const rawTxns = Array.isArray(data?.data) ? data.data : [];
      const ob = data?.meta?.opening_balance ?? 0;
      const { transactions: computed, meta } = recomputeBalances(rawTxns, ob, sortOrder);
      setTransactions(computed);
      setTransactionMeta(meta);
    } catch {
      setTransactions([]);
      setLoadError('We couldn’t load this ledger. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const response = await fetch(getApiUrl('/api/transactions/report'), { cache: 'no-store' });
      if (response.ok) {
        setReportData(await response.json());
      }
    } catch {
      setReportData({ accounts: {}, completed_batches: [], can_print: false });
    }
  };

  useEffect(() => {
    fetchTransactions();
    setSelectedTransactions([]); // Clear selection when account, search, or sort changes
  }, [activeAccount, searchQuery, sortOrder]);

  useEffect(() => {
    fetchReport();
  }, [transactions.length]);

  const openingBalance = parseFloat(transactionMeta.opening_balance ?? form?.opening_balance ?? 0);
  const totalCredit = parseFloat(transactionMeta.total_credit ?? 0);
  const totalDebit = parseFloat(transactionMeta.total_debit ?? 0);
  const currentBalance = parseFloat(transactionMeta.current_balance ?? 0);

  const previewAmount = parseFloat(form.amount || 0) || 0;
  const previewBalance = form.entry_type === 'credit' 
    ? currentBalance + previewAmount 
    : currentBalance - previewAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    const ob = parseFloat(transactionMeta.opening_balance ?? form.opening_balance ?? 0);
      
    const payload = {
      transaction_date: form.transaction_date,
      account_holder:   activeAccount,
      account:          'Account 1',
      entry_type:       form.entry_type,
      amount:           parseFloat(form.amount),
      opening_balance:  ob,
      reference:        null, // Combined into label
      label:            form.label     || null,
      source_type:      'gcash',
    };

    try {
      const res = await fetch(getApiUrl('/api/transactions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        const saved = await res.json();
        // Play sound based on entry type
        playTransactionSound(saved.entry_type || form.entry_type);
        // Prepend new transaction, recompute running balances + meta in real time
        setTransactions(prev => {
          const { transactions: computed, meta } = recomputeBalances(
            [saved, ...prev],
            transactionMeta.opening_balance,
            sortOrder
          );
          setTransactionMeta(meta);
          return computed;
        });
        setForm(f => ({ ...f, amount: '', reference: '', label: '' }));
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save transaction');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? This action cannot be undone.')) return;
    try {
      const response = await fetch(getApiUrl(`/api/transactions/${id}`), { method: 'DELETE' });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setTransactions(prev => {
          const filtered = prev.filter(t => t.id !== id);
          const { transactions: computed, meta } = recomputeBalances(
            filtered,
            transactionMeta.opening_balance,
            sortOrder
          );
          setTransactionMeta(meta);
          return computed;
        });
      } else {
        throw new Error(result.message || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete transaction: ${error.message}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;
    
    if (!window.confirm(`Delete ${selectedTransactions.length} selected transaction${selectedTransactions.length > 1 ? 's' : ''}? This action cannot be undone.`)) return;
    
    setIsDeleting(true);
    try {
      // Use bulk delete endpoint for better performance
      const response = await fetch(getApiUrl('/api/transactions/bulk-delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedTransactions })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local state
        setTransactions(prev => {
          const filtered = prev.filter(t => !selectedTransactions.includes(t.id));
          const { transactions: computed, meta } = recomputeBalances(
            filtered,
            transactionMeta.opening_balance,
            sortOrder
          );
          setTransactionMeta(meta);
          return computed;
        });
        
        // Clear selection
        setSelectedTransactions([]);
        
        // Show success message (optional)
        console.log(result.message);
      } else {
        throw new Error(result.message || 'Failed to delete transactions');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete transactions: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectTransaction = (id) => {
    setSelectedTransactions(prev => 
      prev.includes(id) 
        ? prev.filter(txId => txId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(transactions.map(t => t.id));
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const handleSaveEdit = async (transactionId, updatedData) => {
    try {
      const res = await fetch(getApiUrl(`/api/transactions/${transactionId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      
      if (res.ok) {
        const updated = await res.json();
        // Replace in-place, recompute running balances + meta in real time
        setTransactions(prev => {
          const mapped = prev.map(t => t.id === updated.id ? updated : t);
          const { transactions: computed, meta } = recomputeBalances(
            mapped,
            transactionMeta.opening_balance,
            sortOrder
          );
          setTransactionMeta(meta);
          return computed;
        });
        setEditingTransaction(null);
      } else {
        throw new Error('Failed to update transaction');
      }
    } catch (err) {
      alert('Failed to update transaction: ' + err.message);
    }
  };

  const handlePrintClick = () => {
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { setError('Please allow pop-ups to print your report.'); return; }
    const printContent = generatePrintContent(printDateRange.startDate, printDateRange.endDate);
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setShowPrintModal(false);
    }, 250);
  };

  const generatePrintContent = (startDate = '', endDate = '') => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Report - All Accounts</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Inter', sans-serif;
            padding: 40px;
            background: white;
            color: #1e293b;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 8px;
          }
          
          .header p {
            font-size: 14px;
            color: #64748b;
            font-weight: 600;
          }
          
          .account-section {
            margin-bottom: 50px;
            page-break-inside: avoid;
          }
          
          .account-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
            padding: 12px 16px;
            background: #f1f5f9;
            border-left: 4px solid #3b82f6;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th {
            background: #0f172a;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          
          tr:hover {
            background: #f8fafc;
          }
          
          .batch-tag {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            font-family: 'Courier New', monospace;
            letter-spacing: 0.05em;
          }
          
          .credit { color: #059669; font-weight: 600; }
          .debit { color: #dc2626; font-weight: 600; }
          
          .summary {
            margin-top: 20px;
            padding: 16px;
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          
          .summary-row.total {
            border-top: 2px solid #0f172a;
            margin-top: 8px;
            padding-top: 12px;
            font-weight: 700;
            font-size: 16px;
          }
          
          @media print {
            body { padding: 20px; }
            .account-section { page-break-after: always; }
            .account-section:last-child { page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Transaction Report</h1>
          <p>All Accounts - Generated on ${new Date().toLocaleDateString('en-PH', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          ${startDate || endDate ? `<p style="margin-top: 8px; font-size: 13px; color: #f97316; font-weight: 700;">
            Date Range: ${startDate ? new Date(startDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Beginning'} 
            to ${endDate ? new Date(endDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Present'}
          </p>` : ''}
        </div>
    `;

    ACCOUNTS.forEach(account => {
      const accountReport = reportData.accounts?.[account];
      let accountTransactions = accountReport?.transactions || [];
      
      // Filter by date range if provided
      if (startDate || endDate) {
        accountTransactions = accountTransactions.filter(t => {
          const txDate = new Date(t.transaction_date);
          const start = startDate ? new Date(startDate) : new Date('1900-01-01');
          const end = endDate ? new Date(endDate) : new Date('2100-12-31');
          return txDate >= start && txDate <= end;
        });
      }
      
      if (accountTransactions.length === 0) return;

      // Recalculate totals for filtered transactions
      let totalCredit = 0;
      let totalDebit = 0;
      let openingBalance = accountReport.meta?.opening_balance ?? 0;
      
      accountTransactions.forEach(t => {
        const amt = parseFloat(t.amount || 0);
        if (t.entry_type === 'credit') {
          totalCredit += amt;
        } else {
          totalDebit += amt;
        }
      });
      
      const currentBalance = openingBalance + totalCredit - totalDebit;

      html += `
        <div class="account-section">
          <div class="account-title">${account}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Label</th>
                <th>Batch</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
      `;

      accountTransactions.forEach(t => {
        const amt = parseFloat(t.amount || 0);
        const batchLabel = t.batch_label || '—';
        const displayLabel = t.display_label || (t.entry_type === 'debit' ? (t.label || 'Deduction') : batchLabel);
        
        const color = t.entry_type === 'debit'
          ? { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' }
          : getBatchColor(batchLabel);
        
        const batchStyle = color 
          ? `background: ${color.bg}; border: 1px solid ${color.border}; color: ${color.text};`
          : 'background: #f1f5f9; border: 1px solid #cbd5e1; color: #64748b;';

        html += `
          <tr>
            <td>${fmtDate(t.transaction_date)}</td>
            <td><span class="${t.entry_type}">${t.entry_type === 'credit' ? 'Credit (+)' : 'Debit (−)'}</span></td>
            <td>₱${fmt(amt)}</td>
            <td>${t.label || '—'}</td>
            <td><span class="batch-tag" style="${batchStyle}">${displayLabel}</span></td>
            <td>₱${fmt(t.running_balance ?? 0)}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-row">
              <span>Opening Balance:</span>
              <span>₱${fmt(openingBalance)}</span>
            </div>
            <div class="summary-row">
              <span>Total Credits:</span>
              <span class="credit">+₱${fmt(totalCredit)}</span>
            </div>
            <div class="summary-row">
              <span>Total Debits:</span>
              <span class="debit">−₱${fmt(totalDebit)}</span>
            </div>
            <div class="summary-row total">
              <span>Current Balance:</span>
              <span>₱${fmt(currentBalance)}</span>
            </div>
          </div>
        </div>
      `;
    });

    html += `
      </body>
      </html>
    `;

    return html;
  };

  const fmtDate = (raw) => {
    if (!raw) return '—';
    const d = new Date(raw);
    return d.toLocaleDateString('en-PH', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/ /g, ' '); // Ensure single space, although toLocaleDateString handles it
  };

  return (
    <>
      <div className="tx-root">
        <WorkspacePageHeader title="Transactions" eyebrow="EVERY ENTRY, IN PERSPECTIVE"
          description="A clear view of your credits, debits, and everything in between."
          actions={(          <button
            onClick={handlePrintClick}
            className="print-button"
            title="Print transaction report"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print Transactions
          </button>)} />
        {loadError && <div className="tx-load-error" role="alert"><Icon.Alert /><p>{loadError}</p><button onClick={fetchTransactions}>Retry</button></div>}
        <div className="tx-section-heading"><h2>Account overview</h2><span>Choose an account to view its ledger</span></div>
        <div className="account-header">
          <div className="account-tabs" role="group" aria-label="Account ledger">
            {ACCOUNTS.map(acc => (
              <button
                key={acc}
                className={`account-tab ${activeAccount === acc ? 'active' : ''}`}
                aria-pressed={activeAccount === acc}
                onClick={() => setActiveAccount(acc)}
              >
                {acc}
              </button>
            ))}
          </div>
          

        </div>

        <section className="metrics-grid" aria-label="Account balances">
          <MetricCard label="Opening balance" value={openingBalance} icon={Icon.Wallet} />
          <MetricCard label="Total credits" value={totalCredit} icon={Icon.ArrowUp} color="success" />
          <MetricCard label="Total debits" value={totalDebit} icon={Icon.ArrowDown} color="danger" />
          <MetricCard label="Current balance" value={currentBalance} icon={Icon.Balance} color="accent" />
        </section>
        <div className="main-layout">
          {/* Form Panel */}
          <div className="glass-panel sticky">
            <div className="form-header">
              <div className="form-icon">
                <Icon.Plus />
              </div>
              <div className="form-title-group">
                <h2>New transaction</h2>
                <div className="form-subtitle">{activeAccount}</div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <Icon.Alert />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label" htmlFor="tx-date">Date</label>
                <input id="tx-date"
                  type="date"
                  className="input-field"
                  value={form.transaction_date}
                  onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))}
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label">Type</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-button ${form.entry_type === 'credit' ? 'active' : ''}`} aria-pressed={form.entry_type === 'credit'}
                    onClick={() => setForm(f => ({ ...f, entry_type: 'credit' }))}
                  >
                    <Icon.ArrowUp /> Credit
                  </button>
                  <button
                    type="button"
                    className={`toggle-button danger ${form.entry_type === 'debit' ? 'active' : ''}`} aria-pressed={form.entry_type === 'debit'}
                    onClick={() => setForm(f => ({ ...f, entry_type: 'debit' }))}
                  >
                    <Icon.ArrowDown /> Debit
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="tx-amount">Amount</label>
                <div className="amount-input-container">
                  <span className="amount-prefix" aria-hidden="true">₱</span>
                  <input id="tx-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field amount-input"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="tx-label">Reference / Label</label>
                <input id="tx-label"
                  type="text"
                  className="input-field"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. 50238 / Int"
                />
              </div>

              {transactions.length === 0 && (
                <div className="field-group">
                  <label className="field-label" htmlFor="tx-opening">Opening Balance</label>
                  <input id="tx-opening"
                    type="number"
                    step="0.01"
                    className="input-field"
                    style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}
                    value={form.opening_balance}
                    onChange={e => setForm(f => ({ ...f, opening_balance: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              )}

              {form.amount && (
                <div className={`preview-card ${form.entry_type}`}>
                  <span className="preview-label">Projected Balance</span>
                  <span className={`preview-value ${form.entry_type}`}>
                    ₱{fmt(previewBalance)}
                  </span>
                </div>
              )}

              <button 
                type="submit" 
                className="cta-button"
                disabled={submitting || !form.amount}
              >
                {submitting ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon.Plus />
                    Add Transaction
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Main Content */}
          <div className="tx-ledger">
            <div className="glass-panel">
              <div className="table-header">
                <div>
                  <h2 className="table-title">Transaction history</h2>
                  <p className="form-subtitle">{activeAccount} • All activity</p>
                </div>
                <div className="tx-table-tools">
                  {selectedTransactions.length > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                      className="bulk-delete-button"
                      title={`Delete ${selectedTransactions.length} selected transaction${selectedTransactions.length > 1 ? 's' : ''}`}
                    >
                      {isDeleting ? (
                        <>
                          <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px', borderTopColor: 'white' }} />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Icon.Trash className="w-4 h-4" />
                          Delete ({selectedTransactions.length})
                        </>
                      )}
                    </button>
                  )}
                  <div className="tx-search">
                    {/* Search icon */}
                    <div style={{
                      position: 'absolute', left: '11px', top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9a3412', opacity: 0.45,
                      pointerEvents: 'none',
                      display: 'flex', alignItems: 'center',
                      zIndex: 1,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search transactions…"
                      aria-label="Search transactions"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '220px',
                        height: '36px',
                        paddingLeft: '34px',
                        paddingRight: searchQuery ? '32px' : '12px',
                        paddingTop: '0',
                        paddingBottom: '0',
                        background: '#ffffff',
                        border: '1px solid rgba(251,146,60,0.25)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: '#431407',
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s, box-shadow 0.15s',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(251,146,60,0.25)'; e.target.style.boxShadow = 'none'; }}
                    />
                    {searchQuery && (
                      <button
                        aria-label="Clear transaction search"
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute', right: '8px', top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent', border: 'none',
                          cursor: 'pointer', color: '#9a3412', opacity: 0.5,
                          display: 'flex', alignItems: 'center', padding: '2px',
                          borderRadius: '4px', transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2" style={{ gap: '8px' }}>
                    <button 
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      className="table-stats hover:bg-white/5 transition-all flex items-center gap-2"
                      title={sortOrder === 'desc' ? "Showing Newest First" : "Showing Oldest First"}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: sortOrder === 'asc' ? 'rotate(180deg)' : 'none' }}>
                        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                      </svg>
                      {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                    </button>
                    <div className="table-stats">
                      {transactions.length} transactions
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="empty-state">
                  <div className="spinner" />
                  <div className="empty-text">Loading transactions...</div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon.File />
                  </div>
                  <div className="empty-text">{searchQuery ? 'No matching transactions' : 'Your ledger starts here'}</div>
                  <p>{searchQuery ? 'Try another reference or label to find your entry.' : 'Start with a credit or debit using the new transaction form.'}</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="checkbox-cell">
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={transactions.length > 0 && selectedTransactions.length === transactions.length}
                            onChange={handleSelectAll}
                            title="Select all transactions" aria-label="Select all transactions"
                          />
                        </th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Batch</th>
                        <th className="w-full">Reference / Label</th>
                        <th>Amount</th>
                        <th>Balance</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(t => {
                          const amt = parseFloat(t.amount || 0);
                          const running = t.running_balance ?? 0;
                          
                          const d = fmtDate(t.transaction_date);
                          const batch = t.batch;
                          const batchLabel = t.batch_label || batch?.final_batch_number;
                          const batchTitle = t.batch_name || batch?.name;
                          
                          // For debit transactions, show descriptive word instead of batch number
                          const displayLabel = t.entry_type === 'debit' 
                            ? (t.label || 'Deduction')
                            : batchLabel;
                          
                          const isEditing = editingTransaction?.id === t.id;

                          if (isEditing) {
                            // Inline edit mode
                            return (
                              <tr key={t.id} className="editing-row">
                                <td data-label="Select" className="checkbox-cell">
                                  <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    aria-label={`Select transaction ${t.id}`}
                                    checked={selectedTransactions.includes(t.id)}
                                    onChange={() => handleSelectTransaction(t.id)}
                                  />
                                </td>
                                <td data-label="Date">
                                  <input
                                    type="date"
                                    defaultValue={t.transaction_date}
                                    className="inline-edit-input"
                                    aria-label="Edit date" id={`edit-date-${t.id}`}
                                  />
                                </td>
                                <td data-label="Type">
                                  <select
                                    defaultValue={t.entry_type}
                                    className="inline-edit-select"
                                    aria-label="Edit type" id={`edit-type-${t.id}`}
                                  >
                                    <option value="credit">Credit</option>
                                    <option value="debit">Debit</option>
                                  </select>
                                </td>
                                <td data-label="Batch">
                                  {t.entry_type === 'debit' ? (
                                    <span 
                                      className="batch-tag" 
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        borderColor: 'rgba(239, 68, 68, 0.3)',
                                        color: '#a33e2c'
                                      }}
                                    >
                                      {displayLabel}
                                    </span>
                                  ) : batchLabel ? (
                                    <span 
                                      className="batch-tag" 
                                      title={batchTitle ? `${batchLabel} · ${batchTitle}` : batchLabel}
                                      style={(() => {
                                        const color = getBatchColor(batchLabel);
                                        return color ? {
                                          background: color.bg,
                                          borderColor: color.border,
                                          color: color.text
                                        } : {};
                                      })()}
                                    >
                                      {batchLabel}
                                    </span>
                                  ) : (
                                    <span className="batch-none">—</span>
                                  )}
                                </td>
                                <td data-label="Ref / Label">
                                  <input
                                    type="text"
                                    defaultValue={t.label || ''}
                                    placeholder="Label"
                                    className="inline-edit-input"
                                    aria-label="Edit label" id={`edit-label-${t.id}`}
                                  />
                                </td>
                                <td data-label="Amount">
                                  <input
                                    type="number"
                                    step="0.01"
                                    defaultValue={amt}
                                    className="inline-edit-input"
                                    aria-label="Edit amount" id={`edit-amount-${t.id}`}
                                  />
                                </td>
                                <td data-label="Balance">
                                  <div className="balance-display">
                                    ₱{fmt(running)}
                                  </div>
                                </td>
                                <td data-label="Actions" style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button 
                                      className="save-button" 
                                      onClick={() => {
                                        const updatedData = {
                                          transaction_date: document.getElementById(`edit-date-${t.id}`).value,
                                          entry_type: document.getElementById(`edit-type-${t.id}`).value,
                                          amount: document.getElementById(`edit-amount-${t.id}`).value,
                                          label: document.getElementById(`edit-label-${t.id}`).value,
                                        };
                                        handleSaveEdit(t.id, updatedData);
                                      }}
                                      title="Save changes"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </button>
                                    <button 
                                      className="cancel-button" 
                                      onClick={handleCancelEdit}
                                      title="Cancel editing"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          // Normal display mode
                          return (
                            <tr key={t.id}>
                              <td data-label="Select" className="checkbox-cell">
                                <input
                                  type="checkbox"
                                  className="custom-checkbox"
                                  aria-label={`Select transaction ${t.id}`}
                                    checked={selectedTransactions.includes(t.id)}
                                  onChange={() => handleSelectTransaction(t.id)}
                                />
                              </td>
                              <td data-label="Date">
                                <div className="date-display">{d}</div>
                              </td>
                              <td data-label="Type">
                                <div className={`type-badge ${t.entry_type}`}>
                                  <div className={`type-dot ${t.entry_type}`} />
                                  {t.entry_type}
                                </div>
                              </td>
                              <td data-label="Batch">
                                {t.entry_type === 'debit' ? (
                                  <span 
                                    className="batch-tag" 
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      borderColor: 'rgba(239, 68, 68, 0.3)',
                                      color: '#a33e2c'
                                    }}
                                  >
                                    {displayLabel}
                                  </span>
                                ) : batchLabel ? (
                                  <span 
                                    className="batch-tag" 
                                    title={batchTitle ? `${batchLabel} · ${batchTitle}` : batchLabel}
                                    style={(() => {
                                      const color = getBatchColor(batchLabel);
                                      return color ? {
                                        background: color.bg,
                                        borderColor: color.border,
                                        color: color.text
                                      } : {};
                                    })()}
                                  >
                                    {batchLabel}
                                  </span>
                                ) : (
                                  <span className="batch-none">—</span>
                                )}
                              </td>
                              <td data-label="Ref / Label">
                                <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'visible' }}>
                                  {t.label || t.reference || '—'}
                                </div>
                              </td>
                              <td data-label="Amount">
                                <div className={`amount-display ${t.entry_type}`}>
                                  {t.entry_type === 'credit' ? '+' : '−'}₱{fmt(amt)}
                                </div>
                              </td>
                              <td data-label="Balance">
                                <div className="balance-display">
                                  ₱{fmt(running)}
                                </div>
                              </td>
                              <td data-label="Actions" style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button 
                                    className="edit-button" 
                                    onClick={() => handleEdit(t)}
                                    title="Edit transaction"
                                  >
                                    <Icon.Edit />
                                  </button>
                                  <button 
                                    className="delete-button" 
                                    onClick={() => handleDelete(t.id)}
                                    title="Delete transaction"
                                  >
                                    <Icon.Trash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot className="table-footer">
                      <tr>
                        <td colSpan={6}>
                          <div className="footer-stats">Total Activity</div>
                          <div className="footer-amounts">
                            <div className="footer-credit">+₱{fmt(totalCredit)}</div>
                            <div className="footer-debit">−₱{fmt(totalDebit)}</div>
                          </div>
                        </td>
                        <td colSpan={2}>
                          <div className="footer-stats">Current Balance</div>
                          <div className="net-balance">₱{fmt(currentBalance)}</div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPrintModal && <PrintRangeDialog range={printDateRange} onChange={setPrintDateRange} onClose={() => setShowPrintModal(false)} onPrint={handlePrint} />}

    </>
  );
}