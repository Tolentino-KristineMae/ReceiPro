import React, { useState, useEffect } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getApiUrl, getStorageUrl } from '../../apiConfig';

// ── Enhanced Constants with Premium Themes ──
const ACCOUNTS = ['Babilyn', 'Nixie', 'Kristine'];
const SHORT = { Babilyn: 'BAB', Nixie: 'NIX', Kristine: 'KRI' };

const ACCOUNT_THEMES = {
  Babilyn: {
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    glow: 'rgba(249,115,22,0.2)',
    pill: '#fff7ed',
    pillText: '#c2410c',
    dot: '#f97316',
    label: '#9a3412',
    activeBg: 'rgba(249,115,22,0.1)',
    activeBorder: 'rgba(249,115,22,0.3)',
    topLine: '#f97316',
    chipBg: '#fff7ed',
    shimmer: 'rgba(249,115,22,0.15)',
  },
  Nixie: {
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    glow: 'rgba(139,92,246,0.2)',
    pill: '#f5f3ff',
    pillText: '#6d28d9',
    dot: '#8b5cf6',
    label: '#5b21b6',
    activeBg: 'rgba(139,92,246,0.1)',
    activeBorder: 'rgba(139,92,246,0.3)',
    topLine: '#8b5cf6',
    chipBg: '#f5f3ff',
    shimmer: 'rgba(139,92,246,0.15)',
  },
  Kristine: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    glow: 'rgba(16,185,129,0.2)',
    pill: '#ecfdf5',
    pillText: '#047857',
    dot: '#10b981',
    label: '#065f46',
    activeBg: 'rgba(16,185,129,0.1)',
    activeBorder: 'rgba(16,185,129,0.3)',
    topLine: '#10b981',
    chipBg: '#ecfdf5',
    shimmer: 'rgba(16,185,129,0.15)',
  },
};

