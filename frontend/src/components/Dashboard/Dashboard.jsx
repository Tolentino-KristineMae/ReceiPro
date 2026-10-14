import React from 'react';
import unclaimedCardImg from '../../totalunclaimedcard-removebg-preview.png';
import claimedCardImg from '../../totalclaimedcard-removebg-preview.png';
const Icon = {
  Receipt: ({ size = 18, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <path d="M15 9a2 2 0 0 1 1 3.75 4 4 0 0 0 0 6.5" />
    </svg>
  ),
  Clock: ({ size = 18, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  CheckCircle: ({ size = 18, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  ),
  Wallet: ({ size = 18, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  Download: ({ size = 14, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Plus: ({ size = 14, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Inbox: ({ size = 20, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 8 15 3 9 3 9 8 6 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89a2 2 0 0 0-1.95-1.11H5.45z" />
    </svg>
  ),
};

function DashboardStats({ receipts, onNavigate }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthReceipts = receipts.filter(r => {
    const date = new Date(r.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const claimed = currentMonthReceipts.filter(r => r.match_status === 'verified' || r.match_status === 'matched').length;
  const unclaimed = currentMonthReceipts.length - claimed;

  const stats = [
    {
      key: 'total_claimed',
      label: 'Total Claimed',
      value: claimed,
      sub: 'Verified & matched',
      tag: 'Confirmed',
      icon: Icon.CheckCircle,
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(52,211,153,0.05) 100%)',
      image: claimedCardImg
    },
    {
      key: 'total_unclaimed',
      label: 'Total Unclaimed',
      value: unclaimed,
      sub: 'Awaiting verification',
      tag: 'Pending',
      icon: Icon.Clock,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      bg: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(251,191,36,0.05) 100%)',
      image: unclaimedCardImg
    },
  ];

  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);
  React.useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 1024);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const getGridColumns = () => {
    if (isMobile) return '1fr';
    if (isTablet) return 'repeat(2, 1fr)';
    return 'repeat(3, 1fr)';
  };

  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: getGridColumns(),
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {stats.map(stat => (
        <div
          key={stat.key}
          onClick={() => {
            if (stat.key === 'total_uploaded') onNavigate?.('/transactions');
            else if (stat.key === 'total_claimed') onNavigate?.('/transactions');
            else if (stat.key === 'total_unclaimed') onNavigate?.('/batch');
          }}
          style={{ 
            background: 'transparent',
            border: 'none',
            borderRadius: '0',
            padding: '0',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            cursor: 'pointer',
            boxShadow: 'none',
            minHeight: stat.image ? '240px' : 'auto',
            display: stat.image ? 'flex' : 'block',
            alignItems: stat.image ? 'stretch' : 'flex-start',
          }}
          onMouseEnter={(e) => {
            if (stat.image) {
              e.currentTarget.style.transform = 'scale(1.03)';
            } else {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = stat.image ? 'scale(1)' : 'translateY(0)';
            e.currentTarget.style.boxShadow = stat.image ? 'none' : '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)';
            e.currentTarget.style.borderColor = stat.image ? 'none' : 'rgba(255, 255, 255, 0.7)';
          }}
        >
          {stat.image ? (
            <>
              <img
                src={stat.image}
                alt={stat.label}
                style={{
                  width: '100%',
                  height: '100%',
                  flex: 1,
                  objectFit: 'fill',
                  display: 'block',
                }}
              />
            </>
          ) : (
            <>
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: stat.gradient,
                opacity: 0.06,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <stat.icon size={56} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: stat.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <stat.icon size={20} />
                </div>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '9999px',
                  background: 'white',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  fontFamily: 'JetBrains Mono, monospace',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  {stat.tag}
                </div>
              </div>
              
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#94a3b8',
                marginBottom: '0.35rem',
                position: 'relative',
                zIndex: 1
              }}>
                {stat.label}
              </div>
              
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: isMobile ? '1.75rem' : '2rem',
                fontWeight: '800',
                letterSpacing: '-0.03em',
                lineHeight: '1.1',
                color: '#1e293b',
                marginBottom: '0.35rem',
                position: 'relative',
                zIndex: 1
              }}>
                {stat.value}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                fontWeight: '500',
                letterSpacing: '0.025em',
                position: 'relative',
                zIndex: 1
              }}>
                {stat.sub}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function RecentBatches({ batches, onNavigate }) {
  const [selectedBatch, setSelectedBatch] = React.useState(null);
  const [showSummaryModal, setShowSummaryModal] = React.useState(false);
  
  const recentBatches = [...batches]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const statusColor = {
    open: { bg: 'rgba(161, 98, 7, 0.1)', color: '#92400e', label: 'Open' },
    claiming: { bg: 'rgba(234, 179, 8, 0.1)', color: '#a16207', label: 'Claiming' },
    verified: { bg: 'rgba(5, 150, 105, 0.1)', color: '#047857', label: 'Verified' },
    finalized: { bg: 'rgba(120, 113, 108, 0.1)', color: '#57534e', label: 'Finalized' },
    summarized: { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', label: 'Summarized' },
    billing_ready: { bg: 'rgba(34, 197, 94, 0.1)', color: '#15803d', label: 'Billing Ready' },
  };

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 640);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const getGridColumns = () => {
    if (isMobile) return '1fr';
    return 'repeat(auto-fill, minmax(280px, 1fr))';
  };

  const handleViewSummary = (batch) => {
    setSelectedBatch(batch);
    setShowSummaryModal(true);
  };

  const getBatchDisplayNumber = (batch) => {
    // Extract number from final_batch_number (e.g., "B-052" -> "52")
    if (batch.final_batch_number) {
      const match = batch.final_batch_number.match(/\d+/);
      return match ? match[0] : batch.id;
    }
    // Extract number from name (e.g., "Batch #052" -> "52")
    if (batch.name) {
      const match = batch.name.match(/\d+/);
      return match ? match[0] : batch.id;
    }
    return batch.id;
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          color: '#0f172a',
          fontFamily: 'Inter, sans-serif'
        }}>
          Recent Batches
        </h2>
        <button 
          onClick={() => onNavigate('/batch')}
          style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#ea580c',
            background: 'transparent',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(234, 88, 12, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          View All
        </button>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: getGridColumns(),
        gap: '1.25rem'
      }}>
        {recentBatches.length > 0 ? recentBatches.map(batch => {
          const status = statusColor[batch.checker_status] || statusColor.open;
          const receiptCount = batch.stats?.total || batch.receipts?.length || 0;
          const verifiedCount = batch.stats?.verified || 0;
          const batchNumber = batch.final_batch_number || batch.name || `Batch #${batch.id}`;
          const displayNumber = getBatchDisplayNumber(batch);
          
          const date = new Date(batch.created_at).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <div
              key={batch.id}
              style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
                borderRadius: '20px',
                padding: '1.75rem',
                boxShadow: '0 4px 6px -1px rgba(120,53,15,0.1), 0 2px 4px -2px rgba(120,53,15,0.05)',
                border: '1px solid rgba(217, 119, 6, 0.2)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(120,53,15,0.15), 0 8px 16px -8px rgba(120,53,15,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(120,53,15,0.1), 0 2px 4px -2px rgba(120,53,15,0.05)';
              }}
            >
              {/* View Summary Icon - Top Right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewSummary(batch);
                }}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255,251,235,0.9)',
                  border: '1px solid rgba(217,119,6,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#92400e'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ea580c';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = '#ea580c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,251,235,0.9)';
                  e.currentTarget.style.color = '#92400e';
                  e.currentTarget.style.borderColor = 'rgba(217,119,6,0.3)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>

              {/* Batch Number Circle */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 8px 16px rgba(234,88,12,0.3)',
                border: '4px solid rgba(255,251,235,0.95)'
              }}>
                <span style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: 'white',
                  fontFamily: 'JetBrains Mono, monospace'
                }}>
                  {displayNumber}
                </span>
              </div>

              {/* Batch Number */}
              <div style={{
                fontSize: '1.125rem',
                fontWeight: '700',
                color: '#0f172a',
                textAlign: 'center',
                marginBottom: '0.375rem',
                fontFamily: 'Inter, sans-serif'
              }}>
                {batchNumber}
              </div>

              {/* Date */}
              <div style={{
                fontSize: '0.8125rem',
                color: '#94a3b8',
                textAlign: 'center',
                marginBottom: '1.25rem',
                fontFamily: 'Inter, sans-serif'
              }}>
                {date}
              </div>

              {/* Stats Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '1.25rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid rgba(226,232,240,0.6)'
              }}>
                {/* Status */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.375rem',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Status
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    background: status.bg,
                    color: status.color,
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    {status.label}
                  </div>
                </div>

                {/* Receipts */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.375rem',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Receipts
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    color: '#0f172a',
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '-0.02em'
                  }}>
                    {receiptCount}
                  </div>
                </div>

                {/* Verified */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '0.6875rem',
                    fontWeight: '600',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.375rem',
                    fontFamily: 'Inter, sans-serif'
                  }}>
                    Verified
                  </div>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    color: '#15803d',
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '-0.02em'
                  }}>
                    {verifiedCount}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '0.75rem',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => onNavigate(`/batch/${batch.id}`)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.25rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 4px 12px rgba(234,88,12,0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(234,88,12,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(234,88,12,0.3)';
                  }}
                >
                  View Batch
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add bookmark functionality here
                  }}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: '#fffbeb',
                    border: '1px solid rgba(217,119,6,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: '#92400e'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fef3c7';
                    e.currentTarget.style.color = '#92400e';
                    e.currentTarget.style.borderColor = '#d97706';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fffbeb';
                    e.currentTarget.style.color = '#92400e';
                    e.currentTarget.style.borderColor = 'rgba(217,119,6,0.3)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        }) : (
          <div style={{
            gridColumn: '1 / -1',
            padding: '3rem 1rem',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '0.9375rem',
            fontFamily: 'Inter, sans-serif'
          }}>
            No recent batches
          </div>
        )}
      </div>

      {/* Batch Summary Modal */}
      {showSummaryModal && selectedBatch && (
        <BatchSummaryModal 
          batch={selectedBatch} 
          onClose={() => {
            setShowSummaryModal(false);
            setSelectedBatch(null);
          }} 
        />
      )}
    </div>
  );
}

