import React from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './CropStage.css';

const API_BASE = 'http://localhost:8000';

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
  onChangeToGCash, // NEW PROP
  onChangeToOthers, // NEW PROP
  index,
  total,
  gcashProcessed,
  gcashTotal,
  othersProcessed,
  othersTotal,
  isGcash,
  isOthers,
}) {
  return (
    <div className="cs-root">
      {/* Main Content Area */}
      <div className="cs-content">
        {/* Image Canvas */}
        <div className="cs-canvas-wrapper">
          <div
            className="cs-canvas-rotator"
            style={{
              transform: `rotate(${imageRotation}deg)`,
            }}
          >
            <ReactCrop
              crop={currentCategory === 'gcash' ? crop : null}
              onChange={onChange}
              onComplete={onComplete}
              disabled={currentCategory !== 'gcash'}
            >
              <img
                ref={imgRef}
                src={current ? `${API_BASE}/api/receipts/${current.id}/image` : ''}
                onLoad={onImageLoad}
                crossOrigin="anonymous"
                loading="eager"
                fetchPriority="high"
                alt="Receipt"
                className="cs-image"
                style={{
                  opacity: currentCategory !== 'gcash' ? 0.8 : 1,
                  maxWidth: '420px',
                  maxHeight: '600px',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Sidebar */}
        <div className="cs-sidebar">
          {/* Header Card */}
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

          {/* Progress Stats */}
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

          {/* Info Section */}
          <div className="cs-info-section">
            <div className="cs-info-row">
              <span className="cs-info-label">Category</span>
              <span className={`cs-info-value ${currentCategory === 'gcash' ? 'gcash' : 'others'}`}>
                {currentCategory}
              </span>
            </div>

            {currentAccount && (
              <div className="cs-info-row">
                <span className="cs-info-label">Account</span>
                <span className="cs-info-value">{currentAccount}</span>
              </div>
            )}
          </div>

          {/* Category Change Buttons - NEW */}
          {currentCategory && currentCategory !== 'unsorted' && (
            <div className="cs-category-change">
              <div className="cs-category-change-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 7h10v10" />
                  <path d="M7 17 17 7" />
                </svg>
                <span>Wrong Category?</span>
              </div>
              
              {currentCategory === 'gcash' && (
                <button 
                  onClick={onChangeToOthers}
                  className="cs-category-change-btn others"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Change to Others
                </button>
              )}
              
              {currentCategory === 'others' && (
                <button 
                  onClick={onChangeToGCash}
                  className="cs-category-change-btn gcash"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Change to GCash
                </button>
              )}
            </div>
          )}

          {/* Rotate Button */}
          <button onClick={rotateImage} className="cs-rotate-btn">
            <span className="cs-rotate-label">Rotate Image</span>
            <div className="cs-rotate-info">
              <span className="cs-rotate-angle">
                {imageRotation % 360 === 0 ? 'Portrait' : 
                 imageRotation % 360 === 90 ? 'Landscape' : 
                 imageRotation % 360 === 180 ? 'Inverted' : 
                 'Landscape Left'}
              </span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="cs-rotate-icon"
                style={{ transform: `rotate(${imageRotation}deg)` }}
              >
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </div>
          </button>

          {/* Manual Input Form (Others only) */}
          {currentCategory === 'others' && (
            <div className="cs-form">
              {/* Row 1: Account and Amount */}
              <div className="cs-form-row">
                <div className="cs-form-group">
                  <label className="cs-form-label">Account</label>
                  <select
                    value={currentAccount || ''}
                    onChange={(e) => setCurrentAccount(e.target.value)}
                    className="cs-form-select"
                  >
                    <option value="">— Select —</option>
                    {ACCOUNTS.map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>

                <div className="cs-form-group">
                  <label className="cs-form-label">Amount (₱)</label>
                  <input 
                    type="number" 
                    value={manualAmount} 
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="cs-form-input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Row 2: Label and Date */}
              <div className="cs-form-row">
                <div className="cs-form-group">
                  <label className="cs-form-label">Label</label>
                  <input 
                    type="text" 
                    value={manualReference} 
                    onChange={(e) => setManualReference(e.target.value)}
                    className="cs-form-input"
                    placeholder="e.g. Payment"
                  />
                </div>

                <div className="cs-form-group">
                  <label className="cs-form-label">Date</label>
                  <input 
                    type="date" 
                    value={manualDate} 
                    onChange={(e) => setManualDate(e.target.value)}
                    className="cs-form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Recategorize Button */}
          <button onClick={onRecategorize} className="cs-recategorize-btn">
            Re-categorize All
          </button>

          {/* Navigation */}
          <div className="cs-nav">
            <div className="cs-nav-buttons">
              {index > 0 && (
                <button onClick={onPrev} className="cs-nav-btn prev">
                  Prev
                </button>
              )}
              <button onClick={onNext} className={`cs-nav-btn next ${currentCategory === 'gcash' ? 'gcash' : 'others'}`}>
                {index + 1 < total ? 'Next' : 'Finish ✨'}
              </button>
            </div>
            <div className="cs-nav-progress">
              <div className="cs-nav-divider" />
              <span className="cs-nav-text">
                Stage 3 of 8: Crop & Input ({index + 1}/{total})
              </span>
              <div className="cs-nav-divider" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
