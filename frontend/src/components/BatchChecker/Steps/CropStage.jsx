import React, { useState, useEffect, useRef } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './CropStage.css';
import { getApiUrl } from '../../../apiConfig';

export default function CropStage({
  current,
  currentCategory,
  currentAccount,
  setCurrentAccount,
  crop,
  onChange,
  onComplete,
  imgRef,
  onImageLoad,
  imageRotation,
  rotateImage,
  manualAmount,
  setManualAmount,
  manualReference,
  setManualReference,
  manualDate,
  setManualDate,
  ACCOUNTS,
  onPrev,
  onNext,
  onRecategorize,
  onChangeToGCash,
  onChangeToOthers,
  index,
  total,
  gcashProcessed,
  gcashTotal,
  othersProcessed,
  othersTotal,
  isGcash,
  isOthers,
  allReceipts,
}) {
  const [errors, setErrors] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  // ── Magnifier state ─────────────────────────────────────────────
  const [magnifierOn, setMagnifierOn]   = useState(false);
  const [lensPos, setLensPos]           = useState({ x: 0, y: 0 });
  const [showLens, setShowLens]         = useState(false);
  const [pinnedLens, setPinnedLens]     = useState(null); // locked position on double-click
  const canvasWrapperRef                = useRef(null);
  const ZOOM                            = 3;
  const LENS_SIZE                       = 280;

  const handleMouseMove = (e) => {
    if (!magnifierOn || !imgRef.current || pinnedLens) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setShowLens(false);
      return;
    }
    setShowLens(true);
    setLensPos({ x, y, rect });
  };

  const handleMouseLeave = () => {
    if (!pinnedLens) setShowLens(false);
  };

  const handleDoubleClick = (e) => {
    if (!magnifierOn || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    if (pinnedLens) {
      // Unpin
      setPinnedLens(null);
      setShowLens(false);
    } else {
      // Pin at this location
      setPinnedLens({ x, y, rect });
      setShowLens(true);
      setLensPos({ x, y, rect });
    }
  };

  const validateForm = () => {
    const e = {};
    if (isOthers) {
      if (!manualDate)                                e.date      = 'Date is required';
      if (!currentAccount)                            e.account   = 'Account must be selected';
      if (!manualAmount || Number(manualAmount) <= 0) e.amount    = 'Amount must be greater than 0';
      if (!manualReference?.trim())                   e.reference = 'Label is required';
    }
    setErrors(e);
    if (Object.keys(e).length) {
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 4000);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (isOthers && !validateForm()) return;
    onNext();
  };

  const handlePrev = () => { onPrev(); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [manualDate, currentAccount, manualAmount, manualReference, isOthers]);

  // ── Lens background position calculation ────────────────────────
  const getLensStyle = () => {
    if (!imgRef.current) return {};
    const pos    = pinnedLens || lensPos;
    if (!pos.rect) return {};
    const rect   = pos.rect;
    const bgX    = -(pos.x * ZOOM - LENS_SIZE / 2);
    const bgY    = -(pos.y * ZOOM - LENS_SIZE / 2);
    const imgSrc = current ? getApiUrl(`/api/receipts/${current.id}/image`) : '';
    return {
      width:               `${LENS_SIZE}px`,
      height:              `${LENS_SIZE}px`,
      backgroundImage:     `url(${imgSrc})`,
      backgroundSize:      `${rect.width * ZOOM}px ${rect.height * ZOOM}px`,
      backgroundPosition:  `${bgX}px ${bgY}px`,
      backgroundRepeat:    'no-repeat',
      left:                `${pos.x}px`,
      top:                 `${pos.y}px`,
      transform:           'translate(-50%, -50%)',
    };
  };

  return (
    <div className="cs-root">
      {/* Error Toast */}
      {showErrorToast && Object.keys(errors).length > 0 && (
        <div className="cs-error-toast">
          <div className="cs-error-toast-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Please fill all required fields</span>
            <button onClick={() => setShowErrorToast(false)} className="cs-error-toast-close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="cs-error-toast-body">
            {Object.values(errors).map((err, i) => (
              <div key={i} className="cs-error-toast-item">• {err}</div>
            ))}
          </div>
        </div>
      )}

      <div className="cs-content">
        {/* Image Canvas */}
        <div
          className="cs-canvas-wrapper"
          ref={canvasWrapperRef}
          style={{ cursor: magnifierOn ? 'none' : 'default' }}
        >
          {/* Magnifier toggle button */}
          <button
            className={`cs-magnifier-btn ${magnifierOn ? 'active' : ''}`}
            onClick={() => { setMagnifierOn(v => !v); setShowLens(false); setPinnedLens(null); }}
            title={magnifierOn ? 'Disable magnifier' : 'Enable magnifier'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            {magnifierOn ? 'Zoom On' : 'Zoom'}
          </button>

          <div
            className="cs-canvas-rotator"
            style={{ transform: `rotate(${imageRotation}deg)`, position: 'relative' }}
          >
            <ReactCrop
              crop={currentCategory === 'gcash' ? crop : null}
              onChange={onChange}
              onComplete={onComplete}
              disabled={currentCategory !== 'gcash' || magnifierOn}
            >
              <img
                ref={imgRef}
                src={current ? getApiUrl(`/api/receipts/${current.id}/image`) : ''}
                onLoad={onImageLoad}
                crossOrigin="anonymous"
                loading="eager"
                fetchPriority="high"
                alt="Receipt"
                className="cs-image"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onDoubleClick={handleDoubleClick}
                style={{
                  opacity: currentCategory !== 'gcash' ? 0.8 : 1,
                  maxWidth: '420px',
                  maxHeight: '600px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  cursor: magnifierOn ? (pinnedLens ? 'zoom-out' : 'crosshair') : 'default',
                }}
              />
            </ReactCrop>

            {/* Zoom Lens */}
            {magnifierOn && showLens && (
              <div className={`cs-zoom-lens ${pinnedLens ? 'pinned' : ''}`} style={getLensStyle()}>
                {pinnedLens && (
                  <div className="cs-zoom-lens-pin-hint">Double-click to unpin</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="cs-sidebar">
          <div className={`cs-header-card ${currentCategory === 'gcash' ? 'gcash' : 'others'}`}>
            <h3 className="cs-header-title">
              {currentCategory === 'gcash' ? 'Crop GCash Receipts' : 'Input Other Receipts'}
            </h3>
            <p className="cs-header-subtitle">
              {currentCategory === 'gcash'
                ? 'Adjust the crop area to capture the transaction amount and reference number'
                : 'Manually enter the transaction details for non-GCash receipts'}
            </p>
          </div>

          <div className="cs-stats-grid">
            <div className="cs-stat-card">
              <div className="cs-stat-label">Total Progress</div>
              <div className="cs-stat-value">{index + 1} / {total}</div>
            </div>
            {gcashTotal > 0 && (
              <div className="cs-stat-card gcash">
                <div className="cs-stat-label">GCash</div>
                <div className="cs-stat-value">{gcashProcessed} / {gcashTotal}</div>
              </div>
            )}
            {othersTotal > 0 && (
              <div className="cs-stat-card others">
                <div className="cs-stat-label">Others</div>
                <div className="cs-stat-value">{othersProcessed} / {othersTotal}</div>
              </div>
            )}
          </div>

          <div className="cs-info-section">
            <div className="cs-info-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="cs-info-label">Category</span>
                <span className={`cs-info-value ${currentCategory === 'gcash' ? 'gcash' : 'others'}`}>
                  {currentCategory}
                </span>
              </div>
              {currentAccount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="cs-info-label">Account</span>
                  <span className={`cs-info-value account-${currentAccount.toLowerCase()}`}>{currentAccount}</span>
                </div>
              )}
            </div>
          </div>

          <div className="cs-actions-row">
            <div className="cs-action-item category">
              <span className="cs-action-label">Wrong Category?</span>
              {currentCategory === 'gcash'
                ? <button onClick={onChangeToOthers} className="cs-action-btn others">To Others</button>
                : <button onClick={onChangeToGCash}  className="cs-action-btn gcash">To GCash</button>}
            </div>
            <div className="cs-action-divider" />
            <div className="cs-action-item rotate">
              <span className="cs-action-label">Rotate</span>
              <button onClick={rotateImage} className="cs-action-btn rotate">
                {imageRotation % 360 === 0 ? 'Portrait' : imageRotation % 360 === 90 ? 'Land' : imageRotation % 360 === 180 ? 'Inv' : 'Land-L'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: `rotate(${imageRotation}deg)`, marginLeft: '4px' }}>
                  <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                </svg>
              </button>
            </div>
          </div>

          {isOthers && (
            <div className="cs-form">
              <div className="cs-form-row" style={{ gridTemplateColumns: '0.8fr 2.2fr' }}>
                <div className="cs-form-group">
                  <label className="cs-form-label">Date *</label>
                  <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)}
                    className={`cs-form-input ${errors.date ? 'error' : ''}`} />
                </div>
                <div className="cs-form-group">
                  <label className="cs-form-label">Account *</label>
                  <div className={`cs-acc-toggle-bar ${errors.account ? 'error' : ''}`}>
                    {['Babilyn', 'Nixie', 'Kristine'].map(acc => (
                      <button key={acc} onClick={() => setCurrentAccount(acc)}
                        className={`cs-acc-toggle-btn ${currentAccount === acc ? 'active' : ''}`}
                        data-account={acc}>{acc}</button>
                    ))}
                  </div>
                  {errors.account && (
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', marginTop: '2px', display: 'block', fontFamily: 'var(--font-display)' }}>
                      ⚠ Select an account
                    </span>
                  )}
                </div>
              </div>
              <div className="cs-form-row three-cols">
                <div className="cs-form-group">
                  <label className="cs-form-label">Amount *</label>
                  <input type="number" value={manualAmount} onChange={e => setManualAmount(e.target.value)}
                    className={`cs-form-input ${errors.amount ? 'error' : ''}`} placeholder="0.00" />
                </div>
                <div className="cs-form-group">
                  <label className="cs-form-label">Label *</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input type="text" value={manualReference} onChange={e => setManualReference(e.target.value)}
                      className={`cs-form-input ${errors.reference ? 'error' : ''}`} placeholder="40315 or OTH" />
                    <button onClick={() => setManualReference('OTH')} className="cs-quick-fill-btn" type="button"
                      style={{ width: 'auto', padding: '10px 12px', margin: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      OTH
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="cs-nav">
            <div className="cs-nav-buttons">
              <button onClick={handlePrev} className="cs-nav-btn prev" disabled={index === 0}>Prev</button>
              <button onClick={handleNext} className={`cs-nav-btn next ${currentCategory === 'gcash' ? 'gcash' : 'others'}`}>Next</button>
            </div>
            <div className="cs-nav-progress">
              <div className="cs-nav-divider" />
              <span className="cs-nav-text">Stage 3 of 8: Crop &amp; Input ({index + 1}/{total})</span>
              <div className="cs-nav-divider" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
