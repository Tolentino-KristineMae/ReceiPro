import { useEffect, useState } from 'react';
import { getApiUrl } from '../apiConfig';
import { requestJson } from '../utils/requestJson';

export function useDashboardData(enabled) {
  const [receipts, setReceipts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activeBatchCount, setActiveBatchCount] = useState(null);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [receiptsError, setReceiptsError] = useState('');
  const [batchesError, setBatchesError] = useState('');

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight || controller.signal.aborted) return;
      clearTimeout(timer);
      if (document.hidden || !navigator.onLine) {
        timer = setTimeout(refresh, 10000);
        return;
      }
      inFlight = true;
      await Promise.all([
        requestJson(getApiUrl('/api/receipts?view=activity'), { signal: controller.signal, cache: 'no-store' })
          .then(data => {
            if (controller.signal.aborted) return;
            setReceipts(Array.isArray(data) ? data : data.data ?? []);
            setReceiptsError('');
          })
          .catch(() => { if (!controller.signal.aborted) setReceiptsError('Unable to load receipts. Please check your connection.'); })
          .finally(() => { if (!controller.signal.aborted) setReceiptsLoading(false); }),
        requestJson(getApiUrl('/api/batches'), { signal: controller.signal, cache: 'no-store' })
          .then(data => {
            if (controller.signal.aborted) return;
            setBatches(Array.isArray(data?.batches) ? data.batches : Array.isArray(data) ? data : []);
            setActiveBatchCount(data?.dashboard?.active_batches ?? null);
            setBatchesError('');
          })
          .catch(() => { if (!controller.signal.aborted) setBatchesError('Unable to load batches. Please check your connection.'); })
          .finally(() => { if (!controller.signal.aborted) setBatchesLoading(false); }),
      ]);
      inFlight = false;
      if (!controller.signal.aborted) timer = setTimeout(refresh, 10000);
    };
    const resume = () => { if (!document.hidden && navigator.onLine) refresh(); };
    refresh();
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    return () => {
      clearTimeout(timer);
      controller.abort();
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
    };
  }, [enabled]);

  return { receipts, setReceipts, batches, activeBatchCount, receiptsLoading, batchesLoading, receiptsError, batchesError };
}
