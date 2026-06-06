export const parseOCRData = (data) => {
  if (!data) return null;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const calculateBatchStats = (batch) => {
  if (!batch || !batch.receipts) {
    return {
      total: 0,
      unsorted: 0,
      needsCropInput: 0,
      readyForOcr: 0,
      ocrFinished: 0,
      verified: 0,
    };
  }

  const receipts = batch.receipts;
  
  const stats = {
    total: receipts.length,
    unsorted: receipts.filter(r => !r.category || r.category === 'unsorted').length,
    // How many still need cropping or manual input
    needsCropInput: receipts.filter(r => {
      if (!r.category || r.category === 'unsorted') return false;
      const ocr = parseOCRData(r.ocr_data);
      
      if (r.category === 'others') {
        // If it's manual, we check if manual flag is true AND amount/ref exist
        const isManualDone = ocr && ocr.manual === true && (ocr.amount || ocr.reference);
        return !isManualDone;
      }
      
      // GCash: Need a cropped image (check for path string or base64)
      const hasCrop = r.cropped_image && r.cropped_image.length > 5;
      return !hasCrop;
    }).length,
    // How many are ready for OCR (or have finished it)
    readyForOcr: receipts.filter(r => {
      const ocr = parseOCRData(r.ocr_data);
      const isOthersDone = r.category === 'others' && ocr && ocr.manual;
      const isGcashDone = r.category === 'gcash' && r.cropped_image && r.cropped_image.length > 5;
      return isOthersDone || isGcashDone;
    }).length,
    // How many have actually finished the OCR/Extraction phase
    ocrFinished: receipts.filter(r => {
      const ocr = parseOCRData(r.ocr_data);
      if (r.category === 'others' && ocr?.manual) return true;
      return r.ocr_status === 'completed' || r.ocr_status === 'processing' || (ocr && ocr.raw_text);
    }).length,
    // How many are verified (Stage 5)
    verified: receipts.filter(r => {
      const status = r.match_status?.toLowerCase();
      return status === 'verified' || status === 'flagged' || status === 'not_found';
    }).length || 0,
  };

  return stats;
};

export const getOverallProgress = (batch) => {
  if (!batch || !batch.receipts || batch.receipts.length === 0) return 0;
  
  const stats = calculateBatchStats(batch);
  const total = stats.total;
  
  let totalProgress = 0;
  const stageWeight = 100 / 8; // Each stage is 12.5%
  
  // Stage 1: Uploading (Always done if we have the batch)
  totalProgress += stageWeight;
  
  // Stage 2: Sorting
  totalProgress += ((total - stats.unsorted) / total) * stageWeight;
  
  // Stage 3: Crop & Input
  totalProgress += ((total - stats.needsCropInput) / total) * stageWeight;
  
  // Stage 4: Extraction
  totalProgress += (stats.ocrFinished / total) * stageWeight;
  
  // Stage 5: Run Check
  totalProgress += (stats.verified / total) * stageWeight;

  // Stage 6: Finalize
  if (batch.checker_status === 'finalized' || batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready') {
    totalProgress += stageWeight;
  }

  // Stage 7: Summary
  if (batch.checker_status === 'summarized' || batch.checker_status === 'billing_ready') {
    totalProgress += stageWeight;
  }

  // Stage 8: Billing
  if (batch.checker_status === 'billing_ready') {
    totalProgress += stageWeight;
  }

  return Math.round(totalProgress);
};
