import React from 'react';
import { getApiUrl } from '../../../apiConfig';
import './VerificationStage.css';

export default function VerificationStage({
  batchId,
  isVerifying,
  ocrResults,
  onStartVerification,
  onFinalize,
  onBack,
  setOcrResults,
}) {
  const verifiedCount = ocrResults?.filter(r => r.verification_status === 'verified').length || 0;
  const totalCount = ocrResults?.length || 0;
  const notFoundCount = totalCount - verifiedCount;

  const handleManualVerify = async (receiptId, transactionId) => {
    try {
      const res = await fetch(getApiUrl(`/api/batches/${batchId}/receipts/${receiptId}/manual-verify`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId
        }),
      });

      if (res.ok) {
        const updatedReceipt = await res.json();
        setOcrResults(prev => prev.map(r => 
          r.receipt.id === updatedReceipt.id 
            ? { ...r, receipt: updatedReceipt, verification_status: 'verified' } 
            : r
        ));
      }
    } catch (e) {
      console.error('Manual verification failed', e);
      alert('Failed to update verification status');
    }
  };

  return (
    <div className="vs-root">
      {/* Header Card */}
      <div className={`vs-header-card ${ocrResults ? 'complete' : isVerifying ? 'processing' : 'ready'}`}>
        <div className="vs-header-icon">
          {isVerifying ? (
            <div className="vs-header-spinner" />
          ) : ocrResults ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          )}
        </div>
        <div className="vs-header-content">
          <h3 className="vs-header-title">
            {isVerifying ? 'Verifying...' : ocrResults ? 'Check Complete' : 'Ready'}
          </h3>
          <p className="vs-header-subtitle">
            {isVerifying 
              ? 'Checking receipts against database...' 
              : ocrResults 
                ? `${verifiedCount} matched, ${notFoundCount} flagged items.` 
                : 'Click below to start verification.'}
          </p>
        </div>
      </div>

      {/* Progress Stats */}
      {totalCount > 0 && ocrResults && (
        <div className="vs-stats-grid">
          <div className="vs-stat-card">
            <div className="vs-stat-label">Total</div>
            <div className="vs-stat-value">{totalCount}</div>
          </div>
          <div className="vs-stat-card success">
            <div className="vs-stat-label">Verified</div>
            <div className="vs-stat-value">{verifiedCount}</div>
          </div>
          <div className="vs-stat-card error">
            <div className="vs-stat-label">Missing</div>
            <div className="vs-stat-value">{notFoundCount}</div>
          </div>
        </div>
      )}

      {/* Results List */}
      {ocrResults && (
        <div className="vs-results-list">
          {ocrResults.map((res, i) => (
            <div key={res.receipt.id} className={`vs-result-item ${res.verification_status}`}>
              <div className="vs-result-main">
                <div className="vs-receipt-info">
                  <img src={getApiUrl(`/api/receipts/${res.receipt.id}/image`)} className="vs-receipt-img" alt="" />
                  <div className="vs-receipt-meta">
                    <span className="vs-receipt-amount">₱{Number(res.amount).toLocaleString()}</span>
                    <span className="vs-receipt-ref">{res.reference || 'No Reference'}</span>
                  </div>
                </div>
                <div className={`vs-status-badge ${res.verification_status}`}>
                  {res.verification_status === 'verified' ? 'Found' : 'Not Found'}
                </div>
              </div>

              {res.verification_status === 'flagged' && (
                <div className="vs-comparison">
                  <div className="vs-comparison-title">Recommended Transactions</div>
                  <div className="vs-comparison-grid">
                    <div className="vs-comp-side receipt">
                      <div className="vs-comp-label">From Receipt (OCR)</div>
                      <div className="vs-comp-row">
                        <span className="vs-comp-key">Amount</span>
                        <span className="vs-comp-val">₱{Number(res.amount).toLocaleString()}</span>
                      </div>
                      <div className="vs-comp-row">
                        <span className="vs-comp-key">Ref</span>
                        <span className="vs-comp-val">{res.reference || 'N/A'}</span>
                      </div>
                    </div>
                    
                    <div className="vs-comp-side transaction">
                      <div className="vs-comp-label">Recommended Matches</div>
                      <div className="vs-potential-matches">
                        {res.match_details?.potential_matches?.length > 0 ? (
                          res.match_details.potential_matches.map(tx => (
                            <div key={tx.id} className="vs-match-card" onClick={() => handleManualVerify(res.receipt.id, tx.id)}>
                              <div className="vs-match-info">
                                <span className="vs-match-ref">{tx.reference || tx.label || 'No Ref'}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="vs-match-date">{tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : 'No Date'}</span>
                                  <span style={{ 
                                    fontFamily: "'Space Mono', monospace", 
                                    fontSize: '11px', 
                                    fontWeight: 900, 
                                    color: '#10b981' 
                                  }}>
                                    ₱{Number(tx.amount).toLocaleString()}
                                  </span>
                                </div>
                                {tx.label && tx.label.includes('Int') && (
                                  <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 800 }}>INT MATCH</span>
                                )}
                              </div>
                              <div className="vs-manual-verify">
                                <input type="checkbox" readOnly checked={false} />
                                <span>Found</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="vs-comp-row">
                            <span className="vs-comp-val" style={{ color: '#ef4444' }}>No recommended transactions found</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Processing Indicator */}
      {isVerifying && (
        <div className="vs-processing-card">
          <div className="vs-spinner-wrapper">
            <div className="vs-spinner" />
          </div>
          <span className="vs-processing-text">Verifying receipts...</span>
        </div>
      )}

      {/* Action Button - Start Verification */}
      {!isVerifying && !ocrResults && onStartVerification && (
        <button className="vs-action-btn" onClick={onStartVerification}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Start Check
        </button>
      )}

      {/* Navigation and Action Buttons */}
      {!isVerifying && ocrResults && (
        <div className="vs-nav">
          <div className="vs-nav-buttons">
            {onBack && (
              <button 
                className="vs-nav-btn back"
                onClick={onBack}
              >
                ← Back
              </button>
            )}
            {onFinalize && (
              <button className="vs-nav-btn finalize" onClick={onFinalize}>
                Finalize
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            )}
          </div>
          <div className="vs-nav-progress">
            <div className="vs-nav-divider" />
            <span className="vs-nav-text">
              Stage 5 of 8
            </span>
            <div className="vs-nav-divider" />
          </div>
        </div>
      )}
    </div>
  );
}

