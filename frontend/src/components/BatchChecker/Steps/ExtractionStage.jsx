import React from 'react';
import './ExtractionStage.css';

export default function ExtractionStage({
  isProcessingOcr,
  ocrResults,
  onStartExtraction,
  receiptsCount,
  ocrProgress = 0,
  onReExtract, // NEW PROP
}) {
  return (
    <div className="es-root">
      {/* Header Card */}
      <div className="es-header-card">
        <div className="es-icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div className="es-header-content">
          <h3 className="es-title">OCR Extraction</h3>
          <p className="es-subtitle">
            Extract data from cropped receipt images using OCR technology
          </p>
        </div>
      </div>

      {/* Status Section */}
      <div className="es-status-section">
        <div className={`es-status-card ${isProcessingOcr ? 'processing' : ocrResults ? 'complete' : 'ready'}`}>
          <div className="es-status-icon">
            {isProcessingOcr ? (
              <div className="es-spinner-wrapper">
                <div className="es-spinner" />
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
          
          <div className="es-status-content">
            <h4 className="es-status-title">
              {isProcessingOcr ? 'Extracting Data...' : ocrResults ? 'Extraction Complete' : 'Ready to Scan'}
            </h4>
            <p className="es-status-description">
              {isProcessingOcr 
                ? 'Our OCR engine is reading your cropped images. This may take a moment...' 
                : ocrResults 
                  ? 'All receipt data has been successfully extracted and is ready for verification.' 
                  : 'All receipts are sorted and cropped. Click the button below to start the extraction process.'}
            </p>
          </div>
        </div>

        {/* Progress Info */}
        {receiptsCount > 0 && (
          <div className="es-info-grid">
            <div className="es-info-card">
              <div className="es-info-label">Total Receipts</div>
              <div className="es-info-value">{receiptsCount}</div>
            </div>
            {ocrResults && (
              <>
                <div className="es-info-card success">
                  <div className="es-info-label">Extracted</div>
                  <div className="es-info-value">{ocrResults.length}</div>
                </div>
                <div className="es-info-card">
                  <div className="es-info-label">Status</div>
                  <div className="es-info-value es-status-badge">Ready</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isProcessingOcr && !ocrResults && (
        <button className="es-action-btn" onClick={onStartExtraction}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
          </svg>
          Start OCR Extraction
        </button>
      )}

      {/* Re-Extract Button - NEW */}
      {!isProcessingOcr && ocrResults && onReExtract && (
        <div className="es-reextract-section">
          <div className="es-reextract-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Not satisfied with the extraction results?</span>
          </div>
          <button className="es-reextract-btn" onClick={onReExtract}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Re-Extract All Receipts
          </button>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessingOcr && (
        <div className="es-processing-container">
          <div className="es-processing-bar">
            <div className="es-processing-fill" style={{ width: `${ocrProgress}%` }} />
          </div>
          <div className="es-processing-text">
            <span>Processing receipts</span>
            <span className="es-processing-percentage">{ocrProgress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
