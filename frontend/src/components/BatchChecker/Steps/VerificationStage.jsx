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
  const total      = verificationSummary?.total      ?? ocrResults?.length ?? 0;
  const confirmed  = verificationSummary?.confirmed  ?? 0;
  const matched    = verificationSummary?.matched     ?? 0;
  const notFound   = verificationSummary?.not_found  ?? 0;
  const duplicate  = verificationSummary?.duplicate  ?? 0;

  const isDone     = !isVerifying && ocrResults;
  const isReady    = !isVerifying && !ocrResults;

  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  return (
    <div className="vs-root">

      {/* ── Status Banner ─────────────────────────────────────── */}
      <div className={`vs-banner ${isVerifying ? 'verifying' : isDone ? 'done' : 'idle'}`}>
        <div className="vs-banner-icon">
          {isVerifying ? (
            <div className="vs-spin" />
          ) : isDone ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          )}
        </div>
        <div className="vs-banner-text">
          <span className="vs-banner-title">
            {isVerifying ? 'Running Check…' : isDone ? 'Check Complete' : 'Ready to Check'}
          </span>
          <span className="vs-banner-sub">
            {isVerifying
              ? 'Matching receipts against the database'
              : isDone
                ? `${confirmed} of ${total} receipts confirmed`
                : 'Start to match receipts against the transaction database'}
          </span>
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────── */}
      {isDone && total > 0 && (
        <>
          <div className="vs-stats-row">
            <div className="vs-stat neutral">
              <span className="vs-stat-val">{total}</span>
              <span className="vs-stat-lbl">Total</span>
            </div>
            <div className="vs-stat success">
              <span className="vs-stat-val">{confirmed}</span>
              <span className="vs-stat-lbl">Confirmed</span>
            </div>
            <div className="vs-stat warning">
              <span className="vs-stat-val">{matched}</span>
              <span className="vs-stat-lbl">Matched</span>
            </div>
            <div className={`vs-stat ${notFound > 0 ? 'danger' : 'neutral'}`}>
              <span className="vs-stat-val">{notFound}</span>
              <span className="vs-stat-lbl">Missing</span>
            </div>
          </div>

          {/* ── Progress bar ─────────────────────────────────── */}
          <div className="vs-progress-wrap">
            <div className="vs-progress-track">
              <div className="vs-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="vs-progress-pct">{pct}%</span>
          </div>
        </>
      )}

      {/* ── Duplicate notice (only when relevant) ─────────────── */}
      {isDone && duplicate > 0 && (
        <div className="vs-notice">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{duplicate} receipt{duplicate !== 1 ? 's' : ''} already claimed by another batch</span>
        </div>
      )}

      {/* ── Spacer ──────────────────────────────────────────────── */}
      <div className="vs-spacer" />

      {/* ── Start Check ─────────────────────────────────────────── */}
      {isReady && onStartVerification && (
        <button className="vs-btn primary" onClick={onStartVerification}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Start Check
        </button>
      )}

      {/* ── Bottom Nav ──────────────────────────────────────────── */}
      {isDone && (
        <div className="vs-nav">
          {onBack && (
            <button className="vs-btn ghost" onClick={onBack}>Back</button>
          )}
          {onFinalize && (
            <button className="vs-btn finalize" onClick={onFinalize}>
              Finalize
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="vs-stage-label">Stage 5 of 8 · Run Check</div>

    </div>
  );
}
