import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CropWizard from './CropWizardModal';
import BatchDashboard from './BatchDashboard';
import BatchDetail from './BatchDetail';
import { BATCH_STYLES } from './BatchStyles';
import { getApiUrl } from '../../apiConfig';
 
// ─── Enhanced BatchCheckerPage ─────────────────────────────────────────────────
export default function BatchCheckerPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProcessor, setShowProcessor] = useState(false);
  const [processorPhase, setProcessorPhase] = useState('categorize');
  const [isCreating, setIsCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [filter, setFilter] = useState('all');
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [wizardReceipts, setWizardReceipts] = useState([]);

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
    if ((batchId || isRunningCheck || isCreating) && !isCreating) {
      // Only poll if not in the middle of creating/uploading
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
  }, [batchId, isRunningCheck, isCreating]);

  const fetchBatches = async (silent = false) => {
    try {
      const res = await fetch(getApiUrl(`/api/batches?t=${Date.now()}`), { cache: 'no-store' });
      const data = await res.json();
      setBatches(Array.isArray(data) ? data : []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      if (!silent) setLoading(false); 
    }
  };

  useEffect(() => {
    if (batches.length > 0 && batchId) {
      const batch = batches.find(b => String(b.id) === String(batchId));
      if (batch) {
        console.log(`Batch ${batchId} found with ${batch.receipts?.length || 0} receipts`);
        setSelectedBatch(batch);
      } else {
        // If batch not found in list, fetch it directly
        console.log(`Batch ${batchId} not in list, fetching directly...`);
        fetch(getApiUrl(`/api/batches/${batchId}?t=${Date.now()}`), { cache: 'no-store' })
          .then(r => r.json())
          .then(batch => {
            console.log(`Fetched batch ${batchId} with ${batch.receipts?.length || 0} receipts`);
            setSelectedBatch(batch);
          })
          .catch(console.error);
      }
    } else if (!batchId) {
      setSelectedBatch(null);
    }
  }, [batches, batchId]);

  const handleCreateAndUpload = async (e) => {
    e.preventDefault();
    const files = Array.from(fileInputRef.current?.files || []);
    if (!files.length) return;
    
    setIsCreating(true);
    setUploadProgress({ current: 0, total: files.length });
    
    try {
      const res = await fetch(getApiUrl('/api/batches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), 
      });
      
      if (res.ok) {
        const newBatch = await res.json();
        
        // Chunk uploads to bypass PHP's max_file_uploads (usually 20)
        const CHUNK_SIZE = 15;
        let latestBatchData = newBatch;

        for (let i = 0; i < files.length; i += CHUNK_SIZE) {
          const chunk = files.slice(i, i + CHUNK_SIZE);
          const formData = new FormData();
          chunk.forEach(file => formData.append('receipts[]', file));
          formData.append('batch_id', newBatch.id);
          
          const uploadRes = await fetch(getApiUrl('/api/receipts/upload'), {
            method: 'POST',
            body: formData,
          });
          
          if (uploadRes.ok) {
            latestBatchData = await uploadRes.json();
            setUploadProgress(prev => ({ ...prev, current: Math.min(prev.total, i + chunk.length) }));
            // Update batches list in real-time
            setBatches(prev => [latestBatchData, ...prev.filter(b => b.id !== latestBatchData.id)]);
            setSelectedBatch(latestBatchData);
          } else {
            console.error('Upload chunk failed');
            break;
          }
        }
        
        // Properly clear file input
        setFileCount(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          if (fileInputRef.current.form) fileInputRef.current.form.reset();
        }
        
        // Final state sync and navigation
        setBatches(prev => [latestBatchData, ...prev.filter(b => b.id !== latestBatchData.id)]);
        setSelectedBatch(latestBatchData);
        navigate(`/batch/${latestBatchData.id}`);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsCreating(false);
      setUploadProgress({ current: 0, total: 0 });
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
      const res = await fetch(getApiUrl(`/api/batches/${id}`), { method: 'DELETE' });
      if (res.ok) {
        // Re-fetch all batches to get the updated sequences from the server
        await fetchBatches(true);
        if (String(selectedBatch?.id) === String(id)) {
          navigate('/batch');
          setSelectedBatch(null);
        }
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
    
    const filesArray = Array.from(files);
    setIsCreating(true);
    setUploadProgress({ current: 0, total: filesArray.length });

    try {
      const CHUNK_SIZE = 15;
      for (let i = 0; i < filesArray.length; i += CHUNK_SIZE) {
        const chunk = filesArray.slice(i, i + CHUNK_SIZE);
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
          setUploadProgress(prev => ({ ...prev, current: Math.min(prev.total, i + chunk.length) }));
        }
      }
    } catch (e) { 
      console.error('Failed to upload receipts:', e); 
    } finally { 
      setIsCreating(false); 
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const filteredReceipts = selectedBatch?.receipts?.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'pending') return r.ocr_status === 'pending';
    if (filter === 'completed') return r.ocr_status === 'completed';
    if (filter === 'gcash') return r.category === 'gcash';
    if (filter === 'others') return r.category === 'others' || !r.category;
    return true;
  }) || [];

  const stats = {
    total: selectedBatch?.receipts?.length || 0,
    unsorted: selectedBatch?.receipts?.filter(r => !r.category || r.category === 'unsorted').length || 0,
    ready: selectedBatch?.receipts?.filter(r => r.category && r.category !== 'unsorted' && r.ocr_status === 'pending').length || 0,
    verified: selectedBatch?.receipts?.filter(r => r.ocr_status === 'completed').length || 0,
  };

  const progress = stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0;

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

  const parseOCRData = (data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="bcp-root">
      {!batchId ? (
        <BatchDashboard
          batches={batches}
          fileCount={fileCount}
          setFileCount={setFileCount}
          fileInputRef={fileInputRef}
          isCreating={isCreating}
          uploadProgress={uploadProgress}
          handleDeleteBatch={handleDeleteBatch}
          handleCreateAndUpload={handleCreateAndUpload}
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
          isCreating={isCreating}
          uploadProgress={uploadProgress}
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
            await fetchBatches();
          }}
          onDone={async () => {
            setShowProcessor(false);
            await fetchBatches();
          }}
        />
      )}
    </div>
  );
}
