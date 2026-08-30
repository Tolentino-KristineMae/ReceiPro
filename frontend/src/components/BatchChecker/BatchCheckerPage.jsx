import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CropWizard from './CropWizardModal';
import BatchDashboard from './BatchDashboard';
import BatchDetail from './BatchDetail';
import { BATCH_STYLES } from './BatchStyles';
import { getApiUrl } from '../../apiConfig';
import { parseOCRData } from './BatchUtils';
 
// ─── Enhanced BatchCheckerPage ─────────────────────────────────────────────────
export default function BatchCheckerPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [nextBatchNumber, setNextBatchNumber] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [showProcessor, setShowProcessor] = useState(false);
  const [processorPhase, setProcessorPhase] = useState('categorize');
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [wizardReceipts, setWizardReceipts] = useState([]);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const pollInFlightRef = useRef(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = BATCH_STYLES;
    document.head.appendChild(style);
    
    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, []);

  useEffect(() => { fetchBatches(); }, []);

  // Poll only while uploads/OCR/checks are actively running — not on every batch detail view.
  useEffect(() => {
    const hasActiveBatches = batches.some(b =>
      b.checker_status === 'processing' ||
      b.receipts?.some(r => r.ocr_status === 'processing' || r.ocr_status === 'uploading')
    );
    const shouldPoll = isRunningCheck || isCreating || hasActiveBatches;
    if (!shouldPoll) return undefined;

    const controller = new AbortController();

    const poll = async () => {
      if (pollInFlightRef.current) return;
      // Skip silently when offline — browser will resume when back online
      if (!navigator.onLine) return;
      pollInFlightRef.current = true;
      try {
        if (batchId) {
          const res = await fetch(getApiUrl(`/api/batches/${batchId}?t=${Date.now()}`), {
            cache: 'no-store',
            signal: controller.signal,
          });
          if (!res.ok || res.status === 429) return;
          const batch = await res.json();
          setBatches(prev => prev.map(b => b.id === batch.id ? batch : b));
          setSelectedBatch(batch);
        } else {
          await fetchBatches(true);
        }
      } catch (e) {
        // Ignore abort errors and network errors (offline) — they are expected
        if (e.name !== 'AbortError' && navigator.onLine) {
          console.warn('[BatchChecker] Poll skipped:', e.message);
        }
      } finally {
        pollInFlightRef.current = false;
      }
    };

    const interval = setInterval(poll, 8000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [batchId, isRunningCheck, isCreating, batches]);

  const fetchBatches = async (silent = false) => {
    try {
      // Load first 20 batches (pagination)
      const res = await fetch(getApiUrl(`/api/batches?per_page=20&t=${Date.now()}`), { cache: 'no-store' });
      if (res.status === 429) return;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBatches(Array.isArray(data?.batches) ? data.batches : (Array.isArray(data) ? data : []));
      if (data?.dashboard) setDashboard(data.dashboard);
      if (data?.next_batch_number) setNextBatchNumber(data.next_batch_number);
      // Store pagination info if needed for "Load More" feature later
      if (data?.pagination) {
        console.log(`Loaded ${data.pagination.to} of ${data.pagination.total} batches`);
      }
    } catch (e) {
      if (navigator.onLine) console.warn('[BatchChecker] fetchBatches:', e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchSelectedBatch = async (id, receiptFilter = filter) => {
    const query = receiptFilter && receiptFilter !== 'all' ? `?filter=${receiptFilter}&t=${Date.now()}` : `?t=${Date.now()}`;
    const res = await fetch(getApiUrl(`/api/batches/${id}${query}`), { cache: 'no-store' });
    if (res.status === 429) throw new Error('Too many requests — please wait a moment');
    if (!res.ok) throw new Error(`Failed to fetch batch ${id}`);
    return res.json();
  };

  // Only fetch the selected batch when batchId or filter changes — NOT on every
  // batches update (that would overwrite optimistic upload state mid-flight).
  useEffect(() => {
    if (!batchId) {
      setSelectedBatch(null);
      setLoadingBatch(false);
      return;
    }
    setLoadingBatch(true);
    fetchSelectedBatch(batchId, filter)
      .then(setSelectedBatch)
      .catch(console.error)
      .finally(() => setLoadingBatch(false));
  }, [batchId, filter]);

  const handleCreateAndUpload = async (e, batchName) => {
    e.preventDefault();
    const files = fileInputRef.current?.files;
    if (!files?.length) return;
    
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/api/batches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: batchName }), 
      });
      
      if (res.status === 422) {
        const data = await res.json();
        setError(data.message || 'A batch with this number already exists.');
        setIsCreating(false);
        return;
      }

      if (res.ok) {
        const newBatch = await res.json();
        setBatches(prev => [newBatch, ...prev]);
        setSelectedBatch(newBatch);

        // Upload files in chunks to avoid server-side max_file_uploads limits (often 20)
        const fileArray = Array.from(files);
        const chunkSize = 15; // Safe margin below 20
        let finalUpdatedBatch = newBatch;

        for (let i = 0; i < fileArray.length; i += chunkSize) {
          const chunk = fileArray.slice(i, i + chunkSize);
          const formData = new FormData();
          chunk.forEach(file => formData.append('receipts[]', file));
          formData.append('batch_id', newBatch.id);
          
          console.log(`Uploading files ${i + 1} to ${Math.min(i + chunkSize, fileArray.length)} of ${fileArray.length}...`);
          
          const uploadRes = await fetch(getApiUrl('/api/receipts/upload'), {
            method: 'POST',
            body: formData,
          });
          
          if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            setError(errorData.message || `Failed to upload chunk starting at ${i + 1}.`);
            setIsCreating(false);
            return;
          }

          finalUpdatedBatch = await uploadRes.json();
          // Update state after each chunk so the user sees progress
          setBatches(prev => prev.map(b => b.id === finalUpdatedBatch.id ? finalUpdatedBatch : b));
          setSelectedBatch(finalUpdatedBatch);
        }

        console.log(`Upload complete. Batch now has ${finalUpdatedBatch.receipts?.length || 0} receipts.`);
        
        setFileCount(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          if (fileInputRef.current.form) {
            fileInputRef.current.form.reset();
          }
        }
        
        navigate(`/batch/${finalUpdatedBatch.id}`);
      }
    } catch (e) { 
      console.error(e);
      setError('An unexpected error occurred. Please try again.');
    } finally { 
      setIsCreating(false); 
    }
  };

  const handleUpdateBatchName = async (id, newName) => {
    setError(null);
    try {
      const res = await fetch(getApiUrl(`/api/batches/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (res.status === 422) {
        const data = await res.json();
        setError(data.message || 'A batch with this number already exists.');
        return;
      }

      if (res.ok) {
        const updatedBatch = await res.json();
        setBatches(prev => prev.map(b => b.id === updatedBatch.id ? updatedBatch : b));
        if (selectedBatch?.id === updatedBatch.id) {
          setSelectedBatch(updatedBatch);
        }
      }
    } catch (e) {
      console.error('Failed to update batch name:', e);
      setError('Failed to update batch name.');
    }
  };

  const handleRunExtraction = async () => {
    if (!selectedBatch) return;
    openProcessor('ocr');
  };

  const handleRunFinalCheck = async () => {
    if (!selectedBatch) return;
    openProcessor('verify');
  };

  const handleDeleteBatch = async (e, id, skipConfirm = false) => {
    e.stopPropagation();
    if (!skipConfirm && !window.confirm('Delete this batch?')) return;
    try {
      const response = await fetch(getApiUrl(`/api/batches/${id}`), { method: 'DELETE' });
      const result = await response.json();
      
      if (response.ok) {
        setBatches(prev => prev.filter(b => b.id !== id));
        if (String(selectedBatch?.id) === String(id)) {
          navigate('/batch');
          setSelectedBatch(null);
        }
      } else {
        throw new Error(result.message || 'Failed to delete batch');
      }
    } catch (error) {
      console.error('Delete batch error:', error);
      alert(`Failed to delete batch: ${error.message}`);
    }
  };

  const handleDeleteReceipt = async (receiptId) => {
    try {
      const res = await fetch(getApiUrl(`/api/receipts/${receiptId}`), { method: 'DELETE' });
      if (res.ok) {
        // Update both selectedBatch and batches list directly — no full refetch needed
        setSelectedBatch(prev => {
          if (!prev) return prev;
          const updated = { ...prev, receipts: (prev.receipts || []).filter(r => r.id !== receiptId) };
          setBatches(bs => bs.map(b => b.id === updated.id ? updated : b));
          return updated;
        });
      }
    } catch (e) {
      console.error('Failed to delete receipt:', e);
      throw e;
    }
  };

  const handleResetBatch = async () => {
    if (!selectedBatch) return;
    if (!window.confirm('Reset this batch? This will unlink all claimed transactions, clear all receipt OCR data, and reset the batch back to its initial state. This cannot be undone.')) return;

    try {
      const res = await fetch(getApiUrl(`/api/batches/${selectedBatch.id}/reset`), { method: 'POST' });
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      setShowProcessor(false);
      setWizardReceipts([]);
      await fetchBatches(true);
      const batch = await fetchSelectedBatch(selectedBatch.id, filter);
      setSelectedBatch(batch);
      setBatches(prev => prev.map(b => b.id === batch.id ? batch : b));
    } catch (e) {
      alert(`Reset failed: ${e.message}`);
    }
  };

  const handleAddUpload = async (files) => {
    if (!selectedBatch || !files.length) return;
    
    setIsCreating(true);
    // Snapshot existing receipt IDs before upload so we can isolate the new ones
    const existingIds = new Set((selectedBatch.receipts || []).map(r => r.id));

    try {
      const fileArray = Array.from(files);
      const chunkSize = 15;
      let finalBatch = selectedBatch;
      
      for (let i = 0; i < fileArray.length; i += chunkSize) {
        const chunk = fileArray.slice(i, i + chunkSize);
        const formData = new FormData();
        chunk.forEach(file => formData.append('receipts[]', file));
        formData.append('batch_id', selectedBatch.id);
        
        const uploadRes = await fetch(getApiUrl('/api/receipts/upload'), {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          finalBatch = await uploadRes.json();
          // Update both selectedBatch and the batches list immediately so the
          // receipt grid re-renders in real time after each chunk
          setSelectedBatch(finalBatch);
          setBatches(prev => prev.map(b => b.id === finalBatch.id ? finalBatch : b));
        }
      }

      // Open wizard with ONLY the newly added (unsorted) receipts
      const newReceipts = (finalBatch.receipts || []).filter(r => !existingIds.has(r.id));
      if (newReceipts.length > 0) {
        const sorted = [...newReceipts].sort((a, b) => {
          const order = { unsorted: 1, gcash: 2, others: 3 };
          return (order[a.category || 'unsorted'] || 99) - (order[b.category || 'unsorted'] || 99);
        });
        setWizardReceipts(sorted);
        setProcessorPhase('categorize');
        setShowProcessor(true);
      }
    } catch (e) { 
      console.error('Failed to upload receipts:', e); 
    } finally { 
      setIsCreating(false); 
    }
  };

  const filteredReceipts = selectedBatch?.receipts || [];

  if (loading) {
    return (
      <div className="bcp-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-modern" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  // Still fetching the specific batch — show spinner, not "not found"
  if (batchId && loadingBatch && !selectedBatch) {
    return (
      <div className="bcp-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-modern" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  // Handle batch not found case — only after fetch is complete
  if (batchId && !loadingBatch && !selectedBatch && batches.length > 0) {
    return (
      <div className="bcp-root">
        <div className="glass-card empty-box">
          <div className="empty-icon-lg">⚠️</div>
          <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Batch Not Found</div>
          <div style={{ opacity: 0.7, marginBottom: '1.5rem' }}>
            The batch you are looking for does not exist or has been deleted.
          </div>
          <button className="btn-primary-modern" style={{ width: 'auto' }} onClick={() => navigate('/batch')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const openProcessor = (phase = 'categorize') => {
    if (!selectedBatch) return;

    const allReceipts = selectedBatch.receipts || [];

    let receiptsForWizard;

    if (phase === 'categorize') {
      // Only pass receipts that are still unsorted
      const unsorted = allReceipts.filter(r => !r.category || r.category === 'unsorted');
      // If nothing to sort, fall back to all (so the user can still review)
      receiptsForWizard = unsorted.length > 0 ? unsorted : allReceipts;
    } else if (phase === 'crop') {
      // Only pass receipts that still need crop/input work
      const needsWork = allReceipts.filter(r => {
        if (!r.category || r.category === 'unsorted') return false; // not sorted yet
        if (r.category === 'gcash') return !r.cropped_image;
        if (r.category === 'others') {
          const ocr = r.ocr_data
            ? (typeof r.ocr_data === 'string' ? (() => { try { return JSON.parse(r.ocr_data); } catch { return {}; } })() : r.ocr_data)
            : null;
          return !ocr?.manual;
        }
        return false;
      });
      receiptsForWizard = needsWork.length > 0 ? needsWork : allReceipts.filter(r => r.category && r.category !== 'unsorted');
    } else {
      // For ocr / verify / finalize / summary / billing — pass ALL receipts
      // so the wizard has the full picture for counts and processing
      receiptsForWizard = [...allReceipts];
    }

    // Sort: gcash first, then others, then unsorted
    const sorted = [...receiptsForWizard].sort((a, b) => {
      const order = { gcash: 1, others: 2, unsorted: 3 };
      const catA = a.category || 'unsorted';
      const catB = b.category || 'unsorted';
      return (order[catA] || 99) - (order[catB] || 99);
    });

    setWizardReceipts(sorted);
    setProcessorPhase(phase);
    setShowProcessor(true);
  };

  return (
    <div className="bcp-root">
      {!batchId ? (
        <BatchDashboard
          batches={batches}
          dashboard={dashboard}
          nextBatchNumber={nextBatchNumber}
          fileCount={fileCount}
          setFileCount={setFileCount}
          fileInputRef={fileInputRef}
          isCreating={isCreating}
          handleDeleteBatch={handleDeleteBatch}
          handleCreateAndUpload={handleCreateAndUpload}
          handleUpdateBatchName={handleUpdateBatchName}
          error={error}
          navigate={navigate}
          fetchBatches={fetchBatches}
        />
      ) : (
        <BatchDetail
          batch={selectedBatch}
          filter={filter}
          setFilter={setFilter}
          filteredReceipts={filteredReceipts}
          handleDeleteBatch={handleDeleteBatch}
          handleDeleteReceipt={handleDeleteReceipt}
          handleResetBatch={handleResetBatch}
          handleAddUpload={handleAddUpload}
          handleRunExtraction={handleRunExtraction}
          handleRunFinalCheck={handleRunFinalCheck}
          isRunningCheck={isRunningCheck}
          setShowProcessor={openProcessor}
          navigate={navigate}
        />
      )}

      {showProcessor && selectedBatch && (
        <CropWizard
          batchId={selectedBatch.id}
          initialPhase={processorPhase}
          receipts={wizardReceipts}
          onSaved={async () => {
            // Refresh the background batch data (for the detail page stats/display)
            // but do NOT replace wizardReceipts — the wizard was opened with a specific
            // filtered set (e.g. only new unsorted receipts) and must stay that way.
            await fetchBatches(true);
            if (batchId) {
              const batch = await fetchSelectedBatch(batchId, filter);
              setSelectedBatch(batch);
            }
          }}
          onClose={async () => {
            setShowProcessor(false);
            setWizardReceipts([]);
            await fetchBatches(false);
            if (batchId) {
              const batch = await fetchSelectedBatch(batchId, filter);
              setSelectedBatch(batch);
            }
          }}
          onDone={async () => {
            setShowProcessor(false);
            setWizardReceipts([]);
            await fetchBatches(false);
            if (batchId) {
              const batch = await fetchSelectedBatch(batchId, filter);
              setSelectedBatch(batch);
            }
          }}
        />
      )}
    </div>
  );
}
