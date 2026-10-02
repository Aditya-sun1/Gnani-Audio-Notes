'use client';

import React, { useState, useRef } from 'react';
import { uploadAudio, AudioNote } from '@/lib/api';

interface AudioUploaderProps {
  onUploadSuccess: (note: AudioNote) => void;
}

export default function AudioUploader({ onUploadSuccess }: AudioUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an audio file first.');
      return;
    }
    setIsUploading(true);
    setError(null);

    try {
      const note = await uploadAudio(file);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadSuccess(note);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload audio file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '4px' }}>Upload Audio Note</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Language is detected automatically. Summaries are available when Gemini is configured.
          </p>
        </div>

      </div>

      {/* Dropzone Area */}
      <div
        className={`upload-dropzone${dragOver ? ' upload-dropzone-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*,.wav,.mp3,.ogg,.m4a,.flac,.aac"
          style={{ display: 'none' }}
        />

        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: '#eaf1ed',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>

        {file ? (
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              {file.name}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>
              Drag & Drop your audio file here, or <span style={{ color: 'var(--primary)' }}>browse</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Supports MP3, WAV, OGG, M4A, FLAC, AAC (Any audio length)
            </div>
          </div>
        )}
      </div>

      {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="btn-primary" 
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              Uploading...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m5 12 7-7 7 7"/>
                <path d="M12 19V5"/>
              </svg>
              Upload audio
            </>
          )}
        </button>
      </div>
    </div>
  );
}
