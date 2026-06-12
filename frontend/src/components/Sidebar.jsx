import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV = [
  {
    id: 'dashboard',
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'transactions',
    path: '/transactions',
    label: 'Transactions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'batch',
    path: '/batch',
    label: 'Batch Checker',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
];

// Orange brand colours
const ORANGE = '#f97316';
const ORANGE_DARK = '#ea580c';
const ACTIVE_BG = 'rgba(255,255,255,0.18)';
const ACTIVE_BORDER = 'rgba(255,255,255,0.28)';
const HOVER_BG = 'rgba(255,255,255,0.10)';
const DIVIDER = 'rgba(255,255,255,0.12)';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '220px',
        minWidth: collapsed ? '64px' : '220px',
        height: '100vh',
        background: `linear-gradient(160deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        borderRight: '1px solid rgba(0,0,0,0.08)',
        zIndex: 40,
      }}
    >
      {/* ── Logo ── */}
      <div style={{
        height: '62px',
        display: 'flex',
        alignItems: 'center',
        padding: collapsed ? '0 16px' : '0 20px 0 20px',
        borderBottom: `1px solid ${DIVIDER}`,
        gap: '10px',
        flexShrink: 0,
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '9px',
          background: 'rgba(255,255,255,0.22)',
          border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
            <path d="M16 8H8M16 12H8M13 16H8" />
          </svg>
        </div>
        {!collapsed && (
          <span style={{
            fontSize: '15px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap',
          }}>
            ReciePro
          </span>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{
        flex: 1,
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {!collapsed && (
          <div style={{
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
            padding: '8px 10px 8px',
          }}>
            Menu
          </div>
        )}

        {NAV.map((item) => {
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.id}
              to={item.path}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '10px 0' : '9px 10px',
                borderRadius: '10px',
                textDecoration: 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? ACTIVE_BG : 'transparent',
                border: `1px solid ${active ? ACTIVE_BORDER : 'transparent'}`,
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = HOVER_BG;
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              {/* Active left indicator */}
              {active && (
                <span style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '18px',
                  background: '#ffffff',
                  borderRadius: '0 3px 3px 0',
                  opacity: 0.9,
                }} />
              )}

              {/* Icon */}
              <span style={{
                color: active ? '#ffffff' : 'rgba(255,255,255,0.65)',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                transition: 'color 0.15s',
              }}>
                {item.icon}
              </span>

              {/* Label */}
              {!collapsed && (
                <span style={{
                  fontSize: '13px',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#ffffff' : 'rgba(255,255,255,0.70)',
                  letterSpacing: '-0.01em',
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                }}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Profile footer ── */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px',
        borderTop: `1px solid ${DIVIDER}`,
        flexShrink: 0,
      }}>
        {!collapsed ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.18)',
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: 'white',
              flexShrink: 0,
              position: 'relative',
            }}>
              RC
              <span style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                background: '#22c55e',
                borderRadius: '50%',
                border: `2px solid ${ORANGE_DARK}`,
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                Admin User
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.55)',
                whiteSpace: 'nowrap',
              }}>
                Administrator
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 800,
              color: 'white',
            }}>
              RC
            </div>
          </div>
        )}
      </div>

      {/* ── Toggle button ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'absolute',
          top: '18px',
          right: '10px',
          width: '26px',
          height: '26px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.20)',
          border: '1px solid rgba(255,255,255,0.30)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#ffffff',
          zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.32)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.50)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.20)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.30)';
        }}
      >
        <svg
          width="14" height="14"
          viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s ease' }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </aside>
  );
}
