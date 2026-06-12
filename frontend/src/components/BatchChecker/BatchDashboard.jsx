import React from 'react';
import BillingSummaryModal from './BillingSummaryModal';

const fmt = (n) =>
  Number(n ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  Calendar: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Receipt: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
      <path d="M16 8h-6M16 12h-6M16 16h-6"/>
    </svg>
  ),
  TrendingUp: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  ArrowRight: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Folder: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  ),
};

export default function BatchDashboard({ 
  batches, 
  dashboard,
  fileCount, 
  setFileCount, 
  fileInputRef, 
  isCreating, 
  handleCreateAndUpload, 
  handleDeleteBatch, 
  handleUpdateBatchName,
  error,
  navigate 
}) {
  const nextBatchNumber = batches.length + 1;
  const autoBatchName = `Batch #${String(nextBatchNumber).padStart(3, '0')}`;
  
  const [customBatchName, setCustomBatchName] = React.useState('');
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [summaryBatch, setSummaryBatch] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState('date-desc');

  // Update custom name if it's empty or when batches change (if not manually editing)
  React.useEffect(() => {
    if (!customBatchName || !isEditingName) {
      setCustomBatchName(autoBatchName);
    }
  }, [batches, autoBatchName]);

  const displayBatchName = customBatchName || autoBatchName;

  // Dashboard statistics from backend
  const totalBatches = dashboard?.total_batches ?? batches.length;
  const completedBatches = dashboard?.completed_batches ?? 0;
  const inProgressBatches = dashboard?.in_progress_batches ?? 0;
  const totalReceipts = dashboard?.total_receipts ?? batches.reduce((sum, b) => sum + (b.receipts?.length || 0), 0);

  // Filter and sort batches
  const filteredBatches = batches.filter(batch => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (batch.name || '').toLowerCase().includes(query) ||
      (batch.final_batch_number || '').toLowerCase().includes(query) ||
      String(batch.id).toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'name-asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name-desc':
        return (b.name || '').localeCompare(a.name || '');
      case 'items-desc':
        return (b.receipts?.length || 0) - (a.receipts?.length || 0);
      case 'items-asc':
        return (a.receipts?.length || 0) - (b.receipts?.length || 0);
      case 'date-desc':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  return (
    <div className="bcp-layout">
      {/* Compact Creation Panel */}
      <div className="glass-card sticky">
        {/* Compact Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '10px'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <span style={{
              fontSize: '9px',
              fontWeight: 900,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontFamily: "'Inter', sans-serif"
            }}>New Batch</span>
          </div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 900,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            fontFamily: "'Inter', sans-serif",
            lineHeight: '1.2',
            marginBottom: '4px'
          }}>
            Verification Workflow
          </h2>
          <p style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: "'Inter', sans-serif",
            lineHeight: '1.4'
          }}>
            Upload and process receipts
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: '14px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(185, 28, 28, 0.05)',
            border: '1px solid rgba(185, 28, 28, 0.2)',
            color: 'var(--danger-primary)',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "'Inter', sans-serif",
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}
        
        <form onSubmit={(e) => handleCreateAndUpload(e, displayBatchName)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Next Batch Info */}
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '9px',
                  fontWeight: 900,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: '6px',
                  fontFamily: "'Inter', sans-serif"
                }}>Next Batch Number</div>
                
                {isEditingName ? (
                  <input
                    type="text"
                    value={customBatchName}
                    onChange={(e) => setCustomBatchName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                    autoFocus
                    style={{
                      fontSize: '24px',
                      fontWeight: 900,
                      color: 'var(--accent-primary)',
                      letterSpacing: '-0.02em',
                      fontFamily: "'JetBrains Mono', monospace",
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '2px solid var(--accent-primary)',
                      width: '100%',
                      outline: 'none',
                      padding: '0'
                    }}
                  />
                ) : (
                  <div 
                    onClick={() => setIsEditingName(true)}
                    style={{
                      fontSize: '28px',
                      fontWeight: 900,
                      color: 'var(--accent-primary)',
                      letterSpacing: '-0.02em',
                      fontFamily: "'JetBrains Mono', monospace",
                      cursor: 'text',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {displayBatchName}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                )}
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--bg-glass-hover)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon.Folder size={24} style={{ color: 'var(--accent-primary)' }} />
              </div>
            </div>
            <div style={{
              marginTop: '10px',
              padding: '6px 10px',
              borderRadius: '8px',
              background: 'rgba(251, 146, 60, 0.08)',
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontFamily: "'Inter', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              {isEditingName ? 'Manual override active' : 'Auto-generated by system'}
            </div>
          </div>

          {/* File Upload Zone */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '10px',
              fontFamily: "'Inter', sans-serif"
            }}>
              <Icon.Receipt size={14} />
              Receipt Images
            </label>
            <div style={{
              position: 'relative',
              borderRadius: '12px',
              border: '2px dashed var(--border-strong)',
              background: 'var(--bg-tertiary)',
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.background = 'rgba(251, 146, 60, 0.12)';
              e.currentTarget.style.transform = 'scale(1.01)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-strong)';
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={(e) => setFileCount(e.target.files?.length || 0)}
                style={{ display: 'none' }}
              />
              
              {fileCount > 0 ? (
                <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    margin: '0 auto 12px',
                    borderRadius: '14px',
                    background: 'rgba(22, 163, 74, 0.1)',
                    border: '1px solid rgba(22, 163, 74, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#16a34a',
                    marginBottom: '6px',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    {fileCount}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#16a34a',
                    marginBottom: '4px',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {fileCount === 1 ? 'File Selected' : 'Files Selected'}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Click to change selection
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    margin: '0 auto 12px',
                    borderRadius: '14px',
                    background: 'var(--bg-glass-hover)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Drop files here
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    marginBottom: '12px',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    or click to browse from your computer
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(249, 115, 22, 0.08)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--accent-primary)',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    JPG, PNG, PDF supported
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Create Button */}
          <button 
            type="submit" 
            disabled={isCreating || fileCount === 0}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: '12px',
              border: 'none',
              background: fileCount === 0 ? 'rgba(100, 116, 139, 0.1)' : 'var(--gradient-primary)',
              color: fileCount === 0 ? '#94a3b8' : '#fff',
              fontSize: '12px',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              cursor: fileCount === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontFamily: "'Inter', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: fileCount === 0 ? 'none' : 'var(--shadow-lg)',
              opacity: fileCount === 0 ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (fileCount > 0 && !isCreating) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
              }
            }}
            onMouseLeave={(e) => {
              if (fileCount > 0 && !isCreating) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }
            }}
          >
            {isCreating ? (
              <>
                <div className="spinner-modern" />
                Creating Batch...
              </>
            ) : (
              <>
                <Icon.Plus size={16} />
                Create Batch
              </>
            )}
          </button>
        </form>
      </div>

      {/* Batches Grid */}
      <div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '1.5rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between'
          }}>
            <div>
              <div className="section-label">Recent Batches</div>
              <div style={{ 
                fontSize: '10px', 
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: '4px'
              }}>
                {filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''} • Sorted by {sortBy}
              </div>
            </div>
          </div>
          
          {/* Search & Sort Controls */}
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            alignItems: 'center'
          }}>
            {/* Search Input */}
            <div style={{ flex: 1, position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                opacity: 0.6
              }}>
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search by name, ID or batch number..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            
            {/* Sort Select */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)} 
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                fontSize: '11px',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                minWidth: '160px',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.boxShadow = '0 0 0 4px rgba(249, 115, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="date-desc">Date: Newest First</option>
              <option value="date-asc">Date: Oldest First</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
              <option value="items-desc">Items: Most First</option>
              <option value="items-asc">Items: Fewest First</option>
            </select>
          </div>
        </div>
        
        {filteredBatches.length === 0 ? (
          <div className="glass-card empty-box">
            <div className="empty-icon-lg">📂</div>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{searchQuery ? 'No matching batches' : 'No batches yet'}</div>
            <div style={{ opacity: 0.7 }}>
              {searchQuery ? 'Try a different search term' : 'Create your first batch above to begin processing'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredBatches.map((batch, i) => (
              <BatchCard
                key={batch.id}
                batch={batch}
                onClick={() => navigate(`/batch/${batch.id}`)}
                onDelete={(e) => handleDeleteBatch(e, batch.id)}
                onUpdateName={handleUpdateBatchName}
                onViewSummary={(e) => {
                  e.stopPropagation();
                  setSummaryBatch(batch);
                }}
                delay={i * 0.03}
              />
            ))}
          </div>
        )}

        {/* Billing Summary Modal */}
        {summaryBatch && (() => {
          const sd = summaryBatch.summary_data || {};
          const bd = summaryBatch.billing_data || {};

          // Build verified receipts list from actual receipt data
          const verifiedReceipts = summaryBatch.verified_claims || [];

          // Fallback: reconstruct financials from receipts if summary_data wasn't saved
          const grossFallback = verifiedReceipts.reduce((s, r) => s + r.amount, 0);
          const feeFallback = Math.floor(grossFallback / 1000) * 10;
          const netFallback = grossFallback - feeFallback;

          const grossAmount   = sd.gross_amount   ?? grossFallback;
          const serviceFee    = sd.service_fee    ?? feeFallback;
          const netAmount     = sd.net_amount     ?? netFallback;
          const deductions    = sd.deductions     || [];

          const billingMethod      = bd.method              || 'both';
          const cashDenoms         = bd.cash_denominations  || {};
          const bankAmt            = bd.bank_transfer_amount || 0;
          const bankAmts           = Array.isArray(bd.bank_transfer_amount) ? bd.bank_transfer_amount : (bd.bank_transfer_amount ? [bd.bank_transfer_amount] : []);
          const totalPrepared      = bd.total_prepared       || netAmount;

          return (
            <BillingSummaryModal
              onClose={() => setSummaryBatch(null)}
              batchNumber={summaryBatch.batch_number}
              finalBatchNumber={summaryBatch.final_batch_number}
              grossAmount={grossAmount}
              serviceFee={serviceFee}
              deductions={deductions}
              netAmount={netAmount}
              billingMethod={billingMethod}
              cashDenominations={cashDenoms}
              bankTransferAmount={Array.isArray(bankAmt) ? bankAmts.reduce((s,v)=>s+Number(v||0),0) : bankAmt}
              bankTransferAmounts={bankAmts}
              totalPrepared={totalPrepared}
              verifiedClaims={verifiedReceipts}
            />
          );
        })()}
      </div>
    </div>
  );
}

