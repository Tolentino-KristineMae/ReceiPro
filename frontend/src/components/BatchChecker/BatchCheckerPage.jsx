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
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProcessor, setShowProcessor] = useState(false);
  const [processorPhase, setProcessorPhase] = useState('categorize');
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [wizardReceipts, setWizardReceipts] = useState([]);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = BATCH_STYLES;
    document.head.appendChild(style);
    
    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, []);

  useEffect(() => { fetchBatches(); }, []);

  // Polling for real-time updates when a batch is active or processing
  useEffect(() => {
    let interval;
    // Check if any batch is in an active state that needs polling
    const hasActiveBatches = batches.some(b => 
      b.checker_status === 'processing' || 
      b.receipts?.some(r => r.ocr_status === 'processing' || r.ocr_status === 'uploading')
    );

    if ((batchId || isRunningCheck || isCreating || hasActiveBatches) && !isCreating) {
      interval = setInterval(() => {
        if (!batchId) {
          // Dashboard view - fetch all batches
          fetchBatches(true);
        } else {
          // Batch detail view - fetch only this specific batch to avoid losing receipts
          fetch(getApiUrl(`/api/batches/${batchId}?t=${Date.now()}`), { cache: 'no-store' })
            .then(r => r.json())
            .then(batch => {
              setBatches(prev => prev.map(b => b.id === batch.id ? batch : b));
              setSelectedBatch(batch);
            })
            .catch(console.error);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [batchId, isRunningCheck, isCreating, batches.length]); // Use length as a simple trigger

  const fetchBatches = async (silent = false) => {
    try {
      const res = await fetch(getApiUrl(`/api/batches?t=${Date.now()}`), { cache: 'no-store' });
      const data = await res.json();
      setBatches(Array.isArray(data?.batches) ? data.batches : (Array.isArray(data) ? data : []));
      if (data?.dashboard) setDashboard(data.dashboard);
    } catch (e) { 
      console.error(e); 
    } finally { 
      if (!silent) setLoading(false); 
    }
  };

  const fetchSelectedBatch = async (id, receiptFilter = filter) => {
    const query = receiptFilter && receiptFilter !== 'all' ? `?filter=${receiptFilter}&t=${Date.now()}` : `?t=${Date.now()}`;
    const res = await fetch(getApiUrl(`/api/batches/${id}${query}`), { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch batch ${id}`);
    return res.json();
  };

  useEffect(() => {
    if (batches.length > 0 && batchId) {
      const batch = batches.find(b => String(b.id) === String(batchId));
      if (batch) {
        fetchSelectedBatch(batchId, filter)
          .then(setSelectedBatch)
          .catch(console.error);
      } else {
        fetchSelectedBatch(batchId, filter)
          .then(setSelectedBatch)
          .catch(console.error);
      }
    } else if (!batchId) {
      setSelectedBatch(null);
    }
  }, [batches, batchId, filter]);

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

  const handleDeleteBatch = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this batch?')) return;
    try {
      await fetch(getApiUrl(`/api/batches/${id}`), { method: 'DELETE' });
      setBatches(prev => prev.filter(b => b.id !== id));
      if (String(selectedBatch?.id) === String(id)) {
        navigate('/batch');
        setSelectedBatch(null);
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteReceipt = async (receiptId) => {
    try {
      const res = await fetch(getApiUrl(`/api/receipts/${receiptId}`), {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchBatches(true);
      }
    } catch (e) {
      console.error('Failed to delete receipt:', e);
      throw e;
    }
  };

  const handleAddUpload = async (files) => {
    if (!selectedBatch || !files.length) return;
    
    setIsCreating(true);
    try {
      const fileArray = Array.from(files);
      const chunkSize = 15;
      
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
          const updatedBatch = await uploadRes.json();
          setBatches(prev => prev.map(b => b.id === updatedBatch.id ? updatedBatch : b));
          setSelectedBatch(updatedBatch);
        }
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

  // Handle batch not found case
  if (batchId && !selectedBatch && batches.length > 0) {
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

    // Capture ALL receipts for the wizard session.
    // The Wizard will handle its own logic for which steps to show/skip,
    // but we need the full list for accurate counts and batch-wide processing.
    const allReceipts = [...(selectedBatch.receipts || [])].sort((a, b) => {
      const order = { 'gcash': 1, 'others': 2, 'unsorted': 3 };
      const catA = a.category || 'unsorted';
      const catB = b.category || 'unsorted';
      return (order[catA] || 99) - (order[catB] || 99);
    });

    setWizardReceipts(allReceipts);
    setProcessorPhase(phase);
    setShowProcessor(true);
  };

  return (
    <div className="bcp-root">
      {!batchId ? (
        <BatchDashboard
          batches={batches}
          dashboard={dashboard}
          fileCount={fileCount}
          setFileCount={setFileCount}
          fileInputRef={fileInputRef}
          isCreating={isCreating}
          handleDeleteBatch={handleDeleteBatch}
          handleCreateAndUpload={handleCreateAndUpload}
          handleUpdateBatchName={handleUpdateBatchName}
          error={error}
          navigate={navigate}
        />
      ) : (
        <BatchDetail
          batch={selectedBatch}
          filter={filter}
          setFilter={setFilter}
          filteredReceipts={filteredReceipts}
          handleDeleteBatch={handleDeleteBatch}
          handleDeleteReceipt={handleDeleteReceipt}
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
          onClose={async () => {
            setShowProcessor(false);
            // Force immediate batch refresh to sync progress
            await fetchBatches(false);
            if (batchId) {
              const batch = await fetchSelectedBatch(batchId, filter);
              setSelectedBatch(batch);
            }
          }}
          onDone={async () => {
            setShowProcessor(false);
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
