import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import WizardStepCrop from './Steps/WizardStepCrop';
import BillingSummaryModal from './BillingSummaryModal';
import SortingStage from './Steps/SortingStage';
import CropStage from './Steps/CropStage';
import ExtractionStage from './Steps/ExtractionStage';
import VerificationStage from './Steps/VerificationStage';
import FinalizeStage from './Steps/FinalizeStage';
import SummaryStage from './Steps/SummaryStage';
import { getApiUrl } from '../../apiConfig';
import qrJonarld from '../../assets/qr-jonarld.jpg';

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .cw-overlay {
    position: fixed; inset: 0; background: rgba(67, 20, 7, 0.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 10px; backdrop-filter: blur(12px);
  }
  .cw-card {
    background: #fffbf5; border: 1px solid rgba(251, 146, 60, 0.2);
    border-radius: 24px; width: 100%; max-width: 1400px;
    max-height: 95vh; display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 40px 100px rgba(67, 20, 7, 0.15);
  }
  .cw-header { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    padding: 10px 14px; 
    border-bottom: 2px solid #f97316; 
    justify-content: center;
    position: relative;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.08);
  }
  .cw-header-icon {
    width: 32px; height: 32px; border-radius: 10px; background: #ffffff;
    border: 2px solid #f97316; display: flex; align-items: center; justify-content: center; 
    color: #f97316; box-shadow: 0 2px 8px rgba(249, 115, 22, 0.12);
  }
  .cw-title-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .cw-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800; color: #431407; text-transform: uppercase; letter-spacing: 0.05em; }
  .cw-subtitle { font-family: 'Inter', sans-serif; font-size: 8px; color: #9a3412; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 1px; }
  .cw-close { position: absolute; right: 14px; color: #9a3412; font-size: 20px; cursor: pointer; transition: all 0.2s; border: none; background: none; opacity: 0.5; }

  .cw-content { 
    flex: 1; 
    position: relative; 
    display: flex; 
    flex-direction: row; 
    overflow: hidden; 
    justify-content: center;
    align-items: stretch;
    background: #fffbf5;
  }

  .cw-canvas-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    max-width: 600px;
    background: #ffffff;
    border-right: 1px solid rgba(251, 146, 60, 0.1);
  }

  .cw-sidebar {
     width: 480px;
     flex-shrink: 0;
     background: #ffffff;
     display: flex;
     flex-direction: column;
     padding: 20px;
     overflow-y: auto;
     border-left: 1px solid rgba(251, 146, 60, 0.1);
     scrollbar-width: none;
  }
  .cw-sidebar::-webkit-scrollbar { display: none; }

  .cw-footer { padding: 16px 20px; border-top: 1px solid rgba(251, 146, 60, 0.1); display: flex; justify-content: center; background: #ffffff; }
  .cw-btn-confirm {
    width: 100%; max-width: 400px; background: #f97316; color: #fff;
    font-family: 'Syne', sans-serif; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.15em; font-size: 11px; padding: 14px 20px; border-radius: 16px;
    border: none; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 10px 20px rgba(249, 115, 22, 0.2);
  }
  .cw-btn-confirm:hover { background: #fb923c; transform: translateY(-2px); box-shadow: 0 15px 30px rgba(249, 115, 22, 0.3); }
  .cw-btn-confirm:active { transform: translateY(0); }

  /* OCR Table specific styles */
  .cw-table { width: 100%; border-spacing: 0 6px; border-collapse: separate; }
  .cw-table th {
    padding: 0 12px 6px; text-align: left;
    font-family: 'Inter', system-ui, sans-serif; font-size: 8px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.12em; color: #9a3412;
  }
  .cw-row { background: #ffffff; transition: all 0.2s ease; border-radius: 10px; border: 1px solid rgba(251, 146, 60, 0.05); }
  .cw-row:hover { background: #fff7ed; border-color: rgba(249, 115, 22, 0.2); }
  .cw-row.saved { background: rgba(34, 197, 94, 0.05); border-color: rgba(34, 197, 94, 0.15); }
  .cw-td { padding: 10px 12px; color: #431407; font-size: 11px; }
  .cw-td:first-child { border-radius: 10px 0 0 10px; }
  .cw-td:last-child { border-radius: 0 10px 10px 0; }

  .cw-input {
    background: #fff; border: 1.5px solid rgba(251, 146, 60, 0.15);
    border-radius: 8px; padding: 8px 12px; color: #431407; font-family: 'JetBrains Mono', monospace;
    font-size: 11px; outline: none; transition: all 0.2s; width: 100%;
  }
  .cw-input:focus { border-color: #f97316; background: #fff; box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }

  .cw-badge {
    padding: 3px 8px; border-radius: 50px; font-size: 7px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.1em; font-family: 'Inter', system-ui, sans-serif;
  }
  .cw-badge.success { background: rgba(34, 197, 94, 0.1); color: #15803d; border: 1px solid rgba(34, 197, 94, 0.2); }
  .cw-badge.warning { background: rgba(249, 115, 22, 0.1); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.2); }

  .cw-stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
  .cw-stat-card { background: #ffffff; border: 1px solid rgba(251, 146, 60, 0.1); border-radius: 12px; padding: 12px; text-align: center; box-shadow: 0 4px 10px rgba(67, 20, 7, 0.03); }
  .cw-stat-val { font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 700; color: #431407; }
  .cw-stat-label { font-size: 8px; font-weight: 700; color: #9a3412; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 3px; }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Responsive Styles */
  @media (max-width: 900px) {
    .cw-overlay { padding: 8px; }
    .cw-card { max-height: 100vh; border-radius: 16px; }
    .cw-header { padding: 14px 16px; gap: 10px; }
    .cw-header-icon { width: 36px; height: 36px; border-radius: 12px; }
    .cw-title { font-size: 14px; }
    .cw-subtitle { font-size: 8px; }
    .cw-close { right: 16px; font-size: 22px; }
    
    .cw-content { flex-direction: column; }
    .cw-canvas-wrapper {
      padding: 12px;
      max-width: 100%;
      border-right: none;
      border-bottom: 1px solid rgba(251, 146, 60, 0.1);
      min-height: 40vh;
    }
    .cw-sidebar {
      width: 100%;
      max-height: 56vh;
      padding: 12px;
    }
    .cw-footer { padding: 12px 16px; }
    .cw-btn-confirm {
      padding: 12px 16px;
      font-size: 10px;
      letter-spacing: 0.12em;
    }
    .cw-stat-grid { gap: 8px; }
    .cw-stat-card { padding: 10px; border-radius: 10px; }
    .cw-stat-val { font-size: 15px; }
  }
  
  @media (max-width: 480px) {
    .cw-overlay { padding: 5px; }
    .cw-card { border-radius: 12px; }
    .cw-header { padding: 12px 12px; gap: 8px; }
    .cw-header-icon { width: 32px; height: 32px; border-radius: 10px; }
    .cw-title { font-size: 12px; }
    .cw-subtitle { font-size: 7px; }
    .cw-close { right: 12px; font-size: 20px; }
    
    .cw-canvas-wrapper { padding: 8px; min-height: 38vh; }
    .cw-sidebar { padding: 10px; max-height: 58vh; }
    .cw-footer { padding: 10px 12px; }
    .cw-btn-confirm { padding: 10px 14px; font-size: 9px; }
    
    .cw-stat-grid { grid-template-columns: 1fr; gap: 8px; }
    .cw-td { padding: 8px 10px; font-size: 10px; }
    .cw-input { padding: 7px 10px; font-size: 10px; }
  }
`;

function summarizeVerificationFromResults(results = []) {
  const summary = { total: results.length, confirmed: 0, matched: 0, not_found: 0, duplicate: 0 };
  for (const row of results) {
    const status = row.verification_status;
    if (status === 'verified') summary.confirmed++;
    else if (status === 'matched') summary.matched++;
    else if (status === 'duplicate') summary.duplicate++;
    else summary.not_found++;
  }
  return summary;
}

const CropWizard = ({ receipts = [], batchId, onDone, onClose, onSaved, initialPhase = 'categorize' }) => {
  // Debounce utility function
  const debounce = (func, wait) => {
    let timeout;
    const debouncedFn = (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
    debouncedFn.cancel = () => clearTimeout(timeout);
    return debouncedFn;
  };
  // 1. Initial state
  const [phase, setPhase] = useState(initialPhase); 
  const [index, setIndex] = useState(() => {
    if (initialPhase === 'categorize') {
      const firstUnsorted = receipts.findIndex(r => !r.category || r.category === 'unsorted');
      return firstUnsorted !== -1 ? firstUnsorted : 0;
    }
    if (initialPhase === 'crop') {
      const ocr = (r) => r.ocr_data ? (typeof r.ocr_data === 'string' ? JSON.parse(r.ocr_data) : r.ocr_data) : null;
      // Always start with first pending GCash, fall back to first pending Others
      const firstGcash = receipts.findIndex(r => r.category === 'gcash' && !r.cropped_image);
      const firstOthers = receipts.findIndex(r => r.category === 'others' && !ocr(r)?.manual);
      const firstNeedsCrop = firstGcash !== -1 ? firstGcash : firstOthers !== -1 ? firstOthers : 0;
      return firstNeedsCrop;
    }
    return 0;
  });
  
  // Stage 2: New bulk-sorting state
  const [checkedForOthers, setCheckedForOthers] = useState(() => {
    // Pre-check receipts already marked as 'others'
    const set = new Set();
    receipts.forEach(r => { if (r.category === 'others') set.add(r.id); });
    return set;
  });

  const [sortingView, setSortingView] = useState(() => {
    if (initialPhase === 'categorize') {
      const hasUnsorted = receipts.some(r => !r.category || r.category === 'unsorted');
      return hasUnsorted ? 'select' : 'review';
    }
    return 'select';
  });

  const [isSavingSorting, setIsSavingSorting] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const summaryDeductionsRef = useRef([]);
  const summaryNetRef = useRef(0);
  const [selections, setSelections] = useState({}); // { index: { category, account } } — used in crop phase
  const [crops, setCrops] = useState({}); // { index: dataUrl }
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0); // Track OCR progress percentage
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);
  const [ocrAccountFilter, setOcrAccountFilter] = useState('All'); // Filter for OCR results
  const [showOcrPreview, setShowOcrPreview] = useState(() => initialPhase === 'ocr');
  const [showVerifyPreview, setShowVerifyPreview] = useState(false);
  const [finalizedBatch, setFinalizedBatch] = useState(null);

  // Toast notification state
  const [toast, setToast] = useState(null); // { message, detail, type: 'success' | 'error' }
  const toastTimerRef = useRef(null);
  const showToast = useCallback((message, detail = null, type = 'success', duration = 4000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, detail, type });
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);
  
  // Stage 7: Summary State
  const [deductionType, setDeductionType] = useState('none');
  const [manualDeduction, setManualDeduction] = useState('');
  const [savedDeductions, setSavedDeductions] = useState([]); // Store saved deductions from batch
  const [finalNetAmount, setFinalNetAmount] = useState(0); // Store the final calculated net amount from Stage 7

  // Stage 8: Billing State
  const [billingMethod, setBillingMethod] = useState('both'); // 'cash', 'bank', 'both'
  const [cashDenominations, setCashDenominations] = useState({
    '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, // Bills
    'c20': 0, 'c10': 0, 'c5': 0, 'c1': 0 // Coins
  });
  const [bankTransferAmounts, setBankTransferAmounts] = useState([0]); // Array of partial transfers (max ₱50k each)
  const [showBillingSummary, setShowBillingSummary] = useState(false);
  const [showBillingSummaryModal, setShowBillingSummaryModal] = useState(false);
  const [savedBatchInfo, setSavedBatchInfo] = useState(null);
  const [verificationSummary, setVerificationSummary] = useState(null);

  // Calculations for Summary
  const verifiedClaims = savedBatchInfo?.verified_claims
    || ocrResults?.filter(r => r.verification_status === 'verified')
    || [];
  const totalClaimsAmount = verifiedClaims.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const serviceFee = Math.floor(totalClaimsAmount / 1000) * 10;
  const cashoutFee = Math.floor(totalClaimsAmount * 0.015 * 100) / 100; // 1.5% of total, rounded to 2 decimals
  
  // Calculate total deductions from savedDeductions array
  const totalDeductionsAmount = savedDeductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  
  // Calculate net amount: if finalNetAmount is set and valid, use it; otherwise calculate fresh
  // Only use finalNetAmount if it's been explicitly set (greater than 0 or if we're in billing phase)
  const calculatedNet = totalClaimsAmount - serviceFee - totalDeductionsAmount;
  const netAmount = (finalNetAmount > 0 && phase === 'billing') ? finalNetAmount : calculatedNet;
  
  // Billing Calculations
  const cashTotal = Object.entries(cashDenominations).reduce((sum, [key, count]) => {
    const val = key.startsWith('c') ? Number(key.substring(1)) : Number(key);
    return sum + (val * count);
  }, 0);
  const bankTransferAmount = bankTransferAmounts.reduce((sum, v) => sum + Number(v || 0), 0);
  const billingTotal = cashTotal + bankTransferAmount;
  const billingDiff = netAmount - billingTotal;
  const isBillingBalanced = Math.abs(billingDiff) < 0.01;

  // Try to reconstruct ocrResults from receipts if they have data
  useEffect(() => {
    if ((phase === 'ocr' || phase === 'finalize' || phase === 'summary' || phase === 'billing') && !ocrResults && receipts.length > 0) {
      const hasOcrData = receipts.some(r => {
        const ocr = r.ocr_data ? (typeof r.ocr_data === 'string' ? JSON.parse(r.ocr_data) : r.ocr_data) : null;
        return r.ocr_status === 'completed' || (ocr && (ocr.raw_text || ocr.manual));
      });

      if (hasOcrData) {
        console.log('Reconstructing ocrResults from receipts data...');
        const results = receipts.map(r => {
          const ocr = r.ocr_data ? (typeof r.ocr_data === 'string' ? JSON.parse(r.ocr_data) : r.ocr_data) : {};
          return {
            receipt: r,
            amount: ocr.amount || 0,
            reference: ocr.reference || null,
            date: ocr.date || null,
            confidence: ocr.confidence || 100,
            manualEntry: !!ocr.manual,
            account_holder: r.account_holder || ocr.account_holder,
            verification_status: r.match_status // Used in Stage 5
          };
        });
        setOcrResults(results);
        
        // Ensure preview flags are set if we jumped to these phases
        if (phase === 'ocr') setShowOcrPreview(true);
      }
    }
  }, [phase, receipts, ocrResults]);

  // Initialize verification when opening directly at the verify stage
  useEffect(() => {
    if (initialPhase === 'verify' && !ocrResults && receipts.length > 0) {
      const triggerProcess = async () => {
        setIsVerifying(true);
        setShowVerifyPreview(false);
        try {
          const res = await fetch(getApiUrl(`/api/batches/${batchId}/process`), { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (res.ok) {
            const payload = await res.json();
            setOcrResults(payload.results || []);
            setVerificationSummary(payload.summary || null);
            setShowVerifyPreview(true);
          }
        } catch (e) {
          console.error('Initial verification failed', e);
        } finally {
          setIsVerifying(false);
        }
      };
      triggerProcess();
    }
  }, [initialPhase, batchId, receipts.length, ocrResults]);

  // Load saved deductions when entering summary or billing phase
  useEffect(() => {
    if ((phase === 'summary' || phase === 'billing') && batchId) {
      const loadBatchData = async () => {
        console.log('=== Loading batch data ===');
        console.log('Phase:', phase);
        console.log('Batch ID:', batchId);
        
        try {
          const res = await fetch(getApiUrl(`/api/batches/${batchId}`));
          console.log('Batch fetch response status:', res.status);
          
          if (res.ok) {
            const batch = await res.json();
            console.log('Batch data loaded:', batch);
            console.log('Batch summary_data:', batch.summary_data);
            console.log('Batch deductions:', batch.summary_data?.deductions);
            
            // Store the full batch info for the billing summary modal
            setSavedBatchInfo(batch);
            
            // If already finalized, set the finalized batch state
            if (batch.checker_status === 'finalized' || batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready') {
              setFinalizedBatch(batch);
            }

            if (batch.verification_summary) {
              setVerificationSummary(batch.verification_summary);
            }
            
            // Only load saved deductions and final net amount if we're in billing phase
            // For summary phase, start fresh with recalculated values
            if (phase === 'billing' && batch.summary_data) {
              if (batch.summary_data.deductions) {
                console.log('Setting savedDeductions:', batch.summary_data.deductions);
                setSavedDeductions(batch.summary_data.deductions);
              }
              if (batch.summary_data.net_amount) {
                setFinalNetAmount(batch.summary_data.net_amount);
              }
            } else {
              // Reset to fresh calculations for summary phase
              setSavedDeductions([]);
              setFinalNetAmount(0);
            }
            
            // Load billing data if in billing phase
            if (phase === 'billing' && batch.billing_data) {
              if (batch.billing_data.method) {
                setBillingMethod(batch.billing_data.method);
              }
              if (batch.billing_data.cash_denominations) {
                setCashDenominations(batch.billing_data.cash_denominations);
              }
              if (batch.billing_data.bank_transfer_amount !== undefined) {
                // Support both old single value and new array format
                const saved = batch.billing_data.bank_transfer_amount;
                if (Array.isArray(saved)) {
                  setBankTransferAmounts(saved.length > 0 ? saved : [0]);
                } else {
                  setBankTransferAmounts(saved ? [saved] : [0]);
                }
              }
            }
          }
        } catch (e) {
          console.error('Failed to load batch data', e);
        }
      };
      loadBatchData();
    }
  }, [phase, batchId]);
  
  // Track manual data for all items in the wizard session
  const [manualEntries, setManualEntries] = useState({}); // { index: { amount, reference, date } }
  
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  
  // Manual entry state for 'Others'
  const [manualAmount, setManualAmount] = useState('');
  const [manualReference, setManualReference] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);

  // Image rotation state - tracks cumulative rotation for smooth animation
  const [imageRotation, setImageRotation] = useState(0);
  const rotateImage = () => setImageRotation(r => r + 90);

  // Per-receipt account tracking (receipt.id → account name)
  const [accountEntries, setAccountEntries] = useState({});
  
  const imgRef = useRef(null);
  const ACCOUNTS = ['Kristine', 'Nixie', 'Babilyn'];

  // Critical safety check for receipts list
  const total = receipts?.length || 0;
  const current = receipts?.[index];

  // 1. Calculate live categories for all receipts in the session
  const liveReceipts = receipts.map((r, i) => ({
    ...r,
    category: selections[i]?.category || r.category || 'unsorted'
  }));

  const gcashReceipts = liveReceipts.filter(r => r.category === 'gcash');
  const othersReceipts = liveReceipts.filter(r => r.category === 'others');
  const unsortedReceipts = liveReceipts.filter(r => r.category === 'unsorted');
  
  // 2. Determine current item's live state
  const isGcash = currentCategory === 'gcash';
  const isOthers = currentCategory === 'others';
  
  // 3. Calculate breakdown counts
  const currentTotalStr = `${index + 1}/${total}`;

  // For GCash: How many have we processed in Phase 2?
  // In Phase 2, "processed" means crops[i] exists.
  const gcashProcessed = gcashReceipts.filter(r => crops[liveReceipts.indexOf(r)] || r.cropped_image).length;
  // If we are currently on a GCash item, we show its relative index
  const currentGcashIdx = (isGcash && current) ? gcashReceipts.findIndex(r => r.id === current.id) + 1 : 0;

  // For Others: How many have manual data?
  const othersProcessed = othersReceipts.filter(r => manualEntries[liveReceipts.indexOf(r)] || r.ocr_data?.manual).length;
  const currentOthersIdx = (isOthers && current) ? othersReceipts.findIndex(r => r.id === current.id) + 1 : 0;

  // Sync internal selection state only when index or phase changes
  // This prevents background polling from overwriting unsaved local choices
  useEffect(() => {
    if (phase === 'categorize') {
      const sel = selections[index] || {};
      setCurrentCategory(sel.category || current?.category || null);
      setCurrentAccount(sel.account || current?.account_holder || null);
    } else {
      const sel = selections[index] || {};
      setCurrentCategory(sel.category || current?.category);
      setCurrentAccount(sel.account || current?.account_holder);
      
      if (current?.category === 'others') {
        const sessionManual = manualEntries[index];
        setManualAmount(sessionManual?.amount || current?.ocr_data?.amount || '');
        setManualReference(sessionManual?.reference || current?.ocr_data?.reference || '');
        setManualDate(sessionManual?.date || current?.ocr_data?.date || new Date().toISOString().split('T')[0]);
      }
    }
  }, [index, phase]); // Removed 'selections' and 'current' from dependencies

  const needsAccount = currentCategory === 'gcash';

  useEffect(() => {
    // Reset if index or receipts change unexpectedly
    if (index >= total && total > 0) {
      setIndex(total - 1);
    }
  }, [index, total]);

  const onComplete = useCallback((c) => setCompletedCrop(c), []);
  const onChange = useCallback((c) => setCrop(c), []);

  const onImageLoad = useCallback((e) => {
    if (phase !== 'crop') return;

    const { width, height } = e.currentTarget;

    const initialCrop = {
      unit: '%',
      x: 5,
      y: 2,
      width: 90,
      height: 38,
    };

    const centeredCrop = centerCrop(initialCrop, width, height);
    setCrop(centeredCrop);
    setCompletedCrop(centeredCrop);
  }, [phase]);

  // Effect to initialize crop when switching to crop phase or changing index
  useEffect(() => {
    if (phase === 'crop' && !crop && imgRef.current && imgRef.current.complete) {
      const { width, height } = imgRef.current;
      if (width && height) {
        const initialCrop = {
          unit: '%',
          x: 5,
          y: 2,
          width: 90,
          height: 38,
        };
        const centeredCrop = centerCrop(initialCrop, width, height);
        setCrop(centeredCrop);
        setCompletedCrop(centeredCrop);
      }
    }
  }, [phase, index, crop]);

  const getCroppedDataUrl = useCallback(() => {
    if (!completedCrop || !imgRef.current) return null;
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image,
      completedCrop.x * scaleX, completedCrop.y * scaleY,
      completedCrop.width * scaleX, completedCrop.height * scaleY,
      0, 0, canvas.width, canvas.height
    );
    return canvas.toDataURL('image/png');
  }, [completedCrop]);

  const handlePrev = async () => {
    try {
      await saveCurrentStageProgress();
    } catch (e) {
      console.error('Auto-save on prev failed', e);
    }
    
    if (index > 0) {
      setIndex(i => i - 1);
      setCrop(null);
      setCompletedCrop(null);
      setImageRotation(0);
    } else if (phase === 'crop') {
      setPhase('categorize');
      setIndex(total - 1);
      setImageRotation(0);
    }
  };

  const buildSortingPayload = useCallback(() => (
    receipts.map(r => {
      const cat = checkedForOthers.has(r.id) ? 'others' : 'gcash';
      return {
        id: r.id,
        category: cat,
        account_holder: cat === 'others' ? 'OTHERS' : null,
      };
    })
  ), [receipts, checkedForOthers]);

  const saveSortingProgress = useCallback(async () => {
    const res = await fetch(getApiUrl('/api/receipts/bulk-update-category'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipts: buildSortingPayload() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to save sorting (HTTP ${res.status})`);
    }
    if (onSaved) await onSaved();
    return true;
  }, [buildSortingPayload, onSaved]);

  const saveCropDraft = useCallback(async ({ allowEmpty = false } = {}) => {
    if (!current) return allowEmpty;

    const dataUrl = getCroppedDataUrl();
    const payload = {};
    if (dataUrl) payload.cropped_image = dataUrl;

    if (currentCategory === 'others') {
      const hasData = manualAmount || manualReference?.trim() || manualDate;
      if (!hasData) {
        if (allowEmpty) return false;
        throw new Error('Enter amount, label, or date before saving');
      }
      const amt = Number(manualAmount);
      const mData = {
        amount: !isNaN(amt) && amt > 0 ? amt : 0,
        reference: manualReference?.trim() || null,
        date: manualDate || null,
        manual: !isNaN(amt) && amt > 0,
      };
      if (mData.manual) payload.ocr_status = 'completed';
      payload.ocr_data = mData;
      if (currentAccount) payload.account_holder = currentAccount;
      setManualEntries(prev => ({ ...prev, [index]: mData }));
      if (currentAccount && current) {
        setAccountEntries(prev => ({ ...prev, [current.id]: currentAccount }));
      }
      setSelections(prev => ({
        ...prev,
        [index]: { ...prev[index], category: 'others', account: currentAccount || 'OTHERS' },
      }));
    } else if (currentCategory === 'gcash') {
      if (!dataUrl) {
        if (allowEmpty) return false;
        throw new Error('Adjust the crop area before saving');
      }
      if (currentAccount) payload.account_holder = currentAccount;
    }

    const response = await fetch(getApiUrl(`/api/receipts/${current.id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Failed to save receipt (HTTP ${response.status})`);
    }

    if (dataUrl) setCrops(prev => ({ ...prev, [index]: dataUrl }));
    // Background refresh — don't block the caller on network round-trip
    if (onSaved) onSaved().catch(e => console.warn('[CropWizard] background refresh failed:', e));
    return true;
  }, [current, currentCategory, currentAccount, manualAmount, manualReference, manualDate, index, getCroppedDataUrl, onSaved]);

  const saveCropDraftOrSkip = useCallback(
    (options) => saveCropDraft(options).then((saved) => saved ? 'Receipt progress saved' : 'No pending crop changes'),
    [saveCropDraft]
  );

  const saveSummaryDraft = useCallback(async (deductions, calculatedNetAmount) => {
    const res = await fetch(getApiUrl(`/api/batches/${batchId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary_data: {
          gross_amount: totalClaimsAmount,
          service_fee: serviceFee,
          cashout_fee: cashoutFee,
          deductions: deductions || [],
          net_amount: calculatedNetAmount,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to save summary (HTTP ${res.status})`);
    }
    setSavedDeductions(deductions || []);
    setFinalNetAmount(calculatedNetAmount);
    if (onSaved) await onSaved();
    return true;
  }, [batchId, totalClaimsAmount, serviceFee, onSaved]);

  const saveBillingDraft = useCallback(async () => {
    const res = await fetch(getApiUrl(`/api/batches/${batchId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billing_data: {
          method: billingMethod,
          cash_denominations: cashDenominations,
          bank_transfer_amount: bankTransferAmounts,
          total_prepared: billingTotal,
        },
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to save billing (HTTP ${res.status})`);
    }
    if (onSaved) await onSaved();
    return true;
  }, [batchId, billingMethod, cashDenominations, bankTransferAmounts, billingTotal, onSaved]);

  const saveCurrentStageProgress = useCallback(async () => {
    switch (phase) {
      case 'categorize':
        await saveSortingProgress();
        return 'Sorting saved';
      case 'crop':
        return saveCropDraftOrSkip({ allowEmpty: true });
      case 'ocr':
      case 'verify':
      case 'finalize':
        return 'Progress already saved on server';
      case 'summary':
        await saveSummaryDraft(summaryDeductionsRef.current, summaryNetRef.current);
        return 'Summary saved';
      case 'billing':
        await saveBillingDraft();
        return 'Billing draft saved';
      default:
        return 'Nothing to save';
    }
  }, [phase, saveSortingProgress, saveCropDraftOrSkip, saveSummaryDraft, saveBillingDraft]);

  const handleDeductionsChange = useCallback((deductions, calculatedNetAmount) => {
    summaryDeductionsRef.current = deductions;
    summaryNetRef.current = calculatedNetAmount;
  }, []);

  useEffect(() => {
    if (phase === 'summary' || phase === 'billing') {
      summaryDeductionsRef.current = savedDeductions;
      summaryNetRef.current = finalNetAmount || calculatedNet;
    }
  }, [phase, savedDeductions, finalNetAmount, calculatedNet]);

  // Auto-save for summary stage (debounced)
  const debouncedSaveSummary = useCallback(
    debounce(async (deductions, calculatedNetAmount) => {
      if (phase !== 'summary') return;
      try {
        await saveSummaryDraft(deductions, calculatedNetAmount);
      } catch (e) {
        console.error('Auto-save summary failed', e);
      }
    }, 300),
    [phase, saveSummaryDraft]
  );

  useEffect(() => {
    if (phase === 'summary' && summaryDeductionsRef.current) {
      debouncedSaveSummary(summaryDeductionsRef.current, summaryNetRef.current);
    }
    return () => {
      // Clear timeout on unmount or phase change
      debouncedSaveSummary.cancel?.();
    };
  }, [phase, summaryDeductionsRef.current, summaryNetRef.current, debouncedSaveSummary]);

  // Auto-save for billing stage (debounced)
  const debouncedSaveBilling = useCallback(
    debounce(async () => {
      if (phase !== 'billing') return;
      try {
        await saveBillingDraft();
      } catch (e) {
        console.error('Auto-save billing failed', e);
      }
    }, 300),
    [phase, saveBillingDraft]
  );

  useEffect(() => {
    if (phase === 'billing') {
      debouncedSaveBilling();
    }
    return () => {
      // Clear timeout on unmount or phase change
      debouncedSaveBilling.cancel?.();
    };
  }, [phase, billingMethod, cashDenominations, bankTransferAmounts, debouncedSaveBilling]);

  const handleSaveProgress = useCallback(async () => {
    if (isSavingProgress || isProcessingOcr || isVerifying || isFinalizing) return;
    setIsSavingProgress(true);
    try {
      let message;
      if (phase === 'crop') {
        await saveCropDraft({ allowEmpty: false });
        message = 'Receipt progress saved';
      } else {
        message = await saveCurrentStageProgress();
      }
      const isNoop = message.includes('already saved') || message.includes('No pending');
      showToast(isNoop ? 'Up to date' : 'Progress saved', message, 'success');
    } catch (e) {
      console.error('Save progress failed', e);
      showToast('Save failed', e.message, 'error', 6000);
    } finally {
      setIsSavingProgress(false);
    }
  }, [phase, isSavingProgress, isProcessingOcr, isVerifying, isFinalizing, saveCropDraft, saveCurrentStageProgress, showToast]);

  const handleClose = useCallback(async () => {
    if (isProcessingOcr || isVerifying || isFinalizing) {
      showToast('Please wait', 'An operation is still running. Try again shortly.', 'error');
      return;
    }
    setIsSavingProgress(true);
    try {
      const message = await saveCurrentStageProgress();
      if (!message.includes('No pending')) {
        showToast('Progress saved', 'Your work has been saved before closing.', 'success', 2500);
      }
    } catch (e) {
      console.error('Auto-save on close failed', e);
      const proceed = window.confirm(
        `Could not save progress: ${e.message}\n\nClose anyway? Unsaved changes may be lost.`
      );
      if (!proceed) return;
    } finally {
      setIsSavingProgress(false);
    }
    await onClose?.();
  }, [isProcessingOcr, isVerifying, isFinalizing, saveCurrentStageProgress, showToast, onClose]);

  // Bulk apply: save all receipts as gcash or others based on checkbox state
  const handleApplySorting = async () => {
    setIsSavingSorting(true);
    try {
      await saveSortingProgress();
      setSortingView('review');
      showToast('Sorting saved', 'Categories applied successfully.', 'success');
    } catch (e) {
      showToast('Save failed', e.message, 'error', 6000);
    } finally {
      setIsSavingSorting(false);
    }
  };

  // Handle receipt card click - navigate to specific receipt's crop/input stage
  const handleReceiptClick = (receipt) => {
    console.log('=== Receipt Click Handler Called ===');
    console.log('Receipt:', receipt);
    
    // Find the index of the clicked receipt
    const receiptIndex = receipts.findIndex(r => r.id === receipt.id);
    
    if (receiptIndex === -1) {
      console.error('Receipt not found:', receipt.id);
      alert(`Receipt ID ${receipt.id} not found in receipts array`);
      return;
    }

    console.log('Receipt index found:', receiptIndex);
    console.log('Navigating to crop phase...');

    // Navigate to crop phase with the specific receipt
    setPhase('crop');
    setIndex(receiptIndex);
    
    // Set the category and account from the receipt
    setCurrentCategory(receipt.category);
    setCurrentAccount(receipt.account_holder);
    
    // Reset crop state
    setCrop(null);
    setCompletedCrop(null);
    setImageRotation(0);
    
    // If it's Others, load the existing manual data
    if (receipt.category === 'others') {
      const ocrData = receipt.ocr_data 
        ? (typeof receipt.ocr_data === 'string' ? JSON.parse(receipt.ocr_data) : receipt.ocr_data)
        : null;
      
      setManualAmount(String(ocrData?.amount || ''));
      setManualReference(ocrData?.reference || '');
      setManualDate(ocrData?.date || new Date().toISOString().split('T')[0]);
    }
    
    console.log('Navigation complete!');
  };


  // Proceed from review to crop phase — always persist sorting first
  const handleProceedToCrop = async () => {
    setIsSavingSorting(true);
    try {
      await saveSortingProgress();
    } catch (e) {
      showToast('Save failed', `${e.message}. Sorting was not saved.`, 'error', 6000);
      return;
    } finally {
      setIsSavingSorting(false);
    }

    const newSelections = {};
    receipts.forEach((r, i) => {
      const cat = checkedForOthers.has(r.id) ? 'others' : 'gcash';
      newSelections[i] = { category: cat, account: cat === 'others' ? 'OTHERS' : null };
    });
    setSelections(newSelections);
    setPhase('crop');

    const updatedLive = receipts.map((r) => ({
      ...r,
      category: checkedForOthers.has(r.id) ? 'others' : 'gcash',
    }));
    const firstGcash = updatedLive.findIndex(r => r.category === 'gcash' && !r.cropped_image);
    const firstOthers = updatedLive.findIndex(r => r.category === 'others' && !r.ocr_data?.manual);
    const startIndex = firstGcash !== -1 ? firstGcash : firstOthers !== -1 ? firstOthers : 0;

    setIndex(startIndex);
    setCrop(null);
    setCompletedCrop(null);
  };

  const handleNextCategorize = () => {
    setSortingView('select');
    setPhase('categorize');
  };

  // Handle category change from GCash to Others
  const handleChangeToOthers = async () => {
    if (!current) return;
    
    // Update the category
    setCurrentCategory('others');
    setSelections(prev => ({
      ...prev,
      [index]: { ...prev[index], category: 'others' }
    }));
    
    // Clear crop if it exists
    setCrops(prev => {
      const newCrops = { ...prev };
      delete newCrops[index];
      return newCrops;
    });
    
    // Reset crop state
    setCrop(null);
    setCompletedCrop(null);
    
    try {
      const res = await fetch(getApiUrl(`/api/receipts/${current.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'others' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      if (onSaved) onSaved().catch(e => console.warn('[CropWizard] background refresh failed:', e));
    } catch (e) {
      showToast('Update failed', e.message, 'error');
      return;
    }
    
    // Automatically proceed to next GCash receipt (skip this one, will see it later in Others section)
    // Find next GCash receipt that needs cropping
    const nextGcashIndex = liveReceipts.findIndex((r, i) => 
      i > index && r.category === 'gcash' && !r.cropped_image
    );
    
    if (nextGcashIndex !== -1) {
      // Move to next GCash receipt
      setIndex(nextGcashIndex);
      setCrop(null);
      setCompletedCrop(null);
      setImageRotation(0);
    } else {
      // No more GCash receipts, find first Others receipt that needs input
      const firstOthersIndex = liveReceipts.findIndex((r, i) => 
        r.category === 'others' && !r.ocr_data?.manual
      );
      
      if (firstOthersIndex !== -1) {
        setIndex(firstOthersIndex);
        setCrop(null);
        setCompletedCrop(null);
        setImageRotation(0);
      } else {
        // All done, proceed to OCR
        startOcrPhase();
      }
    }
  };

  // Handle category change from Others to GCash
  const handleChangeToGCash = async () => {
    if (!current) return;
    
    // Update the category
    setCurrentCategory('gcash');
    setSelections(prev => ({
      ...prev,
      [index]: { ...prev[index], category: 'gcash' }
    }));
    
    // Clear manual entry if it exists
    setManualEntries(prev => {
      const newEntries = { ...prev };
      delete newEntries[index];
      return newEntries;
    });
    
    // Reset manual input fields
    setManualAmount('');
    setManualReference('');
    setManualDate(new Date().toISOString().split('T')[0]);
    
    try {
      const res = await fetch(getApiUrl(`/api/receipts/${current.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'gcash' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      if (onSaved) onSaved().catch(e => console.warn('[CropWizard] background refresh failed:', e));
    } catch (e) {
      showToast('Update failed', e.message, 'error');
      return;
    }
    
    // Automatically proceed to next Others receipt (skip this one, will see it later in GCash section)
    // Find next Others receipt that needs input
    const nextOthersIndex = liveReceipts.findIndex((r, i) => 
      i > index && r.category === 'others' && !r.ocr_data?.manual
    );
    
    if (nextOthersIndex !== -1) {
      // Move to next Others receipt
      setIndex(nextOthersIndex);
      setCrop(null);
      setCompletedCrop(null);
      setImageRotation(0);
    } else {
      // No more Others receipts, check if there are GCash receipts that need cropping
      const firstGcashIndex = liveReceipts.findIndex((r, i) => 
        r.category === 'gcash' && !r.cropped_image
      );
      
      if (firstGcashIndex !== -1) {
        setIndex(firstGcashIndex);
        setCrop(null);
        setCompletedCrop(null);
        setImageRotation(0);
      } else {
        // All done, proceed to OCR
        startOcrPhase();
      }
    }
  };

  // Handle re-crop/re-input from finalize stage
  const handleReCrop = useCallback((result, resultIndex) => {
    // The result object has a 'receipt' property containing the full receipt object
    const receipt = result.receipt;
    
    if (!receipt || !receipt.id) {
      console.error('Invalid receipt data:', result);
      return;
    }
    
    // Find the receipt index in the receipts array
    const receiptIndex = receipts.findIndex(r => r.id === receipt.id);
    
    if (receiptIndex === -1) {
      console.error('Receipt not found in receipts array:', receipt.id);
      return;
    }
    
    // Go back to crop phase
    setPhase('crop');
    setIndex(receiptIndex);
    
    // Set the category and account
    setCurrentCategory(receipt.category);
    setCurrentAccount(receipt.account_holder || result.account_holder);
    
    // Reset image rotation
    setImageRotation(0);
    
    // If it's a GCash receipt, load existing crop or allow re-cropping
    if (receipt.category === 'gcash') {
      // Don't clear the crop - let them see the existing crop
      // They can adjust it if needed
      setCrop(null);
      setCompletedCrop(null);
    }
    
    // If it's Others, load the existing manual data
    if (receipt.category === 'others') {
      const ocrData = receipt.ocr_data 
        ? (typeof receipt.ocr_data === 'string' ? JSON.parse(receipt.ocr_data) : receipt.ocr_data)
        : null;
      
      // Load from result or ocrData
      setManualAmount(String(result.amount || ocrData?.amount || ''));
      setManualReference(result.reference || ocrData?.reference || '');
      setManualDate(result.date || ocrData?.date || new Date().toISOString().split('T')[0]);
    }
    
    // Reset OCR results to allow re-extraction after editing
    setOcrResults(null);
    setShowOcrPreview(false);
    setShowVerifyPreview(false);
  }, [receipts]);

  const handleNextCrop = useCallback(async () => {
    if (!current) return;

    // Validate manual input for 'others' receipts
    if (currentCategory === 'others') {
      const amt = Number(manualAmount);
      if (!manualAmount || isNaN(amt) || amt <= 0) {
        alert('Please enter a valid amount greater than ₱0.');
        return;
      }
    }

    // Check if we're re-cropping (coming from extraction results)
    const isReCropping = ocrResults && ocrResults.length > 0;

    // 1. Get cropped data and save locally
    const dataUrl = getCroppedDataUrl();
    const updatedCrops = { ...crops, [index]: dataUrl };
    setCrops(updatedCrops);

    // 2. Prepare payload
    const payload = {};
    if (dataUrl) payload.cropped_image = dataUrl;

    // If it's 'Others', we save manual data as ocr_data immediately
    if (currentCategory === 'others') {
      const mData = {
        amount: Number(manualAmount),
        reference: manualReference || null,
        date: manualDate || null,
        manual: true
      };
      payload.ocr_status = 'completed';
      payload.ocr_data = mData;
      if (currentAccount) payload.account_holder = currentAccount;
      setManualEntries(prev => ({ ...prev, [index]: mData }));
      // Track account by receipt id so OCR loop can read it reliably
      if (currentAccount && current) {
        setAccountEntries(prev => ({ ...prev, [current.id]: currentAccount }));
      }
      setSelections(prev => ({
        ...prev,
        [index]: { ...prev[index], category: 'others', account: currentAccount || 'OTHERS' }
      }));
    }

    // 3. Immediate save to DB — fire background refresh (onSaved) without blocking navigation
    try {
      const response = await fetch(getApiUrl(`/api/receipts/${current.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      // Refresh batch stats in the background — don't await so UI moves instantly
      if (onSaved) onSaved().catch(e => console.warn('[CropWizard] background refresh failed:', e));
    } catch (e) {
      console.error('Failed to save Stage 3 data to DB', e);
      showToast('Save failed', e.message, 'error', 6000);
      return;
    }
    
    // If re-cropping from extraction results, re-run OCR for this specific receipt
    if (isReCropping && currentCategory === 'gcash' && dataUrl) {
      console.log('Re-cropping detected, running OCR extraction for receipt:', current.id);
      
      try {
        setIsProcessingOcr(true);

        const worker = await createWorker('eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') console.log(`[OCR re-crop] ${Math.round(m.progress * 100)}%`);
          },
        });

        await worker.setParameters({
          tessedit_pageseg_mode: '6',
          tessedit_ocr_engine_mode: '1',
        });

        const loadCanvas = (src, enhance = false) => new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const timeout = setTimeout(() => { img.src = ''; reject(new Error(`Timeout: receipt #${current.id}`)); }, 15000);
          img.onload = () => {
            clearTimeout(timeout);
            const scale = (enhance && img.naturalWidth < 400) ? 2 : 1;
            const canvas = document.createElement('canvas');
            canvas.width  = img.naturalWidth  * scale;
            canvas.height = img.naturalHeight * scale;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            if (enhance) {
              const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const d  = id.data;
              for (let p = 0; p < d.length; p += 4) {
                const grey = 0.299 * d[p] + 0.587 * d[p+1] + 0.114 * d[p+2];
                const out  = grey > 128 ? Math.min(255, grey * 1.15) : Math.max(0, grey * 0.7);
                d[p] = d[p+1] = d[p+2] = out;
              }
              ctx.putImageData(id, 0, 0);
            }
            resolve(canvas);
          };
          img.onerror = () => { clearTimeout(timeout); reject(new Error(`Load failed: receipt #${current.id}`)); };
          img.src = src;
        });

        // OCR the crop with enhancement for amount/reference
        const cropCanvas = await loadCanvas(dataUrl, true);
        const { data: { text: cropText } } = await worker.recognize(cropCanvas);
        const extracted = extractFields(cropText);

        // OCR the full original image for phone/account detection
        const knownAccount = accountEntries[current.id] || currentAccount;
        let detectedAccount = extracted.account_holder || knownAccount || null;

        if (!detectedAccount || detectedAccount === 'Unknown' || detectedAccount === 'OTHERS') {
          try {
            const fullCanvas = await loadCanvas(getApiUrl(`/api/receipts/${current.id}/image`), false);
            const { data: { text: fullText } } = await worker.recognize(fullCanvas);
            const phoneAccount = detectAccountFromPhone(fullText);
            if (phoneAccount) detectedAccount = phoneAccount;
            if (!extracted.amount || !extracted.reference) {
              const fullExtracted = extractFields(fullText);
              if (!extracted.amount && fullExtracted.amount) extracted.amount = fullExtracted.amount;
              if (!extracted.reference && fullExtracted.reference) extracted.reference = fullExtracted.reference;
              if (!extracted.date && fullExtracted.date) extracted.date = fullExtracted.date;
            }
          } catch (e) {
            console.warn(`Full-image scan failed for re-crop #${current.id}:`, e.message);
          }
        }

        const patchRes = await fetch(getApiUrl(`/api/receipts/${current.id}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ocr_status: 'completed',
            ocr_data: {
              amount: extracted.amount || 0,
              reference: extracted.reference || null,
              date: extracted.date || null,
              raw_text: cropText,
              confidence: 99
            },
            account_holder: detectedAccount || null,
          }),
        });

        if (!patchRes.ok) throw new Error(`Save failed for receipt #${current.id}`);

        const updatedReceipt = await patchRes.json();
        
        setOcrResults(prevResults => {
          const newResults = [...prevResults];
          const resultIndex = newResults.findIndex(r => r.receipt?.id === current.id);
          if (resultIndex !== -1) {
            newResults[resultIndex] = {
              receipt: updatedReceipt,
              amount: extracted.amount || 0,
              reference: extracted.reference || null,
              date: extracted.date || null,
              confidence: 99,
              manualEntry: false,
              account_holder: detectedAccount || updatedReceipt.account_holder,
            };
          }
          return newResults;
        });

        await worker.terminate();
        setIsProcessingOcr(false);
        setPhase('ocr');
        setShowOcrPreview(true);
        
        showToast(
          'Re-extraction complete!',
          `Amount: ₱${extracted.amount || 0}  ·  Ref: ${extracted.reference || 'N/A'}  ·  Account: ${detectedAccount || 'Unknown'}`,
          'success'
        );
        return;
      } catch (e) {
        console.error('Re-extraction failed:', e);
        showToast('Re-extraction failed', e.message, 'error', 6000);
        setIsProcessingOcr(false);
        setPhase('ocr');
        setShowOcrPreview(true);
        return;
      }
    }
    
    // If re-cropping Others receipt, just go back to results
    if (isReCropping) {
      setPhase('ocr');
      setShowOcrPreview(true);
      showToast('Manual data updated successfully!', null, 'success');
      return;
    }
    
    // Find next item that needs crop/input — GCash always first, then Others
    const needsCrop = (r, i) => {
      const receiptIndex = receipts.findIndex(rec => rec.id === r.id);
      if (r.category === 'gcash') return !r.cropped_image && !crops[receiptIndex];
      if (r.category === 'others') {
        return !r.ocr_data?.manual && !manualEntries[receiptIndex];
      }
      return false;
    };

    // First look for any remaining GCash (anywhere in the list, not just after current)
    const nextGcash = liveReceipts.findIndex((r, i) => i !== index && r.category === 'gcash' && needsCrop(r, i));
    // Then look for any remaining Others
    const nextOthers = liveReceipts.findIndex((r, i) => i !== index && r.category === 'others' && needsCrop(r, i));

    const nextNeedsCrop = nextGcash !== -1 ? nextGcash : nextOthers;

    if (nextNeedsCrop !== -1) {
      const nextReceipt = receipts[nextNeedsCrop];
      const savedLabel = currentCategory === 'others'
        ? (manualReference?.trim() ? `₱${Number(manualAmount).toLocaleString()} · ${manualReference.trim()}` : `₱${Number(manualAmount).toLocaleString()}`)
        : 'Crop saved';
      const nextNum = nextNeedsCrop + 1;
      const nextType = nextReceipt?.category === 'gcash' ? 'GCash' : 'Others';
      showToast(
        `Saved · Moving to receipt ${nextNum}`,
        `${savedLabel} → Next: ${nextType}`,
        'success',
        2500
      );
      setIndex(nextNeedsCrop);
      setCrop(null);
      setCompletedCrop(null);
      setImageRotation(0);
    } else {
      // Phase 2 complete -> Automatically start Phase 3
      showToast('All done! ✓', 'All receipts have been cropped & filled. Proceeding to extraction.', 'success', 3000);
      startOcrPhase();
    }
  }, [current, currentCategory, manualAmount, manualReference, manualDate, currentAccount, ocrResults, crops, index, liveReceipts, receipts, manualEntries, accountEntries, getCroppedDataUrl, showToast]);

  const startOcrPhase = () => {
    setPhase('ocr');
    // Removed handleRunOcrExtraction(); - User wants a button now
  };

  const startVerifyPhase = async () => {
    setPhase('verify');
    setShowOcrPreview(false);
    setShowVerifyPreview(false);
    setIsVerifying(true);
    
    try {
      const res = await fetch(getApiUrl(`/api/batches/${batchId}/process`), { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(errText || `Server error ${res.status}`);
      }

      const payload = await res.json();
      setOcrResults(payload.results || []);
      setVerificationSummary(payload.summary || null);
      setShowVerifyPreview(true);
    } catch (e) {
      console.error('Verification failed', e);
      alert(`Verification failed: ${e.message}. Please try again.`);
      setPhase('ocr');
      setShowOcrPreview(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const confirmTransactionMatch = async (receiptId, tx) => {
    if (!receiptId || !tx?.id) return false;
    try {
      const response = await fetch(getApiUrl(`/api/batches/${batchId}/receipts/${receiptId}/manual-verify`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: tx.id }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${response.status}`);
      }
      setOcrResults(prev => {
        const next = prev.map(r =>
          r.receipt?.id === receiptId
            ? { ...r, verification_status: 'verified', reference: tx.reference || tx.label, amount: tx.amount, match_details: { bank: tx.source_type || 'Database' } }
            : r
        );
        setVerificationSummary(summarizeVerificationFromResults(next));
        return next;
      });
      showToast('Transaction confirmed!', `Ref: ${tx.reference || tx.label}`, 'success');
      return true;
    } catch (e) {
      showToast('Failed to confirm', e.message, 'error');
      return false;
    }
  };

  const startFinalizePhase = async () => {
    const pendingMatches = ocrResults?.filter(r =>
      r.verification_status === 'matched' ||
      (r.verification_status !== 'verified' && r.match_details?.potential_matches?.length > 0)
    ) || [];

    if (pendingMatches.length > 0) {
      const proceed = window.confirm(
        `${pendingMatches.length} receipt(s) still need confirmation. ` +
        'Only explicitly confirmed receipts will receive a batch label. Continue finalizing?'
      );
      if (!proceed) return;
    }

    setPhase('finalize');
    setIsFinalizing(true);
    try {
      const res = await fetch(getApiUrl(`/api/batches/${batchId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checker_status: 'finalized' }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(errText || `Server error ${res.status}`);
      }
      const batch = await res.json();
      setFinalizedBatch(batch);
    } catch (e) {
      console.error('Finalize failed', e);
      alert(`Finalization failed: ${e.message}. Please try again.`);
      setPhase('verify');
      setShowVerifyPreview(true);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleRunOcrExtraction = async () => {
    setIsProcessingOcr(true);
    setOcrResults(null);
    setOcrProgress(0); // Initialize progress

    const worker = await createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] ${Math.round(m.progress * 100)}%`);
        }
      },
      errorHandler: e => console.error('Tesseract Worker Error:', e),
    });

    // PSM 6 = single uniform text block — ideal for cropped receipt sections
    // OEM 1 = LSTM only (more accurate than legacy)
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_ocr_engine_mode: '1',
    });

    try {
      const results = [];
      const failedReceipts = [];
      
      const receiptsToProcess = liveReceipts.filter(r => r.category && r.category !== 'unsorted');
      const totalToProcess = receiptsToProcess.length;
      
      for (let idx = 0; idx < receiptsToProcess.length; idx++) {
        const r = receiptsToProcess[idx];
        const i = liveReceipts.indexOf(r);
        
        // Update progress
        setOcrProgress(Math.round((idx / totalToProcess) * 100));
        
        // Skip OCR if it's 'Others' and already has manual data
        const sessionManual = manualEntries[i];
        // ocr_data can arrive as a string if the backend didn't cast it
        const ocrDataParsed = r.ocr_data
          ? (typeof r.ocr_data === 'string' ? (() => { try { return JSON.parse(r.ocr_data); } catch { return {}; } })() : r.ocr_data)
          : null;
        if ((r.category === 'others' && ocrDataParsed?.manual) || sessionManual) {
          const data = sessionManual || ocrDataParsed;
          // Account: prefer accountEntries (set during manual input), then receipt's saved value
          const resolvedAccount = accountEntries[r.id] || r.account_holder;
          const resolvedReceipt = resolvedAccount
            ? { ...r, account_holder: resolvedAccount }
            : r;
          results.push({
            receipt: resolvedReceipt,
            amount: data.amount,
            reference: data.reference,
            date: data.date,
            confidence: 100,
            manualEntry: true,
            account_holder: resolvedAccount || r.account_holder,
          });
          continue;
        }

        // Use the saved cropped image or the original for amount/reference extraction
        let imageSrc = crops[i];
        if (!imageSrc) {
          // GCash receipts need a cropped image — without one, OCR on the full receipt
          // is too noisy to reliably extract amount/reference. Skip and warn.
          if (r.category === 'gcash' && !r.cropped_image) {
            console.warn(`Receipt #${r.id} (GCash) has no cropped image — skipping OCR, marking as failed.`);
            failedReceipts.push(r.id);
            continue;
          }
          imageSrc = r.cropped_image
            ? getApiUrl(`/api/receipts/${r.id}/image?type=crop`)
            : getApiUrl(`/api/receipts/${r.id}/image`);
        }

        // Always also load the FULL original image for account holder detection —
        // the phone number is at the bottom of a GCash receipt and gets cut off by the crop.
        const fullImageSrc = getApiUrl(`/api/receipts/${r.id}/image`);

        // ─── Per-receipt try/catch so one failure doesn't kill the batch ───
        try {
          // Load image → canvas, with optional contrast-boost preprocessing for OCR accuracy
          const loadCanvas = (src, enhance = false) => new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const timeout = setTimeout(() => {
              img.src = '';
              reject(new Error(`Image load timeout for receipt #${r.id}`));
            }, 15000);
            img.onload = () => {
              clearTimeout(timeout);
              // Scale up small images — Tesseract works best at ~300 DPI equivalent.
              // If the crop is very small (< 400px wide), upscale 2×.
              const scale = (enhance && img.naturalWidth < 400) ? 2 : 1;
              const canvas = document.createElement('canvas');
              canvas.width  = img.naturalWidth  * scale;
              canvas.height = img.naturalHeight * scale;
              const ctx = canvas.getContext('2d');
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              if (enhance) {
                // Simple contrast boost: convert to greyscale + high contrast
                const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const d  = id.data;
                for (let p = 0; p < d.length; p += 4) {
                  // Luminance-weighted greyscale
                  const grey = 0.299 * d[p] + 0.587 * d[p+1] + 0.114 * d[p+2];
                  // High-contrast threshold: push towards black or white
                  const out  = grey > 128 ? Math.min(255, grey * 1.15) : Math.max(0, grey * 0.7);
                  d[p] = d[p+1] = d[p+2] = out;
                }
                ctx.putImageData(id, 0, 0);
              }

              resolve(canvas);
            };
            img.onerror = () => {
              clearTimeout(timeout);
              reject(new Error(`Failed to load image for receipt #${r.id}`));
            };
            img.src = src;
          });

          // Run OCR on crop with enhancement (contrast boost + upscale for small crops)
          const cropCanvas = await loadCanvas(imageSrc, true);
          const { data: { text: cropText } } = await worker.recognize(cropCanvas);
          const extracted = extractFields(cropText);

          // Run OCR on full image to detect phone number / account holder
          // Only do this if account not already known from crop or manual selection
          const knownAccount = accountEntries[r.id] || r.account_holder;
          let detectedAccount = extracted.account_holder || knownAccount || null;

          if (!detectedAccount || detectedAccount === 'Unknown' || detectedAccount === 'OTHERS') {
            try {
              // Full image: no enhance — we want the raw text for phone number detection
              const fullCanvas = await loadCanvas(fullImageSrc, false);
              const { data: { text: fullText } } = await worker.recognize(fullCanvas);
              // Try phone detection on full text
              const phoneAccount = detectAccountFromPhone(fullText);
              if (phoneAccount) detectedAccount = phoneAccount;
              // Also try field extraction from full image as fallback for amount/ref
              if (!extracted.amount || !extracted.reference) {
                const fullExtracted = extractFields(fullText);
                if (!extracted.amount && fullExtracted.amount) extracted.amount = fullExtracted.amount;
                if (!extracted.reference && fullExtracted.reference) extracted.reference = fullExtracted.reference;
                if (!extracted.date && fullExtracted.date) extracted.date = fullExtracted.date;
              }
            } catch (fullErr) {
              console.warn(`Full-image OCR failed for receipt #${r.id} (non-fatal):`, fullErr.message);
            }
          }

          // Validate extracted data — warn but don't block
          if (!extracted.amount && !extracted.reference) {
            console.warn(`Receipt #${r.id}: OCR found no amount or reference. Crop text: ${cropText.substring(0, 100)}`);
          }

          const patchRes = await fetch(getApiUrl(`/api/receipts/${r.id}`), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ocr_status: 'completed',
              ocr_data: {
                amount: extracted.amount || 0,
                reference: extracted.reference || null,
                date: extracted.date || null,
                raw_text: cropText,
                confidence: 99
              },
              // Always write account_holder: use detected, then known, never leave null for gcash
              account_holder: detectedAccount || null,
            }),
          });

          if (!patchRes.ok) throw new Error(`Save failed for receipt #${r.id} (HTTP ${patchRes.status})`);

          const updatedReceipt = await patchRes.json();
          results.push({
            receipt: updatedReceipt,
            amount: extracted.amount || 0,
            reference: extracted.reference || null,
            date: extracted.date || null,
            confidence: 99,
            manualEntry: false,
            account_holder: detectedAccount || updatedReceipt.account_holder,
          });
        } catch (receiptErr) {
          console.error(`OCR failed for receipt #${r.id}:`, receiptErr);
          failedReceipts.push(r.id);
        }
      }

      // Set progress to 100% BEFORE showing results
      setOcrProgress(100);
      
      // Small delay to ensure progress bar shows 100% before results appear
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setOcrResults(results);
      setShowOcrPreview(true);

      if (failedReceipts.length > 0) {
        alert(`Extraction complete with ${failedReceipts.length} error(s).\nReceipt IDs that failed: ${failedReceipts.join(', ')}.`);
      }
    } catch (e) {
      console.error('OCR Extraction failed:', e);
      alert(`Extraction failed: ${e.message}. Please check your connection and try again.`);
    } finally {
      await worker.terminate();
      setIsProcessingOcr(false);
    }
  };

  

  useEffect(() => {
    if (total === 0 && !isProcessingOcr && !isVerifying && !isFinalizing) {
      onClose();
    }
  }, [total, isProcessingOcr, isVerifying, isFinalizing, onClose]);

  if (total === 0 || !current) {
    if (phase === 'ocr' || phase === 'verify' || phase === 'finalize') {
      // Allow these phases to render their specialized UI even if 'current' is null
    } else {
      return null;
    }
  }

  return (
    <>
    {/* ── Upper-right toast notification ── */}
    {toast && (
      <div style={{
        position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
        minWidth: '280px', maxWidth: '380px',
        background: toast.type === 'success' ? '#ffffff' : '#fff5f5',
        border: `1.5px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
        borderRadius: '16px',
        boxShadow: toast.type === 'success'
          ? '0 8px 32px rgba(16,185,129,0.15), 0 2px 8px rgba(0,0,0,0.08)'
          : '0 8px 32px rgba(239,68,68,0.15), 0 2px 8px rgba(0,0,0,0.08)',
        padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: '6px',
        animation: 'toastSlideIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily: "'Inter', 'Inter', sans-serif",
      }}>
        <style>{`
          @keyframes toastSlideIn {
            from { opacity: 0; transform: translateX(40px) scale(0.95); }
            to   { opacity: 1; transform: translateX(0)   scale(1);    }
          }
        `}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {toast.type === 'success' ? (
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
          ) : (
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          )}
          <span style={{ fontSize: '13px', fontWeight: 800, color: toast.type === 'success' ? '#064e3b' : '#7f1d1d', flex: 1, letterSpacing: '-0.01em' }}>
            {toast.message}
          </span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.3)', padding: '2px', lineHeight: 1, flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {toast.detail && (
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(0,0,0,0.45)', paddingLeft: '38px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.01em' }}>
            {toast.detail}
          </div>
        )}
      </div>
    )}
    <div className="cw-overlay">
      <style>{CSS}</style>
      <div className="cw-card">
        {/* Header */}
        <div className="cw-header">
          <div className="cw-header-icon">
            {/* Stage 2: Sorting — grid with checkboxes */}
            {phase === 'categorize' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                <polyline points="14 17.5 16.5 20 21 15"/>
              </svg>
            )}
            {/* Stage 3: Crop & Input */}
            {phase === 'crop' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
              </svg>
            )}
            {/* Stage 4: OCR */}
            {phase === 'ocr' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/>
                <rect x="7" y="7" width="10" height="10" rx="1"/>
              </svg>
            )}
            {/* Stage 5: Verify */}
            {phase === 'verify' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4"/>
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/>
              </svg>
            )}
            {/* Stage 6: Finalize */}
            {phase === 'finalize' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            )}
            {/* Stage 7: Summary */}
            {phase === 'summary' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            )}
            {/* Stage 8: Billing */}
            {phase === 'billing' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            )}
          </div>
          <div className="cw-title-group">
            {/* Stage 2 gets its own styled header to match SortingStage's design language */}
            {phase === 'categorize' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Stage pill */}
                  <span style={{
                    padding: '4px 12px', borderRadius: '100px',
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1.5px solid rgba(249, 115, 22, 0.3)',
                    color: '#f97316',
                    fontSize: '10px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}>
                    Stage 2 of 8
                  </span>
                </div>
                {/* Title */}
                <div style={{
                  fontSize: '20px', fontWeight: 900,
                  color: '#431407',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Sort Receipts
                </div>
                {/* Subtitle */}
                <div style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(67, 20, 7, 0.6)',
                  letterSpacing: '0.02em',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Classify each receipt as GCash or Others
                </div>
              </div>
            ) : phase === 'crop' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Stage pill */}
                  <span style={{
                    padding: '4px 12px', borderRadius: '100px',
                    background: '#f97316',
                    border: '1.5px solid #f97316',
                    color: '#fff',
                    fontSize: '10px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}>
                    Stage 3 of 8
                  </span>
                </div>
                {/* Title */}
                <div style={{
                  fontSize: '20px', fontWeight: 900,
                  color: '#f97316',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Crop & Input
                </div>
                {/* Subtitle */}
                <div style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(67, 20, 7, 0.6)',
                  letterSpacing: '0.02em',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Crop GCash receipts and input Others manually
                </div>
              </div>
            ) : phase === 'ocr' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Stage pill */}
                  <span style={{
                    padding: '4px 12px', borderRadius: '100px',
                    background: '#f97316',
                    border: '1.5px solid #f97316',
                    color: '#fff',
                    fontSize: '10px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}>
                    Stage 4 of 8
                  </span>
                </div>
                {/* Title */}
                <div style={{
                  fontSize: '20px', fontWeight: 900,
                  color: '#f97316',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  OCR Extraction
                </div>
                {/* Subtitle */}
                <div style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(67, 20, 7, 0.6)',
                  letterSpacing: '0.02em',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Automatically reading receipt details
                </div>
              </div>
            ) : phase === 'verify' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Stage pill */}
                  <span style={{
                    padding: '4px 12px', borderRadius: '100px',
                    background: '#f97316',
                    border: '1.5px solid #f97316',
                    color: '#fff',
                    fontSize: '10px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}>
                    Stage 5 of 8
                  </span>
                </div>
                {/* Title */}
                <div style={{
                  fontSize: '20px', fontWeight: 900,
                  color: '#f97316',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Verification
                </div>
                {/* Subtitle */}
                <div style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(67, 20, 7, 0.6)',
                  letterSpacing: '0.02em',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Match results with database records
                </div>
              </div>
            ) : phase === 'finalize' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Stage pill */}
                  <span style={{
                    padding: '4px 12px', borderRadius: '100px',
                    background: '#f97316',
                    border: '1.5px solid #f97316',
                    color: '#fff',
                    fontSize: '10px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}>
                    Stage 6 of 8
                  </span>
                </div>
                {/* Title */}
                <div style={{
                  fontSize: '20px', fontWeight: 900,
                  color: '#f97316',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Finalization
                </div>
                {/* Subtitle */}
                <div style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(67, 20, 7, 0.6)',
                  letterSpacing: '0.02em',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Final review before batch creation
                </div>
              </div>
            ) : phase === 'summary' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Stage pill */}
                  <span style={{
                    padding: '4px 12px', borderRadius: '100px',
                    background: '#f97316',
                    border: '1.5px solid #f97316',
                    color: '#fff',
                    fontSize: '10px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}>
                    Stage 7 of 8
                  </span>
                </div>
                {/* Title */}
                <div style={{
                  fontSize: '20px', fontWeight: 900,
                  color: '#f97316',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Batch Summary
                </div>
                {/* Subtitle */}
                <div style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(67, 20, 7, 0.6)',
                  letterSpacing: '0.02em',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Review total amounts and deductions
                </div>
              </div>
            ) : phase === 'billing' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Stage pill */}
                  <span style={{
                    padding: '4px 12px', borderRadius: '100px',
                    background: '#f97316',
                    border: '1.5px solid #f97316',
                    color: '#fff',
                    fontSize: '10px', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}>
                    Stage 8 of 8
                  </span>
                </div>
                {/* Title */}
                <div style={{
                  fontSize: '20px', fontWeight: 900,
                  color: '#f97316',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Payment & Billing
                </div>
                {/* Subtitle */}
                <div style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(67, 20, 7, 0.6)',
                  letterSpacing: '0.02em',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Complete the transaction via GCash
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  fontSize: '20px', fontWeight: 900,
                  color: '#431407',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  textTransform: 'uppercase',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  {phase === 'crop' ? 'Crop & Input' : 'Batch Checker'}
                </div>
                <div style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(67, 20, 7, 0.6)',
                  letterSpacing: '0.02em',
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}>
                  Step {index + 1} of {receipts.length}
                </div>
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', right: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="cw-close" onClick={handleClose} style={{ position: 'static' }}>✕</button>
          </div>
        </div>

        {/* Progress */}
        <div className="cw-progress-container" style={{ position: 'relative' }}>

          {phase !== 'categorize' && phase !== 'ocr' && phase !== 'verify' && phase !== 'finalize' && phase !== 'summary' && phase !== 'billing' && (
          <div className="cw-steps">
            {receipts.map((_, i) => (
              <div key={i} className={`cw-step-seg ${i < index ? 'done' : i === index ? 'active' : ''}`}>
                <div className="cw-step-fill" style={i < index ? { transform: 'scaleX(1)' } : {}} />
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Content Area */}
        <div className="cw-content">
          {(phase === 'ocr' || phase === 'verify' || phase === 'finalize' || phase === 'summary' || phase === 'categorize' || phase === 'billing') ? (
            <div className={`flex-1 flex flex-col overflow-hidden ${phase === 'billing' ? '' : 'bg-black/20'}`} style={phase === 'billing' ? { overflow: 'auto' } : {}}>

              {/* ── Stage 2: Sorting ── */}
              {phase === 'categorize' && (
                <SortingStage
                  receipts={receipts}
                  checkedForOthers={checkedForOthers}
                  setCheckedForOthers={setCheckedForOthers}
                  sortingView={sortingView}
                  setSortingView={setSortingView}
                  isSavingSorting={isSavingSorting || isSavingProgress}
                  onApply={handleApplySorting}
                  onProceed={handleProceedToCrop}
                  onReceiptClick={handleReceiptClick}
                />
              )}
              {/* Phase 3 Preview */}
              {phase === 'ocr' && showOcrPreview && (
                <div className="flex-1 flex flex-col overflow-hidden" style={{ 
                  background: '#fffbf5',
                  padding: '16px 12px'
                }}>
                  {/* Header */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(249, 115, 22, 0.08)',
                        border: '1px solid rgba(249, 115, 22, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span style={{ 
                          color: '#f97316', 
                          fontSize: '11px', 
                          fontWeight: 900, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.08em',
                          fontFamily: "'Inter', sans-serif"
                        }}>
                          Extraction Complete
                        </span>
                      </div>
                      <div style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        background: 'rgba(249, 115, 22, 0.06)',
                        border: '1px solid rgba(249, 115, 22, 0.15)'
                      }}>
                        <span style={{ 
                          color: 'rgba(67, 20, 7, 0.7)', 
                          fontSize: '11px', 
                          fontWeight: 700,
                          fontFamily: "'Inter', sans-serif"
                        }}>
                          {ocrResults?.length} receipts processed
                        </span>
                      </div>
                    </div>
                    <p style={{ 
                      color: 'rgba(67, 20, 7, 0.55)', 
                      fontSize: '13px', 
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                      margin: 0
                    }}>
                      Review extracted data before proceeding to verification
                    </p>
                  </div>

                  {/* Account breakdown with filter */}
                  {(() => {
                    const accounts = ['Babilyn', 'Nixie', 'Kristine'];
                    const colors = {
                      All:      { bg: 'rgba(249,115,22,0.08)',   border: 'rgba(249,115,22,0.25)',   text: '#f97316',  count: '#ea580c' },
                      Babilyn:  { bg: 'rgba(236,72,153,0.08)',   border: 'rgba(236,72,153,0.25)',   text: '#ec4899',  count: '#db2777' },
                      Nixie:    { bg: 'rgba(139,92,246,0.08)',   border: 'rgba(139,92,246,0.25)',   text: '#8b5cf6',  count: '#7c3aed' },
                      Kristine: { bg: 'rgba(6,182,212,0.08)',    border: 'rgba(6,182,212,0.25)',    text: '#06b6d4',  count: '#0891b2' },
                    };
                    const allCount = ocrResults?.length || 0;
                    const unknownCount = ocrResults?.filter(r => {
                      const h = r.receipt?.account_holder || r.account_holder;
                      return !h || h === 'Unknown' || h === 'OTHERS';
                    }).length || 0;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
                        <div 
                          onClick={() => setOcrAccountFilter('All')}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            background: ocrAccountFilter === 'All' ? colors.All.bg : '#ffffff',
                            border: `1px solid ${ocrAccountFilter === 'All' ? colors.All.border : 'rgba(251,146,60,0.15)'}`,
                            display: 'flex', alignItems: 'center', gap: '10px',
                            transition: 'all 0.2s', cursor: 'pointer',
                            boxShadow: ocrAccountFilter === 'All' ? '0 2px 8px rgba(249,115,22,0.12)' : 'none',
                            minHeight: '48px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                        >
                          <span style={{ color: colors.All.text, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif" }}>All</span>
                          <span style={{ background: 'rgba(249,115,22,0.1)', color: colors.All.count, borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", minWidth: '32px', textAlign: 'center' }}>{allCount}</span>
                        </div>
                        
                        {accounts.map(acc => {
                          const count = ocrResults?.filter(r => (r.receipt?.account_holder || r.account_holder) === acc).length || 0;
                          const c = colors[acc];
                          return (
                            <div 
                              key={acc}
                              onClick={() => setOcrAccountFilter(acc)}
                              style={{
                                padding: '8px 12px', borderRadius: '10px',
                                background: ocrAccountFilter === acc ? c.bg : '#ffffff',
                                border: `1px solid ${ocrAccountFilter === acc ? c.border : 'rgba(251,146,60,0.15)'}`,
                                display: 'flex', alignItems: 'center', gap: '10px',
                                transition: 'all 0.2s', cursor: 'pointer',
                                boxShadow: ocrAccountFilter === acc ? `0 2px 8px ${c.bg}` : 'none',
                                minHeight: '48px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                              }}
                            >
                              <span style={{ color: c.text, fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif" }}>{acc}</span>
                              <span style={{ background: c.bg, color: c.count, borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", minWidth: '32px', textAlign: 'center' }}>{count}</span>
                            </div>
                          );
                        })}

                        {/* Unknown filter pill */}
                        {unknownCount > 0 && (
                          <div
                            onClick={() => setOcrAccountFilter('Unknown')}
                            style={{
                              padding: '8px 12px', borderRadius: '10px',
                              background: ocrAccountFilter === 'Unknown' ? 'rgba(239,68,68,0.1)' : '#ffffff',
                              border: `1.5px solid ${ocrAccountFilter === 'Unknown' ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.25)'}`,
                              display: 'flex', alignItems: 'center', gap: '10px',
                              transition: 'all 0.2s', cursor: 'pointer',
                              boxShadow: ocrAccountFilter === 'Unknown' ? '0 2px 8px rgba(239,68,68,0.15)' : 'none',
                              minHeight: '48px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif" }}>Unknown</span>
                            <span style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', borderRadius: '8px', padding: '4px 10px', fontSize: '13px', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", minWidth: '32px', textAlign: 'center' }}>{unknownCount}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Results list */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      {(() => {
                        const filteredResults = ocrAccountFilter === 'All' 
                          ? ocrResults 
                          : ocrAccountFilter === 'Unknown'
                            ? ocrResults?.filter(r => { const h = r.receipt?.account_holder || r.account_holder; return !h || h === 'Unknown' || h === 'OTHERS'; })
                            : ocrResults?.filter(r => (r.receipt?.account_holder || r.account_holder) === ocrAccountFilter);

                        // Sort: Unknown/null account holders first, then rest
                        const sortedResults = [...(filteredResults || [])].sort((a, b) => {
                          const aHolder = a.receipt?.account_holder || a.account_holder;
                          const bHolder = b.receipt?.account_holder || b.account_holder;
                          const aUnknown = !aHolder || aHolder === 'Unknown' || aHolder === 'OTHERS';
                          const bUnknown = !bHolder || bHolder === 'Unknown' || bHolder === 'OTHERS';
                          if (aUnknown && !bUnknown) return -1;
                          if (!aUnknown && bUnknown) return 1;
                          return 0;
                        });
                        
                        return sortedResults?.map((res, i) => {
                          const holder = res.receipt?.account_holder || res.account_holder;
                          const receiptId = res.receipt?.id;
                          const isUnknown = !holder || holder === 'Unknown' || holder === 'OTHERS';
                          const acctColors = {
                            Babilyn:  { bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.2)',  text: '#ec4899' },
                            Nixie:    { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  text: '#8b5cf6' },
                            Kristine: { bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)',   text: '#06b6d4' },
                          };
                          const ac = acctColors[holder];
                          return (
                            <div 
                              key={i} 
                              onClick={() => { if (res.receipt) handleReceiptClick(res.receipt); }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#fffbf5';
                                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                                e.currentTarget.style.borderColor = 'rgba(251,146,60,0.15)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(67,20,7,0.04)';
                              }}
                              title={`Receipt ID: ${receiptId} - Click to edit`}
                              style={{
                                background: isUnknown ? 'rgba(239,68,68,0.04)' : '#ffffff',
                                border: isUnknown ? '1.5px solid rgba(239,68,68,0.3)' : '1px solid rgba(251,146,60,0.15)',
                                borderRadius: '14px',
                                padding: '18px 20px',
                                display: 'flex', flexDirection: 'column', gap: '16px',
                                transition: 'all 0.2s', cursor: 'pointer', position: 'relative',
                                boxShadow: isUnknown ? '0 2px 8px rgba(239,68,68,0.08)' : '0 2px 8px rgba(67,20,7,0.04)',
                                minHeight: '112px'
                              }}>
                              {/* Top row: number, account, warning badge */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {/* Number */}
                                  <div style={{
                                    width: '40px', height: '40px', borderRadius: '12px',
                                    background: 'rgba(249,115,22,0.08)',
                                    border: '1px solid rgba(249,115,22,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}>
                                    <span style={{ color: '#f97316', fontSize: '17px', fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</span>
                                  </div>
                                  
                                  {/* Account badge */}
                                  <div style={{
                                    padding: '10px 16px', borderRadius: '10px',
                                    background: ac ? ac.bg : 'rgba(249,115,22,0.06)',
                                    border: `1px solid ${ac ? ac.border : 'rgba(249,115,22,0.15)'}`,
                                    color: ac ? ac.text : 'rgba(67,20,7,0.5)',
                                    fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                                    fontFamily: "'Inter', system-ui, sans-serif"
                                  }}>
                                    {holder || 'Unknown'}
                                  </div>
                                </div>
                                
                                {/* Amount */}
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(67,20,7,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: "'Inter', system-ui, sans-serif" }}>Amount</div>
                                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#f97316', letterSpacing: '-0.01em', fontFamily: "'JetBrains Mono', monospace" }}>
                                    ₱{Number(res.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>

                              {/* Unknown warning badge */}
                              {isUnknown && (
                                <div style={{
                                  alignSelf: 'flex-start',
                                  padding: '6px 12px', borderRadius: '8px',
                                  background: 'rgba(239,68,68,0.1)',
                                  border: '1px solid rgba(239,68,68,0.3)',
                                  display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                  </svg>
                                  <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif" }}>
                                    Needs Attention
                                  </span>
                                </div>
                              )}
                              
                              {/* Reference */}
                              <div style={{ marginTop: isUnknown ? '8px' : '0' }}>
                                <div style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(67,20,7,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px', fontFamily: "'Inter', system-ui, sans-serif" }}>Reference</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#431407', letterSpacing: '0.01em', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>{res.reference || '—'}</div>
                              </div>

                              {/* Receipt ID */}
                              <div style={{ 
                                alignSelf: 'flex-end',
                                color: 'rgba(67,20,7,0.35)', 
                                fontSize: '11px', 
                                fontWeight: 700, 
                                letterSpacing: '0.05em', 
                                fontFamily: "'JetBrains Mono', monospace" 
                              }}>
                                Receipt #{receiptId}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 5 — Compact verify results (mobile-first) */}
              {phase === 'verify' && showVerifyPreview && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fffbf5', padding: '8px' }}>
                  {/* Summary pills */}
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '7px', flexShrink: 0 }}>
                    <div style={{ padding: '3px 9px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: '11px', fontWeight: 800, color: '#059669', whiteSpace: 'nowrap' }}>
                      ✓ {verificationSummary?.confirmed ?? 0}
                    </div>
                    {(verificationSummary?.matched ?? 0) > 0 && (
                      <div style={{ padding: '3px 9px', borderRadius: '20px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', fontSize: '11px', fontWeight: 800, color: '#ea580c', whiteSpace: 'nowrap' }}>
                        ? {verificationSummary.matched}
                      </div>
                    )}
                    {(verificationSummary?.not_found ?? 0) > 0 && (
                      <div style={{ padding: '3px 9px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '11px', fontWeight: 800, color: '#dc2626', whiteSpace: 'nowrap' }}>
                        ✕ {verificationSummary.not_found}
                      </div>
                    )}
                    {(verificationSummary?.duplicate ?? 0) > 0 && (
                      <div style={{ padding: '3px 9px', borderRadius: '20px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', fontSize: '11px', fontWeight: 800, color: '#7c3aed', whiteSpace: 'nowrap' }}>
                        ⚠ {verificationSummary.duplicate}
                      </div>
                    )}
                  </div>

                  {/* Compact results list */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {[...(ocrResults || [])].sort((a, b) => {
                        const rank = r => r.verification_status === 'verified' ? 3 : r.verification_status === 'matched' ? 2 : r.verification_status === 'duplicate' ? 1 : 0;
                        return rank(a) - rank(b);
                      }).map((res, i) => {
                        const isVerified  = res.verification_status === 'verified';
                        const isMatched   = res.verification_status === 'matched';
                        const isDuplicate = res.verification_status === 'duplicate';
                        const holder = res.receipt?.account_holder || res.account_holder;
                        const acctColor = { Babilyn: '#ec4899', Nixie: '#8b5cf6', Kristine: '#06b6d4' }[holder];
                        const statusColor = isVerified ? '#10b981' : isMatched ? '#f97316' : isDuplicate ? '#7c3aed' : '#ef4444';
                        const statusIcon  = isVerified ? '✓' : isMatched ? '?' : isDuplicate ? '⚠' : '✕';
                        const statusText  = isVerified ? 'Confirmed' : isMatched ? 'Needs confirm' : isDuplicate ? `Claimed${res.match_details?.claimed_batch ? ' · ' + res.match_details.claimed_batch : ''}` : 'Not found';
                        const potentialMatches = isMatched && res.match_details?.transaction
                          ? [res.match_details.transaction]
                          : (res.match_details?.potential_matches || []);
                        return (
                          <div key={i} style={{ background: '#fff', border: `1px solid ${statusColor}30`, borderRadius: '9px', overflow: 'hidden' }}>
                            {/* Main row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 9px' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0, background: `${statusColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColor, fontSize: '12px', fontWeight: 900 }}>
                                {statusIcon}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#431407', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {res.reference || '—'}
                                </div>
                                <div style={{ fontSize: '10px', fontWeight: 600, color: statusColor, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {statusText}
                                </div>
                              </div>
                              {holder && (
                                <div style={{ padding: '2px 6px', borderRadius: '5px', background: `${acctColor ?? '#f97316'}18`, color: acctColor ?? '#f97316', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', flexShrink: 0 }}>
                                  {holder.slice(0, 3)}
                                </div>
                              )}
                              <div style={{ fontSize: '13px', fontWeight: 900, color: statusColor, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                                ₱{Number(res.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            {/* Confirm row — only when match suggestions exist */}
                            {!isVerified && potentialMatches.length > 0 && (
                              <div style={{ borderTop: '1px dashed rgba(249,115,22,0.15)', padding: '5px 9px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(249,115,22,0.02)' }}>
                                {potentialMatches.map((tx, j) => (
                                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#431407', fontFamily: "'JetBrains Mono', monospace" }}>{tx.reference || tx.label || '—'}</span>
                                      {tx.account_holder && <span style={{ fontSize: '9px', color: 'rgba(67,20,7,0.5)', marginLeft: '5px' }}>{tx.account_holder}</span>}
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#f97316', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                                      ₱{Number(tx.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </span>
                                    <button onClick={() => confirmTransactionMatch(res.receipt?.id, tx)}
                                      style={{ flexShrink: 0, padding: '5px 10px', borderRadius: '7px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#059669', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer' }}>
                                      Confirm
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {/* Finalized Claims View (Left Side) */}
              {phase === 'finalize' && finalizedBatch && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fffbf5', padding: '12px' }}>
                  {/* Header */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {/* Batch Summary badge */}
                      <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span style={{ color: '#f97316', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>Batch Summary</span>
                      </div>
                      {/* Stat badges */}
                      <div style={{ padding: '4px 8px', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <span style={{ color: '#059669', fontSize: '10px', fontWeight: 800, fontFamily: "'Inter', sans-serif" }}>
                          {verificationSummary?.confirmed ?? 0} Confirmed
                        </span>
                      </div>
                      {(verificationSummary?.not_found ?? 0) > 0 && (
                        <div style={{ padding: '4px 8px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          <span style={{ color: '#dc2626', fontSize: '10px', fontWeight: 800, fontFamily: "'Inter', sans-serif" }}>
                            {verificationSummary.not_found} Not Found
                          </span>
                        </div>
                      )}
                    </div>
                    <p style={{ color: 'rgba(67,20,7,0.55)', fontSize: '11px', fontWeight: 500, fontFamily: "'Inter', sans-serif", margin: 0 }}>
                      Final receipt list — verified and ready for summary
                    </p>
                  </div>

                  {/* Receipt list */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[...(ocrResults || [])].sort((a, b) => {
                        if (a.verification_status !== 'verified' && b.verification_status === 'verified') return -1;
                        if (a.verification_status === 'verified' && b.verification_status !== 'verified') return 1;
                        return 0;
                      }).map((res, i) => {
                        const isVerified = res.verification_status === 'verified';
                        const holder = res.receipt?.account_holder || res.account_holder;
                        const acctColors = {
                          Babilyn:  { bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.2)',  text: '#ec4899' },
                          Nixie:    { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  text: '#8b5cf6' },
                          Kristine: { bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)',   text: '#06b6d4' },
                        };
                        const ac = acctColors[holder];
                        return (
                          <div key={i} style={{
                            background: isVerified ? '#ffffff' : 'rgba(239,68,68,0.03)',
                            border: `1px solid ${isVerified ? 'rgba(251,146,60,0.15)' : 'rgba(239,68,68,0.2)'}`,
                            borderRadius: '8px', padding: '8px 10px',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            transition: 'all 0.15s',
                          }}>
                            {/* Status */}
                            <div style={{
                              width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                              background: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              border: `1px solid ${isVerified ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: isVerified ? '#10b981' : '#ef4444', fontSize: '10px', fontWeight: 900
                            }}>
                              {isVerified ? '✓' : '!'}
                            </div>
                            {/* Reference + account */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#431407', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {res.reference || `REF-${res.receipt?.id}`}
                              </div>
                              <div style={{
                                display: 'inline-block', marginTop: '2px',
                                padding: '1px 6px', borderRadius: '4px',
                                background: ac ? ac.bg : 'rgba(249,115,22,0.06)',
                                border: `1px solid ${ac ? ac.border : 'rgba(249,115,22,0.15)'}`,
                                color: ac ? ac.text : 'rgba(67,20,7,0.5)',
                                fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
                                fontFamily: "'Inter', sans-serif"
                              }}>
                                {holder || 'Unknown'}
                              </div>
                            </div>
                            {/* Amount */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: '12px', fontWeight: 900, color: isVerified ? '#f97316' : '#ef4444', fontFamily: "'JetBrains Mono', monospace" }}>
                                ₱{Number(res.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </div>
                              {!isVerified && (
                                <div style={{ fontSize: '7px', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Inter', sans-serif" }}>Not Found</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 7: Summary View (Main Content) */}
              {phase === 'summary' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fffbf5', padding: '12px' }}>
                  {/* Header */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      {/* Financial Summary badge */}
                      <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span style={{ color: '#f97316', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Inter', sans-serif" }}>Financial Summary</span>
                      </div>
                      {/* Verified Claims badge */}
                      <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <span style={{ color: '#f97316', fontSize: '11px', fontWeight: 800, fontFamily: "'Inter', sans-serif" }}>{verifiedClaims.length} Verified Claims</span>
                      </div>
                    </div>
                    <p style={{ color: 'rgba(67,20,7,0.55)', fontSize: '12px', fontWeight: 500, fontFamily: "'Inter', sans-serif", margin: 0 }}>
                      Review breakdown and add deductions before proceeding to billing
                    </p>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Gross + Service Fee cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ padding: '14px 12px', borderRadius: '14px', background: '#ffffff', border: '1px solid rgba(16,185,129,0.2)', boxShadow: '0 2px 8px rgba(16,185,129,0.06)', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(67,20,7,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Inter', sans-serif" }}>Gross Claims</div>
                        <div style={{ fontSize: '17px', fontWeight: 900, color: '#059669', letterSpacing: '-0.02em', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all', lineHeight: 1.2 }}>
                          ₱{totalClaimsAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '9px', color: 'rgba(67,20,7,0.4)', fontWeight: 600, textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>Sum of verified receipts</div>
                      </div>
                      <div style={{ padding: '14px 12px', borderRadius: '14px', background: '#ffffff', border: '1px solid rgba(239,68,68,0.2)', boxShadow: '0 2px 8px rgba(239,68,68,0.06)', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(67,20,7,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Inter', sans-serif" }}>Service Fee</div>
                        <div style={{ fontSize: '17px', fontWeight: 900, color: '#dc2626', letterSpacing: '-0.02em', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all', lineHeight: 1.2 }}>
                          − ₱{serviceFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: '9px', color: 'rgba(67,20,7,0.4)', fontWeight: 600, textTransform: 'uppercase', fontFamily: "'Inter', sans-serif" }}>₱10 per ₱1,000</div>
                      </div>
                    </div>

                    {/* Claims Breakdown by account */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(251,146,60,0.15)', padding: '20px', boxShadow: '0 2px 8px rgba(67,20,7,0.03)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(67,20,7,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '14px', fontFamily: "'Inter', sans-serif" }}>Claims Breakdown</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          const accountSummary = {};
                          verifiedClaims.forEach(claim => {
                            const holder = claim.receipt?.account_holder || claim.account_holder || 'Unknown';
                            if (!accountSummary[holder]) accountSummary[holder] = { count: 0, total: 0 };
                            accountSummary[holder].count++;
                            accountSummary[holder].total += Number(claim.amount || 0);
                          });
                          const acctColors = {
                            Babilyn:  { bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.2)',  text: '#ec4899' },
                            Nixie:    { bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  text: '#8b5cf6' },
                            Kristine: { bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)',   text: '#06b6d4' },
                          };
                          return Object.entries(accountSummary).map(([holder, data]) => {
                            const ac = acctColors[holder];
                            return (
                              <div key={holder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', background: ac ? ac.bg : 'rgba(249,115,22,0.04)', border: `1px solid ${ac ? ac.border : 'rgba(249,115,22,0.12)'}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ffffff', border: `1px solid ${ac ? ac.border : 'rgba(249,115,22,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
                                  <div>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: ac ? ac.text : '#f97316', fontFamily: "'Inter', sans-serif" }}>{holder}</div>
                                    <div style={{ fontSize: '9px', color: 'rgba(67,20,7,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>{data.count} {data.count === 1 ? 'claim' : 'claims'}</div>
                                  </div>
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 900, color: '#431407', fontFamily: "'JetBrains Mono', monospace" }}>
                                  ₱{data.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Info tip */}
                    <div style={{ padding: '14px 18px', background: 'rgba(249,115,22,0.05)', borderRadius: '12px', border: '1px solid rgba(249,115,22,0.15)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '16px', flexShrink: 0 }}>💡</span>
                      <span style={{ fontSize: '11px', color: 'rgba(67,20,7,0.6)', fontWeight: 500, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>
                        Review the breakdown and add any deductions in the sidebar. The net amount updates automatically and carries forward to billing.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 8: Billing View (Main Content) */}
              {phase === 'billing' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', background: '#fffbf5', gap: '20px', overflow: 'visible' }}>
                  {/* Big QR */}
                  <div style={{ padding: '16px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderRadius: '28px', boxShadow: '0 16px 48px rgba(249,115,22,0.25)', border: '2px solid rgba(249,115,22,0.25)', flexShrink: 0 }}>
                    <img src={qrJonarld} alt="QR Code" style={{ width: '340px', height: '340px', objectFit: 'contain', display: 'block', borderRadius: '14px' }} />
                  </div>
                  {/* Label */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#431407', fontFamily: "'Inter', sans-serif" }}>Scan to Send via QR</div>
                    <div style={{ fontSize: '12px', color: 'rgba(67,20,7,0.5)', fontWeight: 500, marginTop: '6px', fontFamily: "'Inter', sans-serif" }}>
                      Send ₱{netAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  {/* Account details */}
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '12px', padding: '10px 16px', background: 'rgba(249,115,22,0.05)', borderRadius: '10px', border: '1px solid rgba(249,115,22,0.12)', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(67,20,7,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>Account</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#431407', fontFamily: "'Inter', sans-serif" }}>Jonarld</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', padding: '10px 16px', background: 'rgba(249,115,22,0.05)', borderRadius: '10px', border: '1px solid rgba(249,115,22,0.12)', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(67,20,7,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Inter', sans-serif" }}>Method</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#f97316', fontFamily: "'Inter', sans-serif" }}>QR</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading & Start States */}
              {((phase === 'ocr' && !showOcrPreview) || (phase === 'verify' && !showVerifyPreview) || (phase === 'finalize' && !finalizedBatch)) && (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center" style={{ background: '#fffbf5' }}>
                  
                  {/* Stage 4: OCR Extraction */}
                  {phase === 'ocr' && (
                    <div className="max-w-xl w-full">
                      <div className="relative mb-12 inline-block">
                        <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 border-4 border-orange-200 transition-all duration-500">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </div>
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tight mb-4" style={{ color: '#431407', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                        {isProcessingOcr ? 'Extracting Data' : 'Ready to Extract'}
                      </h3>
                      {!isProcessingOcr && (
                        <p className="text-base font-medium leading-relaxed mb-8" style={{ color: 'rgba(67,20,7,0.5)', fontFamily: "'Inter', sans-serif" }}>
                          Click "Start OCR Extraction" in the sidebar
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stage 5: Verify */}
                  {phase === 'verify' && (
                    <div className="max-w-xl w-full">
                      <div className="relative mb-12 inline-block">
                        <div className={`w-32 h-32 rounded-full border-4 ${
                          isVerifying ? 'border-orange-200 border-t-orange-500 animate-spin' : 'border-orange-200'
                        } flex items-center justify-center text-5xl`}>
                          ⚖️
                        </div>
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tight mb-4" style={{ color: '#431407' }}>
                        Verifying Claims
                      </h3>
                      <p className="text-base font-medium leading-relaxed" style={{ color: 'rgba(67,20,7,0.5)' }}>
                        Matching with transaction records
                      </p>
                    </div>
                  )}

                  {/* Stage 6: Finalize */}
                  {phase === 'finalize' && (
                    <div className="max-w-xl w-full">
                      <div className="relative mb-12 inline-block">
                        <div className="w-32 h-32 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin flex items-center justify-center text-5xl">
                          📦
                        </div>
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tight mb-4" style={{ color: '#431407' }}>
                        Finalizing Batch
                      </h3>
                      <p className="text-base font-medium leading-relaxed" style={{ color: 'rgba(67,20,7,0.5)' }}>
                        Linking verified transactions
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : phase === 'crop' ? (
            <CropStage
              current={current}
              currentCategory={currentCategory}
              currentAccount={currentAccount}
              setCurrentAccount={setCurrentAccount}
              crop={crop}
              onChange={onChange}
              onComplete={onComplete}
              imgRef={imgRef}
              onImageLoad={onImageLoad}
              imageRotation={imageRotation}
              rotateImage={rotateImage}
              manualAmount={manualAmount}
              setManualAmount={setManualAmount}
              manualReference={manualReference}
              setManualReference={setManualReference}
              manualDate={manualDate}
              setManualDate={setManualDate}
              ACCOUNTS={ACCOUNTS}
              onPrev={handlePrev}
              onNext={handleNextCrop}
              isSaving={isSavingProgress}
              onRecategorize={() => {
                setPhase('categorize');
                setIndex(0);
                setCrop(null);
                setCompletedCrop(null);
              }}
              onChangeToGCash={handleChangeToGCash}
              onChangeToOthers={handleChangeToOthers}
              index={index}
              total={total}
              gcashProcessed={gcashProcessed}
              gcashTotal={gcashReceipts.length}
              othersProcessed={othersProcessed}
              othersTotal={othersReceipts.length}
              isGcash={isGcash}
              isOthers={isOthers}
              allReceipts={liveReceipts}
            />
          ) : (
            <WizardStepCrop
              crop={null}
              onChange={onChange}
              onComplete={onComplete}
              imgRef={imgRef}
              src={current ? getApiUrl(`/api/receipts/${current.id}/image`) : ''}
              onLoad={onImageLoad}
              disabled={true}
              category={currentCategory}
              rotation={imageRotation}
            />
          )}

          {phase !== 'categorize' && phase !== 'crop' && (
          <div className="cw-sidebar">

            {phase === 'ocr' && (
              <ExtractionStage
                isProcessingOcr={isProcessingOcr}
                ocrResults={ocrResults}
                onStartExtraction={handleRunOcrExtraction}
                receiptsCount={receipts.length}
                ocrProgress={ocrProgress}
                onReExtract={() => {
                  setOcrResults(null);
                  setShowOcrPreview(false);
                  handleRunOcrExtraction();
                }}
              />
            )}

            {phase === 'verify' && (
              <VerificationStage
                isVerifying={isVerifying}
                ocrResults={ocrResults}
                verificationSummary={verificationSummary}
                onStartVerification={startVerifyPhase}
                onFinalize={startFinalizePhase}
                onBack={() => {
                  setPhase('ocr');
                  setShowOcrPreview(true);
                }}
              />
            )}

            {phase === 'finalize' && (
              <FinalizeStage
                isFinalizing={isFinalizing}
                finalizedBatch={finalizedBatch}
                ocrResults={ocrResults}
                verificationSummary={verificationSummary}
                onDone={onDone}
                onViewSummary={() => {
                  setPhase('summary');
                }}
                onReCrop={handleReCrop}
              />
            )}

            <div className="mt-auto pt-12 flex flex-col gap-5">
              {(phase !== 'ocr' && phase !== 'verify' && phase !== 'finalize' && phase !== 'summary' && phase !== 'billing' && phase !== 'categorize') && (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3">
                      {(index > 0 || phase === 'crop') && (
                        <button 
                          className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] hover:bg-white/10 hover:text-white transition-all active:scale-95"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                          onClick={handlePrev}
                        >
                          ← Prev
                        </button>
                      )}
                      
                      {phase === 'categorize' ? (
                        <button 
                          disabled={!currentCategory || (needsAccount && !currentAccount)}
                          className="flex-[2] cw-btn-confirm disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed" 
                          onClick={handleNextCategorize}
                          style={{ 
                            maxWidth: 'none', 
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: '#fff',
                            boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)',
                            padding: '16px 10px',
                            fontSize: '10px',
                            fontWeight: 900,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif",
                            borderRadius: '16px'
                          }}
                        >
                          {index + 1 < total ? 'Next Receipt →' : 'Finish Sorting →'}
                        </button>
                      ) : (
                        <button 
                          className="flex-[2] cw-btn-confirm" 
                          onClick={handleNextCrop} 
                          style={{ 
                            maxWidth: 'none',
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            boxShadow: '0 10px 25px rgba(249, 115, 22, 0.3)',
                            padding: '16px 10px',
                            fontSize: '10px',
                            fontWeight: 900,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif",
                            borderRadius: '16px'
                          }}
                        >
                          {index + 1 < total ? 'Next Crop →' : 'Finish Crop & Input ✨'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 py-2">
                    <div className="h-[1px] flex-1 bg-white/5" />
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap px-2">
                    {phase === 'categorize' && `Stage 2 of 5: sorting (${index + 1}/${total})`}
                    {phase === 'crop' && `Stage 3 of 5: crop & input (${index + 1}/${total})`}
                  </div>
                    <div className="h-[1px] flex-1 bg-white/5" />
                  </div>
                </>
              )}

              {/* Phase 3 -> 4 Transition */}
              {phase === 'ocr' && !isProcessingOcr && ocrResults && (
                <div style={{ 
                  marginTop: 'auto',
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '24px 40px'
                }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      style={{
                        flex: 1,
                        padding: '16px 24px',
                        borderRadius: '14px',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        border: '1px solid rgba(249, 115, 22, 0.25)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'rgba(249, 115, 22, 0.08)',
                        color: '#f97316',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => {
                        setPhase('crop');
                        setIndex(total - 1);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.25)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      Back to Crop
                    </button>
                    <button 
                      style={{
                        flex: 2,
                        padding: '16px 24px',
                        borderRadius: '14px',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        border: '1px solid rgba(251, 146, 60, 0.35)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)',
                        color: '#fff',
                        boxShadow: '0 6px 28px rgba(249, 115, 22, 0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={startVerifyPhase}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 36px rgba(249, 115, 22, 0.55)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 6px 28px rgba(249, 115, 22, 0.45)';
                      }}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      Start Verification Check
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '8px 0'
                  }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.05)' }} />
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 900,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.2em',
                      whiteSpace: 'nowrap',
                      fontFamily: "'Inter', system-ui, sans-serif"
                    }}>
                      Stage 4 of 8: OCR Extraction
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.05)' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Stage 7 Summary */}
              {phase === 'summary' && (
                <SummaryStage
                  verifiedClaims={verifiedClaims}
                  totalClaimsAmount={totalClaimsAmount}
                  serviceFee={serviceFee}
                  deductionType={deductionType}
                  setDeductionType={setDeductionType}
                  manualDeduction={manualDeduction}
                  setManualDeduction={setManualDeduction}
                  netAmount={netAmount}
                  savedDeductions={savedDeductions}
                  onDeductionsChange={handleDeductionsChange}

                  isSaving={isSavingProgress}
                  onProceed={async (deductions, calculatedNetAmount) => {
                    // Store the calculated net amount for use in billing stage
                    setFinalNetAmount(calculatedNetAmount);
                    
                    try {
                      const res = await fetch(getApiUrl(`/api/batches/${batchId}/status`), {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          checker_status: 'summarized',
                          summary_data: {
                            gross_amount: totalClaimsAmount,
                            service_fee: serviceFee,
                            deductions: deductions, // Array of { type, amount }
                            net_amount: calculatedNetAmount
                          }
                        }),
                      });
                      if (!res.ok) throw new Error(`Server error ${res.status}`);
                      setPhase('billing');
                    } catch (e) {
                      console.error('Summary save failed', e);
                      alert(`Failed to save summary: ${e.message}. Please try again.`);
                    }
                  }}
                  onBack={() => setPhase('finalize')}
                />
              )}

            {phase === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
                {/* Method toggle */}
                <div style={{ display: 'flex', padding: '4px', background: 'rgba(249,115,22,0.06)', borderRadius: '14px', border: '1px solid rgba(249,115,22,0.15)', gap: '4px' }}>
                  {['cash', 'bank', 'both'].map(method => (
                    <button key={method} onClick={() => setBillingMethod(method)} style={{
                      flex: 1, padding: '8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: billingMethod === method ? '#f97316' : 'transparent',
                      color: billingMethod === method ? '#fff' : 'rgba(67,20,7,0.5)',
                      fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em',
                      fontFamily: "'Inter', sans-serif",
                      boxShadow: billingMethod === method ? '0 2px 8px rgba(249,115,22,0.3)' : 'none'
                    }}>
                      {method}
                    </button>
                  ))}
                </div>

                {/* Inputs */}
                <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                  {(billingMethod === 'cash' || billingMethod === 'both') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Bills */}
                      <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(67,20,7,0.4)', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: "'Inter', sans-serif", padding: '2px 2px 4px' }}>
                        Bills
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {[1000, 500, 200, 100, 50, 20].map(val => {
                          const count = cashDenominations[val] || 0;
                          const subtotal = val * count;
                          return (
                            <div key={val} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              background: count > 0 ? 'rgba(249,115,22,0.06)' : '#fafafa',
                              border: `1.5px solid ${count > 0 ? 'rgba(249,115,22,0.3)' : 'rgba(0,0,0,0.06)'}`,
                              borderRadius: '12px', padding: '8px 12px',
                              transition: 'all 0.15s'
                            }}>
                              {/* Denomination label */}
                              <div style={{ width: '44px', flexShrink: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: 900, color: count > 0 ? '#f97316' : 'rgba(67,20,7,0.4)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>₱{val >= 1000 ? `${val/1000}K` : val}</div>
                              </div>
                              {/* Stepper */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}>
                                <button onClick={() => setCashDenominations(prev => ({ ...prev, [val]: Math.max(0, (prev[val] || 0) - 1) }))}
                                  style={{ width: '24px', height: '24px', borderRadius: '8px', border: '1.5px solid rgba(249,115,22,0.2)', background: '#fff', color: '#f97316', fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>−</button>
                                <input type="number" min="0"
                                  value={count || ''}
                                  onChange={(e) => setCashDenominations(prev => ({ ...prev, [val]: Math.max(0, parseInt(e.target.value) || 0) }))}
                                  style={{ width: '36px', background: 'transparent', border: 'none', outline: 'none', color: '#431407', fontSize: '13px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', padding: 0 }}
                                  placeholder="0"
                                />
                                <button onClick={() => setCashDenominations(prev => ({ ...prev, [val]: (prev[val] || 0) + 1 }))}
                                  style={{ width: '24px', height: '24px', borderRadius: '8px', border: '1.5px solid rgba(249,115,22,0.2)', background: '#fff', color: '#f97316', fontSize: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>+</button>
                              </div>
                              {/* Subtotal */}
                              <div style={{ width: '56px', textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: count > 0 ? '#431407' : 'rgba(67,20,7,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>
                                  {count > 0 ? `₱${subtotal.toLocaleString()}` : '—'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Coins */}
                      <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(67,20,7,0.4)', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: "'Inter', sans-serif", padding: '6px 2px 4px', marginTop: '4px', borderTop: '1px solid rgba(249,115,22,0.1)' }}>
                        Coins
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {[20, 10, 5, 1].map(val => {
                          const count = cashDenominations[`c${val}`] || 0;
                          return (
                            <div key={`c${val}`} style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                              background: count > 0 ? 'rgba(249,115,22,0.06)' : '#fafafa',
                              border: `1.5px solid ${count > 0 ? 'rgba(249,115,22,0.3)' : 'rgba(0,0,0,0.06)'}`,
                              borderRadius: '12px', padding: '10px 6px',
                              transition: 'all 0.15s'
                            }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: count > 0 ? '#f97316' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                                <span style={{ fontSize: '10px', fontWeight: 900, color: count > 0 ? '#fff' : 'rgba(67,20,7,0.35)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>₱{val}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <button onClick={() => setCashDenominations(prev => ({ ...prev, [`c${val}`]: Math.max(0, (prev[`c${val}`] || 0) - 1) }))}
                                  style={{ width: '18px', height: '18px', borderRadius: '6px', border: '1px solid rgba(249,115,22,0.2)', background: '#fff', color: '#f97316', fontSize: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>−</button>
                                <input type="number" min="0"
                                  value={count || ''}
                                  onChange={(e) => setCashDenominations(prev => ({ ...prev, [`c${val}`]: Math.max(0, parseInt(e.target.value) || 0) }))}
                                  style={{ width: '24px', background: 'transparent', border: 'none', outline: 'none', color: '#431407', fontSize: '12px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', padding: 0 }}
                                  placeholder="0"
                                />
                                <button onClick={() => setCashDenominations(prev => ({ ...prev, [`c${val}`]: (prev[`c${val}`] || 0) + 1 }))}
                                  style={{ width: '18px', height: '18px', borderRadius: '6px', border: '1px solid rgba(249,115,22,0.2)', background: '#fff', color: '#f97316', fontSize: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(billingMethod === 'bank' || billingMethod === 'both') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: billingMethod === 'both' ? '8px' : '0', borderTop: billingMethod === 'both' ? '1px solid rgba(249,115,22,0.12)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '9px', fontWeight: 900, color: 'rgba(67,20,7,0.45)', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: "'Inter', sans-serif", padding: '0 4px' }}>Bank Transfers</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            disabled={!bankTransferAmounts[0] || bankTransferAmounts[0] <= 0}
                            onClick={() => {
                              if (bankTransferAmounts[0] > 0) {
                                setBankTransferAmounts([...bankTransferAmounts, 0]);
                              }
                            }} 
                            style={{ fontSize: '9px', fontWeight: 700, color: bankTransferAmounts[0] > 0 ? '#059669' : '#ccc', background: bankTransferAmounts[0] > 0 ? 'rgba(5,150,105,0.1)' : 'rgba(0,0,0,0.05)', border: bankTransferAmounts[0] > 0 ? '1px solid rgba(5,150,105,0.2)' : '1px solid rgba(0,0,0,0.1)', padding: '4px 12px', borderRadius: '6px', cursor: bankTransferAmounts[0] > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif" }} 
                            onMouseEnter={(e) => { if (bankTransferAmounts[0] > 0) { e.target.style.background = 'rgba(5,150,105,0.15)'; e.target.style.borderColor = 'rgba(5,150,105,0.4)'; } }} 
                            onMouseLeave={(e) => { if (bankTransferAmounts[0] > 0) { e.target.style.background = 'rgba(5,150,105,0.1)'; e.target.style.borderColor = 'rgba(5,150,105,0.2)'; } }}>
                            + Add
                          </button>
                          <button onClick={() => {
                            const remaining = Math.max(0, netAmount - cashTotal - bankTransferAmounts.slice(0, -1).reduce((sum, v) => sum + Number(v || 0), 0));
                            const updated = [...bankTransferAmounts];
                            updated[updated.length - 1] = remaining;
                            setBankTransferAmounts(updated);
                          }} style={{ fontSize: '9px', fontWeight: 700, color: '#f97316', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif" }} onMouseEnter={(e) => { e.target.style.background = 'rgba(249,115,22,0.15)'; e.target.style.borderColor = 'rgba(249,115,22,0.4)'; }} onMouseLeave={(e) => { e.target.style.background = 'rgba(249,115,22,0.1)'; e.target.style.borderColor = 'rgba(249,115,22,0.2)'; }}>
                            Max
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {bankTransferAmounts.map((amount, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(67,20,7,0.4)', fontSize: '13px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>₱</span>
                              <input type="number" min="0"
                                value={amount || ''}
                                onChange={(e) => {
                                  const updated = [...bankTransferAmounts];
                                  updated[idx] = Math.max(0, parseFloat(e.target.value) || 0);
                                  setBankTransferAmounts(updated);
                                }}
                                style={{ width: '100%', background: '#ffffff', border: '1.5px solid rgba(249,115,22,0.2)', borderRadius: '10px', padding: '10px 14px 10px 30px', color: '#431407', fontSize: '13px', fontWeight: 700, outline: 'none', fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box' }}
                                placeholder="0.00"
                              />
                            </div>
                            {bankTransferAmounts.length > 1 && (
                              <button onClick={() => {
                                const updated = bankTransferAmounts.filter((_, i) => i !== idx);
                                setBankTransferAmounts(updated.length > 0 ? updated : [0]);
                              }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }} onMouseEnter={(e) => { e.target.style.background = 'rgba(220,38,38,0.15)'; e.target.style.borderColor = 'rgba(220,38,38,0.4)'; }} onMouseLeave={(e) => { e.target.style.background = 'rgba(220,38,38,0.08)'; e.target.style.borderColor = 'rgba(220,38,38,0.2)'; }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Unallocated warning */}
                {!isBillingBalanced && (
                  <div style={{ textAlign: 'center', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#dc2626', fontFamily: "'Inter', sans-serif" }}>
                      {billingDiff > 0
                        ? `₱${billingDiff.toLocaleString('en-PH', { minimumFractionDigits: 2 })} still unallocated`
                        : `₱${Math.abs(billingDiff).toLocaleString('en-PH', { minimumFractionDigits: 2 })} over-allocated`}
                      {' — funds must match net amount exactly.'}
                    </span>
                  </div>
                )}

                {/* Action Buttons — top row: Back to Summary only (auto-save on close/navigate) */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setPhase('summary')}
                    style={{
                      flex: 1, padding: '13px 16px', borderRadius: '14px', border: '1.5px solid rgba(249,115,22,0.3)',
                      cursor: 'pointer',
                      background: '#fff', color: '#f97316', fontSize: '11px', fontWeight: 900,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(249,115,22,0.05)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'; }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                    Back to Summary
                  </button>
                </div>

                {/* Action Buttons — bottom row: Finish & Confirm (full width) */}
                <button
                  disabled={!isBillingBalanced}
                  onClick={async () => {
                    try {
                      const res = await fetch(getApiUrl(`/api/batches/${batchId}/status`), {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          checker_status: 'billing_ready',
                          summary_data: { gross_amount: totalClaimsAmount, service_fee: serviceFee, deductions: savedDeductions, net_amount: finalNetAmount || netAmount },
                          billing_data: { method: billingMethod, cash_denominations: cashDenominations, bank_transfer_amount: bankTransferAmounts, total_prepared: billingTotal }
                        }),
                      });
                      if (!res.ok) throw new Error(`Server error ${res.status}`);
                      const batchData = await res.json();
                      setSavedBatchInfo(batchData);
                      setShowBillingSummaryModal(true);
                    } catch (e) {
                      console.error('Billing save failed', e);
                      showToast('Save failed', e.message, 'error', 6000);
                    }
                  }}
                  style={{
                    width: '100%', padding: '15px 20px', borderRadius: '14px', border: 'none',
                    cursor: isBillingBalanced ? 'pointer' : 'not-allowed',
                    background: isBillingBalanced
                      ? 'linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%)'
                      : 'rgba(251,146,60,0.35)',
                    color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em',
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: isBillingBalanced ? '0 6px 20px rgba(249,115,22,0.4)' : 'none',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                  onMouseEnter={(e) => { if (isBillingBalanced) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(249,115,22,0.5)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isBillingBalanced ? '0 6px 20px rgba(249,115,22,0.4)' : 'none'; }}
                  onMouseDown={(e) => { if (isBillingBalanced) e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Finish & Confirm
                </button>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>

    {/* Billing Summary Modal */}
    {showBillingSummaryModal && (
        <BillingSummaryModal
          onClose={() => {
            setShowBillingSummaryModal(false);
            onDone();
          }}
          batchNumber={savedBatchInfo?.batch_number || batchId}
          finalBatchNumber={savedBatchInfo?.final_batch_number}
          grossAmount={totalClaimsAmount}
          serviceFee={serviceFee}
          deductions={savedBatchInfo?.summary_data?.deductions || savedDeductions || []}
          netAmount={netAmount}
          billingMethod={billingMethod}
          cashDenominations={cashDenominations}
          bankTransferAmount={bankTransferAmount}
          bankTransferAmounts={bankTransferAmounts}
          totalPrepared={billingTotal}
          verifiedClaims={verifiedClaims.map(r => ({
            account_holder: r.receipt?.account_holder || r.account_holder,
            amount: r.amount,
            reference: r.reference,
            source_label: r.receipt?.source_label || r.source_label,
          }))}
        />
    )}
    </>
  );
};

// ─── Phone → Account mapping ──────────────────────────────────────────────────
const PHONE_ACCOUNT_MAP = {
  '639166319253': 'Kristine',
  '639491582632': 'Babilyn',
  '639565382671': 'Nixie',
};

function detectAccountFromPhone(text) {
  // Normalize the full OCR text: strip all non-digit characters
  // OCR often inserts spaces, reads 0 as O, 6 as G, 1 as I/l, 8 as B, etc.
  const ocrNorm = (str) =>
    str
      .toUpperCase()
      .replace(/O/g, '0')
      .replace(/[IL|]/g, '1')
      .replace(/G/g, '6')
      .replace(/B/g, '8')
      .replace(/S/g, '5')
      .replace(/[^0-9]/g, '');

  const flatRaw   = text.replace(/\D/g, '');               // digits only, raw
  const flatNorm  = ocrNorm(text);                          // digits only, OCR-corrected

  for (const [phone, account] of Object.entries(PHONE_ACCOUNT_MAP)) {
    const local = '0' + phone.slice(2);   // 09166319253
    const short = phone.slice(2);         // 9166319253 (10 digits, drop country code)

    // Try both the raw text and the OCR-normalised text
    for (const flat of [flatRaw, flatNorm]) {
      // Exact full number match (12-digit +63 or 11-digit 0...)
      if (flat.includes(phone) || flat.includes(local)) return account;

      // 10-digit body (no leading 0 or +63)
      if (flat.includes(short)) return account;

      // Last 8 digits fuzzy match — tolerates 1-2 OCR errors at the start
      const tail8 = phone.slice(-8);
      const tail7 = phone.slice(-7);
      if (flat.includes(tail8) || flat.includes(tail7)) return account;
    }
  }
  return null;
}

// ─── Real OCR Field Extraction Helpers ─────────────────────────────────────────
function extractFields(text) {
  // ── Normalise raw OCR text ──────────────────────────────────────────────────
  const normalized = text
    .replace(/\r/g, '\n')
    .replace(/[|\\\[\]{}]/g, ' ')
    .replace(/['"\u0060]/g, '')
    .replace(/\u00a0/g, ' ');

  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  let amount = null;
  let reference = null;

  // ── Reference extraction ────────────────────────────────────────────────────
  // Fully collapse ALL inter-digit spaces (repeat until stable) so that
  // "1 2 3 4 5 6 7 8 9 0 1 2 3" becomes "1234567890123".
  const collapseDigits = (str) => {
    let prev = str;
    // Keep collapsing adjacent digit–space–digit pairs until nothing changes
    let next = prev.replace(/(\d)\s+(\d)/g, '$1$2');
    while (next !== prev) { prev = next; next = prev.replace(/(\d)\s+(\d)/g, '$1$2'); }
    return next;
  };

  // Pull a run of 11–16 digits (GCash refs are 13; allow tolerance for OCR extras)
  const pullRef = (str) => {
    const clean = collapseDigits(str.replace(/\s/g, ''));
    // Prefer exactly 13 digits
    let m = clean.match(/\d{13}/);
    if (m) return m[0];
    // Accept 11–16 as fallback (trace numbers vary)
    m = clean.match(/\d{11,16}/);
    if (m) return m[0];
    return null;
  };

  const refLabelRe = /(?:ref(?:erence)?(?:\s*(?:no|num|number|\.)?)?|trace\s*(?:no|number)?|transaction\s*(?:ref|id|no)|gcash\s*ref)[:\s#.]*/i;

  // Pass 1: look for a line that contains a reference label
  for (let i = 0; i < lines.length; i++) {
    if (!refLabelRe.test(lines[i])) continue;
    const afterLabel = lines[i].replace(refLabelRe, '').trim();
    const fromSameLine = pullRef(afterLabel);
    if (fromSameLine) { reference = fromSameLine; break; }
    // Check up to 2 following lines (label can be on its own line)
    const fromNext = pullRef((lines[i + 1] || '') + ' ' + (lines[i + 2] || ''));
    if (fromNext) { reference = fromNext; break; }
  }

  // Pass 2: scan every line for a standalone digit run (no label needed)
  if (!reference) {
    for (const line of lines) {
      const found = pullRef(line);
      if (found) { reference = found; break; }
    }
  }

  // ── Amount extraction ───────────────────────────────────────────────────────
  // Normalize OCR-misread currency symbols: 'Php', 'PhP', 'php', '₱', 'P ' (with space)
  // Do NOT match a bare capital P that is part of a word.
  const currencyRe = /(?:php|₱|P(?=\s*[\d,]))\s*([\d,]+(?:\.[0-9]{1,2})?)/gi;

  // Labels that precede the amount on GCash receipts
  const amountLabelRe = /\b(?:total\s*amount(?:\s*sent)?|amount\s*(?:sent|received|paid)?|total|amt)\s*[:\-]?\s*/i;

  const parseAmt = (str) => {
    const n = parseFloat(str.replace(/,/g, ''));
    return (!isNaN(n) && n > 0 && n < 10_000_000) ? n : null;
  };

  // Strategy 1: label → number on same or next line
  for (let i = 0; i < lines.length && !amount; i++) {
    const lm = lines[i].match(amountLabelRe);
    if (!lm) continue;
    const rest = lines[i].slice(lm.index + lm[0].length).trim();
    // Same-line number (with or without currency prefix)
    const nm = rest.match(/([\d,]+(?:\.[0-9]{1,2})?)/);
    if (nm) { amount = parseAmt(nm[1]); }
    // Next line number
    if (!amount && lines[i + 1]) {
      const nm2 = lines[i + 1].match(/([\d,]+(?:\.[0-9]{1,2})?)/);
      if (nm2) { amount = parseAmt(nm2[1]); }
    }
  }

  // Strategy 2: currency symbol → number (₱500.00 or Php 500)
  if (!amount) {
    currencyRe.lastIndex = 0;
    const fullText = lines.join('\n');
    let m;
    while ((m = currencyRe.exec(fullText)) !== null) {
      const val = parseAmt(m[1]);
      if (val) { amount = val; break; }
    }
  }

  // Strategy 3: any decimal number on its own (e.g. "500.00")
  if (!amount) {
    for (const line of lines) {
      const m = line.match(/\b([\d,]+\.[0-9]{2})\b/);
      if (m) { const val = parseAmt(m[1]); if (val) { amount = val; break; } }
    }
  }

  // Strategy 4: large standalone integer — last resort (e.g. "500" on a clean line)
  if (!amount) {
    for (const line of lines) {
      const m = line.match(/^\s*([\d,]+)\s*$/);
      if (m) {
        const val = parseAmt(m[1]);
        // Only accept if it looks like a plausible cash amount (≥ 10)
        if (val && val >= 10) { amount = val; break; }
      }
    }
  }

  return { amount, reference, date: extractDate(lines), account_holder: detectAccountFromPhone(text) };
}

function extractDate(lines) {
  const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const MONTH_SHORT = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const toMonthName = (idx) => ['January','February','March','April','May','June','July','August','September','October','November','December'][idx];
  const fmt = (month, day, year) => `${toMonthName(month)} ${parseInt(day)}, ${year}`;

  // Normalise OCR digit substitutions in a line before date parsing
  const fixOcrDigits = (s) =>
    s.replace(/O/g, '0').replace(/[Il]/g, '1').replace(/S/g, '5').replace(/G/g, '6').replace(/B/g, '8');

  for (const rawLine of lines) {
    const line = fixOcrDigits(rawLine);

    // "May 14, 2026" / "May 14 2026" / "May. 14, 2026"
    for (let mi = 0; mi < MONTHS.length; mi++) {
      const re = new RegExp(`\\b(?:${MONTHS[mi]}|${MONTH_SHORT[mi]})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'i');
      const m = line.match(re);
      if (m) return fmt(mi, m[1], m[2]);
    }

    // MM/DD/YYYY or MM-DD-YYYY or MM.DD.YYYY
    {
      const m = line.match(/\b(0?[1-9]|1[0-2])[\/\-\.](0?[1-9]|[12]\d|3[01])[\/\-\.](\d{4})\b/);
      if (m) return fmt(parseInt(m[1]) - 1, m[2], m[3]);
    }

    // YYYY/MM/DD or YYYY-MM-DD (ISO-like)
    {
      const m = line.match(/\b(\d{4})[\/\-\.](0?[1-9]|1[0-2])[\/\-\.](0?[1-9]|[12]\d|3[01])\b/);
      if (m) return fmt(parseInt(m[2]) - 1, m[3], m[1]);
    }

    // "14 May 2026" or "14 May, 2026"
    for (let mi = 0; mi < MONTHS.length; mi++) {
      const re = new RegExp(`\\b(\\d{1,2})\\s+(?:${MONTHS[mi]}|${MONTH_SHORT[mi]})\\.?,?\\s+(\\d{4})\\b`, 'i');
      const m = line.match(re);
      if (m) return fmt(mi, m[1], m[2]);
    }
  }
  return null;
}

export default CropWizard;