// ── Ultra Modern Global CSS ──
const ULTRA_MODERN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@300..800&family=IBM+Plex+Mono:ital,wght@300..700&display=swap');

  :root {
    --f: 'Plus Jakarta Sans', -apple-system, sans-serif;
    --fm: 'IBM Plex Mono', 'SF Mono', monospace;
    
    /* Energetic Light Palette */
    --bg-primary:        #fffbf5;
    --bg-secondary:      #ffffff;
    --bg-glass:          rgba(255, 255, 255, 0.7);
    --bg-glass-hover:    rgba(251, 146, 60, 0.08);
    --surface-primary:   #ffffff;
    --surface-secondary: #fff7ed;
    
    /* Enhanced borders */
    --border-subtle:     rgba(251, 146, 60, 0.15);
    --border-hover:      rgba(251, 146, 60, 0.25);
    --border-glow:       rgba(249, 115, 22, 0.2);
    
    /* Text hierarchy */
    --text-primary:      #431407;
    --text-secondary:    #7c2d12;
    --text-muted:        #9a3412;
    --text-faint:        #c2410c;
    
    /* Shadows */
    --shadow-sm:         0 1px 3px 0 rgba(249, 115, 22, 0.1);
    --shadow-md:         0 10px 25px -5px rgba(249, 115, 22, 0.1), 0 4px 6px -2px rgba(249, 115, 22, 0.05);
    --shadow-lg:         0 20px 40px -10px rgba(249, 115, 22, 0.15), 0 8px 16px -8px rgba(249, 115, 22, 0.1);
    --shadow-xl:         0 35px 60px -20px rgba(249, 115, 22, 0.2);
    
    /* Radii */
    --radius-sm:         10px;
    --radius-md:         16px;
    --radius-lg:         24px;
    --radius-xl:         32px;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: var(--f);
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* ── Ultra Modern Animations ── */
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-8px) rotate(1deg); }
    66% { transform: translateY(-4px) rotate(-1deg); }
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(100%) skewX(-12deg); }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px var(--glow); }
    50% { box-shadow: 0 0 40px var(--glow); }
  }

  @keyframes rc-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.08); }
  }

  /* ── Root Layout ── */
  .dash-root {
    min-height: 100vh;
    padding: 2rem;
    max-width: 1800px;
    margin: 0 auto;
    position: relative;
  }

  @media (max-width: 768px) {
    .dash-root { padding: 1.5rem 1rem; }
  }

  /* ── Premium Header ── */
  .dash-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 2rem;
    position: relative;
    backdrop-filter: blur(20px);
  }

  .dash-eyebrow {
    font-family: var(--fm);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    background: linear-gradient(135deg, #f97316, #ea580c);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }

  .dash-title {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, var(--text-primary) 0%, #7c2d12 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
  }

  .dash-title-accent {
    background: linear-gradient(135deg, #a78bfa, #f472b6, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Premium Buttons ── */
  .hbtn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-subtle);
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    color: var(--text-muted);
    font-family: var(--f);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .hbtn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: left 0.5s;
  }

  .hbtn:hover {
    border-color: var(--border-hover);
    color: var(--text-secondary);
    background: var(--bg-glass-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .hbtn:hover::before { left: 100%; }

  .hbtn.primary {
    background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 20px rgba(167,139,250,0.3);
  }

  .hbtn.primary:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 32px rgba(167,139,250,0.4);
  }

  /* ── Stats Grid - Ultra Modern Cards ── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.25rem;
    margin-bottom: 2.5rem;
  }

  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: 1fr; }
  }

  .stat-card {
    background: var(--bg-glass);
    backdrop-filter: blur(40px);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    padding: 2rem 1.5rem;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--top-line);
    opacity: 0;
    transform: scaleX(0);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .stat-card:hover {
    border-color: var(--border-hover);
    transform: translateY(-8px) rotateX(2deg);
    box-shadow: var(--shadow-xl);
  }

  .stat-card:hover::before {
    opacity: 1;
    transform: scaleX(1);
  }

  .stat-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    backdrop-filter: blur(10px);
    box-shadow: var(--shadow-sm);
  }

  .stat-tag {
    font-family: var(--fm);
    font-size: 11px;
    font-weight: 600;
    padding: 0.375rem 0.875rem;
    border-radius: 100px;
    backdrop-filter: blur(10px);
  }

  .stat-label {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-family: var(--fm);
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
    background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-sub {
    font-size: 13px;
    color: var(--text-faint);
    font-weight: 500;
    margin-top: 0.5rem;
    letter-spacing: 0.025em;
  }

  /* ── Columns Grid - Glassmorphism ── */
  .cols-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
  }

  @media (max-width: 1024px) {
    .cols-grid { grid-template-columns: 1fr; }
  }

  /* ── Column Container ── */
  .rcol {
    background: var(--bg-glass);
    backdrop-filter: blur(60px);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    box-shadow: var(--shadow-md);
  }

  .rcol::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--col-gradient);
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: 0;
  }

  .rcol.is-over {
    border-color: var(--col-accent);
    box-shadow: 0 0 0 1px var(--col-accent), var(--shadow-xl);
    transform: translateY(-4px);
  }

  .rcol.is-over::before { opacity: 0.05; }

  .rcol-header {
    padding: 1.75rem;
    border-bottom: 1px solid var(--border-subtle);
    position: relative;
    z-index: 2;
    backdrop-filter: blur(20px);
  }

  .rcol-header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .rcol-title-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .rcol-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow-sm);
  }

  .rcol-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.015em;
    color: var(--text-secondary);
  }

  .rcol-badge {
    font-family: var(--fm);
    font-size: 12px;
    font-weight: 600;
    padding: 0.375rem 0.875rem;
    border-radius: 100px;
    background: var(--bg-glass-hover);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-subtle);
  }

  /* ── Progress Bar ── */
  .rcol-bar {
    display: flex;
    gap: 2px;
    height: 4px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1rem;
    background: var(--border-subtle);
  }

  .rcol-bar-seg {
    border-radius: 4px;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 2px;
  }

  /* ── Filter Chips - Premium ── */
  .filter-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    border-radius: var(--radius-md);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.025em;
    border: 1px solid var(--border-subtle);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(20px);
    position: relative;
    overflow: hidden;
  }

  .filter-chip::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--filter-gradient);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .filter-chip:hover {
    border-color: var(--border-hover);
    color: var(--text-secondary);
    background: var(--bg-glass-hover);
    transform: translateY(-1px);
  }

  .filter-chip.active {
    border-color: transparent;
    color: white;
  }

  .filter-chip.active::before { opacity: 1; }

  .filter-dot {
    display: none;
  }

  .filter-count {
    font-family: var(--fm);
    font-size: 11px;
    opacity: 0.7;
    font-weight: 500;
  }

  /* ── Cards Container ── */
  .rcol-cards {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    max-height: 600px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border-subtle) transparent;
  }

  .rcol-cards::-webkit-scrollbar {
    width: 4px;
  }

  .rcol-cards::-webkit-scrollbar-thumb {
    background: var(--border-subtle);
    border-radius: 4px;
  }

  /* ── Receipt Card - Ultra Premium ── */
  .rc {
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--border-subtle);
    background: var(--bg-glass);
    backdrop-filter: blur(40px);
    cursor: grab;
    position: relative;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: var(--shadow-sm);
  }

  .rc:hover {
    transform: translateY(-6px) rotateX(5deg);
    border-color: var(--border-hover);
    box-shadow: var(--shadow-lg);
  }

  .rc:active { cursor: grabbing; }
  .rc.is-dragging {
    opacity: 0.15;
    transform: scale(0.95);
    box-shadow: var(--shadow-xl);
  }

  .rc.assigned {
    border-color: var(--account-accent);
    box-shadow: 0 0 0 1px var(--account-accent);
  }

  .rc-top-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .rc:hover .rc-top-line,
  .rc.assigned .rc-top-line {
    opacity: 1;
  }

  .rc-img-wrap {
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, #0a0e18, #111727);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rc-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    filter: brightness(0.85) contrast(1.1);
  }

  .rc:hover .rc-img-wrap img {
    filter: brightness(1) contrast(1.15);
    transform: scale(1.05);
  }

  .rc-img-shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(5,6,10,0.95) 0%, transparent 60%);
  }

  .rc-status-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    border-radius: 100px;
    font-family: var(--fm);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(15,23,42,0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: var(--shadow-sm);
  }

  .rc-status-dot {
    display: none;
  }

  .rc-status-dot.pulse {
    animation: none;
  }

  .rc-acct-chip {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    padding: 0.5rem 0.875rem;
    border-radius: var(--radius-md);
    font-family: var(--f);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(255,255,255,0.15);
  }

  .rc-body {
    padding: 1.25rem;
    position: relative;
    z-index: 2;
  }

  .rc-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .rc-ref {
    font-family: var(--fm);
    font-size: 11px;
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 140px;
  }

  .rc-ref.has-ref {
    color: var(--text-muted);
    font-weight: 500;
  }

  .rc-date {
    font-family: var(--fm);
    font-size: 11px;
    color: var(--text-faint);
    flex-shrink: 0;
  }

  .rc-amount {
    font-family: var(--fm);
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    background: linear-gradient(135deg, #34d399, #10b981);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    margin-top: 0.25rem;
  }

  .rc-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--border-subtle), transparent);
    margin: 1rem 0;
  }

  /* ── Premium Pills ── */
  .rc-pill {
    flex: 1;
    padding: 0.75rem 0.5rem;
    border-radius: var(--radius-md);
    font-family: var(--f);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-align: center;
    cursor: pointer;
    border: 1px solid var(--border-subtle);
    background: transparent;
    color: var(--text-faint);
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(20px);
  }

  .rc-pill::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--pill-gradient);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .rc-pill:hover:not(:disabled) {
    border-color: var(--border-hover);
    color: var(--text-secondary);
    background: var(--bg-glass-hover);
    transform: translateY(-1px);
  }

  .rc-pill.active {
    border-color: transparent;
    color: white;
    transform: translateY(-1px);
  }

  .rc-pill.active::before {
    opacity: 1;
  }

  .rc-pill.loading::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, var(--shimmer), transparent);
    animation: shimmer 1.2s infinite;
  }

  /* ── Empty States ── */
  .rcol-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
    color: var(--text-faint);
  }

  .rcol-empty-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-lg);
    border: 2px dashed var(--border-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    backdrop-filter: blur(20px);
  }

  .rcol-empty-text {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.025em;
    text-transform: uppercase;
  }

  /* ── Drop Zone Footer ── */
  .rcol-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: 0.4;
    transition: all 0.3s ease;
    backdrop-filter: blur(20px);
    position: relative;
    z-index: 2;
  }

  .rcol.is-over .rcol-footer {
    opacity: 1;
    background: rgba(var(--col-accent-rgb), 0.1);
    border-color: var(--col-accent);
  }

  .rcol-footer-icon {
    font-size: 14px;
    color: var(--col-accent);
  }

  .rcol-footer span {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.025em;
  }

  .rcol.is-over .rcol-footer span {
    color: var(--col-accent);
  }
