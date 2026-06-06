import React from 'react';
import BillingSummaryModal from './BillingSummaryModal';
import { getApiUrl } from '../../apiConfig';

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
  const fileInputRef = React.useRef(null);

  const parseOCRData = (data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
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

  const stats = {
    total: batch?.receipts?.length || 0,
    unsorted: batch?.receipts?.filter(r => !r.category || r.category === 'unsorted').length || 0,
    // How many still need cropping or manual input
    needsCropInput: batch?.receipts?.filter(r => {
      if (!r.category || r.category === 'unsorted') return false;
      const ocr = parseOCRData(r.ocr_data);
      
      if (r.category === 'others') {
        // If it's manual, we check if manual flag is true AND amount/ref exist
        const isManualDone = ocr && ocr.manual === true && (ocr.amount || ocr.reference);
        return !isManualDone;
      }
      
      // GCash: Need a cropped image (check for path string or base64)
      const hasCrop = r.cropped_image && r.cropped_image.length > 5;
      return !hasCrop;
    }).length,
    // How many are ready for OCR (or have finished it)
    readyForOcr: batch?.receipts?.filter(r => {
      const ocr = parseOCRData(r.ocr_data);
      const isOthersDone = r.category === 'others' && ocr && ocr.manual;
      const isGcashDone = r.category === 'gcash' && r.cropped_image && r.cropped_image.length > 5;
      return isOthersDone || isGcashDone;
    }).length,
    // How many have actually finished the OCR/Extraction phase
    ocrFinished: batch?.receipts?.filter(r => {
      const ocr = parseOCRData(r.ocr_data);
      if (r.category === 'others' && ocr?.manual) return true;
      return r.ocr_status === 'completed' || r.ocr_status === 'processing' || (ocr && ocr.raw_text);
    }).length,
    // How many are verified (Stage 5)
    verified: batch?.receipts?.filter(r => {
      const status = r.match_status?.toLowerCase();
      return status === 'verified' || status === 'flagged' || status === 'not_found';
    }).length || 0,
  };

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
        ? (stats.needsCropInput === 0 ? 'done' : 'active') 
        : 'pending' 
    },
    { 
      id: 4, 
      label: 'Extraction', 
      status: (stats.unsorted === 0 && stats.needsCropInput === 0) 
        ? (stats.ocrFinished === stats.total ? 'done' : 'active') 
        : 'pending' 
    },
    { 
      id: 5, 
      label: 'Run Check', 
      status: (batch.checker_status === 'verified' || batch.checker_status === 'finalized' || batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready')
        ? 'done' 
        : (stats.ocrFinished === stats.total ? (stats.verified === stats.total && stats.total > 0 ? 'done' : 'active') : 'pending') 
    },
    { 
      id: 6, 
      label: 'Finalize', 
      status: (batch.checker_status === 'finalized' || batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready')
        ? 'done' 
        : (batch.checker_status === 'verified' || (stats.verified === stats.total && stats.total > 0) ? 'active' : 'pending')
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

  // Overall completion should reflect all stages (now 8 stages)
  const getOverallProgress = () => {
    if (!batch || stats.total === 0) return 0;
    
    let totalProgress = 0;
    const stageWeight = 100 / 8; // Each stage is 12.5%
    
    // Stage 1: Uploading
    totalProgress += stageWeight;
    
    // Stage 2: Sorting
    totalProgress += ((stats.total - stats.unsorted) / stats.total) * stageWeight;
    
    // Stage 3: Crop & Input
    totalProgress += ((stats.total - stats.needsCropInput) / stats.total) * stageWeight;
    
    // Stage 4: Extraction
    totalProgress += (stats.ocrFinished / stats.total) * stageWeight;
    
    // Stage 5: Run Check
    totalProgress += (stats.verified / stats.total) * stageWeight;

    // Stage 6: Finalize
    if (batch.checker_status === 'finalized' || batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready') {
      totalProgress += stageWeight;
    }

    // Stage 7: Summary
    if (batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready') {
      totalProgress += stageWeight;
    }

    // Stage 8: Billing
    if (batch.checker_status === 'billing_ready') {
      totalProgress += stageWeight;
    }

    return Math.round(totalProgress);
  };

  const progress = getOverallProgress();

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <div className="section-label">Batch Details</div>
            <h2 className="h2-modern" style={{ fontSize: '2.5rem' }}>{batch.name}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
                onClick={() => setShowSummaryModal(true)}
                title="View Generated Billing Summary"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '0 18px', height: '40px', borderRadius: '12px',
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  color: 'var(--success-primary)', fontWeight: 900, fontSize: '11px',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
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
            
            {/* Shortcut Button (Floating-style next to primary action) */}
            {(() => {
              const activeStage = stages.find(s => s.status === 'active');
              if (activeStage && activeStage.id < 8) {
                return (
                  <div style={{ marginLeft: '1.5rem', paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '1rem' }}>
                      Next Step:
                    </div>
                    <button 
                      className="btn-icon-modern" 
                      style={{ width: 'auto', padding: '0 1.5rem', borderRadius: '12px', fontSize: '11px' }}
                      onClick={() => {
                        const nextStage = stages.find(s => s.id === activeStage.id);
                        if (nextStage.id === 2) setShowProcessor('categorize');
                        if (nextStage.id === 3) setShowProcessor('crop');
                        if (nextStage.id === 4) handleRunExtraction();
                        if (nextStage.id === 5) handleRunFinalCheck();
                        if (nextStage.id === 6) {
                           // Finalize shortcut
                           fetch(getApiUrl(`/api/batches/${batch.id}/status`), {
                             method: 'PATCH',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ checker_status: 'finalized' }),
                           }).then(() => window.location.reload());
                        }
                        if (nextStage.id === 7) {
                           // Summary shortcut
                           fetch(getApiUrl(`/api/batches/${batch.id}/status`), {
                             method: 'PATCH',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ checker_status: 'summarized' }),
                           }).then(() => window.location.reload());
                        }
                      }}
                    >
                      {activeStage.label} →
                    </button>
                  </div>
                );
              }
              return null;
            })()}
            
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
                    Start Crop & Input ({stats.needsCropInput})
                  </button>
                );
              }

              if (activeStage.id === 4) {
                const ocrRemaining = stats.total - stats.ocrFinished;
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
                        Run Final Check ({stats.verified})
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
                        await fetch(`http://localhost:8000/api/batches/${batch.id}/status`, {
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

        <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
          <div className="metric-card-sm">
            <span className="metric-label-sm">Total</span>
            <span className="metric-value-sm">{stats.total}</span>
          </div>
          <div className="metric-card-sm">
            <span className="metric-label-sm">Sorting</span>
            <span className={`metric-value-sm ${stats.unsorted > 0 ? 'warning' : ''}`}>
              {stats.total - stats.unsorted}/{stats.total}
            </span>
          </div>
          <div className="metric-card-sm">
            <span className="metric-label-sm">Crop & Input</span>
            <span className={`metric-value-sm ${stats.needsCropInput > 0 ? 'accent' : ''}`}>
              {stats.total - stats.needsCropInput}/{stats.total}
            </span>
          </div>
          <div className="metric-card-sm">
            <span className="metric-label-sm">OCR</span>
            <span className={`metric-value-sm ${stats.ocrFinished > 0 ? 'success' : ''}`}>
              {stats.ocrFinished}/{stats.total}
            </span>
          </div>
          <div className="metric-card-sm">
            <span className="metric-label-sm">Run Check</span>
            <span className="metric-value-sm success">
              {stats.verified}/{stats.total}
            </span>
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
          <div style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
            {filteredReceipts.length} items found
          </div>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon-lg">🔍</div>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>No matches found</div>
            <div style={{ opacity: 0.7 }}>Try adjusting your filters</div>
          </div>
        ) : (
          <div className="receipt-grid">
            {filteredReceipts
              .sort((a, b) => {
                const statusA = a.match_status?.toLowerCase();
                const statusB = b.match_status?.toLowerCase();
                const isErrorA = statusA === 'flagged' || statusA === 'not_found';
                const isErrorB = statusB === 'flagged' || statusB === 'not_found';
                
                if (isErrorA && !isErrorB) return -1;
                if (!isErrorA && isErrorB) return 1;
                return 0;
              })
              .map(receipt => (
                <ReceiptCard 
                  key={receipt.id} 
                  receipt={receipt} 
                  parseOCRData={parseOCRData} 
                  onDelete={() => setReceiptToDelete(receipt)}
                  isBillingDone={batch.checker_status === 'billing_ready'}
                />
              ))}
          </div>
        )}
      </div>

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

        // Build verified receipts list from actual receipt data
        const verifiedReceipts = (batch.receipts || [])
          .filter(r => r.match_status === 'verified' || r.match_status === 'flagged')
          .map(r => {
            const ocr = (typeof r.ocr_data === 'string') ? JSON.parse(r.ocr_data || '{}') : (r.ocr_data || {});
            return {
              account_holder: r.account_holder,
              amount: Number(ocr.amount || 0),
              reference: ocr.reference || null,
              source_label: r.source_label,
            };
          });

        // Fallback: reconstruct financials from receipts if summary_data wasn't saved
        const grossFallback = verifiedReceipts.reduce((s, r) => s + r.amount, 0);
        const feeFallback = Math.floor(grossFallback / 1000) * 10;
        const netFallback = grossFallback - feeFallback;

        const grossAmount   = sd.gross_amount   ?? grossFallback;
        const serviceFee    = sd.service_fee    ?? feeFallback;
        const netAmount     = sd.net_amount     ?? netFallback;
        const deductions    = sd.deductions     || []; // Use deductions array

        // Fallback billing: if billing_data missing, show cash total from denominations
        const billingMethod      = bd.method              || 'both';
        const cashDenoms         = bd.cash_denominations  || {};
        const bankAmt            = bd.bank_transfer_amount || 0;
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
            bankTransferAmount={bankAmt}
            totalPrepared={totalPrepared}
            verifiedClaims={verifiedReceipts}
          />
        );
      })()}
    </div>
  );
}

function ReceiptCard({ receipt, parseOCRData, onDelete, isBillingDone }) {
  const getStatus = () => {
    const ocr = parseOCRData(receipt.ocr_data);
    const mStatus = receipt.match_status?.toLowerCase();
    
    // Stage 5: Verified Status
    if (mStatus === 'verified') {
      return { label: 'Checked', className: 'success' };
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
  const amount = ocr?.amount 
    ? `₱${Number(ocr.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    : '₱0.00';

  return (
    <div
      className={`receipt-card ${status.className === 'danger' ? 'is-not-found' : ''}`}
      style={isBillingDone ? { outline: '2px solid rgba(16,185,129,0.4)', outlineOffset: '-2px' } : {}}
    >
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
