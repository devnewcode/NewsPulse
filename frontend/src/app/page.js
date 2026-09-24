'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import SourceFilter from '../components/SourceFilter';
import Timeline from '../components/Timeline';
import ClusterDrawer from '../components/ClusterDrawer';
import { fetchApi } from '../lib/api';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [clusters, setClusters] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeline = useCallback(async () => {
    try {
      const endpoint = selectedSource
        ? `/timeline?source=${encodeURIComponent(selectedSource)}`
        : `/timeline`;

      const res = await fetchApi(endpoint);
      if (!res.ok) {
        throw new Error(`Backend returned status ${res.status}`);
      }

      const json = await res.json();
      setClusters(json.data || []);
      setError(null);
    } catch (err) {
      setError(
        'Backend server is not running. Please open a terminal and run: cd backend && npm run dev'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedSource]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchTimeline();
    }, 45000);
    return () => clearInterval(timer);
  }, [fetchTimeline]);

  return (
    <main className="app-container">
      <Header
        totalClusters={clusters.length}
        onRefreshSuccess={fetchTimeline}
      />

      <div className="controls-bar">
        <SourceFilter
          selectedSource={selectedSource}
          onSelectSource={setSelectedSource}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Sparkles size={15} color="var(--accent-amber)" />
          <span>TF-IDF Clustered Stories</span>
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          <p>Loading news timeline...</p>
        </div>
      )}

      {error && !loading && (
        <div className="empty-state" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <h3 style={{ color: '#f87171', marginBottom: '8px' }}>Connection Notice</h3>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <Timeline
          clusters={clusters}
          selectedClusterId={selectedClusterId}
          onSelectCluster={(id) => setSelectedClusterId(id)}
        />
      )}

      <ClusterDrawer
        clusterId={selectedClusterId}
        onClose={() => setSelectedClusterId(null)}
      />
    </main>
  );
}
