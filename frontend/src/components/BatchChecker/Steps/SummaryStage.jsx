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
  savedDeductions = [],
  onProceed,
  onBack,
  onDeductionsChange,
  isSaving = false,
}) {
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deductions, setDeductions] = useState(savedDeductions);

  const fmt = (n) => Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    const fetchDeductionTypes = async () => {
      try {
        const response = await fetch(getApiUrl('/api/settings/deduction-types'));
        if (response.ok) {
          const data = await response.json();
          setDeductionTypes(data.deduction_types || []);
        } else {
          setDeductionTypes([]);
        }
      } catch (error) {
        setDeductionTypes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDeductionTypes();
  }, []);

  useEffect(() => {
    if (savedDeductions && savedDeductions.length > 0) {
      setDeductions(savedDeductions);
    }
  }, [savedDeductions]);

  const totalDeductions = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const calculatedNetAmount = totalClaimsAmount - serviceFee - totalDeductions;

  useEffect(() => {
    onDeductionsChange?.(deductions, calculatedNetAmount);
  }, [deductions, calculatedNetAmount, onDeductionsChange]);

  const handleAddDeduction = () => {
    if (deductionTypes.length === 0) {
      alert('No deduction types available. Please add deduction types in Settings first.');
      return;
    }
    setDeductions([...deductions, { type: deductionTypes[0].key, amount: 0 }]);
  };

  const handleRemoveDeduction = (index) => {
    setDeductions(deductions.filter((_, i) => i !== index));
  };

  const handleUpdateDeductionType = (index, type) => {
    const updated = [...deductions];
    updated[index].type = type;
    setDeductions(updated);
  };

  const handleUpdateDeductionAmount = (index, amount) => {
    const updated = [...deductions];
    updated[index].amount = Number(amount) || 0;
    setDeductions(updated);
  };

  return (
    <div className="sum-root">
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(251, 146, 60, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <span style={{ 
              color: '#f97316', 
              fontSize: '10px', 
              fontWeight: 900, 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em',
              fontFamily: "'Inter', sans-serif"
            }}>
              Claims Summary
            </span>
          </div>
          <div style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: '#fffbf5',
            border: '1px solid rgba(251, 146, 60, 0.15)'
          }}>
            <span style={{ 
              color: 'rgba(67, 20, 7, 0.6)', 
              fontSize: '10px', 
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif"
            }}>
              {verifiedClaims?.length || 0} Claims
            </span>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="sum-cards-grid">
        {/* Gross Amount */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            fontSize: '9px',
            fontWeight: 900,
            color: 'rgba(67, 20, 7, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Inter', sans-serif"
          }}>
            Gross Claims
          </div>
          <div className="sum-card-amount" style={{ color: '#10b981' }}>
            ₱{fmt(totalClaimsAmount)}
          </div>
        </div>

        {/* Service Fee */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{
            fontSize: '9px',
            fontWeight: 900,
            color: 'rgba(67, 20, 7, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Inter', sans-serif"
          }}>
            Service Fee
          </div>
          <div className="sum-card-amount" style={{ color: '#ef4444' }}>
            − ₱{fmt(serviceFee)}
          </div>
        </div>
      </div>

      {/* Deduction Controls */}
      <div style={{
        padding: '20px',
        borderRadius: '16px',
        background: '#fffbf5',
        border: '1px solid rgba(251, 146, 60, 0.15)',
        marginBottom: '16px',
        boxShadow: '0 4px 12px rgba(67, 20, 7, 0.03)'
      }}>
        <div className="sum-deductions-header">
          <div style={{
            fontSize: '11px',
            fontWeight: 900,
            color: '#431407',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: "'Inter', sans-serif"
          }}>
            Additional Deductions
          </div>
          <button
            onClick={handleAddDeduction}
            disabled={loading || deductionTypes.length === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              color: '#f97316',
              fontSize: '10px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: loading || deductionTypes.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading || deductionTypes.length === 0 ? 0.5 : 1,
              flexShrink: 0
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
            padding: '30px',
            textAlign: 'center',
            color: 'rgba(67, 20, 7, 0.4)',
            fontSize: '12px',
            fontFamily: "'Inter', sans-serif"
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
          <div style={{ display: 'grid', gap: '10px' }}>
            {deductions.map((deduction, index) => (
              <div key={index} className="sum-deduction-row">
                {/* Deduction Type */}
                <div className="sum-deduction-type">
                  <label style={{
                    fontSize: '9px',
                    fontWeight: 900,
                    color: 'rgba(67, 20, 7, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: '6px',
                    display: 'block',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Type
                  </label>
                  <select 
                    value={deduction.type} 
                    onChange={(e) => handleUpdateDeductionType(index, e.target.value)}
                    style={{
                      width: '100%',
                      background: '#fffbf5',
                      border: '1px solid rgba(251, 146, 60, 0.2)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#431407',
                      fontSize: '12px',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Inter', sans-serif"
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
                <div className="sum-deduction-amount">
                  <label style={{
                    fontSize: '9px',
                    fontWeight: 900,
                    color: 'rgba(67, 20, 7, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: '6px',
                    display: 'block',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    Amount
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(67, 20, 7, 0.4)',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      ₱
                    </span>
                    <input 
                      type="number" 
                      value={deduction.amount || ''} 
                      onChange={(e) => handleUpdateDeductionAmount(index, e.target.value)}
                      style={{
                        width: '100%',
                        background: '#fffbf5',
                        border: '1px solid rgba(251, 146, 60, 0.2)',
                        borderRadius: '8px',
                        padding: '10px 12px 10px 28px',
                        color: '#431407',
                        fontSize: '12px',
                        fontWeight: 700,
                        outline: 'none',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <div className="sum-deduction-delete">
                  <button
                    onClick={() => handleRemoveDeduction(index)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
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
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
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
              fontFamily: "'Inter', sans-serif"
            }}>
              Total Deductions
            </span>
            <span style={{
              fontSize: '18px',
              fontWeight: 900,
              color: '#ef4444',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              − ₱{fmt(totalDeductions)}
            </span>
          </div>
        )}
      </div>

      {/* Net Amount Summary */}
      <div style={{
        padding: '20px',
        borderRadius: '16px',
        background: 'rgba(249, 115, 22, 0.08)',
        border: '1px solid rgba(251, 146, 60, 0.3)',
        marginBottom: '16px',
        boxShadow: '0 4px 16px rgba(249, 115, 22, 0.1)'
      }}>
        <div className="sum-net-row">
          <div>
            <div style={{
              fontSize: '10px',
              fontWeight: 900,
              color: 'rgba(67, 20, 7, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '4px',
              fontFamily: "'Inter', sans-serif"
            }}>
              Total Net Amount
            </div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(67, 20, 7, 0.6)',
              fontFamily: "'Inter', sans-serif"
            }}>
              Final amount for billing
            </div>
          </div>
          <div className="sum-net-amount">
            ₱{fmt(calculatedNetAmount)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sum-actions">
        <button 
          onClick={onBack}
          style={{
            flex: 1,
            padding: '14px 20px',
            borderRadius: '12px',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            border: '1px solid rgba(251, 146, 60, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: '#ffffff',
            color: 'rgba(67, 20, 7, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
        <button 
          onClick={() => onProceed(deductions, calculatedNetAmount)}
          style={{
            flex: 2,
            padding: '14px 20px',
            borderRadius: '12px',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: '#f97316',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
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
