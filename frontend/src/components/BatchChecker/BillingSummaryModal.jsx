import React, { useRef, useState, useEffect } from 'react';
import { getApiUrl } from '../../apiConfig';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Shared orange and earthy palette for the billing report. */

const Row = ({ label, value, valueColor = '#3e3028', dim = false }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '9px 0',
  }}>
    <span style={{ fontSize: '12px', fontWeight: 500, color: dim ? '#746355' : '#746355', fontFamily: "'Inter', sans-serif", letterSpacing: '0.01em' }}>
      {label}
    </span>
    <span style={{ fontSize: '13px', fontWeight: 600, color: valueColor, fontFamily: "'DM Mono', monospace", letterSpacing: '-0.01em' }}>
      {value}
    </span>
  </div>
);

const Chip = ({ label, count, total, coin }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '10px 14px', borderRadius: '12px',
    background: coin ? '#f5ede2' : '#fbf7f2',
    border: `1px solid ${coin ? '#746355' : '#eadfd2'}`,
    minWidth: '68px', gap: '2px',
  }}>
    <span style={{ fontSize: '11px', fontWeight: 600, color: '#60452f', letterSpacing: '0.08em', textTransform: 'none', fontFamily: "'Inter', sans-serif" }}>
      {label}
    </span>
    <span style={{ fontSize: '16px', fontWeight: 600, color: '#3e3028', lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>
      ×{count}
    </span>
    <span style={{ fontSize: '11px', color: '#963b16', fontFamily: "'DM Mono', monospace" }}>
      ₱{Number(total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
    </span>
  </div>
);

const Divider = ({ style }) => (
  <div style={{ height: '1px', background: '#eadfd2', margin: '4px 0', ...style }} />
);

const Tag = ({ children, color = '#963b16', bg = '#fbf7f2', border = '#eadfd2' }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '5px 12px', borderRadius: '100px',
    background: bg, border: `1px solid ${border}`,
    color, fontSize: '11px', fontWeight: 600,
    textTransform: 'none', letterSpacing: '0.12em',
    fontFamily: "'Inter', sans-serif",
  }}>
    {children}
  </div>
);

/* ─── main component ─── */

const BillingSummaryModal = ({
  onClose,
  batchNumber,
  finalBatchNumber,
  grossAmount,
  serviceFee,
  deductions = [],
  netAmount,
  billingMethod,
  cashDenominations,
  bankTransferAmount,
  bankTransferAmounts,
  totalPrepared,
  verifiedClaims,
}) => {
  // Resolve partial transfers — prefer array, fall back to single value
  const resolvedTransfers = Array.isArray(bankTransferAmounts) && bankTransferAmounts.length > 0
    ? bankTransferAmounts.filter(v => Number(v) > 0)
    : bankTransferAmount > 0 ? [bankTransferAmount] : [];
  const cardRef = useRef(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deductionTypes, setDeductionTypes] = useState([]);

  // Fetch deduction types to get labels
  useEffect(() => {
    const fetchDeductionTypes = async () => {
      try {
        const response = await fetch(getApiUrl('/api/settings/deduction-types'));
        if (response.ok) {
          const data = await response.json();
          setDeductionTypes(data.deduction_types || []);
        }
      } catch (error) {
        console.error('Failed to fetch deduction types:', error);
      }
    };
    fetchDeductionTypes();
  }, []);

  // Debug: Log deductions when component mounts or deductions change
  useEffect(() => {
    console.log('=== BillingSummaryModal Debug ===');
    console.log('Deductions received:', deductions);
    console.log('Deductions length:', deductions?.length);
    console.log('Deduction types loaded:', deductionTypes);
  }, [deductions, deductionTypes]);

  // Get label for deduction type
  const getDeductionLabel = (key) => {
    const deduction = deductionTypes.find(d => d.key === key);
    return deduction ? deduction.label : key;
  };

  const today = new Date().toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const cashTotal = Object.entries(cashDenominations || {}).reduce((sum, [key, count]) => {
    const val = key.startsWith('c') ? Number(key.slice(1)) : Number(key);
    return sum + val * (count || 0);
  }, 0);

  const billDenoms = [1000, 500, 200, 100, 50, 20].filter(v => (cashDenominations?.[v] || 0) > 0);
  const coinDenoms = [20, 10, 5, 1].filter(v => (cashDenominations?.['c' + v] || 0) > 0);

  // Get account holders with counts from verified claims
  const accountHolderCounts = (() => {
    if (!verifiedClaims || verifiedClaims.length === 0) return [];
    const counts = {};
    verifiedClaims.forEach(c => {
      const name = c.account_holder || (c.receipt && c.receipt.account_holder) || null;
      if (name) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  })();

  // Check if we're on mobile
  const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const scale = isMobile() ? 1 : 2;

  const captureCanvas = async () => {
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas(cardRef.current, {
      backgroundColor: '#ffffff',
      scale,
      useCORS: true,
      logging: false,
      imageTimeout: 10000 // Prevent hanging on image load
    });
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setCopying(true);
    try {
      const canvas = await captureCanvas();
      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `billing-${finalBatchNumber || batchNumber}-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setCopying(false);
      }, 'image/png', 0.92); // Add compression quality
    } catch { setCopying(false); }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setCopying(true);
    try {
      const canvas = await captureCanvas();
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-${finalBatchNumber || batchNumber}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setCopying(false);
      }, 'image/png', 0.92);
    } catch { setCopying(false); }
  };

  return (
    <>
      <style>{`
        @keyframes bsModalIn { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes bsSpin { to { transform: rotate(360deg); } }
        .bs-btn:hover { opacity: 0.82 !important; }
        .bs-close:hover { background: #fbf7f2 !important; color: #963b16 !important; }
        .bs-claim-row:hover { background: #fffdfa !important; }
      `}</style>

      {/* Overlay */}
      <div role="dialog" aria-modal="true" aria-label="Billing summary"
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(10,22,40,0.55)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          zIndex: 2000, padding: '12px',
          overflowY: 'auto',
        }}
      >
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '10px',
          alignItems: 'center',
          animation: 'bsModalIn 0.25s cubic-bezier(0.16,1,0.3,1)',
          width: '100%',
          paddingTop: '12px',
          paddingBottom: '12px',
        }}>

          {/* ── Action Bar ── */}
          <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '560px' }}>
            {/* Copy */}
            <button
              className="bs-btn"
              onClick={handleCopyImage}
              disabled={copying}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: '10px',
                background: copied ? '#fbf7f2' : '#fff',
                border: `1.5px solid ${copied ? '#746355' : '#eadfd2'}`,
                color: copied ? '#963b16' : '#3e3028',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600, fontSize: '11px',
                textTransform: 'none', letterSpacing: '0.1em',
                cursor: copying ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: '0 1px 3px rgba(14,58,110,0.10)',
                transition: 'all 0.15s',
              }}
            >
              {copying ? (
                <>
                  <span style={{
                    width: '11px', height: '11px', display: 'inline-block',
                    border: '2px solid currentColor', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'bsSpin 0.6s linear infinite',
                  }} />
                  Processing…
                </>
              ) : copied ? '✓ Copied' : '⎘ Copy Image'}
            </button>

            {/* Download */}
            <button
              className="bs-btn"
              onClick={handleDownload}
              disabled={copying}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: '10px',
                background: '#fff', border: '1.5px solid #eadfd2',
                color: '#3e3028',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600, fontSize: '11px',
                textTransform: 'none', letterSpacing: '0.1em',
                cursor: copying ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: '0 1px 3px rgba(14,58,110,0.10)',
                transition: 'all 0.15s',
              }}
            >
              ↓ Download
            </button>

            {/* Close */}
            <button
              className="bs-close"
              aria-label="Close billing summary"
              onClick={onClose}
              style={{
                padding: '10px 14px', borderRadius: '10px',
                background: '#fff', border: '1.5px solid #eadfd2',
                color: '#0a0a0aff', fontWeight: 600, fontSize: '13px',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: '0 1px 3px rgba(14,58,110,0.10)',
              }}
            >
              ✕
            </button>
          </div>

          {/* ── Card ── */}
          <div ref={cardRef} style={{
            width: 'min(560px, calc(100vw - 24px))',
            maxWidth: '560px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #eadfd2',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif",
            boxShadow: '0 20px 60px rgba(14,58,110,0.14), 0 4px 16px rgba(14,58,110,0.08)',
          }}>

            {/* ── Header ── */}
            <div style={{
              padding: '24px 28px 20px',
              background: '#fff0e4',
              borderBottom: '1px solid #963b16',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <div style={{
                  fontSize: '11px', fontWeight: 600, color: '#746355',
                  textTransform: 'none', letterSpacing: '0.18em', marginBottom: '6px',
                }}>
                  Billing Summary
                </div>
                <div style={{
                  fontSize: '20px', fontWeight: 600, color: '#3e3028',
                  letterSpacing: '-0.03em', lineHeight: 1.1,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {finalBatchNumber || batchNumber}
                </div>
                <div style={{ fontSize: '11px', color: '#746355', marginTop: '6px', fontWeight: 500 }}>
                  {today}
                </div>
              </div>
              <Tag color="#3e3028" bg="#eadfd2" border="#746355">✓ Billing Ready</Tag>
            </div>

            {/* ── Financial Summary ── */}
            <div style={{ padding: '18px 28px', borderBottom: '1px solid #eadfd2' }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: '#746355',
                textTransform: 'none', letterSpacing: '0.18em', marginBottom: '3px',
              }}>
                Financial Summary
              </div>

              <Row label="Gross Claims Amount" value={'₱' + fmt(grossAmount)} valueColor="#3e3028" />
              <Divider />
              <Row label="Service Fee" value={'− ₱' + fmt(serviceFee)} valueColor="#a23429" />


              {/* Render deductions */}
          {deductions && deductions.length > 0 &&
            deductions.map((deduction, index) => (
              <Row
                key={index}
                label={getDeductionLabel(deduction.type)}
                value={'− ₱' + fmt(deduction.amount)}
                valueColor="#963b16"
              />
            ))
          }

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '12px', paddingTop: '12px',
                borderTop: '1.5px solid #eadfd2',
              }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600, color: '#3e3028',
                  textTransform: 'none', letterSpacing: '0.1em',
                }}>
                  Net Amount Due
                </span>
                <span style={{
                  fontSize: '22px', fontWeight: 600, color: '#1c7a48ff',
                  letterSpacing: '-0.03em', fontFamily: "'DM Mono', monospace",
                }}>
                  ₱{fmt(netAmount)}
                </span>
              </div>
            </div>

            {/* ── Fund Allocation ── */}
            <div style={{ padding: '18px 28px', borderBottom: '1px solid #eadfd2' }}>
              <div style={{
                fontSize: '11px', fontWeight: 600, color: '#746355',
                textTransform: 'none', letterSpacing: '0.18em', marginBottom: '14px',
              }}>
                Fund Allocation
              </div>

              {(billingMethod === 'cash' || billingMethod === 'both') && (
                <div style={{ marginBottom: billingMethod === 'both' ? '16px' : '0' }}>

                  {/* Bills */}
                  {billDenoms.length > 0 && (
                    <div style={{ marginBottom: coinDenoms.length > 0 ? '14px' : '0' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: '8px',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#963b16', textTransform: 'none', letterSpacing: '0.1em' }}>
                          Bills
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#963b16', fontFamily: "'DM Mono', monospace" }}>
                          ₱{fmt(billDenoms.reduce((s, v) => s + v * (cashDenominations[v] || 0), 0))}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                        {billDenoms.map(v => (
                          <Chip key={v} label={'₱' + v} count={cashDenominations[v]} total={v * cashDenominations[v]} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coins */}
                  {coinDenoms.length > 0 && (
                    <div>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: '8px',
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#44636c', textTransform: 'none', letterSpacing: '0.1em' }}>
                          Coins
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#44636c', fontFamily: "'DM Mono', monospace" }}>
                          ₱{fmt(coinDenoms.reduce((s, v) => s + v * (cashDenominations['c' + v] || 0), 0))}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                        {coinDenoms.map(v => (
                          <Chip key={'c' + v} label={'₱' + v} count={cashDenominations['c' + v]} total={v * cashDenominations['c' + v]} coin />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cash Total */}
                  {(billDenoms.length > 0 || coinDenoms.length > 0) && (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      marginTop: '12px', paddingTop: '12px',
                      borderTop: '1px solid #eadfd2',
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#746355', textTransform: 'none', letterSpacing: '0.1em' }}>
                        Cash Total
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#963b16', fontFamily: "'DM Mono', monospace" }}>
                        ₱{fmt(cashTotal)}
                      </span>
                    </div>
                  )}

                  {billDenoms.length === 0 && coinDenoms.length === 0 && (
                    <p style={{ fontSize: '11px', color: '#746355', fontStyle: 'italic', margin: 0 }}>
                      No cash denominations entered
                    </p>
                  )}
                </div>
              )}

              {(billingMethod === 'bank' || billingMethod === 'both') && (
                <>
                  {billingMethod === 'both' && <Divider style={{ margin: '16px 0' }} />}
                  {resolvedTransfers.length > 0 ? resolvedTransfers.map((amt, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 18px', borderRadius: '12px',
                      background: '#f5ede2',
                      border: '1px solid #963b16',
                      marginBottom: i < resolvedTransfers.length - 1 ? '8px' : '0',
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#746355', textTransform: 'none', letterSpacing: '0.1em' }}>
                          Bank Transfer {resolvedTransfers.length > 1 ? `#${i + 1}` : ''}
                        </div>
                        <div style={{ fontSize: '11px', color: '#963b16', marginTop: '2px', fontWeight: 500 }}>
                          Electronic Settlement
                        </div>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#3e3028', fontFamily: "'DM Mono', monospace" }}>
                        ₱{fmt(amt)}
                      </span>
                    </div>
                  )) : (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 18px', borderRadius: '12px',
                      background: '#f5ede2',
                      border: '1px solid #963b16',
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#746355', textTransform: 'none', letterSpacing: '0.1em' }}>Bank Transfer</div>
                        <div style={{ fontSize: '11px', color: '#963b16', marginTop: '2px', fontWeight: 500 }}>Electronic Settlement</div>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#3e3028', fontFamily: "'DM Mono', monospace" }}>₱{fmt(bankTransferAmount)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Verified Claims (compact, moved above Total Prepared) ── */}
            {verifiedClaims && verifiedClaims.length > 0 && (
              <div style={{ padding: '14px 28px', borderBottom: '1px solid #eadfd2' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#746355', textTransform: 'none', letterSpacing: '0.18em' }}>
                    Verified Claims
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#3e3028' }}>
                    {verifiedClaims.length} {verifiedClaims.length === 1 ? 'Claim' : 'Claims'}
                  </div>
                  {accountHolderCounts.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {accountHolderCounts.map((holder, idx) => (
                        <div key={idx} style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: '#fbf7f2',
                          border: '1px solid #eadfd2',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#963b16',
                          fontFamily: "'Inter', sans-serif",
                        }}>
                          {holder.name} ({holder.count})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Total Prepared ── */}
            <div style={{
              padding: '16px 28px', borderBottom: '1px solid #eadfd2',
              background: 'linear-gradient(135deg, #fbf7f2 0%, #f5ede2 100%)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#746355', textTransform: 'none', letterSpacing: '0.15em', marginBottom: '4px' }}>
                  Total Prepared
                </div>
                <div style={{ fontSize: '19px', fontWeight: 600, color: '#3e3028', letterSpacing: '-0.03em', fontFamily: "'DM Mono', monospace" }}>
                  ₱{fmt(totalPrepared)}
                </div>
              </div>
              <Tag color="#3e3028" bg="#eadfd2" border="#746355">
                ✓ Ready to Receive
              </Tag>
            </div>



            {/* ── Footer ── */}
            <div style={{
              padding: '12px 28px',
              borderTop: '1px solid #eadfd2',
              background: '#fffdfa',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#746355', textTransform: 'none', letterSpacing: '0.15em' }}>
                Generated {today}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#746355', textTransform: 'none', letterSpacing: '0.15em' }}>
                Batch Checker System
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BillingSummaryModal;
