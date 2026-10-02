'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import Link from 'next/link';
import { fetchNoteById, retryNote, deleteNote, AudioNote } from '@/lib/api';
import AudioPlayer from '@/components/AudioPlayer';
import TranscriptView from '@/components/TranscriptView';
import SummaryView from '@/components/SummaryView';
import { useRouter } from 'next/navigation';

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const noteId = resolvedParams.id;
  const router = useRouter();

  const [note, setNote] = useState<AudioNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');
  const isProcessing = note !== null && ['UPLOADED', 'PROCESSING', 'TRANSCRIBING', 'SUMMARIZING'].includes(note.status);

  const loadNote = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchNoteById(noteId);
      setNote(data);
      setError(null);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to load recording.');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    let cancelled = false;

    fetchNoteById(noteId)
      .then((data) => {
        if (!cancelled) {
          setNote(data);
          setError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : 'Failed to load recording.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [noteId]);

  // Poll for background status updates if note is in progress
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        void loadNote(false);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isProcessing, loadNote]);

  const handleRetry = async () => {
    try {
      await retryNote(noteId);
      loadNote(false);
    } catch {
      alert('Failed to retry note processing');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this audio note?')) {
      try {
        await deleteNote(noteId);
        router.push('/');
      } catch {
        alert('Failed to delete audio note');
      }
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading recording...
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '8px' }}>Recording unavailable</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{error || 'Audio note details could not be retrieved.'}</p>
        <Link href="/" className="btn-primary">Return to notes</Link>
      </div>
    );
  }

  const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Back Button & Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          Back to notes
        </Link>

        <div style={{ display: 'flex', gap: '10px' }}>
          {note.status === 'FAILED' && (
            <button onClick={handleRetry} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
              Retry
            </button>
          )}
          <button onClick={handleDelete} className="btn-danger" style={{ fontSize: '0.85rem' }}>
            Delete
          </button>
        </div>
      </div>

      {/* Note Header Card */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>{note.title}</h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>Recorded {formattedDate}</span>
              {note.duration > 0 && <span>{note.duration.toFixed(1)} sec</span>}
              <span>Language: {note.language_code === 'indic-auto' ? 'Auto-detected' : note.language_code}</span>
              <span>{(note.file_size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {note.status === 'COMPLETED' && <span className="badge badge-completed">Completed</span>}
            {note.status === 'PROCESSING' && <span className="badge badge-processing">Processing · {note.progress}%</span>}
            {note.status === 'TRANSCRIBING' && <span className="badge badge-transcribing">Transcribing · {note.progress}%</span>}
            {note.status === 'SUMMARIZING' && <span className="badge badge-summarizing">Generating summary · {note.progress}%</span>}
            {note.status === 'FAILED' && <span className="badge badge-failed">Failed</span>}
          </div>
        </div>

        {note.status === 'COMPLETED' && note.status_message && (
          <div role="status" style={{
            background: '#f7f1e7',
            border: '1px solid #e5d6bd',
            color: '#785a2c',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            marginTop: '16px'
          }}>
            {note.status_message}
          </div>
        )}

        {/* Status Progress Bar for active processing */}
        {note.status !== 'COMPLETED' && note.status !== 'FAILED' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>{note.status_message || 'Processing audio...'}</span>
              <span>{note.progress}%</span>
            </div>
            <div className="progress-container">
              <div className="progress-fill" style={{ width: `${note.progress}%` }} />
            </div>
          </div>
        )}

        {/* Error alert banner */}
        {note.status === 'FAILED' && (
          <div style={{
            background: '#fff8f7',
            border: '1px solid #e8c9c5',
            color: '#8d3732',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <strong>Processing Failure:</strong> {note.error_message || 'An unexpected error occurred during transcription.'}
            </div>
            <button onClick={handleRetry} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              Retry Now
            </button>
          </div>
        )}
      </div>

      {/* Audio Player Component */}
      <AudioPlayer noteId={note.id} />

      {/* Content View Tabs (Summary & Transcript) */}
      <div>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('summary')}
            className="btn-secondary"
            style={{
              background: activeTab === 'summary' ? '#eaf1ed' : 'transparent',
              borderColor: activeTab === 'summary' ? 'var(--primary)' : 'var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              fontWeight: 600
            }}
          >
            Summary
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className="btn-secondary"
            style={{
              background: activeTab === 'transcript' ? '#eaf1ed' : 'transparent',
              borderColor: activeTab === 'transcript' ? 'var(--primary)' : 'var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              fontWeight: 600
            }}
          >
            Transcript
          </button>
        </div>

        {activeTab === 'summary' && (
          <SummaryView summary={note.summary || ''} />
        )}

        {activeTab === 'transcript' && (
          <TranscriptView transcript={note.transcript || ''} title={note.title} />
        )}
      </div>
    </div>
  );
}
