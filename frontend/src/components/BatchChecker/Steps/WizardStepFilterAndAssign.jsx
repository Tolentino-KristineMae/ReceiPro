import React, { useState } from 'react';

const CATEGORY_OPTIONS = [
  {
    id: 'gcash',
    label: 'GCash',
    description: 'Mobile wallet transfers',
    tag: 'Digital',
    gradient: 'linear-gradient(145deg, #4f46e5 0%, #7c3aed 100%)',
    glowColor: 'rgba(99,102,241,0.35)',
    borderColor: 'rgba(139,92,246,0.55)',
    hoverBg: 'rgba(99,102,241,0.08)',
    accentColor: '#a78bfa',
    checkColor: '#a78bfa',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'others',
    label: 'Others',
    description: 'Bank slips & invoices',
    tag: 'Manual',
    gradient: 'linear-gradient(145deg, #0891b2 0%, #0e7490 100%)',
    glowColor: 'rgba(6,182,212,0.3)',
    borderColor: 'rgba(34,211,238,0.45)',
    hoverBg: 'rgba(6,182,212,0.08)',
    accentColor: '#67e8f9',
    checkColor: '#67e8f9',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="12" y2="17" />
      </svg>
    ),
  },
];

const ACCOUNT_THEMES = {
  Babilyn:  { gradient: 'linear-gradient(135deg,#a78bfa,#7c3aed)', glow: 'rgba(139,92,246,0.4)', accent: '#c4b5fd' },
  Nixie:    { gradient: 'linear-gradient(135deg,#f472b6,#db2777)', glow: 'rgba(244,114,182,0.4)', accent: '#f9a8d4' },
  Kristine: { gradient: 'linear-gradient(135deg,#38bdf8,#0284c7)', glow: 'rgba(56,189,248,0.4)',  accent: '#7dd3fc' },
};

const CheckIcon = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StepLabel = ({ number, label, active, done }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    <div style={{
      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontFamily: "'DM Mono', monospace", fontWeight: 500,
      background: done ? 'rgba(52,211,153,0.15)' : active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${done ? 'rgba(52,211,153,0.4)' : active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
      color: done ? '#34d399' : active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
      transition: 'all 0.3s ease',
    }}>
      {done
        ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        : number
      }
    </div>
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: 9,
      fontWeight: 500,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: done ? '#34d399' : active ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)',
      transition: 'color 0.3s ease',
    }}>{label}</span>
  </div>
);

