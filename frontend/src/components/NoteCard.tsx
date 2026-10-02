'use client';

import React from 'react';
import Link from 'next/link';
import { AudioNote, deleteNote, retryNote } from '@/lib/api';

interface NoteCardProps {
  note: AudioNote;
  onRefreshNeeded: () => void;
}

export default function NoteCard({ note, onRefreshNeeded }: NoteCardProps) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Delete "${note.title}"?`)) {
      try {
        await deleteNote(note.id);
        onRefreshNeeded();
      } catch {
        alert('Failed to delete note');
      }
    }
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await retryNote(note.id);
      onRefreshNeeded();
    } catch {
      alert('Failed to retry note');
    }
  };

  const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getStatusBadge = () => {
    switch (note.status) {
      case 'COMPLETED':
        return <span className="badge badge-completed">Completed</span>;
      case 'PROCESSING':
        return <span className="badge badge-processing">Processing · {note.progress}%</span>;
      case 'TRANSCRIBING':
        return <span className="badge badge-transcribing">Transcribing · {note.progress}%</span>;
      case 'SUMMARIZING':
        return <span className="badge badge-summarizing">Generating summary · {note.progress}%</span>;
      case 'FAILED':
        return <span className="badge badge-failed">Failed</span>;
      default:
        return <span className="badge badge-processing">Queued</span>;
    }
  };

  return (
    <Link href={`/note/${note.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              {note.title}
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', gap: '12px' }}>
              <span>{formattedDate}</span>
              {note.duration > 0 && <span>{note.duration.toFixed(1)} sec</span>}
              <span>{note.language_code === 'indic-auto' ? 'Auto-detected' : note.language_code}</span>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Live Progress Bar for active jobs */}
        {note.status !== 'COMPLETED' && note.status !== 'FAILED' && (
          <div style={{ margin: '14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>{note.status_message || 'Processing audio...'}</span>
              <span>{note.progress}%</span>
            </div>
            <div className="progress-container">
              <div className="progress-fill" style={{ width: `${note.progress}%` }} />
            </div>
          </div>
        )}

        {/* Failed Error Banner */}
        {note.status === 'FAILED' && (
          <div className="alert alert-error" style={{ margin: '12px 0', fontSize: '0.82rem' }}>
            <strong>Error:</strong> {note.error_message || 'Audio processing encountered an issue.'}
          </div>
        )}

        {/* Preview of transcript or summary */}
        {note.status === 'COMPLETED' && (
          <p style={{
            fontSize: '0.86rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginBottom: '14px'
          }}>
            {note.transcript || 'No transcript available.'}
          </p>
        )}

        {/* Card Footer / Action controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--primary)', fontWeight: 600 }}>
            Open recording
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            {note.status === 'FAILED' && (
              <button 
                onClick={handleRetry} 
                className="btn-secondary" 
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                Retry
              </button>
            )}
            <button 
              onClick={handleDelete} 
              className="btn-danger" 
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
                Delete
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
