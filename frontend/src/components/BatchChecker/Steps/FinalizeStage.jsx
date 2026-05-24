import React from 'react';
import './FinalizeStage.css';

export default function FinalizeStage({
  isFinalizing,
  finalizedBatch,
  ocrResults,
  onDone,
  onViewSummary,
  onReCrop,
}) {
  const verifiedCount = ocrResults?.filter(r => r.verification_status === 'verified').length || 0;
  const notFoundCount = (ocrResults?.length || 0) - verifiedCount;

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
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <div style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: isFinalizing 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.12) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {isFinalizing ? (
              <div className="fs-header-spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
            <span style={{ 
              color: '#10b981', 
              fontSize: '11px', 
              fontWeight: 900, 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              {isFinalizing ? 'Finalizing Batch' : 'Batch Finalized'}
            </span>
          </div>
          <div style={{
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ 
              color: '#94a3b8', 
              fontSize: '11px', 
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              {ocrResults?.length || 0} receipts processed
            </span>
          </div>
        </div>
        <p style={{ 
          color: '#64748b', 
          fontSize: '13px', 
          fontWeight: 500,
          fontFamily: "'Space Grotesk', sans-serif",
          margin: 0
        }}>
          {isFinalizing 
            ? 'Stamping batch labels and linking transactions...'
            : 'Batch complete and ready for summary calculation'}
        </p>
      </div>

      {/* Stats Row */}
      {ocrResults && ocrResults.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flex: 1,
            minWidth: '140px'
          }}>
            <span style={{ 
              color: '#10b981', 
              fontSize: '11px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              ✓ Verified
            </span>
            <span style={{
              background: 'rgba(0, 0, 0, 0.3)',
              color: '#10b981',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '13px',
              fontWeight: 900,
              fontFamily: "'Space Mono', monospace",
              minWidth: '32px',
              textAlign: 'center'
            }}>{verifiedCount}</span>
          </div>
          
          {notFoundCount > 0 && (
            <div style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              minWidth: '140px'
            }}>
              <span style={{ 
                color: '#ef4444', 
                fontSize: '11px', 
                fontWeight: 800, 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                ✕ Missing
              </span>
              <span style={{
                background: 'rgba(0, 0, 0, 0.3)',
                color: '#ef4444',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '13px',
                fontWeight: 900,
                fontFamily: "'Space Mono', monospace",
                minWidth: '32px',
                textAlign: 'center'
              }}>{notFoundCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Batch Info */}
      {finalizedBatch && (
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ 
              fontSize: '9px', 
              fontWeight: 800, 
              color: '#64748b', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              marginBottom: '4px',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Batch Number
            </div>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 900, 
              color: '#fff',
              fontFamily: "'Space Mono', monospace"
            }}>
              {finalizedBatch.final_batch_number || finalizedBatch.batch_number}
            </div>
          </div>
          <div style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}>
            <span style={{ 
              color: '#fbbf24', 
              fontSize: '11px', 
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Transactions Linked
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isFinalizing && finalizedBatch && (
        <div style={{ 
          marginTop: '24px',
          display: 'flex',
          gap: '12px'
        }}>
          <button 
            onClick={onDone}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
            Return to Batch Details
          </button>
          {onViewSummary && (
            <button 
              onClick={onViewSummary}
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Space Grotesk', sans-serif",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.4)';
              }}>
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