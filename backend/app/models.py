import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Enum as SQLEnum
import enum
from app.database import Base

class NoteStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    TRANSCRIBING = "TRANSCRIBING"
    SUMMARIZING = "SUMMARIZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AudioNote(Base):
    __tablename__ = "audio_notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False, default=0)
    duration = Column(Float, nullable=True, default=0.0)
    language_code = Column(String(10), nullable=False, default="indic-auto")
    
    status = Column(SQLEnum(NoteStatus), nullable=False, default=NoteStatus.UPLOADED)
    progress = Column(Integer, nullable=False, default=0)
    status_message = Column(String(255), nullable=True, default="Uploaded successfully")
    
    transcript = Column(Text, nullable=True, default="")
    summary = Column(Text, nullable=True, default="")
    error_message = Column(Text, nullable=True, default=None)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
