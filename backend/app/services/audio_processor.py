import os
import wave
import contextlib
import tempfile
import logging
import subprocess
from pathlib import Path
from typing import List

logger = logging.getLogger(__name__)

# 1. Ensure imageio_ffmpeg is configured properly with ffmpeg.exe alias
AUDIO_SEGMENT_AVAILABLE = False
FFMPEG_EXECUTABLE = None
try:
    import imageio_ffmpeg
    FFMPEG_EXECUTABLE = imageio_ffmpeg.get_ffmpeg_exe()
    from pydub import AudioSegment
    AUDIO_SEGMENT_AVAILABLE = True
    logger.info(f"Audio processing initialized with ffmpeg at {FFMPEG_EXECUTABLE}")
except Exception as e:
    logger.warning(f"Could not initialize imageio_ffmpeg / pydub: {e}")
    AUDIO_SEGMENT_AVAILABLE = False

class AudioProcessor:
    CHUNK_DURATION_MS = 25 * 1000  # Keep context high while staying below Gnani's 30s limit

    @staticmethod
    def _decode_to_wav(file_path: str, wav_path: str) -> None:
        if not FFMPEG_EXECUTABLE:
            raise RuntimeError("FFmpeg is unavailable. Ensure imageio-ffmpeg is installed.")

        result = subprocess.run(
            [
                FFMPEG_EXECUTABLE,
                "-hide_banner",
                "-loglevel", "error",
                "-y",
                "-i", file_path,
                "-vn",
                "-ac", "1",
                "-ar", "16000",
                "-c:a", "pcm_s16le",
                "-f", "wav",
                wav_path,
            ],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg could not decode audio: {result.stderr.strip()}")

    @staticmethod
    def _wav_duration(file_path: str) -> float:
        with contextlib.closing(wave.open(file_path, "rb")) as audio_file:
            return audio_file.getnframes() / float(audio_file.getframerate())

    @staticmethod
    def has_audio_signal(file_path: str) -> bool:
        if not AUDIO_SEGMENT_AVAILABLE:
            raise RuntimeError("Audio analysis is unavailable. Ensure pydub is installed.")

        audio = AudioSegment.from_wav(file_path)
        return audio.rms > 0

    @staticmethod
    def get_audio_duration(file_path: str) -> float:
        """Returns duration of audio file in seconds."""
        file_path_obj = Path(file_path)
        ext = file_path_obj.suffix.lower()

        if ext == ".wav":
            try:
                return AudioProcessor._wav_duration(file_path)
            except Exception as e:
                logger.warning(f"WAV duration failed for {file_path}: {e}")

        with tempfile.TemporaryDirectory() as temp_dir:
            wav_path = os.path.join(temp_dir, "decoded.wav")
            AudioProcessor._decode_to_wav(file_path, wav_path)
            return AudioProcessor._wav_duration(wav_path)

    @staticmethod
    def split_audio(file_path: str, temp_dir: str) -> List[str]:
        """
        Splits/converts any audio file (MP3, WAV, OGG, M4A, FLAC, AAC) into <= 25-second WAV chunks.
        Guarantees every chunk is strictly under Gnani ASR's 30-second limit.
        """
        ext = Path(file_path).suffix.lower()

        # If file is short WAV (<= 15 sec), return directly
        if ext == ".wav" and AudioProcessor.get_audio_duration(file_path) <= 15.0:
            return [file_path]

        chunk_paths = []

        if AUDIO_SEGMENT_AVAILABLE:
            try:
                logger.info(f"Decoding {file_path} with ffmpeg for chunking...")
                wav_path = file_path
                if ext != ".wav":
                    wav_path = os.path.join(temp_dir, "decoded.wav")
                    AudioProcessor._decode_to_wav(file_path, wav_path)

                audio = AudioSegment.from_wav(wav_path)
                audio = audio.set_channels(1).set_frame_rate(16000)
                total_ms = len(audio)

                for i, start_ms in enumerate(range(0, total_ms, AudioProcessor.CHUNK_DURATION_MS)):
                    end_ms = min(start_ms + AudioProcessor.CHUNK_DURATION_MS, total_ms)
                    chunk = audio[start_ms:end_ms]

                    chunk_path = os.path.join(temp_dir, f"chunk_{i:04d}.wav")
                    chunk.export(chunk_path, format="wav")
                    chunk_paths.append(chunk_path)

                if chunk_paths:
                    logger.info(f"Successfully split {file_path} into {len(chunk_paths)} chunk(s).")
                    return chunk_paths
            except Exception as e:
                logger.error(f"Error splitting audio with pydub: {e}", exc_info=True)
                raise RuntimeError(f"Audio processing failed for {file_path}. Pydub error: {e}")

        raise RuntimeError("AudioSegment decoder is unavailable. Ensure ffmpeg is installed.")

audio_processor = AudioProcessor()
