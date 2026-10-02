'use client';

import React, { useState } from 'react';

interface SummaryViewProps {
  summary: string;
}

export default function SummaryView({ summary }: SummaryViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert raw markdown-like summary into clean React elements
  const renderSummarySections = (text: string) => {
    if (!text) return <p style={{ color: 'var(--text-dim)' }}>No summary generated yet.</p>;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} style={{
            fontSize: '1.1rem',
            color: 'var(--accent-cyan)',
            marginTop: idx === 0 ? '0' : '20px',
            marginBottom: '10px',
            fontFamily: 'var(--font-heading)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {line.replace('### ', '')}
          </h4>
        );
      } else if (line.startsWith('- ')) {
        return (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '8px',
            paddingLeft: '6px',
            fontSize: '0.92rem',
            color: 'var(--text-main)',
            lineHeight: '1.5'
          }}>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>•</span>
            <span>{line.replace('- ', '')}</span>
          </div>
        );
      } else if (line.trim().length > 0) {
        return (
          <p key={idx} style={{
            fontSize: '0.94rem',
            color: 'var(--text-main)',
            lineHeight: '1.6',
            marginBottom: '12px'
          }}>
            {line}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Summary</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Generated from the transcript when configured
          </p>
        </div>

        <button onClick={handleCopy} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
          {copied ? 'Copied' : 'Copy summary'}
        </button>
      </div>

      <div style={{
        background: '#f8faf8',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '24px'
      }}>
        {renderSummarySections(summary)}
      </div>
    </div>
  );
}