export default function WizardStepFilterAndAssign({
  currentCategory,
  currentAccount,
  onCategorySelect,
  onAccountSelect,
  accounts,
}) {
  const [catPressed, setCatPressed] = useState(null);
  const [accPressed, setAccPressed] = useState(null);

  const handleCategory = (id) => {
    setCatPressed(id);
    setTimeout(() => { setCatPressed(null); onCategorySelect(id); }, 160);
  };
  const handleAccount = (acc) => {
    setAccPressed(acc);
    setTimeout(() => { setAccPressed(null); onAccountSelect(acc); }, 160);
  };

  const needsAccount = currentCategory === 'gcash';
  const isReady = currentCategory && (!needsAccount || currentAccount);
  const activeCat = CATEGORY_OPTIONS.find(c => c.id === currentCategory);

  return (
    <div style={{ paddingBottom: '20px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&family=Figtree:wght@400;500;600;700&display=swap');

        .wfa-root {
          font-family: 'Figtree', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        /* Progress bar */
        .wfa-progress {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 2px;
        }
        .wfa-progress-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
          border-radius: 1px;
        }
        .wfa-progress-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          border-radius: 1px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Section block */
        .wfa-section {
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .wfa-section.locked {
          opacity: 0.22;
          pointer-events: none;
          transform: translateY(6px);
        }

        /* Section header */
        .wfa-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .wfa-section-line {
          flex: 1; height: 1px;
          background: rgba(255,255,255,0.05);
        }

        /* Category grid */
        .wfa-cat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* Category card */
        .wfa-cat-card {
          position: relative;
          border-radius: 14px;
          padding: 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow: hidden;
          user-select: none;
          transition:
            transform 0.26s cubic-bezier(0.34,1.56,0.64,1),
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.25s ease;
        }
        .wfa-cat-card:not(.active) {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .wfa-cat-card.active {
          border: 1.5px solid var(--cat-border);
          background: var(--cat-hover-bg);
          box-shadow: 0 0 0 1px var(--cat-border), 0 8px 28px rgba(0,0,0,0.3);
        }
        .wfa-cat-card:not(.active):hover {
          transform: translateY(-2px) scale(1.01);
          border-color: var(--cat-border);
          background: var(--cat-hover-bg);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .wfa-cat-card.pressed { transform: scale(0.96) !important; box-shadow: none !important; }

        .wfa-cat-glow {
          position: absolute;
          top: -24px; right: -24px;
          width: 80px; height: 80px;
          border-radius: 50%;
          background: var(--cat-glow);
          filter: blur(22px);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .wfa-cat-card:hover .wfa-cat-glow,
        .wfa-cat-card.active .wfa-cat-glow { opacity: 1; }

        .wfa-cat-icon {
          width: 32px; height: 32px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
          transition: transform 0.26s cubic-bezier(0.34,1.56,0.64,1);
        }
        .wfa-cat-card:hover .wfa-cat-icon,
        .wfa-cat-card.active .wfa-cat-icon { transform: scale(1.07) rotate(-3deg); }

        .wfa-cat-label {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.88);
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .wfa-cat-desc {
          font-size: 10px;
          color: rgba(255,255,255,0.3);
          line-height: 1.3;
          margin-top: 1px;
        }
        .wfa-cat-tag {
          position: absolute;
          top: 12px; right: 12px;
          font-family: 'DM Mono', monospace;
          font-size: 9px; font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 100px;
          color: var(--cat-accent);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          transition: background 0.2s;
        }
        .wfa-cat-card.active .wfa-cat-tag {
          background: rgba(255,255,255,0.07);
          border-color: var(--cat-border);
        }
        .wfa-cat-check {
          position: absolute;
          bottom: 14px; right: 14px;
          display: flex; align-items: center; justify-content: center;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: var(--cat-glow);
          border: 1.5px solid var(--cat-border);
          opacity: 0;
          transform: scale(0.6);
          transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .wfa-cat-card.active .wfa-cat-check {
          opacity: 1;
          transform: scale(1);
        }

        /* Account pills */
        .wfa-acc-grid {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .wfa-acc-pill {
          flex: 1;
          min-width: 70px;
          padding: 8px 4px;
          border-radius: 10px;
          cursor: pointer;
          text-align: center;
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          user-select: none;
          position: relative;
          overflow: hidden;
          transition:
            transform 0.24s cubic-bezier(0.34,1.56,0.64,1),
            box-shadow 0.2s ease;
        }
        .wfa-acc-pill:not(.active) {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.35);
        }
        .wfa-acc-pill:not(.active):hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.65);
          border-color: rgba(255,255,255,0.14);
        }
        .wfa-acc-pill.active {
          border: 1.5px solid transparent;
          color: #fff;
        }
        .wfa-acc-pill.pressed { transform: scale(0.95) !important; }

        /* Status bar */
        .wfa-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          transition: border-color 0.4s ease, background 0.4s ease;
        }
        .wfa-status-dot {
          display: none;
        }
        .wfa-status-dot.pulse {
          animation: none;
        }
        @keyframes wfa-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }
        .wfa-status-text {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          transition: color 0.4s ease;
        }

        .wfa-ready-arrow {
          display: inline-flex;
          align-items: center;
          margin-left: 4px;
          animation: wfa-arrow 1.2s ease-in-out infinite;
        }
        @keyframes wfa-arrow {
          0%, 100% { transform: translateX(0); }
          50%       { transform: translateX(4px); }
        }
      `}</style>

      <div className="wfa-root">

        {/* Progress row */}
        <div className="wfa-progress">
          <StepLabel number="1" label="Category" active={!currentCategory} done={!!currentCategory} />
          <div className="wfa-progress-line">
            <div className="wfa-progress-fill" style={{
              width: isReady ? '100%' : currentCategory ? (needsAccount && !currentAccount ? '50%' : '100%') : '0%',
              background: isReady ? '#34d399' : activeCat?.accentColor || 'rgba(255,255,255,0.2)',
            }} />
          </div>
          <StepLabel
            number="2"
            label={needsAccount ? 'Account' : 'Done'}
            active={!!currentCategory && needsAccount && !currentAccount}
            done={isReady}
          />
        </div>

        {/* ── Step 1: Category ── */}
        <div className="wfa-section">
          <div className="wfa-section-header">
            <div className="wfa-section-line" />
            <StepLabel number="1" label="Sorting" active={!currentCategory} done={!!currentCategory} />
            <div className="wfa-section-line" />
          </div>

          <div className="wfa-cat-grid">
            {CATEGORY_OPTIONS.map(opt => (
              <div
                key={opt.id}
                className={`wfa-cat-card${currentCategory === opt.id ? ' active' : ''}${catPressed === opt.id ? ' pressed' : ''}`}
                style={{
                  '--cat-gradient': opt.gradient,
                  '--cat-glow': opt.glowColor,
                  '--cat-border': opt.borderColor,
                  '--cat-hover-bg': opt.hoverBg,
                  '--cat-accent': opt.accentColor,
                }}
                onClick={() => handleCategory(opt.id)}
              >
                <div className="wfa-cat-glow" />
                <div className="wfa-cat-tag">{opt.tag}</div>

                <div className="wfa-cat-icon" style={{ background: opt.gradient, boxShadow: `0 6px 18px ${opt.glowColor}` }}>
                  {opt.icon}
                </div>

                <div>
                  <div className="wfa-cat-label">{opt.label}</div>
                  <div className="wfa-cat-desc">{opt.description}</div>
                </div>

                <div className="wfa-cat-check">
                  <CheckIcon color={opt.accentColor} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 2: Account (gcash only) ── */}
        {needsAccount && (
          <div className="wfa-section animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="wfa-section-header">
              <div className="wfa-section-line" />
              <StepLabel
                number="2"
                label="Assign Account"
                active={!currentAccount}
                done={!!currentAccount}
              />
              <div className="wfa-section-line" />
            </div>

            <div className="wfa-acc-grid">
              {(accounts || []).map(acc => {
                const theme = ACCOUNT_THEMES[acc] || { gradient: 'rgba(255,255,255,0.1)', glow: 'rgba(255,255,255,0.1)', accent: '#fff' };
                const isActive = currentAccount === acc;
                return (
                  <div
                    key={acc}
                    className={`wfa-acc-pill${isActive ? ' active' : ''}${accPressed === acc ? ' pressed' : ''}`}
                    style={isActive ? {
                      background: theme.gradient,
                      boxShadow: `0 6px 20px ${theme.glow}`,
                      border: '1.5px solid transparent',
                    } : {}}
                    onClick={() => handleAccount(acc)}
                  >
                    {acc}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
