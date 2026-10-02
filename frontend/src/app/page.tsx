'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AudioUploader from '@/components/AudioUploader';
import NoteCard from '@/components/NoteCard';
import { fetchNotes, AudioNote } from '@/lib/api';

export default function DashboardPage() {
  const [notes, setNotes] = useState<AudioNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const loadNotes = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchNotes();
      setNotes(data);
      setError(null);
    } catch {
      setError('Backend unavailable. Start the API at http://localhost:8000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchNotes()
      .then((data) => {
        if (!cancelled) {
          setNotes(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Backend unavailable. Start the API at http://localhost:8000.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-polling for active background processing tasks
  useEffect(() => {
    const hasActiveJob = notes.some(
      (n) => ['UPLOADED', 'PROCESSING', 'TRANSCRIBING', 'SUMMARIZING'].includes(n.status)
    );

    if (hasActiveJob) {
      const interval = setInterval(() => {
        loadNotes(false);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [notes, loadNotes]);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.transcript && note.transcript.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && note.status === filterStatus;
  });

  const totalNotes = notes.length;
  const completedCount = notes.filter((n) => n.status === 'COMPLETED').length;
  const activeCount = notes.filter((n) => ['PROCESSING', 'TRANSCRIBING', 'SUMMARIZING'].includes(n.status)).length;
  const totalDuration = notes.reduce((sum, n) => sum + (n.duration || 0), 0);

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>Audio notes</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Upload recordings and review their transcripts.
          </p>
        </div>

        <div className="dashboard-stats">
          <div className="dashboard-stat"><strong>{totalNotes}</strong><span>Recordings</span></div>
          <div className="dashboard-stat"><strong>{completedCount}</strong><span>Completed</span></div>
          <div className="dashboard-stat"><strong>{activeCount}</strong><span>In progress</span></div>
          <div className="dashboard-stat"><strong>{(totalDuration / 60).toFixed(1)} min</strong><span>Audio time</span></div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button className="btn-secondary" onClick={() => loadNotes(true)}>Retry</button>
        </div>
      )}

      <AudioUploader onUploadSuccess={() => loadNotes(false)} />

      <div>
        <div className="recordings-header">
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>Recordings</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search recordings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '220px' }}
            />

            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="ALL" style={{ background: '#121420' }}>All Status</option>
              <option value="COMPLETED" style={{ background: '#121420' }}>Completed</option>
              <option value="PROCESSING" style={{ background: '#121420' }}>Processing</option>
              <option value="FAILED" style={{ background: '#121420' }}>Failed</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="empty-state">
            Loading recordings...
          </div>
        )}

        {!loading && filteredNotes.length === 0 && (
          <div className="empty-state">
            <h3>No recordings found</h3>
            <p>
              {searchQuery ? 'Try a different search.' : 'Upload an audio file to get started.'}
            </p>
          </div>
        )}

        {!loading && filteredNotes.length > 0 && (
          <div className="recordings-grid">
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} onRefreshNeeded={() => loadNotes(false)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
