import React from 'react';
import './FinalizeStage.css';

export default function FinalizeStage({
  isFinalizing,
  finalizedBatch,
  ocrResults,
  onDone,
  onViewSummary,
}) {
  const verifiedCount = ocrResults?.filter(r => r.verification_status === 'verified').length || 0;
  const notFoundCount = (ocrResults?.length || 0) - verifiedCount;

  return (
    <div className="fs-root">
      {/* Header Card */}
      <div className={`fs-header-card ${isFinalizing ? 'processing' : 'complete'}`}>
        <div className="fs-header-icon">
          {isFinalizing ? (
            <div className="fs-header-spinner" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
        </div>
        <div className="fs-header-content">
          <h3 className="fs-header-title">
            {isFinalizing ? 'Finalizing' : 'Finalized'}
          </h3>
          <p className="fs-header-subtitle">
            {isFinalizing 
              ? 'Stamping batch labels...' 
              : 'Batch complete and ready!'}
          </p>
        </div>
      </div>

      {/* Batch Summary Stats */}
      {ocrResults && ocrResults.length > 0 && (
        <div className="fs-summary-card">
          <div className="fs-summary-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>Batch Summary</span>
          </div>
          
          <div className="fs-stats-row">
            <div className="fs-stat-item success">
              <div className="fs-stat-icon">✓</div>
              <div className="fs-stat-content">
                <div className="fs-stat-value">{verifiedCount}</div>
                <div className="fs-stat-label">Verified</div>
              </div>
            </div>
            <div className="fs-stat-item error">
              <div className="fs-stat-icon">✕</div>
              <div className="fs-stat-content">
                <div className="fs-stat-value">{notFoundCount}</div>
                <div className="fs-stat-label">Missing</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt List */}
      {ocrResults && ocrResults.length > 0 && (
        <div className="fs-receipts-card">
          <div className="fs-receipts-list">
            {ocrResults.map((result, idx) => (
              <div key={idx} className="fs-receipt-item">
                <div className="fs-receipt-status">
                  {result.verification_status === 'verified' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </div>
                <div className="fs-receipt-ref">{result.reference || 'Manual'}</div>
                <div className="fs-receipt-account">{result.account_holder || 'N/A'}</div>
                <div className="fs-receipt-amount">₱{Number(result.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Info Card */}
      {finalizedBatch && (
        <div className="fs-batch-info">
          <div className="fs-info-row">
            <span className="fs-info-label">Batch Number</span>
            <span className="fs-info-value">{finalizedBatch.final_batch_number || finalizedBatch.batch_number}</span>
          </div>
          <div className="fs-info-row">
            <span className="fs-info-label">Transactions</span>
            <span className="fs-info-value linked">Linked</span>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1, background: 'transparent' }} />

      {/* Action Buttons */}
      {!isFinalizing && finalizedBatch && (
        <div className="fs-actions">
          <button className="fs-action-btn secondary" onClick={onDone}>
            Return to Batch Details
          </button>
          {onViewSummary && (
            <button className="fs-action-btn primary" onClick={onViewSummary}>
              Complete & View Summary
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {!isFinalizing && (
        <div className="fs-progress">
          <div className="fs-progress-divider" />
          <span className="fs-progress-text">Stage 6 of 8</span>
          <div className="fs-progress-divider" />
        </div>
      )}
    </div>
  );
}
