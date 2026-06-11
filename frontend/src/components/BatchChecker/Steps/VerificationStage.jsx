import React from 'react';
import './VerificationStage.css';

export default function VerificationStage({
  isVerifying,
  ocrResults,
  verificationSummary,
  onStartVerification,
  onFinalize,
  onBack,
}) {
  const verifiedCount = verificationSummary?.confirmed ?? 0;
  const matchedCount = verificationSummary?.matched ?? 0;
  const totalCount = verificationSummary?.total ?? ocrResults?.length ?? 0;
  const notFoundCount = verificationSummary?.not_found ?? 0;
  const duplicateCount = verificationSummary?.duplicate ?? 0;

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
            {isVerifying ? 'Verifying...' : ocrResults ? 'Complete' : 'Ready'}
          </h3>
          <p className="vs-header-subtitle">
            {isVerifying 
              ? 'Checking receipts against database...' 
              : ocrResults 
                ? 'Review matches and confirm each receipt before finalizing.' 
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
            <div className="vs-stat-label">Confirmed</div>
            <div className="vs-stat-value">{verifiedCount}</div>
          </div>
          <div className="vs-stat-card" style={{ borderColor: 'rgba(249,115,22,0.25)' }}>
            <div className="vs-stat-label">Needs Confirm</div>
            <div className="vs-stat-value">{matchedCount}</div>
          </div>
          <div className="vs-stat-card error">
            <div className="vs-stat-label">Missing</div>
            <div className="vs-stat-value">{notFoundCount}</div>
          </div>
          {duplicateCount > 0 && (
            <div className="vs-stat-card" style={{ borderColor: 'rgba(124,58,237,0.25)' }}>
              <div className="vs-stat-label">Claimed</div>
              <div className="vs-stat-value">{duplicateCount}</div>
            </div>
          )}
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

      {/* Spacer to push navigation to bottom */}
      <div style={{ flex: 1, background: 'transparent' }} />

      {/* Navigation and Action Buttons */}
      {!isVerifying && ocrResults && (
        <div className="vs-nav">
          <div className="vs-nav-buttons">
            {onBack && (
              <button 
                className="vs-nav-btn back"
                onClick={onBack}
              >
                Back
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
