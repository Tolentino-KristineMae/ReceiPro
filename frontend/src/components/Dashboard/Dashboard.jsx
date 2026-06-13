import React from 'react';

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

function DashboardStats({ receipts }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthReceipts = receipts.filter(r => {
    const date = new Date(r.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const total = currentMonthReceipts.length;
  const claimed = currentMonthReceipts.filter(r => r.match_status === 'verified' || r.match_status === 'matched').length;
  const unclaimed = total - claimed;
  
  const totalAmount = currentMonthReceipts.reduce((s, r) => s + (parseFloat(r.ocr_data?.amount) || 0), 0);
  const serviceFee = totalAmount * 0.02;
  const cashOutFee = totalAmount * 0.015;

  const stats = [
    {
      key: 'total_uploaded',
      label: 'Total Receipts',
      value: total,
      sub: 'This month',
      tag: 'Monthly',
      icon: Icon.Receipt,
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      bg: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.05) 100%)'
    },
    {
      key: 'total_claimed',
      label: 'Total Claimed',
      value: claimed,
      sub: 'Verified & matched',
      tag: 'Confirmed',
      icon: Icon.CheckCircle,
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(52,211,153,0.05) 100%)'
    },
    {
      key: 'total_unclaimed',
      label: 'Total Unclaimed',
      value: unclaimed,
      sub: 'Awaiting verification',
      tag: 'Pending',
      icon: Icon.Clock,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      bg: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(251,191,36,0.05) 100%)'
    },
    {
      key: 'total_service_fee',
      label: 'Service Fees',
      value: `₱${serviceFee.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: '2% of total',
      tag: 'Service',
      icon: Icon.Wallet,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      bg: 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(96,165,250,0.05) 100%)'
    },
    {
      key: 'total_cashout_fee',
      label: 'Cashout Fees',
      value: `₱${cashOutFee.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: '1.5% of total',
      tag: 'Cash Out',
      icon: Icon.Download,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
      bg: 'linear-gradient(135deg, rgba(236,72,153,0.05) 0%, rgba(244,114,182,0.05) 100%)'
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
    return 'repeat(5, 1fr)';
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
          style={{ 
            background: stat.bg,
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            borderRadius: '16px',
            padding: '1.25rem 1rem',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            cursor: 'pointer',
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)';
          }}
        >
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
        </div>
      ))}
    </div>
  );
}

function RecentActivity({ receipts, onSelectReceipt, onNavigate }) {
  const recentReceipts = [...receipts]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const statusColor = {
    completed: { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', label: 'Completed' },
    processing: { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', label: 'Processing' },
    pending: { bg: 'rgba(148, 163, 184, 0.1)', color: '#64748b', label: 'Pending' },
    failed: { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', label: 'Failed' },
  };

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 640);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem 1rem' : '1.5rem',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)',
      border: '1px solid rgba(248, 250, 252, 1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2 style={{
          fontSize: '1rem',
          fontWeight: '700',
          color: '#0f172a',
          fontFamily: 'Inter, sans-serif'
        }}>
          Recent Activity
        </h2>
        <button 
          onClick={() => onNavigate('/transactions')}
          style={{
            fontSize: '0.8125rem',
            fontWeight: '600',
            color: '#6366f1',
            background: 'transparent',
            padding: '0.375rem 0.75rem',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          View All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {recentReceipts.length > 0 ? recentReceipts.map(receipt => {
          const amount = receipt.ocr_data?.amount
            ? `₱${Number(receipt.ocr_data.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
            : '₱0.00';
          const date = new Date(receipt.created_at).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const status = statusColor[receipt.ocr_status] || statusColor.pending;

          return (
            <div
              key={receipt.id}
              onClick={() => onSelectReceipt(receipt)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 0.875rem',
                borderRadius: '12px',
                background: 'transparent',
                border: '1px solid transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)';
                e.currentTarget.style.background = 'rgba(99,102,241,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0
              }}>
                <Icon.Receipt size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#0f172a',
                  fontFamily: 'Inter, sans-serif',
                  marginBottom: '0.125rem'
                }}>
                  Receipt #{receipt.id}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  fontFamily: 'JetBrains Mono, monospace'
                }}>
                  {date} • {amount}
                </div>
              </div>
              <div style={{
                fontSize: '0.6875rem',
                fontWeight: '700',
                padding: '0.25rem 0.5rem',
                borderRadius: '9999px',
                background: status.bg,
                color: status.color,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'JetBrains Mono, monospace',
                flexShrink: 0
              }}>
                {status.label}
              </div>
            </div>
          );
        }) : (
          <div style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.875rem'
          }}>
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActions({ onNavigate }) {
  const actions = [
    { 
      label: 'Upload Receipts', 
      icon: Icon.Plus, 
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      path: '/batch'
    },
    { 
      label: 'View Transactions', 
      icon: Icon.Receipt, 
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      path: '/transactions'
    },
    { 
      label: 'Check Batches', 
      icon: Icon.Inbox, 
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      path: '/batch'
    },
    { 
      label: 'Export Data', 
      icon: Icon.Download, 
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      path: '/transactions'
    },
  ];

  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 640);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: isMobile ? '1.25rem 1rem' : '1.5rem',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)',
      border: '1px solid rgba(248, 250, 252, 1)'
    }}>
      <h2 style={{
        fontSize: '1rem',
        fontWeight: '700',
        color: '#0f172a',
        fontFamily: 'Inter, sans-serif',
        marginBottom: '1rem'
      }}>
        Quick Actions
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '0.75rem'
      }}>
        {actions.map((action, index) => (
          <button 
            key={index} 
            onClick={() => onNavigate(action.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              padding: '0.875rem 1rem',
              borderRadius: '14px',
              background: 'transparent',
              border: '1px solid rgba(226, 232, 240, 1)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: action.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0
            }}>
              <action.icon size={18} />
            </div>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#0f172a'
            }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({
  receipts = [],
  onSelectReceipt,
  onNavigate,
}) {
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

  return (
    <div style={{
      minHeight: '100vh',
      padding: isMobile ? '0.5rem 0 2rem' : '0 0 2rem',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
    }}>
      <DashboardStats receipts={receipts} />
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '1fr' : '2fr 1.5fr'), 
        gap: '1rem', 
        marginTop: '1rem' 
      }}>
        <QuickActions onNavigate={onNavigate} />
        <RecentActivity receipts={receipts} onSelectReceipt={onSelectReceipt} onNavigate={onNavigate} />
      </div>
    </div>
  );
}