import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import WizardStepCrop from './Steps/WizardStepCrop';
import BillingSummaryModal from './BillingSummaryModal';
import SortingStage from './Steps/SortingStage';
import CropStage from './Steps/CropStage';
import { getApiUrl } from '../../apiConfig';

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap');

  .cw-overlay {
    position: fixed; inset: 0; background: rgba(226, 240, 253, 0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px; backdrop-filter: blur(16px);
  }
  .cw-card {
    background: #0b0d11; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 40px; width: 100%; max-width: 1400px;
    max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 60px 120px rgba(0,0,0,0.9);
  }
  .cw-header { 
    display: flex; 
    align-items: center; 
    gap: 20px; 
    padding: 20px 40px; 
    border-bottom: 1px solid rgba(255,255,255,0.05); 
    justify-content: center;
    position: relative;
  }
  .cw-header-icon {
    width: 40px; height: 40px; border-radius: 12px; background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.2); display: flex; align-items: center; justify-content: center; color: #f59e0b;
  }
  .cw-title-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .cw-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; }
  .cw-subtitle { font-family: 'DM Sans', sans-serif; font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
  .cw-close { position: absolute; right: 40px; color: #475569; font-size: 20px; cursor: pointer; transition: color 0.2s; border: none; background: none; }
  .cw-close:hover { color: #fff; }

  .cw-content { 
    flex: 1; 
    position: relative; 
    display: flex; 
    flex-direction: row; 
    overflow: hidden; 
    justify-content: center;
    align-items: stretch;
  }

  .cw-canvas-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    max-width: 600px;
  }

  .cw-sidebar {
     width: 480px;
     flex-shrink: 0;
     background: rgba(255,255,255,0.01);
     display: flex;
     flex-direction: column;
     padding: 40px;
     overflow-y: auto;
   }

  .cw-footer { padding: 30px 40px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: center; }
  .cw-btn-confirm {
    width: 100%; max-width: 400px; background: #f59e0b; color: #000;
    font-family: 'Syne', sans-serif; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.2em; font-size: 12px; padding: 18px; border-radius: 20px;
    border: none; cursor: pointer; transition: all 0.2s;
  }
  .cw-btn-confirm:hover { background: #fbbf24; transform: translateY(-2px); }
  .cw-btn-confirm:active { transform: translateY(0); }

  /* OCR Table specific styles */
  .cw-table { width: 100%; border-spacing: 0 8px; border-collapse: separate; }
  .cw-table th {
    padding: 0 16px 8px; text-align: left;
    font-family: 'DM Sans', sans-serif; font-size: 9px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.15em; color: #475569;
  }
  .cw-row { background: rgba(255,255,255,0.02); transition: all 0.2s ease; border-radius: 12px; }
  .cw-row:hover { background: rgba(255,255,255,0.04); }
  .cw-row.saved { background: rgba(82,200,122,0.05); }
  .cw-td { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.03); }
  .cw-td:first-child { border-left: 1px solid rgba(255,255,255,0.03); border-radius: 12px 0 0 12px; }
  .cw-td:last-child { border-right: 1px solid rgba(255,255,255,0.03); border-radius: 0 12px 12px 0; }

  .cw-input {
    background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px; padding: 8px 12px; color: #fff; font-family: 'JetBrains Mono', monospace;
    font-size: 11px; outline: none; transition: all 0.2s; width: 100%;
  }
  .cw-input:focus { border-color: #52c87a; background: rgba(82,200,122,0.05); }

  .cw-badge {
    padding: 4px 10px; border-radius: 50px; font-size: 8px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.1em; font-family: 'DM Sans', sans-serif;
  }
  .cw-badge.success { background: rgba(82,200,122,0.1); color: #52c87a; border: 1px solid rgba(82,200,122,0.2); }
  .cw-badge.warning { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }

  .cw-stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
  .cw-stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; text-align: center; }
  .cw-stat-val { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 700; color: #fff; }
  .cw-stat-label { font-size: 9px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
`;

const CropWizard = ({ receipts = [], batchId, onDone, onClose, initialPhase = 'categorize' }) => {
  // 1. Initial state
  const [phase, setPhase] = useState(initialPhase); 
  const [index, setIndex] = useState(() => {
    if (initialPhase === 'categorize') {
      const firstUnsorted = receipts.findIndex(r => !r.category || r.category === 'unsorted');
      return firstUnsorted !== -1 ? firstUnsorted : 0;
    }
    if (initialPhase === 'crop') {
      const firstNeedsCrop = receipts.findIndex(r => {
        const ocr = r.ocr_data ? (typeof r.ocr_data === 'string' ? JSON.parse(r.ocr_data) : r.ocr_data) : null;
        if (r.category === 'gcash') return !r.cropped_image;
        if (r.category === 'others') return !ocr?.manual;
        return true; // unsorted
      });
      return firstNeedsCrop !== -1 ? firstNeedsCrop : 0;
    }
    if (initialPhase === 'verify') {
      return 0;
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
  const [sortingView, setSortingView] = useState('select'); // 'select' | 'review'
  const [isSavingSorting, setIsSavingSorting] = useState(false);
  const [selections, setSelections] = useState({}); // { index: { category, account } } — used in crop phase
  const [crops, setCrops] = useState({}); // { index: dataUrl }
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [isVerifying, setIsVerifying] = useState(initialPhase === 'verify');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [ocrResults, setOcrResults] = useState(null);
  const [showOcrPreview, setShowOcrPreview] = useState(false);
  const [showVerifyPreview, setShowVerifyPreview] = useState(initialPhase === 'verify');
  const [finalizedBatch, setFinalizedBatch] = useState(null);
  
  // Stage 7: Summary State
  const [deductionType, setDeductionType] = useState('none');
  const [manualDeduction, setManualDeduction] = useState('');

  // Stage 8: Billing State
  const [billingMethod, setBillingMethod] = useState('both'); // 'cash', 'bank', 'both'
  const [cashDenominations, setCashDenominations] = useState({
    '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, // Bills
    'c20': 0, 'c10': 0, 'c5': 0, 'c1': 0 // Coins
  });
  const [bankTransferAmount, setBankTransferAmount] = useState(0);
  const [showBillingSummary, setShowBillingSummary] = useState(false);
  const [showBillingSummaryModal, setShowBillingSummaryModal] = useState(false);
  const [savedBatchInfo, setSavedBatchInfo] = useState(null);

  // Calculations for Summary
  const verifiedClaims = ocrResults?.filter(r => r.verification_status === 'verified') || [];
  const totalClaimsAmount = verifiedClaims.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const serviceFee = Math.floor(totalClaimsAmount / 1000) * 10;
  const netAmount = totalClaimsAmount - serviceFee - Number(manualDeduction || 0);

  // Billing Calculations
  const cashTotal = Object.entries(cashDenominations).reduce((sum, [key, count]) => {
    const val = key.startsWith('c') ? Number(key.substring(1)) : Number(key);
    return sum + (val * count);
  }, 0);
  const billingTotal = cashTotal + Number(bankTransferAmount || 0);
  const billingDiff = netAmount - billingTotal;
  const isBillingBalanced = Math.abs(billingDiff) < 0.01;

  // Initialize OCR results if jumping to verify
  useEffect(() => {
    if (initialPhase === 'verify' && !ocrResults && receipts.length > 0) {
      const triggerProcess = async () => {
        try {
          const res = await fetch(getApiUrl(`/api/batches/${batchId}/process`), { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (res.ok) {
            const results = await res.json();
            setOcrResults(results);
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
  }, [initialPhase, batchId]);
  
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
  const ACCOUNTS = ['Babilyn', 'Nixie', 'Kristine'];

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

  const getCroppedDataUrl = () => {
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
  };

  const handlePrev = () => {
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

  // Bulk apply: save all receipts as gcash or others based on checkbox state
  const handleApplySorting = async () => {
    setIsSavingSorting(true);
    try {
      await Promise.all(receipts.map(r => {
        const cat = checkedForOthers.has(r.id) ? 'others' : 'gcash';
        return fetch(getApiUrl(`/api/receipts/${r.id}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: cat,
            account_holder: cat === 'others' ? 'OTHERS' : null,
          }),
        });
      }));
      setSortingView('review');
    } catch (e) {
      alert(`Failed to save sorting: ${e.message}. Please try again.`);
    } finally {
      setIsSavingSorting(false);
    }
  };

  // Proceed from review to crop phase
  const handleProceedToCrop = () => {
    const newSelections = {};
    receipts.forEach((r, i) => {
      const cat = checkedForOthers.has(r.id) ? 'others' : 'gcash';
      newSelections[i] = { category: cat, account: cat === 'others' ? 'OTHERS' : null };
    });
    setSelections(newSelections);
    setPhase('crop');
    setIndex(0);
    setCrop(null);
    setCompletedCrop(null);
  };

  const handleNextCategorize = () => {
    setSortingView('select');
    setPhase('categorize');
  };

  const handleNextCrop = async () => {
    if (!current) return;

    // Validate manual input for 'others' receipts
    if (currentCategory === 'others') {
      const amt = Number(manualAmount);
      if (!manualAmount || isNaN(amt) || amt <= 0) {
        alert('Please enter a valid amount greater than ₱0.');
        return;
      }
    }

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

    // 3. Immediate save to DB
    try {
      const response = await fetch(getApiUrl(`/api/receipts/${current.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (e) {
      console.error('Failed to save Stage 3 data to DB', e);
      alert(`Failed to save progress: ${e.message}. Please check your connection.`);
      return;
    }
    
    // Find next item that needs crop/input
    const nextNeedsCrop = liveReceipts.findIndex((r, i) => i > index && (
      (r.category === 'gcash' && !r.cropped_image) || 
      (r.category === 'others' && !r.ocr_data?.manual)
    ));

    if (nextNeedsCrop !== -1) {
      setIndex(nextNeedsCrop);
      setCrop(null);
      setCompletedCrop(null);
      setImageRotation(0);
    } else {
      // Phase 2 complete -> Automatically start Phase 3
      startOcrPhase();
    }
  };

  const startOcrPhase = () => {
    setPhase('ocr');
    // Removed handleRunOcrExtraction(); - User wants a button now
  };

  const startVerifyPhase = async () => {
    setPhase('verify');
    setShowOcrPreview(false);
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

      const results = await res.json();
      setOcrResults(results);
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

  const startFinalizePhase = async () => {
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
    
    const worker = await createWorker('eng', 1, {
      logger: m => console.log(m),
      errorHandler: e => console.error('Tesseract Worker Error:', e),
    });
    
    try {
      const results = [];
      const failedReceipts = [];
      
      const receiptsToProcess = liveReceipts.filter(r => r.category && r.category !== 'unsorted');
      
      for (const r of receiptsToProcess) {
        const i = liveReceipts.indexOf(r);
        
        // Skip OCR if it's 'Others' and already has manual data
        const sessionManual = manualEntries[i];
        if ((r.category === 'others' && r.ocr_data?.manual) || sessionManual) {
          const data = sessionManual || r.ocr_data;
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

        // Use the saved cropped image or the original
        let imageSrc = crops[i];
        if (!imageSrc) {
          imageSrc = r.cropped_image
            ? getApiUrl(`/api/receipts/${r.id}/image?type=crop`)
            : getApiUrl(`/api/receipts/${r.id}/image`);
        }

        // ─── Per-receipt try/catch so one failure doesn't kill the batch ───
        try {
          const bitmap = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const timeout = setTimeout(() => {
              img.src = '';
              reject(new Error(`Image load timeout for receipt #${r.id}`));
            }, 15000);
            img.onload = () => {
              clearTimeout(timeout);
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              canvas.getContext('2d').drawImage(img, 0, 0);
              resolve(canvas);
            };
            img.onerror = () => {
              clearTimeout(timeout);
              reject(new Error(`Failed to load image for receipt #${r.id}`));
            };
            img.src = imageSrc;
          });

          const { data: { text } } = await worker.recognize(bitmap);
          const extracted = extractFields(text);

          // Validate extracted data — warn but don't block
          if (!extracted.amount && !extracted.reference) {
            console.warn(`Receipt #${r.id}: OCR found no amount or reference. Raw text: ${text.substring(0, 100)}`);
          }

          const patchRes = await fetch(`http://localhost:8000/api/receipts/${r.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ocr_status: 'completed',
              ocr_data: {
                amount: extracted.amount || 0,
                reference: extracted.reference || null,
                date: extracted.date || null,
                raw_text: text,
                confidence: 99
              },
              // Auto-assign account_holder if phone number detected
              ...(extracted.account_holder ? { account_holder: extracted.account_holder } : {}),
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
            account_holder: extracted.account_holder || updatedReceipt.account_holder,
          });
        } catch (receiptErr) {
          console.error(`OCR failed for receipt #${r.id}:`, receiptErr);
          failedReceipts.push(r.id);
          // Push a placeholder so the receipt still appears in results
          results.push({
            receipt: r,
            amount: 0,
            reference: null,
            date: null,
            confidence: 0,
            manualEntry: false,
            ocrError: receiptErr.message
          });
        }
      }

      setOcrResults(results);
      setShowOcrPreview(true);

      if (failedReceipts.length > 0) {
        alert(`Extraction complete with ${failedReceipts.length} error(s).\nReceipt IDs that failed: ${failedReceipts.join(', ')}.\nYou can still proceed — failed receipts will show ₱0.`);
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
    <div className="cw-overlay">
      <style>{CSS}</style>
      <div className="cw-card">
        {/* Header */}
        <div className="cw-header">
          <div className="cw-header-icon" style={{
            background: phase === 'categorize' ? 'rgba(99,102,241,0.12)' :
                        phase === 'crop'       ? 'rgba(245,158,11,0.12)' :
                        phase === 'ocr'        ? 'rgba(251,191,36,0.12)' :
                        phase === 'verify'     ? 'rgba(59,130,246,0.12)' :
                        phase === 'finalize'   ? 'rgba(16,185,129,0.12)' :
                        phase === 'summary'    ? 'rgba(168,85,247,0.12)' :
                                                 'rgba(16,185,129,0.12)',
            border: `1px solid ${
                        phase === 'categorize' ? 'rgba(99,102,241,0.3)'  :
                        phase === 'crop'       ? 'rgba(245,158,11,0.3)'  :
                        phase === 'ocr'        ? 'rgba(251,191,36,0.3)'  :
                        phase === 'verify'     ? 'rgba(59,130,246,0.3)'  :
                        phase === 'finalize'   ? 'rgba(16,185,129,0.3)'  :
                        phase === 'summary'    ? 'rgba(168,85,247,0.3)'  :
                                                 'rgba(16,185,129,0.3)'}`,
            color: phase === 'categorize' ? '#818cf8' :
                   phase === 'crop'       ? '#f59e0b' :
                   phase === 'ocr'        ? '#fbbf24' :
                   phase === 'verify'     ? '#60a5fa' :
                   phase === 'finalize'   ? '#34d399' :
                   phase === 'summary'    ? '#c084fc' :
                                            '#34d399',
          }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Stage pill */}
                  <span style={{
                    padding: '3px 10px', borderRadius: '100px',
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.35)',
                    color: '#a5b4fc',
                    fontSize: '9px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.2em',
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  }}>
                    Stage 2 of 8
                  </span>
                </div>
                {/* Title */}
                <div style={{
                  fontSize: '16px', fontWeight: 700,
                  color: '#f1f5f9',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}>
                  Sort Receipts
                </div>
                {/* Subtitle */}
                <div style={{
                  fontSize: '10px', fontWeight: 500,
                  color: '#64748b',
                  letterSpacing: '0.04em',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}>
                  Classify each receipt as GCash or Others
                </div>
              </div>
            ) : phase === 'crop' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Stage pill */}
                  <span style={{
                    padding: '3px 10px', borderRadius: '100px',
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.35)',
                    color: '#fbbf24',
                    fontSize: '9px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.2em',
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  }}>
                    Stage 3 of 8
                  </span>
                </div>
                {/* Title */}
                <div style={{
                  fontSize: '16px', fontWeight: 700,
                  color: '#f1f5f9',
                  letterSpacing: '-0.02em', lineHeight: 1.2,
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}>
                  Crop & Input
                </div>
                {/* Subtitle */}
                <div style={{
                  fontSize: '10px', fontWeight: 500,
                  color: '#64748b',
                  letterSpacing: '0.04em',
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                }}>
                  Crop GCash receipts and input Others manually
                </div>
              </div>
            ) : (
              <>
                <div className="cw-title">
                  {phase === 'ocr' && 'Stage 4: Extraction'}
                  {phase === 'verify' && 'Stage 5: Run Check'}
                  {phase === 'finalize' && 'Stage 6: Finalize'}
                  {phase === 'summary' && 'Stage 7: Summary'}
                  {phase === 'billing' && 'Stage 8: Billing'}
                </div>
            <div className="cw-subtitle">
              {phase === 'ocr' && 'Analyzing batch receipts...'}
              {phase === 'verify' && 'Verifying claims with transactions...'}
              {phase === 'finalize' && 'Stamping batch labels...'}
              {phase === 'summary' && 'Calculating total claims and deductions...'}
              {(phase !== 'ocr' && phase !== 'verify' && phase !== 'finalize' && phase !== 'summary') && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/40">TOTAL</span>
                    <span className="text-white font-bold">{currentTotalStr}</span>
                  </div>
                  
                  {gcashReceipts.length > 0 && (
                    <>
                      <span className="text-white/10">|</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-500/60">GCASH</span>
                        <span className={`font-bold ${isGcash ? 'text-blue-400' : 'text-blue-500/40'}`}>
                          {phase === 'categorize' ? gcashReceipts.length : `${gcashProcessed}/${gcashReceipts.length}`}
                        </span>
                      </div>
                    </>
                  )}

                  {othersReceipts.length > 0 && (
                    <>
                      <span className="text-white/10">|</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-500/60">OTHERS</span>
                        <span className={`font-bold ${isOthers ? 'text-amber-400' : 'text-amber-500/40'}`}>
                          {phase === 'categorize' ? othersReceipts.length : `${othersProcessed}/${othersReceipts.length}`}
                        </span>
                      </div>
                    </>
                  )}

                  {unsortedReceipts.length > 0 && phase === 'categorize' && (
                    <>
                      <span className="text-white/10">|</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500/60">UNSORTED</span>
                        <span className="text-slate-400 font-bold">
                          {unsortedReceipts.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
              </>
            )}
          </div>
          <button className="cw-close" onClick={onClose}>✕</button>
        </div>

        {/* Progress */}
        <div className="cw-progress-container">
          {phase !== 'categorize' && (
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
          {(phase === 'ocr' || phase === 'verify' || phase === 'finalize' || phase === 'summary' || phase === 'categorize') ? (
            <div className="flex-1 flex flex-col bg-black/20 overflow-hidden">

              {/* ── Stage 2: Sorting ── */}
              {phase === 'categorize' && (
                <SortingStage
                  receipts={receipts}
                  checkedForOthers={checkedForOthers}
                  setCheckedForOthers={setCheckedForOthers}
                  sortingView={sortingView}
                  setSortingView={setSortingView}
                  isSavingSorting={isSavingSorting}
                  onApply={handleApplySorting}
                  onProceed={handleProceedToCrop}
                />
              )}
              {/* Phase 3 Preview */}
              {phase === 'ocr' && showOcrPreview && (
                <div className="flex-1 flex flex-col p-10 overflow-hidden animate-in fade-in duration-500">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Extracted Data Preview</h3>
                    <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                      {ocrResults?.length} Items Scanned
                    </span>
                  </div>

                  {/* Account breakdown */}
                  {(() => {
                    const accounts = ['Babilyn', 'Nixie', 'Kristine'];
                    const colors = {
                      Babilyn:  { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', text: '#a78bfa' },
                      Nixie:    { bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)', text: '#f472b6' },
                      Kristine: { bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.3)',  text: '#38bdf8' },
                    };
                    return (
                      <div className="flex items-center gap-3 mb-6 flex-wrap">
                        {accounts.map(acc => {
                          const count = ocrResults?.filter(r =>
                            (r.receipt?.account_holder || r.account_holder) === acc
                          ).length || 0;
                          const c = colors[acc];
                          return (
                            <div key={acc} style={{
                              padding: '6px 14px', borderRadius: '10px',
                              background: c.bg, border: `1px solid ${c.border}`,
                              color: c.text, fontSize: '10px', fontWeight: 900,
                              textTransform: 'uppercase', letterSpacing: '0.12em',
                              display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                              <span>{acc}</span>
                              <span style={{
                                background: c.border, color: '#fff',
                                borderRadius: '6px', padding: '1px 7px',
                                fontSize: '11px', fontWeight: 800,
                              }}>{count}</span>
                            </div>
                          );
                        })}
                        {(() => {
                          const undetected = ocrResults?.filter(r =>
                            !['Babilyn','Nixie','Kristine'].includes(r.receipt?.account_holder || r.account_holder)
                          ).length || 0;
                          return undetected > 0 ? (
                            <div style={{
                              padding: '6px 14px', borderRadius: '10px',
                              background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.3)',
                              color: '#94a3b8', fontSize: '10px', fontWeight: 900,
                              textTransform: 'uppercase', letterSpacing: '0.12em',
                              display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                              <span>Undetected</span>
                              <span style={{
                                background: 'rgba(100,116,139,0.4)', color: '#fff',
                                borderRadius: '6px', padding: '1px 7px',
                                fontSize: '11px', fontWeight: 800,
                              }}>{undetected}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    );
                  })()}

                  {/* Results list */}
                  <div className="flex-1 overflow-y-auto pr-4 no-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                      {ocrResults?.map((res, i) => {
                        const holder = res.receipt?.account_holder || res.account_holder;
                        const acctColors = {
                          Babilyn:  { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)',  text: '#a78bfa' },
                          Nixie:    { bg: 'rgba(244,114,182,0.1)', border: 'rgba(244,114,182,0.25)', text: '#f472b6' },
                          Kristine: { bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)',  text: '#38bdf8' },
                        };
                        const ac = acctColors[holder];
                        return (
                          <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:bg-white/10 transition-all">
                            <div className="flex items-center gap-5">
                              {/* Account badge */}
                              <div style={{
                                minWidth: '80px', padding: '6px 12px', borderRadius: '10px', textAlign: 'center',
                                background: ac ? ac.bg : 'rgba(100,116,139,0.1)',
                                border: `1px solid ${ac ? ac.border : 'rgba(100,116,139,0.2)'}`,
                                color: ac ? ac.text : '#64748b',
                                fontSize: '10px', fontWeight: 900,
                                textTransform: 'uppercase', letterSpacing: '0.1em',
                              }}>
                                {holder || '—'}
                              </div>
                              {/* Reference */}
                              <div>
                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Reference</div>
                                <div className="text-sm font-bold text-white font-mono tracking-wider">{res.reference || '—'}</div>
                              </div>
                            </div>
                            {/* Amount */}
                            <div className="text-right">
                              <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Amount</div>
                              <div className="text-lg font-black text-amber-400">
                                ₱{Number(res.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 4 Preview */}
              {phase === 'verify' && showVerifyPreview && (
                <div className="flex-1 flex flex-col p-10 overflow-hidden animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Verification Check</h3>
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                        {ocrResults?.filter(r => r.verification_status === 'verified').length} Verified
                      </span>
                      <span className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                        {ocrResults?.filter(r => r.verification_status !== 'verified').length} Not Found
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-4 no-scrollbar">
                    <div className="grid grid-cols-1 gap-4">
                      {ocrResults?.sort((a, b) => {
                        // Sort Not Found items to the top
                        if (a.verification_status !== 'verified' && b.verification_status === 'verified') return -1;
                        if (a.verification_status === 'verified' && b.verification_status !== 'verified') return 1;
                        return 0;
                      }).map((res, i) => (
                        <div key={i} className={`bg-white/5 border ${res.verification_status === 'verified' ? 'border-green-500/20' : 'border-red-500/20'} rounded-2xl p-6 flex items-center justify-between group transition-all`}>
                          <div className="flex items-center gap-6">
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-xl ${res.verification_status === 'verified' ? 'bg-green-500/10' : 'bg-red-500/10'} flex items-center justify-center text-xl border border-white/10`}>
                                {res.verification_status === 'verified' ? '✅' : '❌'}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white font-mono tracking-wider mb-1">{res.reference || '—'}</div>
                              <div className={`text-[9px] font-black uppercase tracking-widest ${res.verification_status === 'verified' ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                {res.verification_status === 'verified' 
                                  ? `Found in ${res.match_details?.bank} at ${res.match_details?.timestamp}` 
                                  : 'Error: Transaction not found in database'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-white mb-1">₱{Number(res.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{res.receipt.account_holder}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Finalized Claims View (Left Side) */}
              {phase === 'finalize' && finalizedBatch && (
                <div className="flex-1 flex flex-col p-10 overflow-hidden animate-in fade-in duration-500 text-left">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Batch Summary</h3>
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                        {ocrResults?.filter(r => r.verification_status === 'verified').length} Verified
                      </span>
                      <span className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                        {ocrResults?.filter(r => r.verification_status !== 'verified').length} Not Found
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-3">
                      {ocrResults?.sort((a, b) => {
                        // Sort Not Found items to the top
                        if (a.verification_status !== 'verified' && b.verification_status === 'verified') return -1;
                        if (a.verification_status === 'verified' && b.verification_status !== 'verified') return 1;
                        return 0;
                      }).map((res, i) => (
                        <div key={i} className={`p-4 bg-white/5 rounded-2xl border ${res.verification_status === 'verified' ? 'border-white/5' : 'border-red-500/20'} flex items-center justify-between group hover:bg-white/10 transition-all`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${res.verification_status === 'verified' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} flex items-center justify-center text-sm font-bold border`}>
                              {res.verification_status === 'verified' ? '✓' : '!'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-white uppercase tracking-tight">
                                {res.reference || 'REF-' + res.receipt.id}
                              </span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{res.receipt.account_holder}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-black ${res.verification_status === 'verified' ? 'text-green-400' : 'text-red-400'}`}>
                              ₱{Number(res.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            {res.verification_status !== 'verified' && (
                              <div className="text-[8px] font-black text-red-500/60 uppercase tracking-tighter">Not Found</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 7: Summary View (Main Content) */}
              {phase === 'summary' && (
                <div className="flex-1 flex flex-col p-10 overflow-hidden animate-in slide-in-from-left duration-500 text-left">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Claims Summary</h3>
                    <div className="flex items-center gap-3">
                      <span className="px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                        {verifiedClaims.length} Verified Claims
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-6">
                      {/* Detailed Breakdown Table */}
                      <div className="bg-white/5 rounded-[32px] border border-white/10 overflow-hidden">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-white/5">
                              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                              <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-8 py-6">
                                <div className="text-sm font-bold text-white">Total Gross Claims</div>
                                <div className="text-[10px] text-slate-500 font-medium uppercase mt-1">Sum of all verified receipts</div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="text-lg font-black text-white">₱{totalClaimsAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                              </td>
                            </tr>
                            <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-8 py-6">
                                <div className="text-sm font-bold text-red-400">System Service Fee</div>
                                <div className="text-[10px] text-slate-500 font-medium uppercase mt-1">₱10.00 per ₱1,000.00</div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="text-lg font-black text-red-400">- ₱{serviceFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                              </td>
                            </tr>
                            {deductionType !== 'none' && (
                              <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="px-8 py-6">
                                  <div className="text-sm font-bold text-orange-400">
                                    {deductionType === 'royal' ? 'Cash in Royal Cable' : deductionType === 'bills' ? 'Bills' : 'Other Deduction'}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium uppercase mt-1">Manual Deduction</div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <div className="text-lg font-black text-orange-400">- ₱{Number(manualDeduction || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                                </td>
                              </tr>
                            )}
                            <tr className="bg-green-500/5">
                              <td className="px-8 py-8">
                                <div className="text-base font-black text-green-400 uppercase tracking-tight">Total Net Amount</div>
                                <div className="text-[10px] text-green-500/60 font-bold uppercase mt-1">Final amount for billing</div>
                              </td>
                              <td className="px-8 py-8 text-right">
                                <div className="text-3xl font-black text-green-400 tracking-tighter">
                                  ₱{netAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Help Text */}
                      <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex gap-4 items-start">
                        <div className="text-xl">ℹ️</div>
                        <div className="text-[11px] text-amber-200/60 leading-relaxed font-medium">
                          The system has calculated a service fee of <span className="text-amber-400 font-bold">₱{serviceFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span> based on the total claims. 
                          You can add additional deductions using the dropdown in the sidebar. 
                          Once finalized, this batch will move to Stage 8: Billing.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 8: Billing View (Main Content) */}
              {phase === 'billing' && (
                <div className="flex-1 flex flex-col p-10 overflow-hidden animate-in slide-in-from-left duration-500 text-left">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight">Billing Dashboard</h3>
                    <div className={`px-6 py-2 rounded-full ${isBillingBalanced ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'} text-[12px] font-black uppercase tracking-[0.2em] border transition-all`}>
                      {isBillingBalanced ? '✓ FUNDS BALANCED' : `₱${Math.abs(billingDiff).toLocaleString()} REMAINING`}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-8">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-6">
                        <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 text-center">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Net Amount Due</div>
                          <div className="text-3xl font-black text-white tracking-tighter">
                            ₱{netAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 text-center">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Prepared</div>
                          <div className={`text-3xl font-black ${isBillingBalanced ? 'text-green-400' : 'text-amber-400'} tracking-tighter`}>
                            ₱{billingTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 text-center">
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Difference</div>
                          <div className={`text-3xl font-black ${billingDiff === 0 ? 'text-green-400' : 'text-red-400'} tracking-tighter`}>
                            {billingDiff === 0 ? '—' : `₱${billingDiff.toLocaleString()}`}
                          </div>
                        </div>
                      </div>

                      {/* Visual Allocation */}
                      <div className="bg-white/5 rounded-[40px] border border-white/10 p-10">
                        <div className="flex items-center justify-between mb-8">
                          <h4 className="text-sm font-black text-white uppercase tracking-widest">Fund Allocation</h4>
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Cash</span>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Bank</span>
                          </div>
                        </div>

                        <div className="space-y-12">
                          {/* Cash Breakdown */}
                          {(billingMethod === 'cash' || billingMethod === 'both') && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-5 gap-4">
                                {Object.entries(cashDenominations)
                                  .filter(([_, count]) => count > 0)
                                  .map(([key, count]) => {
                                    const isCoin = key.startsWith('c');
                                    const val = isCoin ? Number(key.substring(1)) : Number(key);
                                    return (
                                      <div key={key} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-1 group hover:border-amber-500/30 transition-all">
                                        <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">₱{val} {isCoin ? 'Coin' : 'Bill'}</div>
                                        <div className="text-xl font-black text-white">×{count}</div>
                                        <div className="text-[9px] font-bold text-slate-500">₱{(val * count).toLocaleString()}</div>
                                      </div>
                                    );
                                  })}
                                {Object.values(cashDenominations).every(c => c === 0) && (
                                  <div className="col-span-5 p-8 border-2 border-dashed border-white/5 rounded-3xl text-center text-[11px] font-black text-slate-600 uppercase tracking-widest">
                                    No Cash Allocated
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Bank Transfer Bar */}
                          {(billingMethod === 'bank' || billingMethod === 'both') && (
                            <div className="p-8 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl text-blue-400">🏦</div>
                                <div>
                                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Electronic Transfer</div>
                                  <div className="text-sm font-bold text-white uppercase tracking-tight">Bank-to-Bank Settlement</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Prepared Amount</div>
                                <div className="text-2xl font-black text-blue-400 tracking-tighter">₱{Number(bankTransferAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading & Start States */}
              {((phase === 'ocr' && !showOcrPreview) || (phase === 'verify' && !showVerifyPreview) || (phase === 'finalize' && !finalizedBatch)) && (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                  <div className="relative mb-12">
                    <div className={`w-32 h-32 rounded-full border-4 ${
                      phase === 'ocr' ? (isProcessingOcr ? 'border-amber-500/10 border-t-amber-500 animate-spin' : 'border-amber-500/20') : 
                      phase === 'verify' ? (isVerifying ? 'border-blue-500/10 border-t-blue-500 animate-spin' : 'border-blue-500/20') : 
                      'border-green-500/10 border-t-green-500 animate-spin'
                    }`} />
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                      {phase === 'ocr' ? '🔍' : phase === 'verify' ? '⚖️' : '📦'}
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
                    {phase === 'ocr' ? (isProcessingOcr ? 'Extracting Data' : 'Ready to Scan') : phase === 'verify' ? 'Verifying Claims' : 'Finalizing Batch'}
                  </h3>
                  <p className="text-slate-500 max-w-md mx-auto text-sm font-medium leading-relaxed mb-10">
                    {phase === 'ocr' ? 
                      (isProcessingOcr ? 'We are scanning your cropped images to extract amounts, dates, and 13-digit reference numbers.' : 'All receipts are sorted and cropped. Use the button in the sidebar to start the extraction.') : 
                      phase === 'verify' ? 'We are matching extracted data with transaction records to verify claims.' : 
                      'We are linking verified transactions to this batch and closing the record.'
                    }
                  </p>
                  
                  {(isProcessingOcr || isVerifying || isFinalizing) && (
                    <div className="w-full max-w-xs bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${
                        phase === 'ocr' ? 'bg-amber-500' : 
                        phase === 'verify' ? 'bg-blue-500' : 
                        'bg-green-500'
                      } animate-pulse`} 
                      style={{ width: '60%' }} />
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
              onRecategorize={() => {
                setPhase('categorize');
                setIndex(0);
                setCrop(null);
                setCompletedCrop(null);
              }}
              index={index}
              total={total}
              gcashProcessed={gcashProcessed}
              gcashTotal={gcashReceipts.length}
              othersProcessed={othersProcessed}
              othersTotal={othersReceipts.length}
              isGcash={isGcash}
              isOthers={isOthers}
            />
          ) : (
            <WizardStepCrop
              crop={null}
              onChange={onChange}
              onComplete={onComplete}
              imgRef={imgRef}
              src={current ? `http://localhost:8000/api/receipts/${current.id}/image` : ''}
              onLoad={onImageLoad}
              disabled={true}
              category={currentCategory}
              rotation={imageRotation}
            />
          )}

          {phase !== 'categorize' && phase !== 'crop' && (
          <div className="cw-sidebar">

            {phase === 'ocr' && (
              <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                <div className={`${isProcessingOcr ? 'bg-amber-500/10 border-amber-500/20' : ocrResults ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'} border rounded-[32px] p-8 text-center transition-colors duration-500`}>
                  <div className="text-4xl mb-4">{isProcessingOcr ? '🔍' : ocrResults ? '✅' : '⏳'}</div>
                  <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">
                    {isProcessingOcr ? 'Stage 4: Extracting' : ocrResults ? 'Stage 4: Complete' : 'Stage 4: Extraction'}
                  </h4>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed">
                    {isProcessingOcr ? 'Our OCR engine is reading your cropped images...' : ocrResults ? 'Extraction successful! Data has been extracted from all receipts.' : 'Ready to begin scanning. Click the button to start extraction.'}
                  </p>
                </div>

                {!isProcessingOcr && !ocrResults && (
                  <button 
                    onClick={handleRunOcrExtraction}
                    className="w-full py-4 rounded-2xl bg-amber-500 text-black font-black text-[11px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                    </svg>
                    Start Scan
                  </button>
                )}

                {!isProcessingOcr && ocrResults && (
                  <div className="space-y-4">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Processed</span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{ocrResults.length} Items</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Ready</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {phase === 'verify' && (
              <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                <div className={`${isVerifying ? 'bg-blue-500/10 border-blue-500/20' : 'bg-green-500/10 border-green-500/20'} border rounded-[32px] p-8 text-center transition-colors duration-500`}>
                  <div className="text-4xl mb-4">{isVerifying ? '⚖️' : '✅'}</div>
                  <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">
                    {isVerifying ? 'Stage 5: Run Check' : 'Stage 5: Complete'}
                  </h4>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed">
                    {isVerifying ? 'Verifying claims with your transaction history...' : 'Verification complete! Check individual status in the final table.'}
                  </p>
                </div>

                {!isVerifying && ocrResults && (
                  <div className="space-y-4">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Verification</span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                          {ocrResults.filter(r => r.verification_status === 'verified').length} / {ocrResults.length} Verified
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Done</span>
                      </div>
                    </div>

                    <button 
                      onClick={startFinalizePhase}
                      className="w-full py-4 rounded-2xl bg-green-500 text-black font-black text-[11px] uppercase tracking-widest hover:bg-green-400 transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-2"
                    >
                      Finalize Batch & Update Progress →
                    </button>
                  </div>
                )}
              </div>
            )}

            {phase === 'finalize' && (
              <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                <div className={`${isFinalizing ? 'bg-green-500/10 border-green-500/20' : 'bg-green-500/20 border-green-500/40'} border rounded-[32px] p-8 text-center transition-colors duration-500`}>
                  <div className="text-4xl mb-4">{isFinalizing ? '📦' : '🏆'}</div>
                  <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">
                    {isFinalizing ? 'Finalizing' : 'Finalized'}
                  </h4>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed">
                    {isFinalizing ? 'Stamping batch labels on transactions...' : 'Batch finalized! Transactions are now linked and claimed.'}
                  </p>
                </div>

                {finalizedBatch && (
                  <div className="space-y-4">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Batch Number</span>
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{finalizedBatch.final_batch_number || finalizedBatch.batch_number}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Transactions</span>
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Linked</span>
                      </div>
                    </div>

                    <button 
                      onClick={onDone}
                      className="w-full py-4 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl flex items-center justify-center gap-2 mt-6"
                    >
                      Return to Batch Details
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto pt-12 flex flex-col gap-5 border-t border-white/5">
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
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#fff',
                            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)',
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
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
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
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] hover:bg-white/10 hover:text-white transition-all active:scale-95"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      onClick={() => {
                        setPhase('crop');
                        setIndex(total - 1);
                      }}
                    >
                      ← Back to Crop
                    </button>
                    <div className="flex-[2]">
                      <button 
                        className="cw-btn-confirm" 
                        onClick={startVerifyPhase}
                        style={{ 
                          width: '100%', 
                          maxWidth: 'none',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.3)',
                          padding: '16px 10px',
                          fontSize: '10px',
                          fontWeight: 900,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          fontFamily: "'Inter', sans-serif",
                          borderRadius: '16px'
                        }}
                      >
                        Start Phase 4: Run Check →
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] font-black text-center text-slate-500 uppercase tracking-[0.2em]">Step 3 of 5: scanning</p>
                </div>
              )}

              {/* Phase 4 -> 5 Transition */}
              {phase === 'verify' && !isVerifying && ocrResults && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-[0.15em] hover:bg-white/10 hover:text-white transition-all active:scale-95"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                      onClick={() => {
                        setPhase('ocr');
                        setShowOcrPreview(true);
                      }}
                    >
                      ← Back
                    </button>
                    <div className="flex-[2]">
                      <button 
                        className="cw-btn-confirm" 
                        onClick={startFinalizePhase}
                        style={{ 
                          width: '100%', 
                          maxWidth: 'none',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                          boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)',
                          padding: '16px 10px',
                          fontSize: '10px',
                          fontWeight: 900,
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          fontFamily: "'Inter', sans-serif",
                          borderRadius: '16px'
                        }}
                      >
                        Start Phase 5: Finalize →
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] font-black text-center text-slate-500 uppercase tracking-[0.2em]">Step 4 of 5: verifying</p>
                </div>
              )}

              {/* Phase 5 Finish */}
              {phase === 'finalize' && !isFinalizing && finalizedBatch && (
                <div className="flex flex-col gap-3">
                  <button 
                    className="cw-btn-confirm" 
                    onClick={() => setPhase('summary')}
                    style={{ 
                      width: '100%', 
                      maxWidth: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    Complete & View Summary ✨
                  </button>
                  <p className="text-[9px] font-black text-center text-slate-500 uppercase tracking-[0.2em]">Step 5 of 5: finalizing</p>
                </div>
              )}

              {/* Stage 7 Summary Actions */}
              {phase === 'summary' && (
              <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-8 text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">Adjust Deductions</h4>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed">
                    Select any additional deductions that apply to this batch.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-[24px] border border-white/5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 block text-left">Deduction Type</label>
                    <select 
                      value={deductionType} 
                      onChange={(e) => setDeductionType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-amber-500 outline-none transition-all mb-4 appearance-none"
                      style={{ colorScheme: 'dark' }}
                    >
                      <option value="none">No Additional Deduction</option>
                      <option value="royal">Cash in Royal Cable</option>
                      <option value="bills">Bills</option>
                      <option value="others">Others</option>
                    </select>
                    
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 block text-left">Deduction Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₱</span>
                      <input 
                        type="number" 
                        value={manualDeduction} 
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '' || Number(v) >= 0) setManualDeduction(v);
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm font-bold focus:border-red-500 outline-none transition-all"
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch(`http://localhost:8000/api/batches/${batchId}/status`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            checker_status: 'summarized',
                            summary_data: {
                              gross_amount: totalClaimsAmount,
                              service_fee: serviceFee,
                              other_deduction_type: deductionType,
                              other_deduction_amount: Number(manualDeduction || 0),
                              net_amount: netAmount
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
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-2xl shadow-amber-500/20 flex items-center justify-center gap-3"
                  >
                    Finalize Summary & Billing →
                  </button>
                  
                  <button 
                    onClick={() => setPhase('finalize')}
                    className="w-full py-3 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    ← Back to Finalize
                  </button>
                </div>
              </div>
            )}

            {phase === 'billing' && (
              <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                <div className={`${isBillingBalanced ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-[32px] p-8 text-center transition-all`}>
                  <div className="text-4xl mb-4">{isBillingBalanced ? '📊' : '⚖️'}</div>
                  <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">Stage 8: Billing</h4>
                  <p className="text-slate-400 text-[10px] font-medium leading-relaxed">
                    Prepare the funds to tally with the net total.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Method Selection Toggles */}
                  <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
                    {['cash', 'bank', 'both'].map(method => (
                      <button
                        key={method}
                        onClick={() => setBillingMethod(method)}
                        className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          billingMethod === method ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Inputs Based on Method */}
                  <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {(billingMethod === 'cash' || billingMethod === 'both') && (
                      <div className="space-y-3">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Cash Denominations</div>
                        {[1000, 500, 200, 100, 50, 20].map(val => (
                          <div key={val} className="flex items-center gap-3">
                            <div className="w-12 text-[10px] font-bold text-slate-400">₱{val}</div>
                            <input 
                              type="number" 
                              min="0"
                              value={cashDenominations[val] || ''}
                              onChange={(e) => setCashDenominations(prev => ({ ...prev, [val]: parseInt(e.target.value) || 0 }))}
                              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-amber-500 outline-none"
                              placeholder="Count"
                            />
                          </div>
                        ))}
                        <div className="h-[1px] bg-white/5 my-2" />
                        {[20, 10, 5, 1].map(val => (
                          <div key={`c${val}`} className="flex items-center gap-3">
                            <div className="w-12 text-[10px] font-bold text-slate-400">₱{val}</div>
                            <input 
                              type="number" 
                              min="0"
                              value={cashDenominations[`c${val}`] || ''}
                              onChange={(e) => setCashDenominations(prev => ({ ...prev, [`c${val}`]: parseInt(e.target.value) || 0 }))}
                              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-amber-500 outline-none"
                              placeholder="Count"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {(billingMethod === 'bank' || billingMethod === 'both') && (
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2">Bank Transfer Amount</div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">₱</span>
                          <input 
                            type="number" 
                            min="0"
                            value={bankTransferAmount || ''}
                            onChange={(e) => setBankTransferAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm font-bold focus:border-blue-500 outline-none"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    disabled={!isBillingBalanced}
                    onClick={async () => {                      try {
                        const res = await fetch(`http://localhost:8000/api/batches/${batchId}/status`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            checker_status: 'billing_ready',
                            // Re-send summary_data so both are stored together
                            summary_data: {
                              gross_amount: totalClaimsAmount,
                              service_fee: serviceFee,
                              other_deduction_type: deductionType,
                              other_deduction_amount: Number(manualDeduction || 0),
                              net_amount: netAmount
                            },
                            billing_data: {
                              method: billingMethod,
                              cash_denominations: cashDenominations,
                              bank_transfer_amount: bankTransferAmount,
                              total_prepared: billingTotal
                            }
                          }),
                        });
                        if (!res.ok) throw new Error(`Server error ${res.status}`);
                        const batchData = await res.json();
                        setSavedBatchInfo(batchData);
                        setShowBillingSummaryModal(true);
                      } catch (e) {
                        console.error('Billing save failed', e);
                        alert(`Failed to save billing: ${e.message}. Please try again.`);
                      }
                    }}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-2xl shadow-green-500/20 flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                  >
                    Finish & Generate Billing ✨
                  </button>

                  {/* Hint when button is disabled */}
                  {!isBillingBalanced && (
                    <div className="text-center text-[10px] font-bold text-red-400/80 px-2">
                      {billingDiff > 0
                        ? `₱${billingDiff.toLocaleString('en-PH', { minimumFractionDigits: 2 })} still unallocated`
                        : `₱${Math.abs(billingDiff).toLocaleString('en-PH', { minimumFractionDigits: 2 })} over-allocated`}
                      {' — funds must match net amount exactly.'}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setPhase('summary')}
                    className="w-full py-3 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    ← Back to Summary
                  </button>
                </div>
              </div>
            )}
            </div>
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
        deductionType={deductionType}
        deductionAmount={Number(manualDeduction || 0)}
        netAmount={netAmount}
        billingMethod={billingMethod}
        cashDenominations={cashDenominations}
        bankTransferAmount={bankTransferAmount}
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
  // Normalize: remove spaces, dashes, dots, parens
  const flat = text.replace(/[\s\-().+]/g, '');
  for (const [phone, account] of Object.entries(PHONE_ACCOUNT_MAP)) {
    // Match the 12-digit number directly or with leading +63 / 0 variants
    const local = '0' + phone.slice(2); // 09166319253
    if (flat.includes(phone) || flat.includes(local)) {
      return account;
    }
  }
  return null;
}

// ─── Real OCR Field Extraction Helpers ─────────────────────────────────────────
function extractFields(text) {
  const normalized = text
    .replace(/\r/g, '\n')
    .replace(/[|\\[\]{}]/g, ' ')
    .replace(/[''`]/g, '')
    .replace(/\u00a0/g, ' ');

  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  let amount = null;
  let reference = null;

  // Pattern for 13-digit reference numbers (specifically GCash format)
  const pull13 = (str) => {
    let m = str.replace(/\s/g, '').match(/\d{13}/);
    if (m) return m[0];
    const collapsed = str.replace(/(\d)\s+(\d)/g, '$1$2').replace(/(\d)\s+(\d)/g, '$1$2');
    m = collapsed.match(/\d{13}/);
    if (m) return m[0];
    return null;
  };

  const refLabelRe = /(?:ref(?:erence)?(?:\s*(?:no|num|number)\.?)?|trace\s*no|transaction\s*(?:ref|id|no))[:\s#.]*/i;

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

  // Amount extraction
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

  return { amount, reference, date: extractDate(lines), account_holder: detectAccountFromPhone(text) };
}

function extractDate(lines) {
  const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const MONTH_SHORT = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const toMonthName = (idx) => ['January','February','March','April','May','June','July','August','September','October','November','December'][idx];
  const fmt = (month, day, year) => `${toMonthName(month)} ${parseInt(day)}, ${year}`;

  for (const line of lines) {
    for (let mi = 0; mi < MONTHS.length; mi++) {
      const re = new RegExp(`\\b(?:${MONTHS[mi]}|${MONTH_SHORT[mi]})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'i');
      const m = line.match(re);
      if (m) return fmt(mi, m[1], m[2]);
    }
    { const m = line.match(/\b(0?[1-9]|1[0-2])[\/\-\.](0?[1-9]|[12]\d|3[01])[\/\-\.](\d{4})\b/); if (m) return fmt(parseInt(m[1])-1, m[2], m[3]); }
  }
  return null;
}

export default CropWizard;
