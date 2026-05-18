import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV = [
  {
    id: 'dashboard',
    path: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    children: ['Activity', 'Traffic', 'Statistics'],
  },
  {
    id: 'transactions',
    path: '/transactions',
    label: 'Transactions',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    id: 'batch',
    path: '/batch',
    label: 'Batch Checker',
    icon: (
      <svg className="w-[17px] h-[17px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
];

const styles = {
  sidebar: {
    width: '200px',
    minWidth: '200px',
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    flexShrink: 0,
    overflow: 'visible', // Changed from hidden to allow toggle button to peek out if needed, but we'll try to keep it inside or well-positioned
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Inter', sans-serif",
    borderRight: '1px solid rgba(255,255,255,0.05)',
    position: 'relative',
  },
  sidebarCollapsed: {
    width: '70px',
    minWidth: '70px',
  },
  toggleBtn: {
    position: 'absolute',
    right: '-12px',
    top: '32px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
    color: '#fff',
    transition: 'all 0.2s',
    zIndex: 100,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '32px 20px 16px',
    position: 'relative',
  },
  profileCollapsed: {
    justifyContent: 'center',
    padding: '16px 0 16px',
  },
  avatarWrap: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    background: '#1e293b',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: '#94a3b8',
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#10b981',
    border: '3px solid #0f172a',
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  profileRole: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '1.8px',
    textTransform: 'uppercase',
    color: '#475569',
    marginBottom: '3px',
  },
  profileName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#f8fafc',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  toggleBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '8px',
    background: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    border: 'none',
    color: '#64748b',
    transition: 'all 0.2s',
  },
  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.05)',
    margin: '0 16px',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: '#334155',
    padding: '12px 20px 6px',
  },
  nav: {
    flex: 1,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflow: 'hidden',
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 12px',
    borderRadius: '14px',
    cursor: 'pointer',
    background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
    transition: 'all 0.2s',
    border: active ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
  }),
  navIcon: (active) => ({
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: active ? '#3b82f6' : 'transparent',
    color: active ? '#fff' : '#475569',
    transition: 'all 0.2s',
  }),
  navLabel: (active) => ({
    fontSize: '14px',
    fontWeight: 600,
    color: active ? '#f8fafc' : '#64748b',
    flex: 1,
  }),
  subnav: {
    padding: '4px 12px 4px 44px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  subItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '7px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    color: active ? '#3b82f6' : '#475569',
    fontWeight: active ? 600 : 500,
    position: 'relative',
    transition: 'all 0.2s',
  }),
  miniNav: {
    flex: 1,
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'center',
  },
  miniIcon: (active) => ({
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: active ? '#3b82f6' : 'transparent',
    color: active ? '#fff' : '#475569',
    transition: 'background 0.15s',
  }),
};

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSubItem, setActiveSubItem] = useState('Statistics');
  const location = useLocation();

  return (
    <div style={{ ...styles.sidebar, ...(collapsed ? styles.sidebarCollapsed : {}) }}>
      {/* Toggle Button */}
      <button 
        style={styles.toggleBtn} 
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>

      {/* Profile Area */}
      <div style={{ ...styles.profile, ...(collapsed ? styles.profileCollapsed : {}) }}>
        <div style={styles.avatarWrap}>
          RC
          <div style={styles.statusDot} />
        </div>
        {!collapsed && (
          <div style={styles.profileText}>
            <p style={styles.profileRole}>Admin</p>
            <p style={styles.profileName}>ReceiPro User</p>
          </div>
        )}
      </div>

      <div style={styles.divider} />

      {/* Main Nav */}
      {!collapsed ? (
        <div style={styles.nav}>
          <p style={styles.sectionLabel}>Main</p>
          {NAV.map((item) => {
            const active = location.pathname === item.path;
            const hasChildren = item.children && item.children.length > 0;
            return (
              <div key={item.id}>
                <Link to={item.path} style={{ textDecoration: 'none' }}>
                  <div style={styles.navItem(active)}>
                    <div style={styles.navIcon(active)}>{item.icon}</div>
                    <span style={styles.navLabel(active)}>{item.label}</span>
                    {hasChildren && <ChevronUpIcon />}
                  </div>
                </Link>
                {active && hasChildren && (
                  <div style={styles.subnav}>
                    {item.children.map((child) => (
                      <div
                        key={child}
                        style={styles.subItem(activeSubItem === child)}
                        onClick={() => setActiveSubItem(child)}
                      >
                        {child}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={styles.miniNav}>
          {NAV.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.id} to={item.path} style={{ textDecoration: 'none' }}>
                <div style={styles.miniIcon(active)}>
                  {item.icon}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
