'use client';

import { useMemo } from 'react';
import { Layers } from 'lucide-react';

export default function Timeline({ clusters, onSelectCluster, selectedClusterId }) {
  const recentClusters = useMemo(() => {
    if (!clusters) return [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return clusters.filter((c) => new Date(c.startTime).getTime() >= sevenDaysAgo);
  }, [clusters]);

  const { minMs, timeSpanMs, timeTicks } = useMemo(() => {
    if (recentClusters.length === 0) {
      return { minMs: 0, timeSpanMs: 0, timeTicks: [] };
    }

    let min = Infinity;
    let max = -Infinity;

    recentClusters.forEach((c) => {
      const s = new Date(c.startTime).getTime();
      const e = new Date(c.endTime).getTime();
      if (s < min) min = s;
      if (e > max) max = e;
    });

    if (max - min < 8 * 3600 * 1000) {
      max = min + 8 * 3600 * 1000;
    }

    const span = max - min;
    const ticks = [];
    const tickCount = 4;

    for (let i = 0; i < tickCount; i++) {
      const t = new Date(min + (span / (tickCount - 1)) * i);
      ticks.push(
        t.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    }

    return { minMs: min, timeSpanMs: span, timeTicks: ticks };
  }, [recentClusters]);

  if (recentClusters.length === 0) {
    return null;
  }

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2 className="timeline-title">
          <Layers size={18} /> Topic Activity Timeline
        </h2>
        <span className="timeline-subtitle">
          Showing active time spans for current news stories
        </span>
      </div>

      <div className="timeline-layout">
        <div className="timeline-grid-header">
          <div className="timeline-col-topic">Topic & Sources</div>
          <div className="timeline-col-axis">
            {timeTicks.map((tick, i) => (
              <span key={i} className="time-tick">{tick}</span>
            ))}
          </div>
        </div>

        <div className="timeline-rows">
          {recentClusters.map((cluster) => {
            const startMs = new Date(cluster.startTime).getTime();
            const endMs = new Date(cluster.endTime).getTime();

            let leftPct = ((startMs - minMs) / timeSpanMs) * 100;
            let widthPct = Math.max(8, ((endMs - startMs) / timeSpanMs) * 100);

            if (leftPct + widthPct > 100) {
              leftPct = 100 - widthPct;
            }
            if (leftPct < 0) leftPct = 0;

            const isSelected = selectedClusterId === cluster.id;

            return (
              <div
                key={cluster.id}
                onClick={() => onSelectCluster(cluster.id)}
                className={`timeline-row ${isSelected ? 'selected' : ''}`}
              >
                <div className="timeline-topic-info">
                  <div className="timeline-topic-label" title={cluster.representativeHeadline || cluster.label}>
                    {cluster.representativeHeadline || cluster.label}
                  </div>
                  <div className="timeline-topic-meta">
                    <span className="badge-count">
                      {cluster.articleCount} {cluster.articleCount === 1 ? 'article' : 'articles'}
                    </span>
                    <span className="sources-text">
                      {cluster.sources.join(' • ')}
                    </span>
                  </div>
                </div>

                <div className="timeline-track">
                  <div
                    className="timeline-span-bar"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                    }}
                  >
                    <span>{cluster.durationHours}h active</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
