'use client';

import { Filter } from 'lucide-react';

const SOURCES = [
  { label: 'All Outlets', value: '' },
  { label: 'BBC News', value: 'BBC News' },
  { label: 'NPR News', value: 'NPR News' },
  { label: 'The Guardian', value: 'The Guardian' },
];

export default function SourceFilter({ selectedSource, onSelectSource }) {
  return (
    <div className="filter-group">
      <span className="filter-label">
        <Filter size={15} /> Filter Source:
      </span>
      {SOURCES.map((source) => (
        <button
          key={source.label}
          onClick={() => onSelectSource(source.value)}
          className={`pill-btn ${selectedSource === source.value ? 'active' : ''}`}
        >
          {source.label}
        </button>
      ))}
    </div>
  );
}
