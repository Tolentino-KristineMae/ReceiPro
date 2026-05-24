import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../../apiConfig';

const ACCOUNTS = ['Babilyn', 'Nixie', 'Kristine'];

// Batch color palette (5 colors cycling)
const BATCH_COLORS = [
  { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)', text: '#a78bfa' },  // Purple
  { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa' },  // Blue
  { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#34d399' },  // Green
  { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24' },  // Amber
  { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)', text: '#f472b6' },  // Pink
];

const getBatchColor = (batchNumber) => {
  if (!batchNumber) return null;
  // Extract numeric part from batch number (e.g., "B-001" -> 1)
  const numMatch = batchNumber.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0]) : 0;
  return BATCH_COLORS[(num - 1) % 5];
};

const fmt = (n) =>
  Number(n ?? 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const EMPTY_FORM = () => ({
  transaction_date: new Date().toISOString().split('T')[0],
  entry_type: 'credit',
  amount: '',
  label: '',
  opening_balance: '',
});

// ─── Modern Professional CSS ──────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

  :root {
    --bg-primary:        #0a0e1a;
    --bg-secondary:      #111827;
    --bg-tertiary:       #1f2937;
    --bg-glass:          rgba(255,255,255,0.02);
    --bg-glass-hover:    rgba(255,255,255,0.05);
    --border-subtle:     rgba(255,255,255,0.08);
    --border-strong:     rgba(255,255,255,0.15);
    --border-glow:       rgba(59,130,246,0.3);
    
    --gradient-primary:  linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --gradient-accent:   linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    --gradient-success:  linear-gradient(135deg, #10b981 0%, #059669 100%);
    --gradient-danger:   linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    
    --text-primary:      #f8fafc;
    --text-secondary:    #e2e8f0;
    --text-muted:        #94a3b8;
    --text-muted-alt:    #64748b;
    
    --accent-primary:    #3b82f6;
    --accent-secondary:  #60a5fa;
    --success-primary:   #10b981;
    --danger-primary:    #ef4444;
    
    --shadow-sm:         0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md:         0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg:         0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl:         0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    --shadow-2xl:        0 25px 50px -12px rgb(0 0 0 / 0.25);
    
    --radius-sm:         8px;
    --radius-md:         12px;
    --radius-lg:         16px;
    --radius-xl:         24px;
    
    --font-family:       'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono:         'JetBrains Mono', 'SF Mono', Menlo, monospace;
  }

  * { 
    box-sizing: border-box; 
    margin: 0; 
    padding: 0; 
  }

  body {
    font-family: var(--font-family);
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
  }

  .tx-root {
    min-height: 100vh;
    padding: 1.5rem 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .tx-root { padding: 1rem 0.75rem; }
  }

  /* ── Account Switcher ── */
  .account-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  @media (max-width: 640px) {
    .account-header {
      flex-direction: column;
      align-items: stretch;
      margin-bottom: 1.5rem;
    }
  }

  .account-tabs {
    display: flex;
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 3px;
    box-shadow: var(--shadow-md);
    overflow-x: auto;
    scrollbar-width: none;
  }

  .account-tabs::-webkit-scrollbar { display: none; }

  .account-tab {
    padding: 8px 18px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-weight: 600;
    font-size: 13px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    letter-spacing: 0.025em;
    white-space: nowrap;
    flex: 1;
    min-width: 100px;
  }

  @media (max-width: 480px) {
    .account-tab { padding: 6px 14px; font-size: 12px; min-width: 80px; }
  }

  .account-tab.active {
    background: var(--gradient-accent);
    color: white;
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .account-tab:hover:not(.active) {
    color: var(--text-secondary);
    background: var(--bg-glass-hover);
  }

  /* ── Print Button ── */
  .print-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: var(--radius-md);
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    letter-spacing: 0.025em;
  }

  .print-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
  }

  .print-button:active {
    transform: translateY(0);
  }

  @media (max-width: 640px) {
    .print-button {
      padding: 8px 16px;
      font-size: 12px;
    }
  }

  /* ── Main Layout ── */
  .main-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 1.25rem;
    align-items: start;
  }

  @media (max-width: 1280px) {
    .main-layout { grid-template-columns: 280px 1fr; gap: 1rem; }
  }

  @media (max-width: 1024px) {
    .main-layout { grid-template-columns: 1fr; gap: 1.5rem; }
  }

  /* ── Glass Panels ── */
  .glass-panel {
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-lg);
    position: relative;
    overflow: hidden;
  }

  @media (max-width: 640px) {
    .glass-panel { padding: 1.25rem; }
  }

  .glass-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--gradient-accent);
    opacity: 0.5;
  }

  .glass-panel.sticky {
    position: sticky;
    top: 1.5rem;
    align-self: start;
  }

  @media (max-width: 1024px) {
    .glass-panel.sticky { position: static; }
  }

  /* ── Form Header ── */
  .form-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border-subtle);
  }

  .form-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: var(--gradient-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 17px;
    box-shadow: var(--shadow-md);
    flex-shrink: 0;
  }

  .form-title-group h2 {
    font-size: 1.1rem;
    font-weight: 800;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    line-height: 1.2;
  }

  .form-subtitle {
    color: var(--text-muted);
    font-size: 11px;
    font-weight: 500;
    margin-top: 0.15rem;
  }

  /* ── Form Fields ── */
  .field-group {
    margin-bottom: 1rem;
  }

  .field-label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 0.4rem;
  }

  .input-field {
    width: 100%;
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 10px 12px;
    font-size: 14px;
    color: var(--text-primary);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
  }

  .input-field:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--border-glow);
    background: var(--bg-tertiary);
  }

  .input-field::placeholder {
    color: var(--text-muted-alt);
  }

  .amount-input-container {
    position: relative;
  }

  .amount-prefix {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-weight: 600;
    font-size: 16px;
    color: var(--text-muted);
    pointer-events: none;
    z-index: 1;
  }

  .amount-input {
    padding-left: 34px;
    font-family: var(--font-mono);
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  /* ── Toggle Buttons ── */
  .toggle-group {
    display: flex;
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .toggle-button {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text-muted);
    padding: 10px 14px;
    font-weight: 700;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .toggle-button.active {
    background: var(--gradient-success);
    color: white;
  }

  .toggle-button.active.danger {
    background: var(--gradient-danger);
  }

  /* ── Preview Card ── */
  .preview-card {
    background: var(--bg-glass-hover);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    padding: 1rem 1.25rem;
    margin-bottom: 1.25rem;
    backdrop-filter: blur(10px);
  }

  .preview-label {
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
    display: block;
  }

  .preview-value {
    font-family: var(--font-mono);
    font-size: 21px;
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .preview-value.credit { color: var(--success-primary); }
  .preview-value.debit { color: var(--danger-primary); }

  /* ── CTA Button ── */
  .cta-button {
    width: 100%;
    background: var(--gradient-accent);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: 14px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }

  .cta-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
  }

  .cta-button:active {
    transform: translateY(0);
  }

  .cta-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* ── Summary Grid ── */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 1400px) {
    .metrics-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 480px) {
    .metrics-grid { grid-template-columns: 1fr; gap: 0.75rem; }
  }

  .metric-card {
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 1.25rem 1rem;
    text-align: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    .metric-card { padding: 1rem; text-align: left; }
  }

  .metric-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: var(--shadow-md);
    flex-shrink: 0;
    margin: 0 !important;
  }

  .metric-label {
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 0.2rem;
    text-align: left;
  }

  .metric-value {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
    text-align: left;
  }

  /* ── Table Header ── */
  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-subtle);
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .table-title {
    font-size: 1.25rem;
    font-weight: 800;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .table-stats {
    background: var(--bg-glass);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
  }

  /* ── Modern Table ── */
  .table-container {
    background: var(--bg-glass);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }

  @media (max-width: 768px) {
    .table-container { background: transparent; border: none; box-shadow: none; overflow: visible; }
    .table thead { display: none; }
    .table tbody { display: grid; gap: 0.75rem; }
    .table tr { 
      display: block; 
      background: var(--bg-glass); 
      border: 1px solid var(--border-subtle); 
      border-radius: var(--radius-md);
      padding: 1rem;
      position: relative;
    }
    .table td { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 0.5rem 0; 
      border: none;
      text-align: right;
    }
    .table td:not(:last-child) { border-bottom: 1px solid var(--border-subtle); }
    .table td::before {
      content: attr(data-label);
      font-size: 9px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
    }
    .table tr:hover td { background: transparent; }
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
    white-space: nowrap;
  }

  .table th {
    padding: 0.75rem 0.5rem;
    text-align: left;
    font-size: 9px;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: transparent;
    border: none;
    white-space: nowrap;
  }

  .table th:last-child { text-align: right; }

  .table td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid var(--border-subtle);
    vertical-align: middle;
    transition: background 0.2s ease;
    white-space: nowrap;
    overflow: visible;
  }

  .table tr:hover td {
    background: var(--bg-glass-hover);
  }

  .table tr:last-child td {
    border-bottom: none;
  }

  /* ── Table Elements ── */
  .date-display {
    font-size: 12px;
    color: var(--text-primary);
    font-weight: 600;
    font-family: var(--font-mono);
    white-space: nowrap;
  }

  .type-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .type-badge.credit {
    background: rgba(16,185,129,0.1);
    color: var(--success-primary);
    border: 1px solid rgba(16,185,129,0.2);
  }

  .type-badge.debit {
    background: rgba(239,68,68,0.1);
    color: var(--danger-primary);
    border: 1px solid rgba(239,68,68,0.2);
  }

  .type-dot {
    display: none;
  }

  .type-dot.credit { background: var(--success-primary); }
  .type-dot.debit { background: var(--danger-primary); }

  .amount-display {
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 700;
    text-align: right;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }

  .amount-display.credit { color: var(--success-primary); }
  .amount-display.debit { color: var(--danger-primary); }

  .balance-display {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--text-primary);
    text-align: right;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }

  /* ── Batch Tag ── */
  .batch-tag {
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 600;
    color: var(--accent-primary);
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    padding: 2px 6px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .batch-none {
    color: var(--text-muted-alt);
    font-size: 12px;
    font-style: italic;
    white-space: nowrap;
  }

  /* ── Edit Button ── */
  .edit-button {
    background: transparent;
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: var(--radius-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-button:hover {
    background: rgba(59, 130, 246, 0.1);
    color: var(--accent-primary);
    border-color: rgba(59, 130, 246, 0.3);
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    .edit-button { 
      background: rgba(59, 130, 246, 0.05);
      border-color: rgba(59, 130, 246, 0.1);
      color: var(--accent-primary);
    }
  }

  /* ── Inline Edit Inputs ── */
  .inline-edit-input,
  .inline-edit-select {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: var(--text-primary);
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font-family);
    outline: none;
    transition: all 0.2s;
  }

  .inline-edit-input:focus,
  .inline-edit-select:focus {
    border-color: var(--accent-primary);
    background: rgba(59, 130, 246, 0.05);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .inline-edit-select {
    cursor: pointer;
  }

  .editing-row {
    background: rgba(59, 130, 246, 0.03) !important;
    box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.2);
  }

  /* ── Save/Cancel Buttons ── */
  .save-button {
    background: transparent;
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: var(--radius-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .save-button:hover {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-primary);
    border-color: rgba(16, 185, 129, 0.3);
    transform: scale(1.05);
  }

  .cancel-button {
    background: transparent;
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: var(--radius-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cancel-button:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger-primary);
    border-color: rgba(239, 68, 68, 0.3);
    transform: scale(1.05);
  }

  /* ── Delete Button ── */
  .delete-button {
    background: transparent;
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    cursor: pointer;
    padding: 6px;
    border-radius: var(--radius-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .delete-button:hover {
    background: rgba(239, 68, 68, 0.1);
    color: var(--danger-primary);
    border-color: rgba(239, 68, 68, 0.3);
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    .delete-button { 
      background: rgba(239, 68, 68, 0.05);
      border-color: rgba(239, 68, 68, 0.1);
      color: var(--danger-primary);
    }
  }

  /* ── Footer ── */
  .table-footer {
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-strong);
  }

  .table-footer td {
    padding: 1.25rem 1rem;
  }

  @media (max-width: 768px) {
    .table-footer { display: block; border-radius: var(--radius-md); margin-top: 1rem; }
    .table-footer td { display: block; text-align: center; }
    .table-footer td::before { display: none; }
  }

  .footer-stats {
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }

  .footer-amounts {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
  }

  @media (max-width: 768px) {
    .footer-amounts { align-items: center; }
  }

  .footer-credit {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--success-primary);
  }

  .footer-debit {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--danger-primary);
  }

  .net-balance {
    font-family: var(--font-mono);
    font-size: 22px;
    font-weight: 800;
    color: var(--accent-primary);
    text-align: right;
    letter-spacing: -0.03em;
    margin-top: 0.25rem;
  }

  @media (max-width: 768px) {
    .net-balance { text-align: center; font-size: 20px; }
  }

  /* ── Empty States ── */
  .empty-state {
    text-align: center;
    padding: 3rem 1.5rem;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-lg);
    background: var(--bg-glass);
    border: 2px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-size: 20px;
    margin: 0 auto 1rem;
  }

  .empty-text {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  /* ── Loading Spinner ── */
  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--border-subtle);
    border-top: 3px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    margin: 0 auto 0.75rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ── Error State ── */
  .error-message {
    background: rgba(239,68,68,0.15);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: var(--radius-lg);
    padding: 1rem;
    color: var(--danger-primary);
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 10px;
    backdrop-filter: blur(10px);
    font-size: 14px;
  }

  /* ── Modal Responsiveness ── */
  @media (max-width: 640px) {
    .modal-container {
      padding: 1.5rem !important;
      border-radius: var(--radius-lg) !important;
    }
    
    .modal-container .grid {
      grid-template-columns: 1fr !important;
      gap: 1.25rem !important;
    }
  }
`;

// ─── Modern Icons ─────────────────────────────────────────────────────────────
const Icon = {
  Plus: ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  ArrowUp: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  ArrowDown: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  ),
  Wallet: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  Balance: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Calendar: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  File: ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Trash: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Edit: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Alert: ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

// ─── Metric Card Component ────────────────────────────────────────────────────
function MetricCard({ label, value, icon: IconComponent, color = "neutral" }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${color}`}>
        <IconComponent />
      </div>
      <div className="metric-content">
        <p className="metric-label">{label}</p>
        <div className="metric-value">₱{fmt(value)}</div>
      </div>
    </div>
  );
}

