import React from 'react';
import './FinalizeStage.css';

export default function FinalizeStage({
  isFinalizing,
  finalizedBatch,
  ocrResults,
  verificationSummary,
  onDone,
  onViewSummary,
  onReCrop,
}) {
  const verifiedCount = verificationSummary?.confirmed ?? finalizedBatch?.stats?.confirmed ?? 0;
  const notFoundCount = verificationSummary?.not_found ?? 0;

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
            padding: '10px 18px', borderRadius: '12px',
            background: isFinalizing ? 'rgba(249,115,22,0.08)' : 'rgba(16,185,129,0.08)',
            border: `1px solid ${isFinalizing ? 'rgba(249,115,22,0.25)' : 'rgba(16,185,129,0.25)'}`,
            display: 'flex', alignItems: 'center', gap: '10px'
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
              color: isFinalizing ? '#f97316' : '#059669',
              fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', 
              letterSpacing: '0.1em', fontFamily: "'Inter', sans-serif"
            }}>
              {isFinalizing ? 'Finalizing Batch' : 'Batch Finalized'}
            </span>
          </div>
          <div style={{
            padding: '8px 16px', borderRadius: '10px',
            background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)'
          }}>
            <span style={{ color: 'rgba(67,20,7,0.6)', fontSize: '11px', fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
              {ocrResults?.length || 0} receipts processed
            </span>
          </div>
        </div>
        <p style={{ 
          color: 'rgba(67,20,7,0.55)', fontSize: '13px', fontWeight: 500,
          fontFamily: "'Inter', sans-serif", margin: 0
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
            <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
              ✓ Verified
            </span>
            <span style={{
              background: 'rgba(16,185,129,0.15)', color: '#059669',
              borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 900,
              fontFamily: "'JetBrains Mono', monospace", minWidth: '32px', textAlign: 'center'
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
              <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>
                ✕ Missing
              </span>
              <span style={{
                background: 'rgba(239,68,68,0.15)', color: '#dc2626',
                borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace", minWidth: '32px', textAlign: 'center'
              }}>{notFoundCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Batch Info */}
      {finalizedBatch && (
        <div style={{
          marginTop: '24px', padding: '16px 20px', borderRadius: '12px',
          background: '#ffffff', border: '1px solid rgba(249,115,22,0.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 2px 8px rgba(67,20,7,0.04)'
        }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(67,20,7,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: "'Inter', sans-serif" }}>
              Batch Number
            </div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#431407', fontFamily: "'JetBrains Mono', monospace" }}>
              {finalizedBatch.final_batch_number || finalizedBatch.batch_number}
            </div>
          </div>
          <div style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <span style={{ color: '#f97316', fontSize: '11px', fontWeight: 800, fontFamily: "'Inter', sans-serif" }}>
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
              flex: 1, padding: '14px 20px', borderRadius: '12px',
              background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
              color: '#f97316', fontSize: '11px', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: "'Inter', sans-serif"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(249,115,22,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(249,115,22,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
            Return to Batch Details
          </button>
          {onViewSummary && (
            <button 
              onClick={onViewSummary}
              style={{
                flex: 1, padding: '14px 20px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)',
                border: 'none', color: '#fff', fontSize: '11px', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 6px 20px rgba(249,115,22,0.35)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(249,115,22,0.45)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(249,115,22,0.35)'; }}>
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