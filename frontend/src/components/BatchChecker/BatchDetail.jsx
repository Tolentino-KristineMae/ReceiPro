import React from 'react';
import './BatchDetail.css';
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
  handleBulkDeleteReceipts,
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
      const ids = [...selectedIds];

      if (handleBulkDeleteReceipts) {
        // Use the provided bulk delete handler
        await handleBulkDeleteReceipts(ids);
        setSelectedIds(new Set());
        setShowBulkDeleteModal(false);
        console.log('✓ Receipts deleted successfully');
      } else if (handleDeleteReceipt) {
        // Fallback: delete one by one
        const results = await Promise.allSettled(
          ids.map(id => handleDeleteReceipt(id))
        );

        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          throw new Error(`${failed.length} receipt(s) could not be deleted`);
        }

        setSelectedIds(new Set());
        setShowBulkDeleteModal(false);
        console.log('✓ All receipts deleted successfully');
      } else {
        throw new Error('No delete handler available');
      }
    } catch (error) {
      console.error('Bulk delete receipts error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  if (!batch) {
    return (
      <div className="glass-card empty-box">
        <div className="spinner-modern" style={{ marginBottom: '1rem' }} />
        <div style={{ fontWeight: 600 }}>Loading Batch...</div>
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

  const progress = Math.max(0, Math.min(100, Number(batch.progress) || 0));
  const percent = (count) => stats.total > 0 ? Math.max(0, Math.min(100, Math.round(count / stats.total * 100))) : 0;
  const metrics = [
    { label: 'Sorting', count: stats.total - stats.unsorted },
    { label: 'Crop & Input', count: stats.total - stats.needs_crop_input },
    { label: 'OCR extraction', count: stats.ocr_finished },
    { label: 'Run Check', count: stats.checked, note: `${stats.confirmed || 0} confirmed` },
  ];

  const currentStageIndex = stages.findLastIndex(s => s.status === 'done' || s.status === 'active');
  const lineFillWidth = (currentStageIndex / (stages.length - 1)) * 100;

  return (
    <div className="bc-detail batch-detail-page">

      {/* Back Link */}
      <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); navigate('/batch'); }}>
        <Icon.ArrowLeft />
        Back to Batches
      </a>

      {/* Header */}
      <header className="batch-detail-heading">
        <div className="batch-header-top">
          <div className="batch-title-section">
            <div className="section-label">Receipt workspace / Batch details</div>
            <h1 className="h2-modern batch-title">{batch.name}<span className="batch-title-dot">.</span></h1>
            <p className="batch-description">Track your receipts from upload to billing, all in one place.</p>
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
              className="btn-icon-modern batch-add-receipts"
              onClick={() => fileInputRef.current?.click()}
              title="Add More Receipts"
            >
              <Icon.Plus />
              Add receipts
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
              aria-label="Delete batch"
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
                  <button className="btn-primary-modern" style={{ width: 'auto' }} onClick={() => setShowProcessor('crop')}>
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
                    style={{ width: 'auto' }}
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
                    style={{ width: 'auto' }}
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
                    style={{ width: 'auto' }}
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
                    style={{ width: 'auto' }}
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
                    style={{ width: 'auto' }}
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

      </header>
      {/* Stage Progress */}
      <section className="glass-card batch-workflow" aria-labelledby="batch-workflow-title">
        <div className="batch-panel-heading"><div><h2 id="batch-workflow-title">Processing overview</h2><p>Follow each step or open a completed stage to review.</p></div><span className="batch-state">{batch.checker_status === 'billing_ready' ? 'Ready for billing' : 'In progress'}</span></div>
        {hasStatusWithoutClaims && (
          <div style={{
            marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '12px',
            background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.25)',
            color: 'var(--workspace-accent-hover)', fontSize: '12px', fontWeight: 700, lineHeight: 1.5,
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
            <button
              type="button"
              key={stage.id}
              className={`stage-item ${stage.status}`}
              disabled={stage.status === 'pending' || stage.id === 1}
              aria-current={stage.status === 'active' ? 'step' : undefined}
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
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card batch-overview" aria-label="Batch progress statistics">
        <div className="batch-metrics">
          <div className="batch-metric batch-total"><span>Total receipts</span><strong>{stats.total}</strong><small>In this batch</small></div>
          {metrics.map(metric => (
            <div className="batch-metric" key={metric.label}>
              <div className="batch-metric-label"><span>{metric.label}</span><small>{percent(metric.count)}%</small></div>
              <strong>{metric.count}<span> / {stats.total}</span></strong>
              <div className="batch-mini-progress" aria-hidden="true"><span style={{ width: `${percent(metric.count)}%` }} /></div>
              {metric.note && <small>{metric.note}</small>}
            </div>
          ))}
          <div className="batch-metric"><span>Post-process</span><strong className="batch-post-status">{batch.checker_status === 'billing_ready' ? 'Ready' : batch.checker_status === 'summarized' ? 'Summary' : batch.checker_status === 'finalized' ? 'Finalized' : 'Waiting'}</strong><small>Finalize · Summary · Billing</small></div>
        </div>
        <div className="batch-completion">
          <div><span>Overall completion</span><strong>{progress}%</strong></div>
          <div className="batch-completion-track" role="progressbar" aria-label="Overall completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
        </div>
      </section>

      {/* Receipts List */}
      <section className="glass-card batch-receipts" aria-labelledby="batch-receipts-title">
        <div className="batch-panel-heading"><div><h2 id="batch-receipts-title">Receipts</h2><p>Review receipt details and manage the files in this batch.</p></div><span className="batch-receipt-total">{stats.total} total</span></div>
        <div className="batch-receipt-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="filter-bar" role="group" aria-label="Filter receipts">
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
                aria-pressed={filter === key}
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
                aria-label="Search receipts"
                placeholder="Search reference, amount or account…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && <button type="button" className="batch-clear-search" aria-label="Clear search" onClick={() => setSearchQuery('')}>×</button>}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
              aria-label="Sort receipts"
            >
              <option value="status">Sort: Status First</option>
              <option value="amount-desc">Sort: Amount (High → Low)</option>
              <option value="amount-asc">Sort: Amount (Low → High)</option>
              <option value="date-desc">Sort: Newest First</option>
              <option value="date-asc">Sort: Oldest First</option>
            </select>
            <div className="results-count" role="status">
              {(() => {
                // Filter and sort logic
                const filtered = filteredReceipts.filter(receipt => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.trim().toLowerCase();
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
            if (!searchQuery.trim()) return true;
            const q = searchQuery.trim().toLowerCase();
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
              default: {
                const statusA = a.match_status?.toLowerCase();
                const statusB = b.match_status?.toLowerCase();
                const isErrorA = statusA === 'flagged' || statusA === 'not_found';
                const isErrorB = statusB === 'flagged' || statusB === 'not_found';

                if (isErrorA && !isErrorB) return -1;
                if (!isErrorA && isErrorB) return 1;
                return 0;
              }
            }
          });

          if (processedReceipts.length === 0) {
            return (
              <div className="empty-box">
                <div className="empty-icon-lg">🔍</div>
                <div style={{ fontWeight: 600 }}>
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
              <div className="batch-selection-bar" style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 4px',
              }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', userSelect: 'none',
                  fontSize: '11px', fontWeight: 700,
                  color: 'var(--text-muted)',
                }}>
                  <input type="checkbox" checked={allVisibleSelected} onChange={() => handleSelectAll(processedReceipts)} />
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
                        textTransform: 'none', letterSpacing: '0',
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
      </section>

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <BatchDetailDialog onClose={() => setShowBulkDeleteModal(false)} busy={isBulkDeleting}>
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
        </BatchDetailDialog>
      )}

      {/* Deletion Confirmation Modal */}
      {receiptToDelete && (
        <BatchDetailDialog onClose={() => setReceiptToDelete(null)} busy={isDeleting}>
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
                  } catch {
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
        </BatchDetailDialog>
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

function BatchDetailDialog({ children, onClose, busy }) {
  const dialogRef = React.useRef(null);
  const titleId = React.useId();
  React.useEffect(() => {
    const dialog = dialogRef.current;
    dialog.querySelector('h3')?.setAttribute('id', titleId);
    dialog.showModal();
    return () => dialog.close();
  }, [titleId]);
  return <dialog ref={dialogRef} className="batch-detail-dialog" aria-labelledby={titleId} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>{children}</dialog>;
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
    <article className={`receipt-card batch-receipt-card ${status.className === 'danger' ? 'is-not-found' : ''} ${isSelected ? 'is-selected' : ''}`}>
      <div className="batch-receipt-image">
        <img src={getApiUrl(`/api/receipts/${receipt.id}/image`)} alt={`Receipt ${receipt.id}`} className="receipt-img" loading="lazy" crossOrigin="anonymous" />
        <label className="batch-receipt-checkbox"><input type="checkbox" checked={isSelected} onChange={onToggleSelect} aria-label={`Select receipt ${receipt.id}`} /></label>
        <button className="receipt-delete-btn" onClick={onDelete} title="Delete receipt" aria-label={`Delete receipt ${receipt.id}`}><Icon.Trash size={14} /></button>
        {isBillingDone && <span className="batch-completed-badge"><Icon.Check size={12} /> Completed</span>}
      </div>
      <div className="receipt-info">
        <div className="batch-receipt-status-row"><span className={`status-pill ${status.className}`}>{status.label}</span><span className="batch-receipt-category">{receipt.category && receipt.category !== 'unsorted' ? receipt.category === 'gcash' ? 'GCash' : 'Others' : 'Unsorted'}</span></div>
        <div className="receipt-price">{amount}</div>
        <div className="receipt-meta">{receipt.account_holder || (receipt.category === 'others' ? 'Others' : 'Unassigned')}</div>
        <div className="batch-receipt-reference"><span>Reference</span><strong>{ocr?.reference || `Receipt #${receipt.id}`}</strong></div>
      </div>
    </article>
  );
}