// ─── Modal Component ──────────────────────────────────────────────────────────
export function TransactionEntryModal({ onClose, receipt, onTransactionCreated }) {
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    account: 'Account 1',
    amount: receipt?.ocr_data?.amount || '',
    label: receipt?.ocr_data?.reference || '',
    source_type: receipt?.category === 'gcash' ? 'gcash' : 'others',
    denominations: {}
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (receipt?.ocr_data?.amount) {
      const denominations = suggestDenominations(receipt.ocr_data.amount);
      setFormData(prev => ({ 
        ...prev, 
        amount: receipt.ocr_data.amount, 
        label: prev.label || receipt.ocr_data.reference || '',
        denominations 
      }));
    }
  }, [receipt]);

  const suggestDenominations = (amount) => {
    const denominations = {};
    let remaining = parseFloat(amount) || 0;
    if (remaining >= 1000) { denominations['1000'] = Math.floor(remaining / 1000); remaining %= 1000; }
    if (remaining >= 500)  { denominations['500']  = Math.floor(remaining / 500);  remaining %= 500; }
    if (remaining >= 100)  { denominations['100']  = Math.floor(remaining / 100); }
    return denominations;
  };

  const calculateFee = (amount) => {
    const n = parseFloat(amount) || 0;
    if (n < 500) return 5;
    return Math.floor(n / 1000) * 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const payload = { 
      ...formData, 
      reference: null, // Combine into label
      receipt_id: receipt?.id 
    };
    try {
      const response = await fetch(getApiUrl('/api/transactions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const transaction = await response.json();
        if (onTransactionCreated) onTransactionCreated(transaction, receipt?.id);
        onClose();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create transaction.');
      }
    } catch (err) { setError('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const fee = calculateFee(formData.amount);
  const netAmount = (parseFloat(formData.amount) || 0) - fee;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-300">
      <div className="modal-container bg-[#0f172a] border border-white/10 rounded-[24px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50 text-white relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">New Transaction</h2>
            <p className="text-[13px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Record a new receipt activity</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-3">
            <Icon.Alert /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" style={{ padding: 0 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Date</label>
              <input type="date" value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Account</label>
              <select value={formData.account} onChange={(e) => setFormData({...formData, account: e.target.value})} className="input-field appearance-none cursor-pointer">
                <option value="Account 1" className="bg-slate-900">Account 1</option>
                <option value="Account 2" className="bg-slate-900">Account 2</option>
                <option value="Account 3" className="bg-slate-900">Account 3</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Amount</label>
              <div className="amount-input-container">
                <span className="amount-prefix">₱</span>
                <input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => {
                  const amount = parseFloat(e.target.value) || 0;
                  const denominations = suggestDenominations(amount);
                  setFormData({...formData, amount, denominations});
                }} className="input-field amount-input" style={{ fontSize: '24px', fontWeight: 'bold' }} required />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Source Type</label>
              <div className="toggle-group">
                <button type="button" onClick={() => setFormData({...formData, source_type: 'gcash'})} className={`toggle-button ${formData.source_type === 'gcash' ? 'active' : ''}`}>GCASH</button>
                <button type="button" onClick={() => setFormData({...formData, source_type: 'others'})} className={`toggle-button ${formData.source_type === 'others' ? 'active danger' : ''}`}>OTHERS</button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Reference / Label</label>
            <input type="text" value={formData.label} onChange={(e) => setFormData({...formData, label: e.target.value})} placeholder="e.g. 50238 / Int" className="input-field" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-[10px] font-bold text-green-400/60 uppercase tracking-widest mb-1">Fee (Calculated)</span>
              <span className="text-xl font-bold text-green-400 font-mono">₱{fee.toFixed(2)}</span>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest mb-1">Net Amount</span>
              <span className="text-xl font-bold text-blue-400 font-mono">₱{netAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-[20px] p-6">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Suggested Denominations</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(formData.denominations).map(([denom, count]) => (
                <div key={denom} className="bg-slate-800/50 border border-white/5 p-3 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">₱{denom}</div>
                  <div className="text-lg font-bold text-white font-mono">×{count}</div>
                </div>
              ))}
              {Object.keys(formData.denominations).length === 0 && (
                <div className="col-span-3 py-4 text-center">
                  <p className="text-[12px] text-slate-500 italic">Enter an amount to see suggestions</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3.5 border border-white/10 text-slate-400 font-bold text-[13px] uppercase tracking-wider rounded-xl hover:bg-white/5 hover:text-white transition-all">Cancel</button>
            <button type="submit" disabled={submitting} className="cta-button">
              {submitting ? 'Processing...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [activeAccount, setActiveAccount] = useState(ACCOUNTS[0]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forms, setForms] = useState(() => Object.fromEntries(ACCOUNTS.map(a => [a, EMPTY_FORM()])));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [allAccountsData, setAllAccountsData] = useState({});

  const form = forms[activeAccount] || EMPTY_FORM();
  const setForm = (updater) => setForms(prev => {
    const cur = prev[activeAccount] || EMPTY_FORM();
    return { ...prev, [activeAccount]: typeof updater === 'function' ? updater(cur) : updater };
  });

  const fetchTransactions = async () => {
    if (!activeAccount) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(getApiUrl(`/api/transactions?account_holder=${activeAccount}&t=${Date.now()}`), { 
        cache: 'no-store' 
      });
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [activeAccount]);

  // Fetch all accounts data to check for completed batches
  useEffect(() => {
    const fetchAllAccountsData = async () => {
      const data = {};
      for (const account of ACCOUNTS) {
        try {
          const response = await fetch(getApiUrl(`/api/transactions?account_holder=${account}&t=${Date.now()}`), { 
            cache: 'no-store' 
          });
          const transactions = await response.json();
          data[account] = Array.isArray(transactions) ? transactions : [];
        } catch {
          data[account] = [];
        }
      }
      setAllAccountsData(data);
    };
    fetchAllAccountsData();
  }, [transactions]); // Re-fetch when transactions change

  const openingBalance = transactions.length > 0
    ? parseFloat(transactions[0].opening_balance ?? 0)
    : parseFloat(form?.opening_balance || 0);

  const totalCredit = transactions
    .filter(t => t.entry_type === 'credit')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
  const totalDebit = transactions
    .filter(t => t.entry_type === 'debit')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    
  const currentBalance = (isNaN(openingBalance) ? 0 : openingBalance) + totalCredit - totalDebit;

  const previewAmount = parseFloat(form.amount || 0) || 0;
  const previewBalance = form.entry_type === 'credit' 
    ? currentBalance + previewAmount 
    : currentBalance - previewAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    const ob = transactions.length > 0 
      ? parseFloat(transactions[0].opening_balance ?? 0) 
      : parseFloat(form.opening_balance || 0);
      
    const payload = {
      transaction_date: form.transaction_date,
      account_holder:   activeAccount,
      account:          'Account 1',
      entry_type:       form.entry_type,
      amount:           parseFloat(form.amount),
      opening_balance:  ob,
      reference:        null, // Combined into label
      label:            form.label     || null,
      source_type:      'gcash',
    };

    try {
      const res = await fetch('http://localhost:8000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        const saved = await res.json();
        setTransactions(prev => [...prev, saved]);
        setForm(f => ({ ...f, amount: '', reference: '', label: '' }));
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to save transaction');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? This action cannot be undone.')) return;
    try {
      await fetch(getApiUrl(`/api/transactions/${id}`), { method: 'DELETE' });
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch {
      // Silent fail
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const handleSaveEdit = async (transactionId, updatedData) => {
    try {
      const res = await fetch(getApiUrl(`/api/transactions/${transactionId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      
      if (res.ok) {
        const updated = await res.json();
        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
        setEditingTransaction(null);
      } else {
        throw new Error('Failed to update transaction');
      }
    } catch (err) {
      alert('Failed to update transaction: ' + err.message);
    }
  };

  const handleUpdateTransaction = async (updatedData) => {
    await handleSaveEdit(editingTransaction.id, updatedData);
  };

  // Check if we have 5 or more completed batches
  const getCompletedBatches = () => {
    const batchSet = new Set();
    Object.values(allAccountsData).forEach(transactions => {
      transactions.forEach(t => {
        if (t.batch?.final_batch_number) {
          batchSet.add(t.batch.final_batch_number);
        }
      });
    });
    return Array.from(batchSet).sort();
  };

  const completedBatches = getCompletedBatches();
  const canPrint = completedBatches.length >= 5;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const generatePrintContent = () => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction Report - All Accounts</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Inter', sans-serif;
            padding: 40px;
            background: white;
            color: #1e293b;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #0f172a;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 8px;
          }
          
          .header p {
            font-size: 14px;
            color: #64748b;
            font-weight: 600;
          }
          
          .account-section {
            margin-bottom: 50px;
            page-break-inside: avoid;
          }
          
          .account-title {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 16px;
            padding: 12px 16px;
            background: #f1f5f9;
            border-left: 4px solid #3b82f6;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th {
            background: #0f172a;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          
          tr:hover {
            background: #f8fafc;
          }
          
          .batch-tag {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            font-family: 'Courier New', monospace;
            letter-spacing: 0.05em;
          }
          
          .credit { color: #059669; font-weight: 600; }
          .debit { color: #dc2626; font-weight: 600; }
          
          .summary {
            margin-top: 20px;
            padding: 16px;
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          
          .summary-row.total {
            border-top: 2px solid #0f172a;
            margin-top: 8px;
            padding-top: 12px;
            font-weight: 700;
            font-size: 16px;
          }
          
          @media print {
            body { padding: 20px; }
            .account-section { page-break-after: always; }
            .account-section:last-child { page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Transaction Report</h1>
          <p>All Accounts - Generated on ${new Date().toLocaleDateString('en-PH', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
    `;

    ACCOUNTS.forEach(account => {
      const accountTransactions = allAccountsData[account] || [];
      if (accountTransactions.length === 0) return;

      const totalCredit = accountTransactions
        .filter(t => t.entry_type === 'credit')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const totalDebit = accountTransactions
        .filter(t => t.entry_type === 'debit')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const openingBalance = accountTransactions.length > 0
        ? parseFloat(accountTransactions[0].opening_balance ?? 0)
        : 0;
      
      const currentBalance = openingBalance + totalCredit - totalDebit;

      html += `
        <div class="account-section">
          <div class="account-title">${account}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Label</th>
                <th>Batch</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
      `;

      let running = openingBalance;
      accountTransactions.forEach(t => {
        const amt = parseFloat(t.amount || 0);
        running = t.entry_type === 'credit' ? running + amt : running - amt;
        const batchLabel = t.batch?.final_batch_number || t.batch?.batch_number || '—';
        
        // For debit transactions, show descriptive word instead of batch number
        const displayLabel = t.entry_type === 'debit' 
          ? (t.label || 'Deduction')
          : batchLabel;
        
        const color = t.entry_type === 'debit'
          ? { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' }
          : getBatchColor(batchLabel);
        
        const batchStyle = color 
          ? `background: ${color.bg}; border: 1px solid ${color.border}; color: ${color.text};`
          : 'background: #f1f5f9; border: 1px solid #cbd5e1; color: #64748b;';

        html += `
          <tr>
            <td>${fmtDate(t.transaction_date)}</td>
            <td><span class="${t.entry_type}">${t.entry_type === 'credit' ? 'Credit (+)' : 'Debit (−)'}</span></td>
            <td>₱${fmt(amt)}</td>
            <td>${t.label || '—'}</td>
            <td><span class="batch-tag" style="${batchStyle}">${displayLabel}</span></td>
            <td>₱${fmt(running)}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-row">
              <span>Opening Balance:</span>
              <span>₱${fmt(openingBalance)}</span>
            </div>
            <div class="summary-row">
              <span>Total Credits:</span>
              <span class="credit">+₱${fmt(totalCredit)}</span>
            </div>
            <div class="summary-row">
              <span>Total Debits:</span>
              <span class="debit">−₱${fmt(totalDebit)}</span>
            </div>
            <div class="summary-row total">
              <span>Current Balance:</span>
              <span>₱${fmt(currentBalance)}</span>
            </div>
          </div>
        </div>
      `;
    });

    html += `
      </body>
      </html>
    `;

    return html;
  };

  const fmtDate = (raw) => {
    if (!raw) return '—';
    const d = new Date(raw);
    return d.toLocaleDateString('en-PH', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/ /g, ' '); // Ensure single space, although toLocaleDateString handles it
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="tx-root">
        <div className="account-header">
          <div className="account-tabs">
            {ACCOUNTS.map(acc => (
              <button
                key={acc}
                className={`account-tab ${activeAccount === acc ? 'active' : ''}`}
                onClick={() => setActiveAccount(acc)}
              >
                {acc}
              </button>
            ))}
          </div>
          
          {canPrint && (
            <button
              onClick={handlePrint}
              className="print-button"
              title={`Print report for ${completedBatches.length} completed batches`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Report ({completedBatches.length} Batches)
            </button>
          )}
        </div>

        <div className="main-layout">
          {/* Form Panel */}
          <div className="glass-panel sticky">
            <div className="form-header">
              <div className="form-icon">
                <Icon.Plus />
              </div>
              <div className="form-title-group">
                <h2>New Transaction</h2>
                <div className="form-subtitle">{activeAccount}</div>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <Icon.Alert />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={form.transaction_date}
                  onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))}
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label">Type</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-button ${form.entry_type === 'credit' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, entry_type: 'credit' }))}
                  >
                    <Icon.ArrowUp /> Credit
                  </button>
                  <button
                    type="button"
                    className={`toggle-button danger ${form.entry_type === 'debit' ? 'active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, entry_type: 'debit' }))}
                  >
                    <Icon.ArrowDown /> Debit
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Amount</label>
                <div className="amount-input-container">
                  <span className="amount-prefix">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field amount-input"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Reference / Label</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.label}
                  onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. 50238 / Int"
                />
              </div>

              {transactions.length === 0 && (
                <div className="field-group">
                  <label className="field-label">Opening Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}
                    value={form.opening_balance}
                    onChange={e => setForm(f => ({ ...f, opening_balance: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              )}

              {form.amount && (
                <div className={`preview-card ${form.entry_type}`}>
                  <span className="preview-label">Projected Balance</span>
                  <span className={`preview-value ${form.entry_type}`}>
                    ₱{fmt(previewBalance)}
                  </span>
                </div>
              )}

              <button 
                type="submit" 
                className="cta-button"
                disabled={submitting || !form.amount}
              >
                {submitting ? (
                  <>
                    <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon.Plus />
                    Add Transaction
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Main Content */}
          <div>
            <div className="metrics-grid">
              <MetricCard 
                label="Opening" 
                value={openingBalance} 
                icon={Icon.Wallet}
                color="neutral"
              />
              <MetricCard 
                label="Credits" 
                value={totalCredit} 
                icon={Icon.ArrowUp}
                color="success"
              />
              <MetricCard 
                label="Debits" 
                value={totalDebit} 
                icon={Icon.ArrowDown}
                color="danger"
              />
              <MetricCard 
                label="Balance" 
                value={currentBalance} 
                icon={Icon.Balance}
                color="accent"
              />
            </div>

            <div className="glass-panel">
              <div className="table-header">
                <div>
                  <h2 className="table-title">Transaction History</h2>
                  <p className="form-subtitle">{activeAccount} • All activity</p>
                </div>
                <div className="table-stats">
                  {transactions.length} transactions
                </div>
              </div>

              {loading ? (
                <div className="empty-state">
                  <div className="spinner" />
                  <div className="empty-text">Loading transactions...</div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon.File />
                  </div>
                  <div className="empty-text">No transactions yet</div>
                  <p style={{ color: 'var(--text-muted-alt)', fontSize: '15px', marginTop: '0.5rem' }}>
                    Add your first transaction above
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Batch</th>
                        <th>Reference / Label</th>
                        <th>Amount</th>
                        <th>Balance</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let running = openingBalance;
                        return transactions.map(t => {
                          const amt = parseFloat(t.amount || 0);
                          if (t.entry_type === 'credit') running += amt;
                          else running -= amt;
                          
                          const d = fmtDate(t.transaction_date);
                          const batch = t.batch;
                          const batchLabel = batch?.final_batch_number || batch?.batch_number;
                          
                          // For debit transactions, show descriptive word instead of batch number
                          const displayLabel = t.entry_type === 'debit' 
                            ? (t.label || 'Deduction')
                            : batchLabel;
                          
                          const isEditing = editingTransaction?.id === t.id;

                          if (isEditing) {
                            // Inline edit mode
                            return (
                              <tr key={t.id} className="editing-row">
                                <td data-label="Date">
                                  <input
                                    type="date"
                                    defaultValue={t.transaction_date}
                                    className="inline-edit-input"
                                    id={`edit-date-${t.id}`}
                                  />
                                </td>
                                <td data-label="Type">
                                  <select
                                    defaultValue={t.entry_type}
                                    className="inline-edit-select"
                                    id={`edit-type-${t.id}`}
                                  >
                                    <option value="credit">Credit</option>
                                    <option value="debit">Debit</option>
                                  </select>
                                </td>
                                <td data-label="Batch">
                                  {t.entry_type === 'debit' ? (
                                    <span 
                                      className="batch-tag" 
                                      style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        borderColor: 'rgba(239, 68, 68, 0.3)',
                                        color: '#ef4444'
                                      }}
                                    >
                                      {displayLabel}
                                    </span>
                                  ) : batchLabel ? (
                                    <span 
                                      className="batch-tag" 
                                      title={batch?.batch_number}
                                      style={(() => {
                                        const color = getBatchColor(batchLabel);
                                        return color ? {
                                          background: color.bg,
                                          borderColor: color.border,
                                          color: color.text
                                        } : {};
                                      })()}
                                    >
                                      {batchLabel}
                                    </span>
                                  ) : (
                                    <span className="batch-none">—</span>
                                  )}
                                </td>
                                <td data-label="Ref / Label">
                                  <input
                                    type="text"
                                    defaultValue={t.label || ''}
                                    placeholder="Label"
                                    className="inline-edit-input"
                                    id={`edit-label-${t.id}`}
                                  />
                                </td>
                                <td data-label="Amount">
                                  <input
                                    type="number"
                                    step="0.01"
                                    defaultValue={amt}
                                    className="inline-edit-input"
                                    id={`edit-amount-${t.id}`}
                                  />
                                </td>
                                <td data-label="Balance">
                                  <div className="balance-display">
                                    ₱{fmt(running)}
                                  </div>
                                </td>
                                <td data-label="Actions" style={{ textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button 
                                      className="save-button" 
                                      onClick={() => {
                                        const updatedData = {
                                          transaction_date: document.getElementById(`edit-date-${t.id}`).value,
                                          entry_type: document.getElementById(`edit-type-${t.id}`).value,
                                          amount: document.getElementById(`edit-amount-${t.id}`).value,
                                          label: document.getElementById(`edit-label-${t.id}`).value,
                                        };
                                        handleSaveEdit(t.id, updatedData);
                                      }}
                                      title="Save changes"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </button>
                                    <button 
                                      className="cancel-button" 
                                      onClick={handleCancelEdit}
                                      title="Cancel editing"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          // Normal display mode
                          return (
                            <tr key={t.id}>
                              <td data-label="Date">
                                <div className="date-display">{d}</div>
                              </td>
                              <td data-label="Type">
                                <div className={`type-badge ${t.entry_type}`}>
                                  <div className={`type-dot ${t.entry_type}`} />
                                  {t.entry_type}
                                </div>
                              </td>
                              <td data-label="Batch">
                                {t.entry_type === 'debit' ? (
                                  <span 
                                    className="batch-tag" 
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      borderColor: 'rgba(239, 68, 68, 0.3)',
                                      color: '#ef4444'
                                    }}
                                  >
                                    {displayLabel}
                                  </span>
                                ) : batchLabel ? (
                                  <span 
                                    className="batch-tag" 
                                    title={batch?.batch_number}
                                    style={(() => {
                                      const color = getBatchColor(batchLabel);
                                      return color ? {
                                        background: color.bg,
                                        borderColor: color.border,
                                        color: color.text
                                      } : {};
                                    })()}
                                  >
                                    {batchLabel}
                                  </span>
                                ) : (
                                  <span className="batch-none">—</span>
                                )}
                              </td>
                              <td data-label="Ref / Label">
                                <div style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'visible' }}>
                                  {t.label || t.reference || '—'}
                                </div>
                              </td>
                              <td data-label="Amount">
                                <div className={`amount-display ${t.entry_type}`}>
                                  {t.entry_type === 'credit' ? '+' : '−'}₱{fmt(amt)}
                                </div>
                              </td>
                              <td data-label="Balance">
                                <div className="balance-display">
                                  ₱{fmt(running)}
                                </div>
                              </td>
                              <td data-label="Actions" style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button 
                                    className="edit-button" 
                                    onClick={() => handleEdit(t)}
                                    title="Edit transaction"
                                  >
                                    <Icon.Edit />
                                  </button>
                                  <button 
                                    className="delete-button" 
                                    onClick={() => handleDelete(t.id)}
                                    title="Delete transaction"
                                  >
                                    <Icon.Trash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                    <tfoot className="table-footer">
                      <tr>
                        <td colSpan={5}>
                          <div className="footer-stats">Total Activity</div>
                          <div className="footer-amounts">
                            <div className="footer-credit">+₱{fmt(totalCredit)}</div>
                            <div className="footer-debit">−₱{fmt(totalDebit)}</div>
                          </div>
                        </td>
                        <td colSpan={2}>
                          <div className="footer-stats">Current Balance</div>
                          <div className="net-balance">₱{fmt(currentBalance)}</div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Removed EditTransactionModal - using inline editing instead */}
    </>
  );
}