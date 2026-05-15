import React from 'react';

const Icon = {
  Plus: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
    </svg>
  ),
  CheckCircle: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  ),
  Circle: ({ size = 8 }) => (
    <svg width={size} height={size} viewBox="0 0 8 8">
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  ),
};

export default function BatchDashboard({ 
  batches, 
  fileCount, 
  setFileCount, 
  fileInputRef, 
  isCreating, 
  handleCreateAndUpload, 
  handleDeleteBatch, 
  navigate 
}) {
  const nextBatchNumber = batches.length + 1;
  const nextBatchName = `Batch #${String(nextBatchNumber).padStart(3, '0')}`;

  return (
    <div className="bcp-layout">
      {/* Creation Panel */}
      <div className="glass-card sticky">
        <div className="section-label">New Batch</div>
        <h2 className="h1-modern">Verification Workflow</h2>
        
        <form onSubmit={handleCreateAndUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="metric-card-sm" style={{ background: 'var(--bg-glass-hover)', border: '1px solid var(--border-strong)' }}>
            <label className="form-label" style={{ marginBottom: '8px' }}>Next Batch</label>
            <div className="metric-value-sm accent" style={{ fontSize: '1.5rem' }}>{nextBatchName}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>System Auto-Generated</div>
          </div>

          <div>
            <label className="form-label">Receipt Images</label>
            <div className="drop-zone">
              <input
                type="file"
                multiple
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => setFileCount(e.target.files?.length || 0)}
              />
              <div className="drop-icon">📁</div>
              {fileCount > 0 ? (
                <>
                  <div className="metric-value-sm accent" style={{ textAlign: 'center' }}>
                    {fileCount} file{fileCount !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Click to change</div>
                </>
              ) : (
                <>
                  <div className="metric-value-sm" style={{ textAlign: 'center' }}>Drag & Drop</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>or click to browse</div>
                </>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary-modern" 
            disabled={isCreating || fileCount === 0}
          >
            {isCreating ? (
              <>
                <div className="spinner-modern" />
                Creating...
              </>
            ) : (
              <>
                <Icon.Plus />
                Create Batch
              </>
            )}
          </button>
        </form>

        {/* Quick Stats */}
        <div style={{ 
          marginTop: '2rem', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', 
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div className="metric-card-sm" style={{ flex: 1, background: 'transparent', border: 'none' }}>
            <span className="metric-label-sm">Total Batches</span>
            <span className="metric-value-sm">{batches.length}</span>
          </div>
          <div className="metric-card-sm" style={{ flex: 1, background: 'transparent', border: 'none' }}>
            <span className="metric-label-sm">Completed</span>
            <span className="metric-value-sm success">
              {batches.filter(b => b.checker_status === 'finalized').length}
            </span>
          </div>
        </div>
      </div>

      {/* Batches Grid */}
      <div>
        <div className="section-label">Recent Batches</div>
        {batches.length === 0 ? (
          <div className="glass-card empty-box">
            <div className="empty-icon-lg">📂</div>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>No batches yet</div>
            <div style={{ opacity: 0.7 }}>
              Create your first batch above to begin processing
            </div>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="receipt-grid">
              {batches.map((batch, i) => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  onClick={() => navigate(`/batch/${batch.id}`)}
                  onDelete={(e) => handleDeleteBatch(e, batch.id)}
                  delay={i * 0.05}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BatchCard({ batch, onClick, onDelete, delay = 0 }) {
  const total = batch.receipts?.length || 0;
  const verified = batch.receipts?.filter(r => r.ocr_status === 'completed').length || 0;
  const progress = total > 0 ? Math.round((verified / total) * 100) : 0;
  const status = batch.checker_status === 'finalized' ? 'success' : 'pending';

  return (
    <div 
      className="receipt-card glass-card" 
      style={{ 
        animationDelay: `${delay}s`,
        background: 'rgba(255,255,255,0.03)',
        display: 'flex',
        flexDirection: 'column',
        aspectRatio: 'unset',
        minHeight: '180px'
      }}
      onClick={onClick}
    >
      <div className="receipt-info" style={{ opacity: 1, background: 'transparent', position: 'static', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
          <div className={`status-pill ${status}`}>
            {status === 'success' ? <Icon.CheckCircle /> : <Icon.Circle />}
            {status.toUpperCase()}
          </div>
          <button 
            className="btn-icon-modern danger" 
            onClick={onDelete}
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
          >
            <Icon.Trash size={14} />
          </button>
        </div>
        
        <div style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-primary)',
          fontWeight: 800,
          marginBottom: 'auto'
        }}>
          Batch {batch.name || 'Unnamed'}
        </div>
        
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
            <span>PROGRESS</span>
            <span>{verified}/{total} VERIFIED</span>
          </div>
          <div className="progress-bar-wrap" style={{ height: '4px', margin: 0 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
