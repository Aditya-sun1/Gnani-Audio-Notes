'use client';

import React, { useState } from 'react';

interface TranscriptViewProps {
  transcript: string;
  title: string;
}

export default function TranscriptView({ transcript, title }: TranscriptViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const words = transcript ? transcript.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.ceil(words / 200);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\.[^/.]+$/, "")}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const highlightMatches = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{ backgroundColor: '#f1dfba', color: 'var(--text-main)', borderRadius: '2px', padding: '0 2px' }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Transcript</h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', gap: '12px' }}>
            <span>{words} words</span>
            <span>~{readTimeMin} min read</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={handleCopy} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
            {copied ? 'Copied' : 'Copy text'}
          </button>
          <button onClick={handleDownload} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
            Download text
          </button>
        </div>
      </div>

      {/* Search Bar inside Transcript */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          className="input-field"
          placeholder="Search transcript"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
        />
      </div>

      {/* Transcript Text Container */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        lineHeight: 1.7,
        fontSize: '0.96rem',
        color: '#e5e7eb',
        maxHeight: '450px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap'
      }}>
        {transcript ? (
          highlightMatches(transcript, searchQuery)
        ) : (
          <em style={{ color: 'var(--text-dim)' }}>No transcript available for this audio file.</em>
        )}
      </div>
    </div>
  );
}
