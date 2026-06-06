import React, { useState } from 'react';
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
  const [focusedColumn, setFocusedColumn] = useState(null); // null, 'gcash', or 'others'
  const [draggedReceipt, setDraggedReceipt] = useState(null);
  
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

  const handleDragStart = (e, receipt) => {
    setDraggedReceipt(receipt);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedReceipt(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnGcash = (e) => {
    e.preventDefault();
    if (draggedReceipt && checkedForOthers.has(draggedReceipt.id)) {
      // Move from Others to GCash
      setCheckedForOthers(prev => {
        const next = new Set(prev);
        next.delete(draggedReceipt.id);
        return next;
      });
    }
    setDraggedReceipt(null);
  };

  const handleDropOnOthers = (e) => {
    e.preventDefault();
    if (draggedReceipt && !checkedForOthers.has(draggedReceipt.id)) {
      // Move from GCash to Others
      setCheckedForOthers(prev => {
        const next = new Set(prev);
        next.add(draggedReceipt.id);
        return next;
      });
    }
    setDraggedReceipt(null);
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
            <>Apply Sorting</>
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Toggle Buttons */}
          <div style={{
            display: 'flex',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            borderRadius: '10px',
            overflow: 'hidden',
            background: '#fff'
          }}>
            <button
              className={`ss-toggle-btn ${focusedColumn === 'gcash' ? 'active gcash' : ''}`}
              onClick={() => setFocusedColumn(focusedColumn === 'gcash' ? null : 'gcash')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: focusedColumn === 'gcash' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: focusedColumn === 'gcash' ? '#3b82f6' : 'rgba(67, 20, 7, 0.6)',
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Space Grotesk', sans-serif",
                borderRight: '1px solid rgba(251, 146, 60, 0.2)'
              }}
            >
              GCash ({gcashCount})
            </button>
            <button
              className={`ss-toggle-btn ${focusedColumn === 'others' ? 'active others' : ''}`}
              onClick={() => setFocusedColumn(focusedColumn === 'others' ? null : 'others')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: focusedColumn === 'others' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                color: focusedColumn === 'others' ? '#f59e0b' : 'rgba(67, 20, 7, 0.6)',
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Space Grotesk', sans-serif"
              }}
            >
              Others ({othersCount})
            </button>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="ss-scroll">
        <div className="ss-columns" style={{
          gridTemplateColumns: 
            focusedColumn === 'gcash' ? '90% 10%' :
            focusedColumn === 'others' ? '10% 90%' :
            '1fr 1fr'
        }}>

          {/* GCash */}
          {gcashReceipts.length > 0 && (
            <div 
              className="ss-col gcash"
              onDragOver={handleDragOver}
              onDrop={handleDropOnGcash}
            >
              <div className="ss-col-header">
                <span className="ss-col-label gcash">GCash</span>
                <span className="ss-col-count gcash">{gcashReceipts.length}</span>
              </div>
              <div className="ss-col-grid">
                {gcashReceipts.map(r => (
                  <div 
                    key={r.id} 
                    className="ss-col-card gcash"
                    draggable
                    onDragStart={(e) => handleDragStart(e, r)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('GCash receipt clicked:', r.id);
                      if (onReceiptClick) {
                        onReceiptClick(r);
                      } else {
                        console.warn('onReceiptClick handler not provided');
                      }
                    }}
                    style={{ cursor: 'grab' }}
                    title={`Receipt ID: ${r.id} - Drag to move or click to edit`}
                  >
                    <div className="ss-receipt-id">#{r.id}</div>
                    <img src={`${API_BASE}/api/receipts/${r.id}/image`} alt="" crossOrigin="anonymous" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Others */}
          {othersReceipts.length > 0 && (
            <div 
              className="ss-col others"
              onDragOver={handleDragOver}
              onDrop={handleDropOnOthers}
            >
              <div className="ss-col-header">
                <span className="ss-col-label others">Others</span>
                <span className="ss-col-count others">{othersReceipts.length}</span>
              </div>
              <div className="ss-col-grid">
                {othersReceipts.map(r => (
                  <div 
                    key={r.id} 
                    className="ss-col-card others"
                    draggable
                    onDragStart={(e) => handleDragStart(e, r)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Others receipt clicked:', r.id);
                      if (onReceiptClick) {
                        onReceiptClick(r);
                      } else {
                        console.warn('onReceiptClick handler not provided');
                      }
                    }}
                    style={{ cursor: 'grab' }}
                    title={`Receipt ID: ${r.id} - Drag to move or click to edit`}
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
        Confirm Sorting & Proceed to Cropping
      </button>
    </div>
  );
}