function BatchSummaryModal({ batch, onClose }) {
  const summaryRef = React.useRef(null);
  const receiptCount = batch.stats?.total || 0;
  const verifiedCount = batch.stats?.verified || 0;
  const summaryData = batch.summary_data || {};
  const verifiedClaims = batch.verified_claims || [];

  const copySummary = () => {
    const text = summaryRef.current?.innerText || '';
    navigator.clipboard.writeText(text).then(() => {
      alert('Summary copied to clipboard!');
    });
  };

  const downloadSummary = () => {
    const text = summaryRef.current?.innerText || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.final_batch_number || batch.name || `Batch-${batch.id}`}-summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15,10,5,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#0f172a',
              fontFamily: 'Inter, sans-serif',
              marginBottom: '0.25rem'
            }}>
              Batch Summary
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: '#64748b',
              fontFamily: 'Inter, sans-serif'
            }}>
              {batch.final_batch_number || batch.name || `Batch #${batch.id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.borderColor = '#fca5a5';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '1.5rem',
          overflowY: 'auto',
          flex: 1
        }}>
          <div ref={summaryRef} style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: '1.6', color: '#1e293b' }}>
            <div><strong>Batch Number:</strong> {batch.final_batch_number || batch.name || `Batch #${batch.id}`}</div>
            <div><strong>Created:</strong> {new Date(batch.created_at).toLocaleString('en-PH')}</div>
            <div><strong>Status:</strong> {batch.checker_status}</div>
            <br />
            <div><strong>═══ Statistics ═══</strong></div>
            <div>Total Receipts: {receiptCount}</div>
            <div>Verified: {verifiedCount}</div>
            <div>Pending: {receiptCount - verifiedCount}</div>
            <br />
            {summaryData.gross_amount && (
              <>
                <div><strong>═══ Financial Summary ═══</strong></div>
                <div>Gross Amount: ₱{Number(summaryData.gross_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                <div>Service Fee: ₱{Number(summaryData.service_fee || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                <div>Net Amount: ₱{Number(summaryData.net_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                <br />
              </>
            )}
            {verifiedClaims.length > 0 && (
              <>
                <div><strong>═══ Verified Claims ({verifiedClaims.length}) ═══</strong></div>
                {verifiedClaims.map((claim, idx) => (
                  <div key={idx}>
                    {idx + 1}. {claim.account_holder || 'N/A'} - ₱{Number(claim.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })} ({claim.reference || 'N/A'})
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={copySummary}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: '#fef3c7',
              border: '1px solid rgba(217,119,6,0.3)',
              color: '#78350f',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fde68a';
              e.currentTarget.style.borderColor = '#d97706';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fef3c7';
              e.currentTarget.style.borderColor = 'rgba(217,119,6,0.3)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </button>
          <button
            onClick={downloadSummary}
            style={{
              flex: 1,
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              border: 'none',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 12px rgba(234,88,12,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(234,88,12,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(234,88,12,0.3)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Dashboard({
  receipts = [],
  batches = [],
  onSelectReceipt,
  onNavigate,
}) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      padding: isMobile ? '0.5rem 0 2rem' : '0 0 2rem',
      background: '#ffffff'
    }}>
      <DashboardStats receipts={receipts} batches={batches} onNavigate={onNavigate} />
      <div style={{ marginTop: '1rem' }}>
        <RecentBatches batches={batches} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
