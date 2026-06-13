import React from 'react';
import './FinalizeStage.css';

export default function FinalizeStage({
  isFinalizing,
  finalizedBatch,
  ocrResults,
  verificationSummary,
  onDone,
  onViewSummary,
  onReCrop,
}) {
  const verifiedCount = verificationSummary?.confirmed ?? finalizedBatch?.stats?.confirmed ?? 0;
  const notFoundCount = verificationSummary?.not_found ?? 0;

  const handleReceiptClick = (result, idx) => {
    console.log('Receipt clicked:', result, idx);
    if (onReCrop) {
      onReCrop(result, idx);
    } else {
      console.error('onReCrop is not defined!');
    }
  };

  return (
    <div className="fs-root">
      {/* Header */}
      <div className="fs-header-container">
        <div className="fs-header-top">
          <div className={`fs-status-badge ${isFinalizing ? 'finalizing' : 'finalized'}`}>
            {isFinalizing ? (
              <div className="fs-header-spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            <span className="fs-status-text">
              {isFinalizing ? 'Finalizing Batch' : 'Batch Finalized'}
            </span>
          </div>
          <div className="fs-processed-badge">
            <span className="fs-processed-text">
              {ocrResults?.length || 0} receipts processed
            </span>
          </div>
        </div>
        <p className="fs-status-description">
          {isFinalizing 
            ? 'Stamping batch labels and linking transactions...'
            : 'Batch complete and ready for summary calculation'}
        </p>
      </div>

      {/* Stats Row */}
      {ocrResults && ocrResults.length > 0 && (
        <div className="fs-stats-container">
          <div className="fs-stat-card verified">
            <span className="fs-stat-label">✓ Verified</span>
            <span className="fs-stat-value">{verifiedCount}</span>
          </div>
          
          {notFoundCount > 0 && (
            <div className="fs-stat-card missing">
              <span className="fs-stat-label">✕ Missing</span>
              <span className="fs-stat-value">{notFoundCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Batch Info */}
      {finalizedBatch && (
        <div className="fs-batch-info">
          <div>
            <div className="fs-batch-label">Batch Number</div>
            <div className="fs-batch-number">
              {finalizedBatch.final_batch_number || finalizedBatch.batch_number}
            </div>
          </div>
          <div className="fs-transactions-badge">
            <span>Transactions Linked</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isFinalizing && finalizedBatch && (
        <div className="fs-actions-container">
          <button className="fs-btn secondary" onClick={onDone}>
            Return to Batch Details
          </button>
          {onViewSummary && (
            <button className="fs-btn primary" onClick={onViewSummary}>
              Complete & View Summary
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
