export const BATCH_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

  :root {
    --bg-primary:        #fffbf5;
    --bg-secondary:      #ffffff;
    --bg-tertiary:       #fff7ed;
    --bg-glass:          rgba(255, 255, 255, 0.7);
    --bg-glass-hover:    rgba(251, 146, 60, 0.08);
    
    --border-subtle:     rgba(251, 146, 60, 0.15);
    --border-strong:     rgba(251, 146, 60, 0.25);
    --border-accent:     rgba(249, 115, 22, 0.2);
    
    --accent-primary:    #f97316;
    --accent-secondary:  #fb923c;
    --success-primary:   #22c55e;
    --danger-primary:    #b91c1c;
    --warning-primary:   #ea580c;
    
    --gradient-primary:  linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    --gradient-accent:   linear-gradient(135deg, #fb923c 0%, #f97316 100%);
    --gradient-success:  linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    
    --text-primary:      #431407;
    --text-secondary:    #7c2d12;
    --text-muted:        #9a3412;
    --text-muted-alt:    #c2410c;
    
    --shadow-sm:         0 1px 2px 0 rgba(249, 115, 22, 0.05);
    --shadow-md:         0 4px 6px -1px rgba(249, 115, 22, 0.1);
    --shadow-lg:         0 10px 15px -3px rgba(249, 115, 22, 0.1);
    --shadow-xl:         0 20px 25px -5px rgba(249, 115, 22, 0.15);
    
    --radius-sm:         8px;
    --radius-md:         12px;
    --radius-lg:         16px;
    --radius-xl:         24px;
    
    --font-family:       'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    --font-mono:         'JetBrains Mono', 'SF Mono', Menlo, monospace;
  }

  .bcp-root {
    min-height: 100vh;
    padding: 2rem;
    max-width: 1600px;
    margin: 0 auto;
    font-family: var(--font-family);
    color: var(--text-primary);
    overflow-x: hidden;
  }

  .bcp-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 1.5rem;
    align-items: start;
    min-width: 0;
  }

  @media (max-width: 1200px) {
    .bcp-layout { grid-template-columns: 1fr; gap: 2rem; }
  }

  .glass-card {
    background: var(--bg-glass);
    backdrop-filter: blur(40px);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-lg);
    min-width: 0;
  }

  .glass-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--gradient-accent);
    opacity: 0.4;
  }

  .glass-card.sticky {
    position: sticky;
    top: 2rem;
    align-self: start;
  }

  .section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent-primary);
    margin-bottom: 1rem;
    display: block;
  }

  .h1-modern {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.2;
    margin-bottom: 1.5rem;
  }

  .h2-modern {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
  }

  .metric-card-sm {
    background: var(--bg-glass-hover);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    transition: all 0.2s;
  }

  .metric-card-sm:hover {
    border-color: var(--border-accent);
    background: rgba(59,130,246,0.05);
  }

  .metric-label-sm {
    font-size: 9px;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .metric-value-sm {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .metric-value-sm.accent { color: var(--accent-primary); }
  .metric-value-sm.success { color: var(--success-primary); }
  .metric-value-sm.warning { color: var(--warning-primary); }

  .form-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
    display: block;
  }

  .input-modern {
    width: 100%;
    background: var(--bg-secondary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-size: 14px;
    color: var(--text-primary);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
  }

  .input-modern:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--border-accent);
    background: var(--bg-tertiary);
  }

  .btn-primary-modern {
    width: auto;
    background: var(--gradient-accent);
    border: none;
    border-radius: var(--radius-md);
    padding: 10px 18px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: var(--shadow-lg);
    white-space: nowrap;
    flex-shrink: 0;
    line-height: 1.2;
  }

  .btn-primary-modern:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-xl);
    filter: brightness(1.1);
  }

  .btn-primary-modern:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-icon-modern {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-subtle);
    background: var(--bg-glass);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.2s;
  }

  .btn-icon-modern:hover {
    border-color: var(--border-strong);
    background: var(--bg-glass-hover);
    color: var(--text-primary);
    transform: translateY(-1px);
  }

  .btn-icon-modern.danger:hover {
    border-color: var(--danger-primary);
    background: rgba(239,68,68,0.1);
    color: var(--danger-primary);
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
  }

  .status-pill.success { background: rgba(16,185,129,0.1); color: var(--success-primary); border-color: rgba(16,185,129,0.2); }
  .status-pill.pending { background: rgba(59,130,246,0.1); color: var(--accent-primary); border-color: rgba(59,130,246,0.2); }
  .status-pill.warning { background: rgba(245,158,11,0.1); color: var(--warning-primary); border-color: rgba(245,158,11,0.2); }

  .progress-bar-wrap {
    height: 6px;
    background: var(--bg-secondary);
    border-radius: 10px;
    overflow: hidden;
    margin: 1.5rem 0;
  }

  .progress-fill {
    height: 100%;
    background: var(--gradient-accent);
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    padding-bottom: 0.5rem;
    scrollbar-width: none;
  }

  .filter-tab {
    padding: 8px 16px;
    border-radius: var(--radius-md);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--bg-glass);
    border: 1px solid var(--border-subtle);
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .filter-tab.active {
    background: var(--gradient-accent);
    color: white;
    border-color: transparent;
    box-shadow: var(--shadow-md);
  }

  .receipt-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1.25rem;
  }

  .receipt-card {
    aspect-ratio: 4/5;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--bg-secondary);
    border: 2px solid var(--border-subtle);
    position: relative;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  .receipt-card:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: var(--accent-primary);
    box-shadow: 0 12px 24px rgba(0,0,0,0.12);
  }

  .receipt-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.8;
    transition: all 0.4s;
  }

  .receipt-card:hover .receipt-img {
    opacity: 1;
    transform: scale(1.05);
  }

  .receipt-card.is-not-found {
    border-color: rgba(239, 68, 68, 0.4);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.1);
  }

  .receipt-card.is-not-found::after {
    content: '!';
    position: absolute;
    top: 1rem;
    left: 1rem;
    width: 24px;
    height: 24px;
    background: var(--danger-primary);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 14px;
    z-index: 10;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  }

  .receipt-card.is-not-found .receipt-price {
    color: #ef4444;
  }

  .receipt-info {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(10,14,26,0.95) 0%, transparent 60%);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    opacity: 0.9;
  }

  .receipt-price {
    font-family: var(--font-mono);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--accent-primary);
    margin-top: 0.5rem;
  }

  .receipt-meta {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
  }

  .receipt-delete-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: rgba(10, 14, 26, 0.6);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    opacity: 0;
    transform: translateY(-4px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .receipt-card:hover .receipt-delete-btn {
    opacity: 1;
    transform: translateY(0);
  }

  .receipt-card:hover .receipt-checkbox {
    opacity: 1 !important;
  }

  .receipt-delete-btn:hover {
    background: var(--danger-primary);
    color: white;
    border-color: transparent;
    transform: scale(1.1);
  }

  .batch-header {
    background: var(--bg-glass);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-xl);
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .batch-header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2.5rem;
    gap: 2rem;
  }

  .batch-title {
    font-size: 2.5rem;
  }

  .batch-ledger-id {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 700;
    margin-top: 0.25rem;
  }

  .batch-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .reset-batch-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
    height: 40px;
    border-radius: 12px;
    background: rgba(234,88,12,0.08);
    border: 1px solid rgba(234,88,12,0.25);
    color: #ea580c;
    font-weight: 900;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .reset-batch-btn:hover {
    background: rgba(234,88,12,0.15);
  }

  .view-summary-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 18px;
    height: 40px;
    border-radius: 12px;
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.2);
    color: var(--success-primary);
    font-weight: 900;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .search-sort-container {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .search-input-wrapper {
    flex: 1;
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    opacity: 0.6;
  }

  .search-input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    border-radius: 10px;
    border: 1px solid var(--border-subtle);
    background: var(--bg-secondary);
    font-size: 11px;
    color: var(--text-primary);
    outline: none;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s;
  }

  .search-input:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
  }

  .sort-select {
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--border-subtle);
    background: var(--bg-secondary);
    font-size: 11px;
    color: var(--text-primary);
    outline: none;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    min-width: 160px;
    transition: all 0.2s;
  }

  .sort-select:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
  }

  .results-count {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    text-decoration: none;
    margin-bottom: 1.5rem;
    transition: color 0.2s;
  }

  .back-link:hover { color: var(--text-primary); }

  .empty-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem;
    color: var(--text-muted);
    background: var(--bg-secondary);
    border: 1px dashed var(--border-strong);
  }

  .empty-icon-lg {
    font-size: 3rem;
    opacity: 0.2;
  }

  .drop-zone {
    background: var(--bg-secondary);
    border: 2px dashed var(--border-subtle);
    border-radius: var(--radius-xl);
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .drop-zone:hover {
    border-color: var(--accent-primary);
    background: rgba(59,130,246,0.05);
  }

  .drop-zone input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .drop-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    opacity: 0.3;
  }

  .spinner-modern {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(0,0,0,0.05);
    border-top: 3px solid var(--accent-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* ─── Stages ─── */
  .stages-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2.5rem;
    position: relative;
    padding: 0 1rem;
  }

  .stages-line {
    position: absolute;
    top: 20px;
    left: 40px;
    right: 40px;
    height: 2px;
    background: var(--bg-tertiary);
    z-index: 0;
  }

  .stages-line-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: var(--gradient-accent);
    transition: width 0.5s ease;
  }

  .stage-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    position: relative;
    z-index: 1;
    width: 100px;
  }

  .stage-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg-tertiary);
    border: 2px solid var(--border-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 800;
    color: var(--text-muted);
    transition: all 0.3s;
  }

  .stage-item.active .stage-circle {
    background: var(--bg-primary);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    box-shadow: 0 0 20px var(--border-accent);
    transform: scale(1.1);
  }

  .stage-item.done .stage-circle {
    background: var(--gradient-success);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
  }

  .stage-label {
    font-size: 10px;
    font-weight: 800;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: center;
  }

  .stage-item.active .stage-label { color: var(--accent-primary); font-weight: 900; }
  .stage-item.done .stage-label { color: var(--success-primary); font-weight: 700; }

  /* ─── Modals ─── */
  .ort-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
    backdrop-filter: blur(12px);
    animation: modal-fade-in 0.3s ease;
  }

  @keyframes modal-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ─── RESPONSIVE STYLES ─── */
  @media (max-width: 1200px) {
    .bcp-layout { grid-template-columns: 1fr; }
  }
  
  @media (max-width: 1024px) {
    .receipt-grid { grid-template-columns: repeat(4, 1fr); }
  }

  @media (max-width: 768px) {
    .bcp-root { padding: 1rem; }
    .receipt-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .glass-card { padding: 1.25rem 1rem; border-radius: var(--radius-lg); }
    .batch-header { padding: 1.25rem; }
    .stages-wrap { padding: 0; gap: 0.5rem; }
    .stage-item { width: auto; }
    .stage-label { font-size: 8px; }
    .h1-modern { font-size: 1.5rem; }
    
    /* Mobile-specific fixes for search and controls */
    .filter-bar { flex-wrap: wrap; }
    
    /* Stack search and sort on mobile */
    .search-sort-container {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    
    /* Make sort select full-width on mobile */
    .sort-select {
      min-width: unset !important;
      width: 100% !important;
    }
  }

  @media (max-width: 480px) {
    .receipt-grid { grid-template-columns: 1fr; }
    .stages-wrap { 
      flex-wrap: wrap; 
      gap: 1rem; 
      justify-content: center;
    }
    .drop-zone { padding: 2rem 1rem; }
    .empty-box { padding: 3rem 1.5rem; }
    .bcp-root { padding: 0.75rem; }
    
    /* iPhone 13 specific fixes */
    .metric-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    .batch-header {
      padding: 1.25rem !important;
    }
    .glass-card {
      padding: 1rem !important;
    }
  }

  /* iPhone 13 and medium mobile devices */
  @media (max-width: 768px) {
    .batch-header-top {
      flex-direction: column !important;
      gap: 1rem !important;
    }

    .batch-title {
      font-size: 1.8rem !important;
    }

    .batch-actions {
      width: 100% !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
    }

    /* Icon-only buttons stay small squares */
    .btn-icon-modern {
      flex-shrink: 0;
    }

    /* Reset button stays compact */
    .reset-batch-btn {
      flex-shrink: 0;
    }

    /* Primary action button fills remaining space */
    .btn-primary-modern {
      flex: 1 1 auto !important;
      width: 100% !important;
      justify-content: center !important;
      margin-top: 4px !important;
    }

    /* View summary button also full width */
    .view-summary-btn {
      flex: 1 1 auto !important;
      width: 100% !important;
      justify-content: center !important;
    }

    .search-sort-container {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 1rem !important;
    }

    .sort-select {
      min-width: unset !important;
      width: 100% !important;
    }

    .glass-card {
      padding: 1.5rem !important;
    }

    .metric-grid {
      gap: 1rem !important;
    }
  }

  /* Extra small devices (iPhone SE, etc.) */
  @media (max-width: 390px) {
    .metric-grid {
      grid-template-columns: 1fr !important;
    }
    .stage-label {
      font-size: 7px !important;
    }
    .stage-circle {
      width: 32px !important;
      height: 32px !important;
      font-size: 12px !important;
    }
    .stages-line {
      top: 16px !important;
    }
    .batch-title {
      font-size: 1.5rem !important;
    }
  }
`;
