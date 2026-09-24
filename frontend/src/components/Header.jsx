'use client';

import { Activity, Clock } from 'lucide-react';
import RefreshButton from './RefreshButton';

export default function Header({ totalClusters, onRefreshSuccess }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon-box">
          <Activity size={24} color="#ffffff" />
        </div>
        <div>
          <h1 className="brand-title">News Pulse</h1>
          <p className="brand-subtitle">
            Topic-Clustered News Timeline • BBC, NPR & The Guardian
          </p>
        </div>
      </div>

      <div className="header-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <strong>{totalClusters}</strong> Topics Active
          </span>
        </div>
        <RefreshButton onComplete={onRefreshSuccess} />
      </div>
    </header>
  );
}
