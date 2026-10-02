export interface AudioNote {
  id: string;
  title: string;
  filename: string;
  file_size: number;
  duration: number;
  language_code: string;
  status: 'UPLOADED' | 'PROCESSING' | 'TRANSCRIBING' | 'SUMMARIZING' | 'COMPLETED' | 'FAILED';
  progress: number;
  status_message?: string;
  transcript?: string;
  summary?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function uploadAudio(file: File): Promise<AudioNote> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/notes/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errorData.detail || 'Failed to upload audio file');
  }

  return response.json();
}

export async function fetchNotes(): Promise<AudioNote[]> {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notes');
  }

  return response.json();
}

export async function fetchNoteById(id: string): Promise<AudioNote> {
  const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch note details');
  }

  return response.json();
}

export async function retryNote(id: string): Promise<AudioNote> {
  const response = await fetch(`${API_BASE_URL}/notes/${id}/retry`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to retry note processing');
  }

  return response.json();
}

export async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete note');
  }
}

export function getAudioStreamUrl(id: string): string {
  return `${API_BASE_URL}/notes/${id}/audio`;
}
