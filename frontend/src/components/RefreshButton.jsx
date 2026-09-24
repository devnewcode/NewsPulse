'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { fetchApi } from '../lib/api';

export default function RefreshButton({ onComplete }) {
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRefresh = async () => {
    if (loading) return;

    setLoading(true);
    setStatusText('Starting scraper...');
    setIsSuccess(false);

    try {
      const res = await fetchApi('/ingest/trigger', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.jobId) {
        throw new Error(data.message || 'Failed to trigger ingestion');
      }

      const jobId = data.jobId;
      setStatusText('Scraping & clustering...');

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetchApi(`/ingest/status/${jobId}`);
          const statusData = await statusRes.json();

          if (statusData.data?.status === 'completed') {
            clearInterval(pollInterval);
            setLoading(false);
            setIsSuccess(true);
            setStatusText('Updated!');

            if (onComplete) onComplete();

            setTimeout(() => {
              setIsSuccess(false);
              setStatusText('');
            }, 3000);
          } else if (statusData.data?.status === 'failed') {
            clearInterval(pollInterval);
            setLoading(false);
            setStatusText('Failed');
          }
        } catch (pollErr) {
          console.error(pollErr);
        }
      }, 2000);
    } catch (err) {
      setLoading(false);
      setStatusText('Error');
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="refresh-btn"
      title="Fetch latest articles and recalculate clusters"
    >
      {loading ? (
        <>
          <RefreshCw size={16} className="animate-spin" />
          <span>{statusText || 'Scraping...'}</span>
        </>
      ) : isSuccess ? (
        <>
          <CheckCircle2 size={16} color="#86efac" />
          <span>Updated!</span>
        </>
      ) : (
        <>
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </>
      )}
    </button>
  );
}
