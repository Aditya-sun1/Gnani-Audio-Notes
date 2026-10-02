import os
import tempfile
import logging
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models import AudioNote, NoteStatus
from app.services.audio_processor import audio_processor
from app.services.gnani_asr import gnani_asr_service
from app.services.llm_summary import llm_summary_service

logger = logging.getLogger(__name__)

async def process_audio_note_task(note_id: str):
    """
    Background job function to process uploaded audio note:
    1. Audio analysis & splitting
    2. Transcription via Gnani STT API
    3. Summary generation via LLM
    4. Database state updates & failure handling
    """
    async with AsyncSessionLocal() as session:
        try:
            # 1. Fetch note from DB
            result = await session.execute(select(AudioNote).where(AudioNote.id == note_id))
            note = result.scalars().first()
            if not note:
                logger.error(f"Note {note_id} not found in database for background task.")
                return

            logger.info(f"Starting background processing for Note {note_id} ({note.title})")
            note.status = NoteStatus.PROCESSING
            note.progress = 10
            note.status_message = "Analyzing audio file..."
            note.updated_at = datetime.utcnow()
            await session.commit()

            # 2. Get audio duration & prepare temp directory for splitting
            duration = audio_processor.get_audio_duration(note.file_path)
            note.duration = duration
            note.progress = 20
            note.status_message = f"Audio duration: {duration:.1f}s. Preparing transcription..."
            await session.commit()

            with tempfile.TemporaryDirectory() as temp_dir:
                # Split audio into chunks if long
                chunks = audio_processor.split_audio(note.file_path, temp_dir)
                total_chunks = len(chunks)
                logger.info(f"Audio split into {total_chunks} chunk(s) for note {note_id}")

                note.status = NoteStatus.TRANSCRIBING
                note.status_message = f"Transcribing {total_chunks} chunk(s) via Gnani ASR..."
                await session.commit()

                transcripts = []
                transcribed_segments = 0
                audible_segments = 0
                for idx, chunk_path in enumerate(chunks, start=1):
                    # Progress between 25% and 75%
                    current_progress = 25 + int((idx / total_chunks) * 50)
                    note.progress = current_progress
                    note.status_message = f"Transcribing audio segment {idx}/{total_chunks} with Gnani ASR..."
                    await session.commit()

                    if not audio_processor.has_audio_signal(chunk_path):
                        logger.info(f"Skipping silent audio segment {idx}/{total_chunks} for note {note_id}")
                        continue
                    audible_segments += 1

                    chunk_transcript = await gnani_asr_service.transcribe_audio_file(
                        chunk_path,
                        language_code=note.language_code
                    )
                    if chunk_transcript:
                        transcripts.append(chunk_transcript)
                        transcribed_segments += 1

                    # Small delay between chunks to avoid rate limit
                    await asyncio.sleep(0.5)

                full_transcript = " ".join(transcripts).strip()
                if not full_transcript:
                    if audible_segments == 0:
                        full_transcript = "[No audible audio signal detected]"
                    else:
                        full_transcript = "[No speech recognized in audio]"

                note.transcript = full_transcript
                note.progress = 80
                note.status = NoteStatus.SUMMARIZING
                note.status_message = "Generating AI summary from transcript..."
                await session.commit()

                # 3. Generate summary
                summary_text = await llm_summary_service.generate_summary(full_transcript)

                # 4. Mark completed
                note.summary = summary_text
                note.status = NoteStatus.COMPLETED
                note.progress = 100
                if audible_segments == 0:
                    note.status_message = "No audio signal was detected; the recording is silent."
                elif transcribed_segments == 0:
                    note.status_message = (
                        f"Gnani returned no text for any of the {audible_segments} segments containing audio. "
                        "This can happen with music or unclear speech."
                    )
                elif transcribed_segments < audible_segments:
                    note.status_message = (
                        f"Transcript may be incomplete: text was recognized in "
                        f"{transcribed_segments} of {audible_segments} audible segments. Compare it with the audio."
                    )
                else:
                    note.status_message = (
                        f"Text was recognized in all {audible_segments} audible segments. "
                        "Review wording against the original audio."
                    )
                note.updated_at = datetime.utcnow()
                await session.commit()
                logger.info(f"Processing completed successfully for Note {note_id}")

        except Exception as e:
            logger.error(f"Error processing AudioNote {note_id}: {e}", exc_info=True)
            async with AsyncSessionLocal() as fail_session:
                res = await fail_session.execute(select(AudioNote).where(AudioNote.id == note_id))
                fail_note = res.scalars().first()
                if fail_note:
                    fail_note.status = NoteStatus.FAILED
                    fail_note.status_message = "Processing failed"
                    fail_note.error_message = str(e)
                    fail_note.updated_at = datetime.utcnow()
                    await fail_session.commit()
