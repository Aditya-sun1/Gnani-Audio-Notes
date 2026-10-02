import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.config import GNANI_AUTO_LANGUAGE
from app.models import AudioNote, NoteStatus
from app.services.storage import storage_service
from app.services.background_worker import process_audio_note_task

router = APIRouter()

# Pydantic Schemas
class AudioNoteResponse(BaseModel):
    id: str
    title: str
    filename: str
    file_size: int
    duration: float
    language_code: str
    status: str
    progress: int
    status_message: Optional[str]
    transcript: Optional[str]
    summary: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.post("/upload", response_model=AudioNoteResponse, status_code=202)
async def upload_audio_note(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload an audio file (MP3, WAV, OGG, M4A, FLAC, AAC).
    Saves file to storage bucket and triggers async background processing.
    """
    allowed_extensions = {".wav", ".mp3", ".ogg", ".m4a", ".flac", ".aac", ".mp4"}
    filename = file.filename or "audio_note.wav"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(allowed_extensions)}"
        )

    # Read bytes
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Unique filename
    note_id = str(uuid.uuid4())
    stored_filename = f"{note_id}{ext}"
    file_path = storage_service.save_file(contents, stored_filename)

    # Save initial record to DB
    note = AudioNote(
        id=note_id,
        title=filename,
        filename=stored_filename,
        file_path=file_path,
        file_size=len(contents),
        language_code=GNANI_AUTO_LANGUAGE,
        status=NoteStatus.UPLOADED,
        progress=0,
        status_message="File uploaded. Queued for processing..."
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)

    # Dispatch background worker
    background_tasks.add_task(process_audio_note_task, note_id)

    return note

@router.get("", response_model=List[AudioNoteResponse])
async def list_audio_notes(db: AsyncSession = Depends(get_db)):
    """List all audio notes sorted by creation date descending."""
    result = await db.execute(select(AudioNote).order_by(desc(AudioNote.created_at)))
    notes = result.scalars().all()
    return notes

@router.get("/{note_id}", response_model=AudioNoteResponse)
async def get_audio_note(note_id: str, db: AsyncSession = Depends(get_db)):
    """Get single audio note details by ID."""
    result = await db.execute(select(AudioNote).where(AudioNote.id == note_id))
    note = result.scalars().first()
    if not note:
        raise HTTPException(status_code=404, detail="Audio note not found.")
    return note

@router.get("/{note_id}/audio")
async def stream_audio_file(note_id: str, db: AsyncSession = Depends(get_db)):
    """Stream audio file for playback."""
    result = await db.execute(select(AudioNote).where(AudioNote.id == note_id))
    note = result.scalars().first()
    if not note or not os.path.exists(note.file_path):
        raise HTTPException(status_code=404, detail="Audio file not found on server.")
    
    ext = os.path.splitext(note.filename)[1].lower()
    media_types = {
        ".wav": "audio/wav",
        ".mp3": "audio/mpeg",
        ".ogg": "audio/ogg",
        ".m4a": "audio/mp4",
        ".flac": "audio/flac",
        ".aac": "audio/aac"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    return FileResponse(note.file_path, media_type=media_type, filename=note.title)

@router.post("/{note_id}/retry", response_model=AudioNoteResponse)
async def retry_audio_note(
    note_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Re-trigger background processing for a failed audio note."""
    result = await db.execute(select(AudioNote).where(AudioNote.id == note_id))
    note = result.scalars().first()
    if not note:
        raise HTTPException(status_code=404, detail="Audio note not found.")

    note.status = NoteStatus.UPLOADED
    note.language_code = GNANI_AUTO_LANGUAGE
    note.progress = 0
    note.status_message = "Retrying processing..."
    note.error_message = None
    await db.commit()
    await db.refresh(note)

    background_tasks.add_task(process_audio_note_task, note_id)
    return note

@router.delete("/{note_id}", status_code=204)
async def delete_audio_note(note_id: str, db: AsyncSession = Depends(get_db)):
    """Delete audio note and associated stored audio file."""
    result = await db.execute(select(AudioNote).where(AudioNote.id == note_id))
    note = result.scalars().first()
    if note:
        storage_service.delete_file(note.filename)
        await db.delete(note)
        await db.commit()
    return None
