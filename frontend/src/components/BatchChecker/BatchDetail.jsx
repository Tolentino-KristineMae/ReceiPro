import React from 'react';
import BillingSummaryModal from './BillingSummaryModal';
import { getApiUrl } from '../../apiConfig';
import { parseOCRData, defaultBatchStats } from './BatchUtils';

const Icon = {
  Trash: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
    </svg>
  ),
  Crop: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v14a2 2 0 002 2h14" />
      <path d="M18 22V8a2 2 0 00-2-2H2" />
    </svg>
  ),
  Scan: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 12h10" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  Check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Circle: ({ size = 8 }) => (
    <svg width={size} height={size} viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  ),
  Plus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

export default function BatchDetail({ 
  batch, 
  filter, 
  setFilter, 
  filteredReceipts, 
  handleDeleteBatch, 
  handleDeleteReceipt,
  handleResetBatch,
  handleAddUpload,
  handleRunExtraction,
  handleRunFinalCheck, 
  isRunningCheck, 
  setShowProcessor, 
  navigate 
}) {
  const [receiptToDelete, setReceiptToDelete] = React.useState(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showSummaryModal, setShowSummaryModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState('status');
  const fileInputRef = React.useRef(null);

  // ── Multi-select state ──
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = (visibleReceipts) => {
    const visibleIds = visibleReceipts.map(r => r.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleIds));
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => handleDeleteReceipt(id)));
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
    } catch (e) {
      alert('Some receipts could not be deleted.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (!batch) {
    return (
      <div className="glass-card empty-box">
        <div className="spinner-modern" style={{ marginBottom: '1rem' }} />
        <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading Batch...</div>
      </div>
    );
  }

  const stats = batch.stats || defaultBatchStats();

  const hasStatusWithoutClaims =
    ['finalized', 'summarized', 'billing_ready'].includes(batch.checker_status) &&
    (batch.verified_claims?.length || 0) === 0;

  // Define stages logic based on user workflow
  const stages = [
    { id: 1, label: 'Uploading', status: 'done' },
    { 
      id: 2, 
      label: 'Sorting', 
      status: stats.unsorted === 0 ? 'done' : 'active' 
    },
    { 
      id: 3, 
      label: 'Crop & Input', 
      status: stats.unsorted === 0 
        ? (stats.needs_crop_input === 0 ? 'done' : 'active') 
        : 'pending' 
    },
    { 
      id: 4, 
      label: 'Extraction', 
      status: (stats.unsorted === 0 && stats.needs_crop_input === 0) 
        ? (stats.ocr_finished === stats.total ? 'done' : 'active') 
        : 'pending' 
    },
    { 
      id: 5, 
      label: 'Run Check', 
      status: (batch.checker_status === 'verified' || batch.checker_status === 'finalized' || batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready')
        ? 'done' 
        : (stats.ocr_finished === stats.total ? (stats.checked === stats.total && stats.total > 0 ? 'done' : 'active') : 'pending') 
    },
    { 
      id: 6, 
      label: 'Finalize', 
      status: (batch.checker_status === 'finalized' || batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready')
        ? 'done' 
        : (batch.checker_status === 'verified' || (stats.checked === stats.total && stats.total > 0) ? 'active' : 'pending')
    },
    { 
      id: 7, 
      label: 'Summary', 
      status: (batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready')
        ? 'done' 
        : (batch.checker_status === 'finalized' ? 'active' : 'pending')
    },
    { 
      id: 8, 
      label: 'Billing', 
      status: batch.checker_status === 'billing_ready'
        ? 'done' 
        : (batch.checker_status === 'summarized' ? 'active' : 'pending')
    },
  ];

  const progress = batch.progress ?? 0;

  const currentStageIndex = stages.findLastIndex(s => s.status === 'done' || s.status === 'active');
  const lineFillWidth = (currentStageIndex / (stages.length - 1)) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Back Link */}
      <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); navigate('/batch'); }}>
        <Icon.ArrowLeft />
        Back to Batches
      </a>

      {/* Stage Progress */}
      <div className="glass-card" style={{ padding: '1.5rem 2rem' }}>
        {hasStatusWithoutClaims && (
          <div style={{
            marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '12px',
            background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.25)',
            color: '#ea580c', fontSize: '12px', fontWeight: 700, lineHeight: 1.5,
          }}>
            This batch is marked as {batch.checker_status.replace('_', ' ')} but has no verified claims linked to receipts.
            Transaction ledger entries may not match. Use Reset to clear and re-process, or re-run verification to re-link claims.
          </div>
        )}
        <div className="stages-wrap">
          <div className="stages-line">
            <div className="stages-line-fill" style={{ width: `${lineFillWidth}%` }} />
          </div>
          {stages.map((stage) => (
            <div 
              key={stage.id} 
              className={`stage-item ${stage.status}`}
              onClick={() => {
                // Allow jumping to any stage that is not pending
                if (stage.status === 'pending') return;
                
                if (stage.id === 2) setShowProcessor('categorize');
                if (stage.id === 3) setShowProcessor('crop');
                if (stage.id === 4) setShowProcessor('ocr');
                if (stage.id === 5) setShowProcessor('verify');
                if (stage.id === 6) setShowProcessor('finalize');
                if (stage.id === 7) setShowProcessor('summary');
                if (stage.id === 8) setShowProcessor('billing');
              }}
              style={{ cursor: stage.status === 'pending' ? 'default' : 'pointer' }}
              title={stage.status === 'pending' ? 'Complete previous stages first' : `Open ${stage.label}`}
            >
              <div className="stage-circle">
                {stage.status === 'done' ? <Icon.Check size={14} /> : stage.id}
              </div>
              <span className="stage-label">{stage.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="batch-header">
        <div className="batch-header-top">
          <div className="batch-title-section">
            <div className="section-label">Batch Details</div>
            <h2 className="h2-modern batch-title">{batch.name}</h2>
            {batch.final_batch_number && (
              <div className="batch-ledger-id">
                Ledger ID: {batch.final_batch_number}
              </div>
            )}
          </div>
          <div className="batch-actions">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => handleAddUpload(e.target.files)}
            />
            <button
              className="btn-icon-modern"
              onClick={() => fileInputRef.current?.click()}
              title="Add More Receipts"
            >
              <Icon.Plus />
            </button>

            {/* Reset Batch — clear all checker progress */}
            {batch.receipts?.length > 0 && (
              <button
                className="reset-batch-btn"
                title="Reset Batch — clears all verification, transactions links, and receipt data"
                onClick={handleResetBatch}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Reset
              </button>
            )}

            <button
              className="btn-icon-modern danger"
              onClick={(e) => handleDeleteBatch(e, batch.id)}
              title="Delete Batch"
            >
              <Icon.Trash />
            </button>

            {/* View Generated Summary — only when billing is complete */}
            {batch.checker_status === 'billing_ready' && (
              <button
                className="view-summary-btn"
                onClick={() => setShowSummaryModal(true)}
                title="View Generated Billing Summary"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                View Summary
              </button>
            )}
            
            
            {/* Primary Action Button Based on Stage */}
            {(() => {
              const activeStage = stages.find(s => s.status === 'active');
              if (!activeStage) return null;

              if (activeStage.id === 2) {
                return (
                  <button className="btn-primary-modern" style={{ width: 'auto' }} onClick={() => setShowProcessor('categorize')}>
                    <Icon.Circle size={10} />
                    Start Sorting
                  </button>
                );
              }

              if (activeStage.id === 3) {
                return (
                  <button className="btn-primary-modern" style={{ width: 'auto', background: 'var(--gradient-accent)' }} onClick={() => setShowProcessor('crop')}>
                    <Icon.Crop />
                    Start Crop & Input ({stats.needs_crop_input})
                  </button>
                );
              }

              if (activeStage.id === 4) {
                const ocrRemaining = stats.total - stats.ocr_finished;
                return (
                  <button 
                    className="btn-primary-modern" 
                    style={{ width: 'auto', background: 'var(--gradient-success)' }}
                    onClick={handleRunExtraction}
                    disabled={isRunningCheck}
                  >
                    {isRunningCheck ? (
                      <>
                        <div className="spinner-modern" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Icon.Scan />
                        Run Extraction ({ocrRemaining})
                      </>
                    )}
                  </button>
                );
              }

              if (activeStage.id === 5) {
                return (
                  <button 
                    className="btn-primary-modern" 
                    style={{ width: 'auto', background: 'var(--gradient-primary)' }}
                    onClick={handleRunFinalCheck}
                    disabled={isRunningCheck}
                  >
                    {isRunningCheck ? (
                      <>
                        <div className="spinner-modern" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Icon.Check size={14} />
                        Run Final Check ({stats.checked})
                      </>
                    )}
                  </button>
                );
              }

              if (activeStage.id === 6) {
                return (
                  <button 
                    className="btn-primary-modern" 
                    style={{ width: 'auto', background: 'var(--gradient-primary)' }}
                    onClick={async () => {
                      // Call the finalize API
                      try {
                        await fetch(getApiUrl(`/api/batches/${batch.id}/status`), {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ checker_status: 'finalized' }),
                        });
                        // Refresh batch details - assuming a refresh function exists or state update
                        window.location.reload(); 
                      } catch (e) { console.error(e); }
                    }}
                  >
                    <Icon.Check size={14} />
                    Finalize Batch
                  </button>
                );
              }

              if (activeStage.id === 7) {
                return (
                  <button 
                    className="btn-primary-modern" 
                    style={{ width: 'auto', background: 'var(--gradient-accent)' }}
                    onClick={async () => {
                      try {
                        await fetch(getApiUrl(`/api/batches/${batch.id}/status`), {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ checker_status: 'summarized' }),
                        });
                        window.location.reload();
                      } catch (e) { console.error(e); }
                    }}
                  >
                    Calculate Summary
                  </button>
                );
              }

              if (activeStage.id === 8) {
                return (
                  <button 
                    className="btn-primary-modern" 
                    style={{ width: 'auto', background: 'var(--gradient-success)' }}
                    onClick={async () => {
                      try {
                        await fetch(getApiUrl(`/api/batches/${batch.id}/status`), {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ checker_status: 'billing_ready' }),
                        });
                        window.location.reload();
                      } catch (e) { console.error(e); }
                    }}
                  >
                    Prepare Bills
                  </button>
                );
              }

              return null;
            })()}
          </div>
        </div>

        <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <div className="metric-card-sm">
            <span className="metric-label-sm">Total</span>
            <span className="metric-value-sm">{stats.total}</span>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '0.8rem', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '100%', background: 'var(--text-muted)' }} />
            </div>
          </div>
          
          {/* Stage 2: Sorting */}
          <div className="metric-card-sm">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label-sm">Sorting</span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>
                {Math.round(((stats.total - stats.unsorted) / stats.total) * 100 || 0)}%
              </span>
            </div>
            <span className={`metric-value-sm ${stats.unsorted > 0 ? 'warning' : ''}`}>
              {stats.total - stats.unsorted}/{stats.total}
            </span>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '0.8rem', overflow: 'hidden' }}>
              <div style={{ width: `${((stats.total - stats.unsorted) / stats.total) * 100 || 0}%`, height: '100%', background: 'var(--accent-yellow)' }} />
            </div>
          </div>

          {/* Stage 3: Crop & Input */}
          <div className="metric-card-sm">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label-sm">Crop & Input</span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>
                {Math.round(((stats.total - stats.needs_crop_input) / stats.total) * 100 || 0)}%
              </span>
            </div>
            <span className={`metric-value-sm ${stats.needs_crop_input > 0 ? 'accent' : ''}`}>
              {stats.total - stats.needs_crop_input}/{stats.total}
            </span>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '0.8rem', overflow: 'hidden' }}>
              <div style={{ width: `${((stats.total - stats.needs_crop_input) / stats.total) * 100 || 0}%`, height: '100%', background: 'var(--accent-primary)' }} />
            </div>
          </div>

          {/* Stage 4: OCR */}
          <div className="metric-card-sm">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label-sm">OCR</span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>
                {Math.round((stats.ocr_finished / stats.total) * 100 || 0)}%
              </span>
            </div>
            <span className={`metric-value-sm ${stats.ocr_finished > 0 ? 'success' : ''}`}>
              {stats.ocr_finished}/{stats.total}
            </span>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '0.8rem', overflow: 'hidden' }}>
              <div style={{ width: `${(stats.ocr_finished / stats.total) * 100 || 0}%`, height: '100%', background: 'var(--success-primary)' }} />
            </div>
          </div>

          {/* Stage 5: Run Check */}
          <div className="metric-card-sm">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="metric-label-sm">Run Check</span>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)' }}>
                {Math.round((stats.checked / stats.total) * 100 || 0)}%
              </span>
            </div>
            <span className="metric-value-sm success">
              {stats.checked}/{stats.total}
              {stats.confirmed > 0 && (
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                  ({stats.confirmed} confirmed)
                </span>
              )}
            </span>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '0.8rem', overflow: 'hidden' }}>
              <div style={{ width: `${(stats.checked / stats.total) * 100 || 0}%`, height: '100%', background: 'var(--success-primary)' }} />
            </div>
          </div>

          {/* Stage 6-8 Combined Status */}
          <div className="metric-card-sm">
            <span className="metric-label-sm">Post-Process</span>
            <span className="metric-value-sm" style={{ fontSize: '12px' }}>
              {batch.checker_status === 'billing_ready' ? 'READY' : 
               batch.checker_status === 'summarized' ? 'SUMMARY' : 
               batch.checker_status === 'finalized' ? 'FINAL' : 'WAITING'}
            </span>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '0.8rem', overflow: 'hidden', display: 'flex', gap: '2px' }}>
               <div style={{ flex: 1, background: (batch.checker_status === 'finalized' || batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready') ? 'var(--success-primary)' : 'transparent' }} />
               <div style={{ flex: 1, background: (batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready') ? 'var(--success-primary)' : 'transparent' }} />
               <div style={{ flex: 1, background: (batch.checker_status === 'billing_ready') ? 'var(--success-primary)' : 'transparent' }} />
            </div>
          </div>
        </div>

        {stats.total > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
              <span>OVERALL COMPLETION</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar-wrap">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Receipts List */}
      <div className="glass-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="filter-bar">
            {[
              { key: 'all', label: `All (${stats.total})` },
              { key: 'pending', label: 'Pending' },
              { key: 'completed', label: 'Verified' },
              { key: 'gcash', label: 'GCash' },
              { key: 'others', label: 'Others' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`filter-tab ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Search & Sort Controls */}
          <div className="search-sort-container">
            <div className="search-input-wrapper">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search receipts by reference, amount, account..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="search-input"
              />
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)} 
              className="sort-select"
            >
              <option value="status">Sort: Status First</option>
              <option value="amount-desc">Sort: Amount (High → Low)</option>
              <option value="amount-asc">Sort: Amount (Low → High)</option>
              <option value="date-desc">Sort: Newest First</option>
              <option value="date-asc">Sort: Oldest First</option>
            </select>
            <div className="results-count">
              {(() => {
                // Filter and sort logic
                const filtered = filteredReceipts.filter(receipt => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  const ocr = parseOCRData(receipt.ocr_data);
                  return (
                    (receipt.account_holder || '').toLowerCase().includes(q) ||
                    (String(receipt.id) || '').toLowerCase().includes(q) ||
                    (ocr?.reference || '').toLowerCase().includes(q) ||
                    (String(receipt.transaction?.amount || ocr?.amount || '')).includes(q)
                  );
                });
                return `${filtered.length} item${filtered.length !== 1 ? 's' : ''} found`;
              })()}
            </div>
          </div>
        </div>
        {(() => {
          // Filter and sort logic
          let processedReceipts = [...filteredReceipts].filter(receipt => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            const ocr = parseOCRData(receipt.ocr_data);
            return (
              (receipt.account_holder || '').toLowerCase().includes(q) ||
              (String(receipt.id) || '').toLowerCase().includes(q) ||
              (ocr?.reference || '').toLowerCase().includes(q) ||
              (String(receipt.transaction?.amount || ocr?.amount || '')).includes(q)
            );
          }).sort((a, b) => {
            const ocrA = parseOCRData(a.ocr_data);
            const ocrB = parseOCRData(b.ocr_data);
            const amountA = a.transaction?.amount ?? ocrA?.amount ?? 0;
            const amountB = b.transaction?.amount ?? ocrB?.amount ?? 0;

            switch (sortBy) {
              case 'amount-desc':
                return Number(amountB) - Number(amountA);
              case 'amount-asc':
                return Number(amountA) - Number(amountB);
              case 'date-desc':
                return new Date(b.created_at) - new Date(a.created_at);
              case 'date-asc':
                return new Date(a.created_at) - new Date(b.created_at);
              case 'status':
              default:
                const statusA = a.match_status?.toLowerCase();
                const statusB = b.match_status?.toLowerCase();
                const isErrorA = statusA === 'flagged' || statusA === 'not_found';
                const isErrorB = statusB === 'flagged' || statusB === 'not_found';
                
                if (isErrorA && !isErrorB) return -1;
                if (!isErrorA && isErrorB) return 1;
                return 0;
            }
          });

          if (processedReceipts.length === 0) {
            return (
              <div className="empty-box">
                <div className="empty-icon-lg">🔍</div>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {searchQuery ? 'No matching receipts' : 'No receipts found'}
                </div>
                <div style={{ opacity: 0.7 }}>Try adjusting your filters or search</div>
              </div>
            );
          }

          const allVisibleSelected = processedReceipts.length > 0 &&
            processedReceipts.every(r => selectedIds.has(r.id));

          return (
            <>
              {/* ── Select all bar ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 4px',
              }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', userSelect: 'none',
                  fontSize: '11px', fontWeight: 700,
                  color: 'var(--text-muted)',
                }}>
                  <div
                    onClick={() => handleSelectAll(processedReceipts)}
                    style={{
                      width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0,
                      border: `2px solid ${allVisibleSelected ? 'var(--danger-primary)' : 'var(--border-strong)'}`,
                      background: allVisibleSelected ? 'var(--danger-primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {allVisibleSelected && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  {allVisibleSelected ? 'Deselect all' : `Select all (${processedReceipts.length})`}
                </label>

                {selectedIds.size > 0 && (
                  <>
                    <span style={{ color: 'var(--border-strong)' }}>•</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626' }}>
                      {selectedIds.size} selected
                    </span>
                    <button
                      onClick={() => setShowBulkDeleteModal(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '7px', border: 'none',
                        background: '#dc2626', color: 'white',
                        fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                      onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
                    >
                      <Icon.Trash size={11} />
                      Delete {selectedIds.size}
                    </button>
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      style={{
                        padding: '5px 10px', borderRadius: '7px',
                        border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                        color: '#dc2626', fontSize: '11px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>

              <div className="receipt-grid">
                {processedReceipts.map(receipt => (
                  <ReceiptCard
                    key={receipt.id}
                    receipt={receipt}
                    parseOCRData={parseOCRData}
                    onDelete={() => setReceiptToDelete(receipt)}
                    isBillingDone={batch.checker_status === 'billing_ready'}
                    isSelected={selectedIds.has(receipt.id)}
                    onToggleSelect={() => toggleSelect(receipt.id)}
                  />
                ))}
              </div>
            </>
          );
        })()}
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="ort-overlay" style={{ zIndex: 2000 }}>
          <div className="glass-card" style={{ maxWidth: '420px', padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>🗑️</div>
            <h3 className="h2-modern" style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>
              Delete {selectedIds.size} Receipt{selectedIds.size !== 1 ? 's' : ''}?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '2rem', lineHeight: 1.6 }}>
              This will permanently remove {selectedIds.size} selected receipt{selectedIds.size !== 1 ? 's' : ''} and all their extracted data. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn-primary-modern"
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
              >
                Cancel
              </button>
              <button
                className="btn-primary-modern"
                style={{ flex: 1, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? (
                  <><div className="spinner-modern" /> Deleting...</>
                ) : (
                  <><Icon.Trash size={14} /> Delete All</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {receiptToDelete && (
        <div className="ort-overlay" style={{ zIndex: 2000 }}>
          <div className="glass-card" style={{ maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
            <div className="empty-icon-lg" style={{ color: 'var(--accent-red)', marginBottom: '1.5rem' }}>⚠️</div>
            <h3 className="h2-modern" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Delete Receipt?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '2rem', lineHeight: 1.6 }}>
              This will permanently remove this receipt and its extracted data. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn-primary-modern" 
                style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                onClick={() => setReceiptToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn-primary-modern danger"
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await handleDeleteReceipt(receiptToDelete.id);
                    setReceiptToDelete(null);
                  } catch (e) {
                    alert('Failed to delete receipt');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Summary Modal */}
      {showSummaryModal && batch.checker_status === 'billing_ready' && (() => {
        const sd = batch.summary_data || {};
        const bd = batch.billing_data || {};

        // Build verified receipts list from backend-computed claims
          const verifiedReceipts = batch.verified_claims || [];

          // Fallback: reconstruct financials from receipts if summary_data wasn't saved
          const grossFallback = verifiedReceipts.reduce((s, r) => s + r.amount, 0);
          const feeFallback = Math.floor(grossFallback / 1000) * 10;
          const deductionsFallback = sd.deductions || [];
          const totalDeductionsFallback = deductionsFallback.reduce((s, d) => s + (Number(d.amount) || 0), 0);
          const netFallback = grossFallback - feeFallback - totalDeductionsFallback;

          const grossAmount   = sd.gross_amount   ?? grossFallback;
          const serviceFee    = sd.service_fee    ?? feeFallback;
          const deductions    = sd.deductions     || [];
          const totalDeductions = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
          const netAmount     = sd.net_amount     ?? (grossAmount - serviceFee - totalDeductions); // Use deductions array

        // Fallback billing: if billing_data missing, show cash total from denominations
        const billingMethod      = bd.method              || 'both';
        const cashDenoms         = bd.cash_denominations  || {};
        const bankAmt            = bd.bank_transfer_amount || 0;
        // Support array of partial transfers saved from wizard
        const bankAmts           = Array.isArray(bd.bank_transfer_amount) ? bd.bank_transfer_amount : (bd.bank_transfer_amount ? [bd.bank_transfer_amount] : []);
        const totalPrepared      = bd.total_prepared       || netAmount;

        return (
          <BillingSummaryModal
            onClose={() => setShowSummaryModal(false)}
            batchNumber={batch.batch_number}
            finalBatchNumber={batch.final_batch_number}
            grossAmount={grossAmount}
            serviceFee={serviceFee}
            deductions={deductions}
            netAmount={netAmount}
            billingMethod={billingMethod}
            cashDenominations={cashDenoms}
            bankTransferAmount={Array.isArray(bankAmt) ? bankAmts.reduce((s,v)=>s+Number(v||0),0) : bankAmt}
            bankTransferAmounts={bankAmts}
            totalPrepared={totalPrepared}
            verifiedClaims={verifiedReceipts}
          />
        );
      })()}
    </div>
  );
}

function ReceiptCard({ receipt, parseOCRData, onDelete, isBillingDone, isSelected, onToggleSelect }) {
  const getStatus = () => {
    const ocr = parseOCRData(receipt.ocr_data);
    const mStatus = receipt.match_status?.toLowerCase();
    
    // Stage 5: Verified Status
    if (mStatus === 'verified' && receipt.transaction_id) {
      return { label: 'Checked', className: 'success' };
    }
    if (mStatus === 'matched') {
      return { label: 'Needs Confirm', className: 'warning' };
    }
    if (mStatus === 'flagged' || mStatus === 'not_found') {
      return { label: 'Not Found', className: 'danger' };
    }
    
    // Stage 4: OCR Complete
    if (receipt.ocr_status === 'completed' || (ocr && ocr.raw_text)) {
      return { label: 'Extracted', className: 'success' };
    }
    
    // Stage 3: Crop & Input Complete
    const hasCategory = receipt.category && receipt.category !== 'unsorted';
    const hasCropOrInput = (receipt.category === 'gcash' && receipt.cropped_image) || (receipt.category === 'others' && ocr?.manual);
    
    if (hasCategory && hasCropOrInput) return { label: 'Crop & Input', className: 'pending' };
    
    // Stage 2: Sorting Complete
    if (hasCategory) return { label: 'Sorted', className: 'pending' };
    
    // Stage 1: Uploading Complete (but unsorted)
    return { label: 'Unsorted', className: 'warning' };
  };

  const status = getStatus();
  const ocr = parseOCRData(receipt.ocr_data);
  const rawAmount = receipt.transaction?.amount ?? ocr?.amount;
  const amount = rawAmount
    ? `₱${Number(rawAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    : '₱0.00';

  return (
    <div
      className={`receipt-card ${status.className === 'danger' ? 'is-not-found' : ''}`}
      style={{
        ...(isBillingDone ? { outline: '2px solid rgba(16,185,129,0.4)', outlineOffset: '-2px' } : {}),
        ...(isSelected ? { outline: '2px solid #dc2626', outlineOffset: '-2px' } : {}),
      }}
    >
      {/* Checkbox — top left, always visible when selected, on hover otherwise */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        style={{
          position: 'absolute', top: '8px', left: '8px', zIndex: 20,
          width: '20px', height: '20px', borderRadius: '5px',
          border: `2px solid ${isSelected ? '#dc2626' : 'rgba(255,255,255,0.7)'}`,
          background: isSelected ? '#dc2626' : 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
          opacity: isSelected ? 1 : 0,
        }}
        className="receipt-checkbox"
      >
        {isSelected && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <button 
        className="receipt-delete-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete Receipt"
      >
        <Icon.Trash size={14} />
      </button>

      {/* Completed overlay badge */}
      {isBillingDone && (
        <div style={{
          position: 'absolute', top: '8px', left: '8px', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '3px 8px', borderRadius: '8px',
          background: 'rgba(16,185,129,0.85)',
          backdropFilter: 'blur(4px)',
          color: '#fff', fontSize: '9px', fontWeight: 900,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
        }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Completed
        </div>
      )}

      <img 
        src={getApiUrl(`/api/receipts/${receipt.id}/image`)}
        alt=""
        className="receipt-img"
        loading="lazy"
        crossOrigin="anonymous"
      />
      <div className="receipt-info">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <div className={`status-pill ${status.className}`}>
            {status.label}
          </div>
          {receipt.category && receipt.category !== 'unsorted' && (
            <div className="status-pill" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
              {receipt.category.toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="receipt-price">{amount}</div>
        
        <div className="receipt-meta">
          {receipt.account_holder || (receipt.category === 'others' ? 'OTHERS' : 'Unassigned')}
        </div>
      </div>
    </div>
  );
}