`;

// ── Enhanced Icons (using Lucide React or custom SVGs) ──
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
  Filter: ({ size = 14, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
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
  Upload: ({ size = 14, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17,8 12,3 7,8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Inbox: ({ size = 20, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 8 15 3 9 3 9 8 6 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89a2 2 0 0 0-1.95-1.11H5.45z" />
    </svg>
  ),
  PhotoOff: ({ size = 20, className = "" }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s3-8 10-8 10 8 10 8" />
      <path d="M21.73 17.27A2.5 2.5 0 0 1 19 21H5a2.5 2.5 0 0 1-1.73-4.27" />
      <line x1="16.7" y1="7.3" x2="4.3" y2="19.7" />
      <polyline points="7.3,16.7 4.3,19.7 7.3,16.7" />
    </svg>
  ),
};

// ── Enhanced ReceiptCard Component ──
function ReceiptCard({ receipt, onSelect, onAccountAssigned, showAccountPicker }) {
  const [saving, setSaving] = useState(null);
  const [imgError, setImgError] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'receipt',
    item: { id: receipt.id },
    collect: m => ({ isDragging: m.isDragging() }),
  });

  const handlePill = async (acc) => {
    const next = receipt.account_holder === acc ? null : acc;
    setSaving(acc);
    try {
      const res = await fetch(getApiUrl(`/api/receipts/${receipt.id}/account`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_holder: next }),
      });
      if (res.ok && onAccountAssigned) onAccountAssigned(await res.json());
    } catch {}
    finally { setSaving(null); }
  };

  const ocrStatus = {
    completed: { label: 'Verified', color: '#34d399', pulse: false },
    processing: { label: 'Scanning', color: '#fbbf24', pulse: true },
    pending: { label: 'Pending', color: '#94a3b8', pulse: false },
    failed: { label: 'Failed', color: '#f87171', pulse: false },
  }[receipt.ocr_status] || ocrStatus.pending;

  const theme = receipt.account_holder ? ACCOUNT_THEMES[receipt.account_holder] : null;
  const assigned = !!receipt.account_holder;

  const amount = receipt.ocr_data?.amount
    ? `₱${Number(receipt.ocr_data.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
    : null;

  const cardDate = new Date(receipt.created_at).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric',
  });

  return (
    <div
      ref={drag}
      onClick={() => onSelect(receipt)}
      className={[
        'rc',
        assigned ? 'assigned' : '',
        isDragging ? 'is-dragging' : '',
      ].join(' ')}
      style={{
        '--account-accent': theme?.topLine || 'transparent',
        '--account-accent-rgb': theme ? '167,139,250' : '148,163,184',
      }}
    >
      <div
        className="rc-top-line"
        style={{
          background: theme?.gradient || 'linear-gradient(90deg, #a78bfa, #f472b6)',
        }}
      />

      <div className="rc-img-wrap">
        {!imgError ? (
          <img
            src={getStorageUrl(`/storage/${receipt.file_path}`)}
            alt="Receipt"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="rc-no-img">
            <Icon.PhotoOff />
            <span>No image</span>
          </div>
        )}
        <div className="rc-img-shade" />

        <div className="rc-status-badge" style={{ color: ocrStatus.color, '--glow': ocrStatus.color }}>
          <span
            className={`rc-status-dot${ocrStatus.pulse ? ' pulse' : ''}`}
            style={{ background: ocrStatus.color }}
          />
          {ocrStatus.label}
        </div>

        {assigned && theme && (
          <div
            className="rc-acct-chip"
            style={{ 
              background: theme.chipBg,
              '--pill-gradient': theme.gradient,
            }}
          >
            {SHORT[receipt.account_holder]}
          </div>
        )}
      </div>

      <div className="rc-body">
        <div className="rc-meta">
          <span className={`rc-ref${receipt.ocr_data?.reference ? ' has-ref' : ''}`}>
            {receipt.ocr_data?.reference?.slice(-12) || 'No reference'}
          </span>
          <span className="rc-date">{cardDate}</span>
        </div>
        {amount && <div className="rc-amount">{amount}</div>}

        {showAccountPicker && (
          <>
            <div className="rc-divider" />
            <div className="rc-picker" onClick={e => e.stopPropagation()}>
              {ACCOUNTS.map(acc => {
                const isActive = receipt.account_holder === acc;
                const isLoading = saving === acc;
                const t = ACCOUNT_THEMES[acc];
                return (
                  <button
                    key={acc}
                    onClick={() => handlePill(acc)}
                    disabled={!!saving}
                    className={[
                      'rc-pill',
                      isActive ? 'active' : '',
                      isLoading ? 'loading' : '',
                    ].join(' ')}
                    style={{
                      '--pill-gradient': t.gradient,
                      '--shimmer': t.shimmer,
                    }}
                  >
                    {isLoading ? '···' : SHORT[acc]}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Enhanced ReceiptColumn ── (keeping most of the logic, just class updates)
function ReceiptColumn({ column, receipts, onMoveReceipt, onSelectReceipt, onAccountAssigned }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const cfg = {
    unsorted: {
      accent: '#94a3b8',
      gradient: 'linear-gradient(135deg, #94a3b8, #64748b)',
      icon: Icon.Inbox,
      label: 'Unsorted',
    },
    gcash: {
      accent: '#818cf8',
      gradient: 'linear-gradient(135deg, #818cf8, #6366f1)',
      icon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      label: 'GCash',
    },
    others: {
      accent: '#a78bfa',
      gradient: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
      icon: Icon.Receipt,
      label: 'Others',
    },
  }[column.id] || cfg.unsorted;

  const [{ isOver }, drop] = useDrop({
    accept: 'receipt',
    drop: item => onMoveReceipt(item.id, column.id),
    collect: m => ({ isOver: m.isOver() }),
  });

  const countFor = acc => receipts.filter(r => r.account_holder === acc).length;
  const unassigned = receipts.filter(r => !r.account_holder).length;

  const visible = !column.id !== 'unsorted' || activeFilter === 'all'
    ? receipts
    : activeFilter === 'unassigned'
      ? receipts.filter(r => !r.account_holder)
      : receipts.filter(r => r.account_holder === activeFilter);

  return (
    <div
      ref={drop}
      className={`rcol${isOver ? ' is-over' : ''}`}
      style={{
        '--col-accent': cfg.accent,
        '--col-accent-rgb': cfg.accent === '#94a3b8' ? '148,163,184' : cfg.accent === '#818cf8' ? '129,140,248' : '167,139,250',
        '--col-gradient': cfg.gradient,
      }}
    >
      <div className="rcol-header">
        <div className="rcol-header-top">
          <div className="rcol-title-group">
            <div className="rcol-icon" style={{ background: 'rgba(255,255,255,0.08)', color: cfg.accent }}>
              <cfg.icon />
            </div>
            <span className="rcol-title">{column.title}</span>
          </div>
          <span className="rcol-badge">{receipts.length}</span>
        </div>

        {receipts.length > 0 && (
          <div className="rcol-bar">
            {ACCOUNTS.map(acc => {
              const n = countFor(acc);
              if (!n) return null;
              const t = ACCOUNT_THEMES[acc];
              return (
                <div
                  key={acc}
                  className="rcol-bar-seg"
                  title={`${acc}: ${n}`}
                  style={{
                    flex: n,
                    background: t.topLine,
                    opacity: activeFilter === 'all' || activeFilter === acc ? 1 : 0.3,
                  }}
                />
              );
            })}
            {unassigned > 0 && (
              <div
                className="rcol-bar-seg"
                style={{
                  flex: unassigned,
                  background: 'rgba(255,255,255,0.2)',
                  opacity: activeFilter === 'all' || activeFilter === 'unassigned' ? 1 : 0.3,
                }}
              />
            )}
          </div>
        )}

        {receipts.length > 0 && (
          <div className="rcol-filters">
            {[
              { key: 'all', label: 'All', count: receipts.length },
              ...ACCOUNTS.filter(a => countFor(a) > 0).map(a => ({
                key: a, label: SHORT[a], count: countFor(a), themed: true,
              })),
              ...(unassigned > 0 ? [{ key: 'unassigned', label: '—', count: unassigned, warn: true }] : []),
            ].map(p => {
              const t = p.themed ? ACCOUNT_THEMES[p.key] : null;
              const isActive = activeFilter === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setActiveFilter(p.key)}
                  className={`filter-chip${isActive ? ' active' : ''}`}
                  style={{
                    '--filter-gradient': t?.gradient || (p.warn ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.1)'),
                  }}
                >
                  {t && <span className="filter-dot" style={{ background: t.dot }} />}
                  {p.label}
                  <span className="filter-count">{p.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rcol-cards">
        {visible.length > 0 ? (
          visible.map(r => (
            <ReceiptCard
              key={r.id}
              receipt={r}
              onSelect={onSelectReceipt}
              onAccountAssigned={onAccountAssigned}
              showAccountPicker={column.id !== 'unsorted'}
            />
          ))
        ) : (
          <div className="rcol-empty">
            <div className="rcol-empty-icon">
              <Icon.Inbox />
            </div>
            <span className="rcol-empty-text">No receipts here</span>
            <p style={{ fontSize: '13px', opacity: 0.6, textAlign: 'center' }}>
              Drag receipts to get started
            </p>
          </div>
        )}
      </div>

      <div className="rcol-footer">
        <Icon.Upload className="rcol-footer-icon" />
        <span>{isOver ? `Drop into ${column.title}` : 'Drag receipts here'}</span>
      </div>
    </div>
  );
}

// ── Enhanced Stats Cards ──
function DashboardStats({ receipts }) {
  const total = receipts.length;
  const pending = receipts.filter(r => r.match_status === 'unmatched').length;
  const matched = receipts.filter(r => r.match_status === 'matched').length;
  const amount = receipts.reduce((s, r) => s + (parseFloat(r.ocr_data?.amount) || 0), 0);
  const pct = total > 0 ? Math.round((matched / total) * 100) : 0;

  const stats = [
    {
      key: 'total',
      label: 'Total Receipts',
      value: total,
      sub: `${pct}% matched`,
      icon: Icon.Receipt,
      gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
      tag: `${pct}%`,
    },
    {
      key: 'pending',
      label: 'Pending',
      value: pending,
      sub: 'awaiting match',
      icon: Icon.Clock,
      gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      tag: 'Action Required',
    },
    {
      key: 'matched',
      label: 'Matched',
      value: matched,
      sub: 'verified & reconciled',
      icon: Icon.CheckCircle,
      gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
      tag: 'Verified',
    },
    {
      key: 'amount',
      label: 'Total Amount',
      value: `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'all receipts',
      icon: Icon.Wallet,
      gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      tag: 'PHP',
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map(stat => (
        <div
          key={stat.key}
          className="stat-card"
          style={{ 
            '--top-line': stat.gradient,
            '--glow': stat.gradient.split(',')[1]?.trim() || '#a78bfa',
          }}
        >
          <div className="stat-top">
            <div className="stat-icon" style={{ background: stat.gradient, color: 'white' }}>
              <stat.icon />
            </div>
            <span
              className="stat-tag"
              style={{ 
                background: stat.gradient,
                color: 'white',
              }}
            >
              {stat.tag}
            </span>
          </div>
          <div className="stat-label">{stat.label}</div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-sub">{stat.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Enhanced Header ──
function DashboardHeader() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dash-header">
      <div>
        <div className="dash-eyebrow">Receipt Ledger</div>
        <h1 className="dash-title">
          {greeting}, <span className="dash-title-accent">Team.</span>
        </h1>
        <div style={{ 
          fontSize: '13px', 
          color: 'var(--text-muted)', 
          marginTop: '0.25rem',
          fontFamily: 'var(--fm)'
        }}>
          {new Date().toLocaleDateString('en-PH', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="hbtn">
          <Icon.Filter />
          Filters
        </button>
        <button className="hbtn">
          <Icon.Download />
          Export
        </button>
        <button className="hbtn primary">
          <Icon.Plus />
          Upload
        </button>
      </div>
    </div>
  );
}

// ── Main Enhanced Dashboard ──
export default function EnhancedDashboard({
  receipts = [],
  onMoveReceipt,
  onSelectReceipt,
  onCreateTransaction,
  onAccountAssigned,
}) {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = ULTRA_MODERN_CSS;
    document.head.appendChild(style);
    
    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dash-root">
        <DashboardHeader />
        <DashboardStats receipts={receipts} />
      </div>
    </DndProvider>
  );
}