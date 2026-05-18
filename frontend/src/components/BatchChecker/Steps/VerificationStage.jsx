import React from 'react';
import './VerificationStage.css';

export default function VerificationStage({
  isVerifying,
  ocrResults,
  onStartVerification,
  onFinalize,
}) {
  const verifiedCount = ocrResults?.filter(r => r.verification_status === 'verified').length || 0;
  const totalCount = ocrResults?.length || 0;
  const notFoundCount = totalCount - verifiedCount;

  return (
    <div className="vs-root">
      {/* Header Card */}
      <div className="vs-header-card">
        <div className="vs-icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        </div>
        <div className="vs-header-content">
          <h3 className="vs-title">Verification Check</h3>
          <p className="vs-subtitle">
            Verify extracted receipts against transaction records
          </p>
        </div>
      </div>

      {/* Status Section */}
      <div className="vs-status-section">
        <div className={`vs-status-card ${isVerifying ? 'processing' : ocrResults ? 'complete' : 'ready'}`}>
          <div className="vs-status-icon">
            {isVerifying ? (
              <div className="vs-spinner-wrapper">
                <div className="vs-spinner" />
              </div>
            ) : ocrResults ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            )}
          </div>
          
          <div className="vs-status-content">
            <h4 className="vs-status-title">
              {isVerifying ? 'Verifying Claims...' : ocrResults ? 'Verification Complete' : 'Ready to Verify'}
            </h4>
            <p className="vs-status-description">
              {isVerifying 
                ? 'Checking receipts against transaction database. This may take a moment...' 
                : ocrResults 
                  ? 'All receipts have been verified and are ready for finalization.' 
                  : 'All receipts have been extracted. Click the button below to start verification.'}
            </p>
          </div>
        </div>

        {/* Progress Info */}
        {totalCount > 0 && ocrResults && (
          <div className="vs-info-grid">
            <div className="vs-info-card">
              <div className="vs-info-label">Total</div>
              <div className="vs-info-value">{totalCount}</div>
            </div>
            <div className="vs-info-card success">
              <div className="vs-info-label">Verified</div>
              <div className="vs-info-value">{verifiedCount}</div>
            </div>
            {notFoundCount > 0 && (
              <div className="vs-info-card error">
                <div className="vs-info-label">Not Found</div>
                <div className="vs-info-value">{notFoundCount}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button - Start Verification */}
      {!isVerifying && !ocrResults && onStartVerification && (
        <button className="vs-action-btn" onClick={onStartVerification}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          Start Verification Check
        </button>
      )}

      {/* Action Button - Finalize */}
      {!isVerifying && ocrResults && onFinalize && (
        <button className="vs-action-btn finalize" onClick={onFinalize}>
          Finalize Batch & Update Progress
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      )}

      {/* Processing Indicator */}
      {isVerifying && (
        <div className="vs-processing-container">
          <div className="vs-processing-text">
            <span>Verifying receipts against database...</span>
          </div>
        </div>
      )}
    </div>
  );
}
