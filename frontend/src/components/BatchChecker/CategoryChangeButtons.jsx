import React from 'react';

export default function CategoryChangeButtons({
  currentCategory,
  onChangeToGCash,
  onChangeToOthers,
  disabled = false
}) {
  if (!currentCategory || currentCategory === 'unsorted') return null;

  const isGCash = currentCategory === 'gcash';
  const isOthers = currentCategory === 'others';

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '16px',
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      marginBottom: '16px'
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#64748b',
        textTransform: 'none',
        letterSpacing: '0'
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </svg>
        Wrong Category?
      </div>

      {isGCash && (
        <button
          onClick={onChangeToOthers}
          disabled={disabled}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'var(--workspace-accent)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#815318',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: '0',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Change to Others
        </button>
      )}

      {isOthers && (
        <button
          onClick={onChangeToGCash}
          disabled={disabled}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            background: 'var(--workspace-accent)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#44636c',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: '0',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Change to GCash
        </button>
      )}
    </div>
  );
}
