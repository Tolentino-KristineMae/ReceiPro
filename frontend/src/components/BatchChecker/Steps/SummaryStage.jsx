import React, { useState, useEffect } from 'react';
import './SummaryStage.css';
import { getApiUrl } from '../../../apiConfig';

export default function SummaryStage({
  verifiedClaims,
  totalClaimsAmount,
  serviceFee,
  deductionType,
  setDeductionType,
  manualDeduction,
  setManualDeduction,
  netAmount,
  savedDeductions = [], // Receive saved deductions from parent
  onProceed,
  onBack,
}) {
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deductions, setDeductions] = useState(savedDeductions); // Initialize with saved deductions

  const fmt = (n) => Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Fetch deduction types from settings
  useEffect(() => {
    const fetchDeductionTypes = async () => {
      try {
        const response = await fetch(getApiUrl('/api/settings/deduction-types'));
        if (response.ok) {
          const data = await response.json();
          setDeductionTypes(data.deduction_types || []);
        } else {
          // If API fails, set empty array (no deductions available)
          console.error('Failed to fetch deduction types');
          setDeductionTypes([]);
        }
      } catch (error) {
        console.error('Failed to fetch deduction types:', error);
        // If API fails, set empty array (no deductions available)
        setDeductionTypes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeductionTypes();
  }, []);

  // Update deductions when savedDeductions prop changes
  useEffect(() => {
    if (savedDeductions && savedDeductions.length > 0) {
      setDeductions(savedDeductions);
    }
  }, [savedDeductions]);

  // Calculate total deductions
  const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const calculatedNetAmount = totalClaimsAmount - serviceFee - totalDeductions;

  // Add a new deduction
  const handleAddDeduction = () => {
    if (deductionTypes.length === 0) {
      alert('No deduction types available. Please add deduction types in Settings first.');
      return;
    }
    setDeductions([...deductions, { type: deductionTypes[0].key, amount: 0 }]);
  };

  // Remove a deduction
  const handleRemoveDeduction = (index) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  // Update deduction type
  const handleUpdateDeductionType = (index, type) => {
    const updated = [...deductions];
    updated[index].type = type;
    setDeductions(updated);
  };

  // Update deduction amount
  const handleUpdateDeductionAmount = (index, amount) => {
    const updated = [...deductions];
    updated[index].amount = Number(amount) || 0;
    setDeductions(updated);
  };

  // Get label for deduction type
  const getDeductionLabel = (key) => {
    const deduction = deductionTypes.find(d => d.key === key);
    return deduction ? deduction.label : key;
  };

  return (
    <div className="sum-root">
      {/* Header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span style={{ 
              color: '#c084fc', 
              fontSize: '10px', 
              fontWeight: 900, 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Claims Summary
            </span>
          </div>
          <div style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{ 
              color: '#94a3b8', 
              fontSize: '10px', 
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              {verifiedClaims?.length || 0} Claims
            </span>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '10px',
        marginBottom: '12px'
      }}>
        {/* Gross Amount */}
        <div style={{
          padding: '12px',
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            fontSize: '8px',
            fontWeight: 900,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            Gross Claims
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 900,
            color: '#10b981',
            letterSpacing: '-0.02em',
            fontFamily: "'Space Mono', monospace"
          }}>
            ₱{fmt(totalClaimsAmount)}
          </div>
        </div>

        {/* Service Fee */}
        <div style={{
          padding: '12px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            fontSize: '8px',
            fontWeight: 900,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            Service Fee
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 900,
            color: '#ef4444',
            letterSpacing: '-0.02em',
            fontFamily: "'Space Mono', monospace"
          }}>
            − ₱{fmt(serviceFee)}
          </div>
        </div>
      </div>

      {/* Deduction Controls */}
      <div style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 900,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            Additional Deductions
          </div>
          <button
            onClick={handleAddDeduction}
            disabled={loading || deductionTypes.length === 0}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: loading || deductionTypes.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'Space Grotesk', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading || deductionTypes.length === 0 ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && deductionTypes.length > 0) {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Deduction
          </button>
        </div>

        {deductions.length === 0 ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '12px',
            fontFamily: "'Space Grotesk', sans-serif"
          }}>
            {loading ? (
              'Loading deduction types...'
            ) : deductionTypes.length === 0 ? (
              <>
                <div style={{ marginBottom: '8px', fontSize: '24px' }}>📋</div>
                No deduction types available. Add them in Settings first.
              </>
            ) : (
              <>
                <div style={{ marginBottom: '8px', fontSize: '24px' }}>➕</div>
                No deductions added. Click "Add Deduction" to add one.
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {deductions.map((deduction, index) => (
              <div key={index} style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto',
                gap: '10px',
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                {/* Deduction Type */}
                <div>
                  <label style={{
                    fontSize: '9px',
                    fontWeight: 900,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: '6px',
                    display: 'block',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}>
                    Type
                  </label>
                  <select 
                    value={deduction.type} 
                    onChange={(e) => handleUpdateDeductionType(index, e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Space Grotesk', sans-serif",
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4L6 8L10 4' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center'
                    }}
                  >
                    {deductionTypes.map((dt) => (
                      <option key={dt.key} value={dt.key}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label style={{
                    fontSize: '9px',
                    fontWeight: 900,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: '6px',
                    display: 'block',
                    fontFamily: "'Space Grotesk', sans-serif"
                  }}>
                    Amount
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace"
                    }}>
                      ₱
                    </span>
                    <input 
                      type="number" 
                      value={deduction.amount || ''} 
                      onChange={(e) => handleUpdateDeductionAmount(index, e.target.value)}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '10px 12px 10px 28px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        outline: 'none',
                        fontFamily: "'Space Mono', monospace"
                      }}
                      placeholder="0.00"
                      min="0"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => handleRemoveDeduction(index)}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    }}
                    title="Remove deduction"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Deductions Summary */}
        {deductions.length > 0 && (
          <div style={{
            marginTop: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 900,
              color: '#ef4444',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Total Deductions
            </span>
            <span style={{
              fontSize: '18px',
              fontWeight: 900,
              color: '#ef4444',
              fontFamily: "'Space Mono', monospace"
            }}>
              − ₱{fmt(totalDeductions)}
            </span>
          </div>
        )}
      </div>

      {/* Net Amount Summary */}
      <div style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(14, 165, 233, 0.08) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        marginBottom: '12px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              fontSize: '9px',
              fontWeight: 900,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '4px',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Total Net Amount
            </div>
            <div style={{
              fontSize: '10px',
              color: '#94a3b8',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              Final amount for billing
            </div>
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 900,
            color: '#38bdf8',
            letterSpacing: '-0.02em',
            fontFamily: "'Space Mono', monospace"
          }}>
            ₱{fmt(calculatedNetAmount)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex',
        gap: '10px',
        marginTop: 'auto',
        paddingTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <button 
          onClick={onBack}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '12px',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: '10px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Finalize
        </button>
        <button 
          onClick={() => {
            // Pass deductions array to parent
            onProceed(deductions, calculatedNetAmount);
          }}
          style={{
            flex: 2,
            padding: '12px 20px',
            borderRadius: '12px',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: '10px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 60%, #7e22ce 100%)',
            color: '#fff',
            boxShadow: '0 6px 28px rgba(168, 85, 247, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 36px rgba(168, 85, 247, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(168, 85, 247, 0.45)';
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Proceed to Billing
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
