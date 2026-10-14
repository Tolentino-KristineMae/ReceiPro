import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ClipboardCheck,
  Settings,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import profLogo from '../../newprof.png';

const NAV = [
  { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'batch', path: '/batch', label: 'Batch Checker', icon: ClipboardCheck },
  { id: 'settings', path: '/settings', label: 'Settings', icon: Settings },
];

const BRAND = '#4f46e5';
const BRAND_LIGHT = '#eef2ff';
const SURFACE = '#ffffff';
const SURFACE_HOVER = '#f8fafc';
const BORDER = '#e2e8f0';
const TEXT = '#0f172a';
const TEXT_2 = '#334155';
const TEXT_3 = '#64748b';
const TEXT_4 = '#94a3b8';

export default function Sidebar({ onMobileToggle, isMobileMenuOpen }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const showLabels = (!isMobile && !collapsed) || (isMobile && isMobileMenuOpen);

  const handleNavClick = () => {
    if (isMobile) onMobileToggle?.();
  };

  return (
    <>
      {isMobile && (
        <button
          onClick={onMobileToggle}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          style={{
            position: 'fixed',
            top: '14px',
            left: '14px',
            zIndex: 1000,
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: TEXT_2,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = SURFACE_HOVER; e.currentTarget.style.color = TEXT; }}
          onMouseLeave={e => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.color = TEXT_2; }}
        >
          {isMobileMenuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
        </button>
      )}

      {isMobile && isMobileMenuOpen && (
        <div
          onClick={onMobileToggle}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 49,
            animation: 'sbOverlay 0.2s ease both',
          }}
        />
      )}

      <aside
        style={{
          width: isMobile ? (isMobileMenuOpen ? '260px' : '0') : (collapsed ? '72px' : '248px'),
          minWidth: isMobile ? '0' : (collapsed ? '72px' : '248px'),
          height: '100vh',
          background: SURFACE,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile ? (isMobileMenuOpen ? 0 : '-260px') : 0,
          top: 0,
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          borderRight: `1px solid ${BORDER}`,
          boxShadow: isMobile ? '0 0 0 1px rgba(0,0,0,0.04), 12px 0 30px rgba(0,0,0,0.08)' : 'none',
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div style={{
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0 18px' : (collapsed ? '0' : '0 20px'),
          borderBottom: `1px solid ${BORDER}`,
          gap: '12px',
          flexShrink: 0,
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          position: 'relative',
        }}>
          <img
            src={profLogo}
            alt="ReceiPro"
            style={{
              width: collapsed && !isMobile ? '42px' : '150px',
              height: collapsed && !isMobile ? '42px' : '46px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />

          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                position: 'absolute',
                top: '50%',
                right: collapsed ? '50%' : '10px',
                transform: collapsed ? 'translate(50%, -50%)' : 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: TEXT_4,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = SURFACE_HOVER; e.currentTarget.style.color = TEXT_2; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TEXT_4; }}
            >
              {collapsed ? <PanelLeftOpen size={16} strokeWidth={2} /> : <PanelLeftClose size={16} strokeWidth={2} />}
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{
          flex: 1,
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          {showLabels && (
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: TEXT_4,
              padding: '6px 12px 10px',
            }}>
              Menu
            </div>
          )}

          {NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={handleNavClick}
                title={collapsed && !isMobile ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isMobile ? '11px 14px' : (collapsed ? '11px 0' : '10px 14px'),
                  borderRadius: '10px',
                  textDecoration: 'none',
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                  background: active ? BRAND_LIGHT : 'transparent',
                  color: active ? BRAND : TEXT_3,
                  fontWeight: active ? 600 : 500,
                  fontSize: '13.5px',
                  letterSpacing: '-0.01em',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  position: 'relative',
                  outline: 'none',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = SURFACE_HOVER;
                    e.currentTarget.style.color = TEXT;
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = TEXT_3;
                  }
                }}
                onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px rgba(99,102,241,0.25)`; }}
                onBlur={e => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                {active && (
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '18px',
                    background: BRAND,
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}

                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: active ? BRAND : 'inherit',
                }}>
                  <Icon size={18} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </span>

                {showLabels && (
                  <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile footer */}
        <div style={{
          padding: isMobile ? '14px' : (collapsed ? '14px 12px' : '14px'),
          borderTop: `1px solid ${BORDER}`,
          flexShrink: 0,
        }}>
          {showLabels ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              padding: '10px',
              borderRadius: '12px',
              background: SURFACE_HOVER,
              border: `1px solid ${BORDER}`,
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${BRAND} 0%, #6366f1 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: '#ffffff',
                flexShrink: 0,
                position: 'relative',
                boxShadow: '0 1px 3px rgba(79,70,229,0.3)',
              }}>
                RC
                <span style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '9px',
                  height: '9px',
                  background: '#22c55e',
                  borderRadius: '50%',
                  border: `2px solid ${SURFACE_HOVER}`,
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: TEXT,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.3',
                }}>
                  Admin User
                </div>
                <div style={{
                  fontSize: '11px',
                  color: TEXT_3,
                  whiteSpace: 'nowrap',
                  marginTop: '1px',
                }}>
                  Administrator
                </div>
              </div>
            </div>
          ) : (
            !isMobile && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${BRAND} 0%, #6366f1 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  boxShadow: '0 1px 3px rgba(79,70,229,0.3)',
                }}>
                  RC
                </div>
              </div>
            )
          )}
        </div>
      </aside>

      <style>{`
        @keyframes sbOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
