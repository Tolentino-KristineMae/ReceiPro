import React, { useEffect, useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  .ocr-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.82);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 16px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: ocr-fade-in 0.25s ease;
  }
  @keyframes ocr-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .ocr-card {
    background: #111318;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 24px;
    width: 100%;
    max-width: 480px;
    overflow: hidden;
    box-shadow: 0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
    animation: ocr-slide-up 0.3s cubic-bezier(0.22,1,0.36,1);
  }
  @keyframes ocr-slide-up {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  /* ── Header ── */
  .ocr-header {
    padding: 26px 28px 22px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
    position: relative;
  }
  .ocr-header-icon {
    width: 44px;
    height: 44px;
    border-radius: 13px;
    background: rgba(200,169,110,0.1);
    border: 1px solid rgba(200,169,110,0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #c8a96e;
  }
  .ocr-title {
    font-family: 'Syne', sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: #f0eadf;
    letter-spacing: -0.01em;
    margin-bottom: 4px;
  }
  .ocr-subtitle {
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    color: #53535a;
    letter-spacing: 0.02em;
  }
  .ocr-counter {
    margin-left: auto;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    color: #8a8a8e;
    background: #1e2129;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 50px;
    padding: 5px 13px;
    white-space: nowrap;
    letter-spacing: 0.04em;
    align-self: flex-start;
    margin-top: 2px;
  }

  /* ── Progress bar ── */
  .ocr-progress-track {
    height: 2px;
    background: rgba(255,255,255,0.05);
    position: relative;
  }
  .ocr-progress-fill {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    background: linear-gradient(90deg, #c8a96e, #e4c98a);
    transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
    border-radius: 0 2px 2px 0;
  }
  .ocr-progress-glow {
    position: absolute;
    right: -8px; top: 50%;
    transform: translateY(-50%);
    width: 16px; height: 8px;
    background: #e4c98a;
    filter: blur(6px);
    border-radius: 50%;
    opacity: 0.6;
  }

  /* ── List ── */
  .ocr-list {
    padding: 8px 20px 4px;
    max-height: 280px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
  }
  .ocr-list::-webkit-scrollbar { width: 4px; }
  .ocr-list::-webkit-scrollbar-track { background: transparent; }
  .ocr-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

  .ocr-item {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 11px 10px;
    border-radius: 12px;
    transition: background 0.2s;
  }
  .ocr-item.active { background: rgba(255,255,255,0.03); }

  /* Status dot/icon */
  .ocr-status {
    width: 28px;
    height: 28px;
    border-radius: 9px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ocr-status.waiting {
    background: #1e2129;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .ocr-status.processing {
    background: rgba(200,169,110,0.08);
    border: 1px solid rgba(200,169,110,0.2);
  }
  .ocr-status.done {
    background: rgba(82,200,122,0.08);
    border: 1px solid rgba(82,200,122,0.18);
  }
  .ocr-status.skipped {
    background: rgba(234,179,8,0.07);
    border: 1px solid rgba(234,179,8,0.15);
  }
  .ocr-status.error {
    background: rgba(224,92,106,0.07);
    border: 1px solid rgba(224,92,106,0.18);
  }

  .ocr-spinner {
    width: 14px; height: 14px;
    border: 1.5px solid rgba(200,169,110,0.25);
    border-top-color: #c8a96e;
    border-radius: 50%;
    animation: ocr-spin 0.65s linear infinite;
  }
  @keyframes ocr-spin { to { transform: rotate(360deg); } }

  .ocr-wait-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.1);
  }

  /* Text */
  .ocr-item-body { flex: 1; min-width: 0; }
  .ocr-item-name {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #f0eadf;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ocr-item-name.muted { color: #53535a; }
  .ocr-item-detail {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    color: #53535a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: 0.02em;
  }
  .ocr-item-detail.green { color: #52c87a; }
  .ocr-item-detail.amber { color: #c8a96e; }
  .ocr-item-detail.red   { color: #e05c6a; }

  /* Receipt number badge */
  .ocr-num {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    color: #53535a;
    background: #1e2129;
    border-radius: 6px;
    padding: 2px 7px;
    letter-spacing: 0.06em;
  }

  /* Divider */
  .ocr-divider {
    height: 1px;
    background: rgba(255,255,255,0.05);
    margin: 4px 0;
  }

  /* ── Footer ── */
  .ocr-footer {
    padding: 16px 28px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ocr-footer-pulse {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #c8a96e;
    flex-shrink: 0;
    animation: ocr-pulse 1.8s ease-in-out infinite;
  }
  @keyframes ocr-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }
  .ocr-footer-text {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    color: #53535a;
    letter-spacing: 0.04em;
  }
  .ocr-footer-pct {
    margin-left: auto;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    color: #c8a96e;
    letter-spacing: 0.04em;
  }
`;

// ─── Status icons ─────────────────────────────────────────────────────────────
function StatusIcon({ status }) {
  if (status === 'waiting') return <div className="ocr-wait-dot" />;

  if (status === 'processing') return <div className="ocr-spinner" />;

  if (status === 'done')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52c87a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    );

  if (status === 'skipped')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3l4 4-4 4M3 12h18M7 21l-4-4 4-4" />
      </svg>
    );

  if (status === 'error')
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e05c6a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    );

  return null;
}

function ScanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function detailColor(status) {
  if (status === 'done')    return 'green';
  if (status === 'error')   return 'red';
  if (status === 'skipped') return 'amber';
  return '';
}

// ─── OcrProcessor ─────────────────────────────────────────────────────────────
const OcrProcessor = ({ cropResults, onDone }) => {
  const [progress, setProgress]       = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const workerRef = useRef(null);
  const doneRef   = useRef(false);

  useEffect(() => {
    setProgress(
      cropResults.map(r => ({
        id:     r.receipt.id,
        status: r.manualEntry ? 'skipped' : 'waiting',
        text:   r.manualEntry ? 'Manual entry — skipping OCR' : '',
      }))
    );
  }, []);

  useEffect(() => {
    if (doneRef.current) return;
    runAll();
    return () => { if (workerRef.current) workerRef.current.terminate(); };
  }, []);

  const runAll = async () => {
    const worker = await createWorker('eng', 1, { logger: () => {} });
    workerRef.current = worker;
    const ocrResults = [];

    for (let i = 0; i < cropResults.length; i++) {
      const item = cropResults[i];
      setCurrentIndex(i);

      if (item.manualEntry) {
        ocrResults.push({ receipt: item.receipt, amount: null, reference: null, confidence: 0, manualEntry: true });
        setProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'skipped', text: 'Manual entry — skipping OCR' } : p
        ));
        continue;
      }

      setProgress(prev => prev.map((p, idx) =>
        idx === i ? { ...p, status: 'processing', text: 'Analysing image…' } : p
      ));

      try {
        const imageSource = item.croppedDataUrl
          || `http://localhost:8000/api/receipts/${item.receipt.id}/image`;

        const { data } = await worker.recognize(imageSource);
        const { amount, reference, date } = extractFields(data.text);

        ocrResults.push({
          receipt: item.receipt,
          amount,
          reference,
          date,
          confidence: Math.round(data.confidence),
          manualEntry: false,
          rawText: data.text,
        });

        const parts = [
          amount    ? `₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null,
          reference ? `Ref ${reference}` : null,
          date      ? date : null,
        ].filter(Boolean);

        setProgress(prev => prev.map((p, idx) =>
          idx === i ? {
            ...p,
            status: 'done',
            text: parts.length ? parts.join(' · ') : `Confidence ${Math.round(data.confidence)}%`,
            rawText: data.text,
          } : p
        ));
      } catch {
        ocrResults.push({ receipt: item.receipt, amount: null, reference: null, confidence: 0, manualEntry: true, rawText: '' });
        setProgress(prev => prev.map((p, idx) =>
          idx === i ? { ...p, status: 'error', text: 'OCR failed — will enter manually' } : p
        ));
      }
    }

    await worker.terminate();
    doneRef.current = true;
    onDone(ocrResults);
  };

  const done    = progress.filter(p => p.status === 'done' || p.status === 'skipped' || p.status === 'error').length;
  const pct     = cropResults.length > 0 ? Math.round((done / cropResults.length) * 100) : 0;
  const allDone = done === cropResults.length && cropResults.length > 0;

  return (
    <>
      <style>{CSS}</style>
      <div className="ocr-overlay">
        <div className="ocr-card">

          {/* Header */}
          <div className="ocr-header">
            <div className="ocr-header-icon"><ScanIcon /></div>
            <div>
              <div className="ocr-title">Reading Receipts</div>
              <div className="ocr-subtitle">
                {allDone
                  ? 'All receipts processed'
                  : `Processing ${Math.min(currentIndex + 1, cropResults.length)} of ${cropResults.length}`}
              </div>
            </div>
            <div className="ocr-counter">{done}/{cropResults.length}</div>
          </div>

          {/* Progress track */}
          <div className="ocr-progress-track">
            <div className="ocr-progress-fill" style={{ width: `${pct}%` }}>
              {!allDone && <div className="ocr-progress-glow" />}
            </div>
          </div>

          {/* List */}
          <div className="ocr-list">
            {progress.map((p, i) => (
              <div
                key={p.id}
                className={`ocr-item${p.status === 'processing' ? ' active' : ''}`}
              >
                <div className={`ocr-status ${p.status}`}>
                  <StatusIcon status={p.status} />
                </div>
                <div className="ocr-item-body">
                  <div className={`ocr-item-name${p.status === 'waiting' ? ' muted' : ''}`}>
                    Receipt
                    <span className="ocr-num">#{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  {p.text && (
                    <div className={`ocr-item-detail ${detailColor(p.status)}`}>
                      {p.text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="ocr-divider" />

          {/* Footer */}
          <div className="ocr-footer">
            {allDone
              ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52c87a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ocr-footer-text" style={{ color: '#52c87a' }}>All receipts processed</span>
                </>
              ) : (
                <>
                  <div className="ocr-footer-pulse" />
                  <span className="ocr-footer-text">Do not close this window</span>
                </>
              )}
            <span className="ocr-footer-pct">{pct}%</span>
          </div>

        </div>
      </div>
    </>
  );
};

// ─── Field extraction (unchanged logic) ──────────────────────────────────────
function extractFields(text) {
  const normalized = text
    .replace(/\r/g, '\n')
    .replace(/[|\\[\]{}]/g, ' ')
    .replace(/[''`]/g, '')
    .replace(/\u00a0/g, ' ');

  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  let amount = null;
  let reference = null;

  const refLabelRe = /(?:ref(?:erence)?(?:\s*(?:no|num|number)\.?)?|trace\s*no|transaction\s*(?:ref|id|no))[:\s#.]*/i;

  const pull13 = (str) => {
    let m = str.replace(/\s/g, '').match(/\d{13}/);
    if (m) return m[0];
    const collapsed = str.replace(/(\d)\s+(\d)/g, '$1$2').replace(/(\d)\s+(\d)/g, '$1$2');
    m = collapsed.match(/\d{13}/);
    if (m) return m[0];
    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    if (!refLabelRe.test(lines[i])) continue;
    const afterLabel = lines[i].replace(refLabelRe, '').trim();
    const fromSameLine = pull13(afterLabel);
    if (fromSameLine) { reference = fromSameLine; break; }
    const fromNextLine = pull13(lines[i + 1] || '');
    if (fromNextLine) { reference = fromNextLine; break; }
  }

  if (!reference) {
    for (const line of lines) {
      const found = pull13(line);
      if (found) { reference = found; break; }
    }
  }

  if (!reference) {
    const noSpaces = text.replace(/\s/g, '');
    const m = noSpaces.match(/\d{13}/);
    if (m) reference = m[0];
  }

  const amountLabelRe = /\b(?:total\s*amount|amount|total|amt)\b[\s:]*/i;
  const currencyRe    = /(?:php|₱|P)\s*([\d,]+(?:\.[0-9]{1,2})?)/i;

  for (const line of lines) {
    const labelMatch = line.match(amountLabelRe);
    if (labelMatch) {
      const afterAmt = line.slice(labelMatch.index + labelMatch[0].length).trim();
      const numMatch = afterAmt.match(/([\d,]+(?:\.[0-9]{1,2})?)/);
      if (numMatch) {
        const val = parseFloat(numMatch[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0 && val < 10_000_000) { amount = val; break; }
      }
    }
    const currMatch = line.match(currencyRe);
    if (currMatch && !amount) {
      const val = parseFloat(currMatch[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0 && val < 10_000_000) { amount = val; }
    }
  }

  if (!amount) {
    for (const line of lines) {
      const m = line.match(/\b([\d,]+\.[0-9]{2})\b/);
      if (m) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0 && val < 10_000_000) { amount = val; break; }
      }
    }
  }

  return { amount, reference, date: extractDate(lines) };
}

function extractDate(lines) {
  const MONTHS       = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const MONTH_SHORT  = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const toMonthName  = (idx) => ['January','February','March','April','May','June','July','August','September','October','November','December'][idx];
  const fmt          = (month, day, year) => `${toMonthName(month)} ${parseInt(day)}, ${year}`;

  for (const line of lines) {
    for (let mi = 0; mi < MONTHS.length; mi++) {
      const re = new RegExp(`\\b(?:${MONTHS[mi]}|${MONTH_SHORT[mi]})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'i');
      const m = line.match(re);
      if (m) return fmt(mi, m[1], m[2]);
    }
    for (let mi = 0; mi < MONTHS.length; mi++) {
      const re = new RegExp(`\\b(\\d{1,2})\\s+(?:${MONTHS[mi]}|${MONTH_SHORT[mi]})\\.?\\s+(\\d{4})\\b`, 'i');
      const m = line.match(re);
      if (m) return fmt(mi, m[1], m[2]);
    }
    { const m = line.match(/\b(0?[1-9]|1[0-2])[\/\-\.](0?[1-9]|[12]\d|3[01])[\/\-\.](\d{4})\b/); if (m) return fmt(parseInt(m[1])-1, m[2], m[3]); }
    { const m = line.match(/\b(\d{4})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/);     if (m) return fmt(parseInt(m[2])-1, m[3], m[1]); }
  }
  return null;
}

export default OcrProcessor;