function BatchCard({ batch, onClick, onDelete, onUpdateName, onViewSummary, delay = 0 }) {
  const total = batch.stats?.total ?? batch.receipts?.length ?? 0;
  const verified = batch.stats?.ocr_finished ?? 0;
  const progress = batch.progress ?? 0;
  
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(batch.name || '');

  const getStatus = () => {
    if (batch.checker_status === 'billing_ready') return { label: 'Ready', color: '#15803d', bg: 'rgba(21, 128, 61, 0.08)', border: 'rgba(21, 128, 61, 0.2)' };
    if (batch.checker_status === 'summarized' || batch.checker_status === 'finalized') return { label: 'Review', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.08)', border: 'rgba(234, 88, 12, 0.2)' };
    if (batch.receipts?.some(r => r.ocr_status === 'uploading')) return { label: 'Uploading', color: 'var(--accent-primary)', bg: 'rgba(251, 146, 60, 0.08)', border: 'rgba(251, 146, 60, 0.2)' };
    if (total > 0) return { label: 'Active', color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.2)' };
    return { label: 'Draft', color: '#9a3412', bg: 'rgba(154, 52, 18, 0.08)', border: 'rgba(154, 52, 18, 0.2)' };
  };
  
  const status = getStatus();
  const netAmount = batch.summary_data?.net_amount || null;
  const hasNetAmount = netAmount !== null && netAmount !== undefined;
  
  const createdDate = new Date(batch.created_at);
  const formattedDate = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div 
      className="glass-card"
      style={{ 
        animationDelay: `${delay}s`,
        padding: '12px 16px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        border: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--accent-primary)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {/* Batch Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '220px', flexShrink: 0 }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: `linear-gradient(135deg, ${status.color}15 0%, ${status.color}05 100%)`,
          border: `1px solid ${status.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon.Folder size={14} style={{ color: status.color }} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => {
                setIsEditing(false);
                if (editName !== batch.name) {
                  onUpdateName(batch.id, editName);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditing(false);
                  if (editName !== batch.name) {
                    onUpdateName(batch.id, editName);
                  }
                }
                if (e.key === 'Escape') {
                  setEditName(batch.name);
                  setIsEditing(false);
                }
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: 'var(--accent-primary)',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--accent-primary)',
                width: '100%',
                outline: 'none',
                padding: '0'
              }}
            />
          ) : (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              style={{ 
                fontSize: '14px', 
                color: 'var(--text-primary)',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                marginBottom: '1px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {batch.name || 'Unnamed Batch'}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
          )}
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Icon.Calendar size={10} />
            {formattedDate} • {batch.final_batch_number ? `ID: ${batch.final_batch_number}` : 'Draft'}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <div style={{ width: '45px' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted-alt)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Items</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{total}</div>
          </div>
          <div style={{ width: '55px' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted-alt)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Verified</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#15803d', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{verified}</div>
          </div>
          {hasNetAmount && (
            <div style={{ width: '100px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-muted-alt)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Net Total</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                ₱{fmt(netAmount)}
              </div>
            </div>
          )}
        </div>

        {/* Progress Mini */}
        <div style={{ flex: 1, maxWidth: '160px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '9px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px' }}>
            <span style={{ letterSpacing: '0.05em' }}>PROGRESS</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{progress}%</span>
          </div>
          <div style={{ height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: status.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '130px', justifyContent: 'flex-end', flexShrink: 0 }}>
        {batch.checker_status === 'billing_ready' && (
          <button 
            onClick={onViewSummary}
            style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '6px',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              color: 'var(--success-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            title="View Summary"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.08)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </button>
        )}
        
        <div style={{
          padding: '4px 0',
          width: '60px',
          textAlign: 'center',
          borderRadius: '6px',
          background: status.bg,
          border: `1px solid ${status.border}`,
          color: status.color,
          fontSize: '9px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {status.label}
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '6px',
            background: 'transparent',
            border: '1px solid transparent',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(185, 28, 28, 0.08)';
            e.currentTarget.style.color = 'var(--danger-primary)';
            e.currentTarget.style.borderColor = 'rgba(185, 28, 28, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <Icon.Trash size={14} />
        </button>
      </div>
    </div>
  );
}
