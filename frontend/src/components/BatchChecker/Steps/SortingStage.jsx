import React from 'react';
import './SortingStage.css';

const API_BASE = 'http://localhost:8000';

export default function SortingStage({
  receipts,
  checkedForOthers,
  setCheckedForOthers,
  sortingView,
  setSortingView,
  isSavingSorting,
  onApply,
  onProceed,
  onReceiptClick, // New prop for handling receipt card clicks
}) {
  const gcashCount  = receipts.length - checkedForOthers.size;
  const othersCount = checkedForOthers.size;

  const gcashReceipts  = receipts.filter(r => !checkedForOthers.has(r.id));
  const othersReceipts = receipts.filter(r =>  checkedForOthers.has(r.id));

  const toggleReceipt = (id) => {
    setCheckedForOthers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Select view ── */
  if (sortingView === 'select') {
    return (
      <div className="ss-root">
        {/* Header */}
        <div className="ss-header">
          <div>
            <h3 className="ss-title">Sort Receipts</h3>
            <p className="ss-subtitle">
              Check receipts that belong to{' '}
              <strong className="others">Others</strong>.
              The rest are assigned to{' '}
              <strong className="gcash">GCash</strong>.
            </p>
          </div>
          <div className="ss-badges">
            <span className="ss-badge gcash">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
              </svg>
              GCash &nbsp;{gcashCount}
            </span>
            <span className="ss-badge others">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
              </svg>
              Others &nbsp;{othersCount}
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="ss-scroll">
          <div className="ss-grid">
            {receipts.map(r => {
              const checked = checkedForOthers.has(r.id);
              return (
                <div
                  key={r.id}
                  className={`ss-card${checked ? ' checked' : ''}`}
                  onClick={() => toggleReceipt(r.id)}
                >
                  <div className="ss-checkbox">
                    {checked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className={`ss-cat-badge ${checked ? 'others' : 'gcash'}`}>
                    {checked ? 'Others' : 'GCash'}
                  </div>
                  <img
                    src={`${API_BASE}/api/receipts/${r.id}/image`}
                    alt=""
                    crossOrigin="anonymous"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Apply */}
        <button
          className="ss-apply-btn"
          onClick={onApply}
          disabled={isSavingSorting}
        >
          {isSavingSorting ? (
            <><span className="ss-spinner" /> Saving…</>
          ) : (
            <>Apply Sorting &nbsp;→</>
          )}
        </button>
      </div>
    );
  }

  /* ── Review view ── */
  return (
    <div className="ss-root">
      {/* Header */}
      <div className="ss-review-header">
        <h3 className="ss-title">Review Sorting</h3>
        <button className="ss-edit-btn" onClick={() => setSortingView('select')}>
          ← Edit
        </button>
      </div>

      {/* Columns */}
      <div className="ss-scroll">
        <div className="ss-columns">

          {/* GCash */}
          {gcashReceipts.length > 0 && (
            <div className="ss-col gcash">
              <div className="ss-col-header">
                <span className="ss-col-label gcash">GCash</span>
                <span className="ss-col-count gcash">{gcashReceipts.length}</span>
              </div>
              <div className="ss-col-grid">
                {gcashReceipts.map(r => (
                  <div 
                    key={r.id} 
                    className="ss-col-card gcash"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('GCash receipt clicked:', r.id);
                      if (onReceiptClick) {
                        onReceiptClick(r);
                      } else {
                        console.warn('onReceiptClick handler not provided');
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    title={`Receipt ID: ${r.id} - Click to edit`}
                  >
                    <div className="ss-receipt-id">#{r.id}</div>
                    <img src={`${API_BASE}/api/receipts/${r.id}/image`} alt="" crossOrigin="anonymous" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          {gcashReceipts.length > 0 && othersReceipts.length > 0 && (
            <div className="ss-separator" />
          )}

          {/* Others */}
          {othersReceipts.length > 0 && (
            <div className="ss-col others">
              <div className="ss-col-header">
                <span className="ss-col-label others">Others</span>
                <span className="ss-col-count others">{othersReceipts.length}</span>
              </div>
              <div className="ss-col-grid">
                {othersReceipts.map(r => (
                  <div 
                    key={r.id} 
                    className="ss-col-card others"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Others receipt clicked:', r.id);
                      if (onReceiptClick) {
                        onReceiptClick(r);
                      } else {
                        console.warn('onReceiptClick handler not provided');
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                    title={`Receipt ID: ${r.id} - Click to edit`}
                  >
                    <div className="ss-receipt-id">#{r.id}</div>
                    <img src={`${API_BASE}/api/receipts/${r.id}/image`} alt="" crossOrigin="anonymous" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Proceed */}
      <button className="ss-proceed-btn" onClick={onProceed}>
        Looks Good — Proceed to Crop &amp; Input &nbsp;→
      </button>
    </div>
  );
}