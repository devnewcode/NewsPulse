'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, Calendar, Clock, ArrowRight } from 'lucide-react';
import { fetchApi } from '../lib/api';

export default function ClusterDrawer({ clusterId, onClose }) {
  const [cluster, setCluster] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clusterId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchApi(`/clusters/${clusterId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load cluster details');
        return res.json();
      })
      .then((json) => {
        if (isMounted) {
          setCluster(json.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clusterId]);

  if (!clusterId) return null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceClass = (src) => {
    if (!src) return '';
    const s = src.toLowerCase();
    if (s.includes('bbc')) return 'bbc';
    if (s.includes('npr')) return 'npr';
    if (s.includes('guardian')) return 'guardian';
    return '';
  };

  const cleanSummary = (text) => {
    if (!text) return '';
    return text.replace(/<[^>]+>/g, '').replace(/Continue reading\.\.\./g, '').trim();
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Topic Cluster Detail
            </span>
            <h2 className="drawer-title">
              {cluster?.label || 'Loading Cluster...'}
            </h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={22} />
          </button>
        </div>

        {loading && (
          <div className="empty-state">
            <p>Loading chronological articles...</p>
          </div>
        )}

        {error && (
          <div className="empty-state" style={{ color: '#f87171' }}>
            <p>{error}</p>
          </div>
        )}

        {!loading && cluster && (
          <>
            <div className="drawer-meta-bar">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  <span>
                    {formatDate(cluster.startTime)} <ArrowRight size={12} style={{ display: 'inline' }} /> {formatDate(cluster.endTime)}
                  </span>
                </div>
                <span className="badge-count">
                  {cluster.articles?.length || 0} Articles
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coverage by:</span>
                <div className="source-badges">
                  {cluster.sources?.map((s) => (
                    <span key={s} className={`source-tag ${getSourceClass(s)}`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="drawer-articles-list">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Timeline of Articles (Earliest to Latest)
              </h3>

              {cluster.articles?.map((article, idx) => (
                <div key={article.url || idx} className="article-item-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <span className={`source-tag ${getSourceClass(article.source)}`}>
                      {article.source}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {formatDate(article.publishedAt)}
                    </span>
                  </div>

                  <h4 className="article-item-title">{article.title}</h4>

                  {article.summary && (
                    <p className="article-item-summary">{cleanSummary(article.summary)}</p>
                  )}

                  <div className="article-item-footer">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="article-link-btn"
                    >
                      Read full article <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
