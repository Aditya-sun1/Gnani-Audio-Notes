import httpx
import logging
import asyncio
from typing import Optional
from app.config import settings
from app.services.audio_processor import audio_processor

logger = logging.getLogger(__name__)

class GnaniASRService:
    MAX_AUDIO_DURATION_SECONDS = 30.0

    def __init__(self):
        self.api_url = settings.GNANI_ASR_URL
        self.api_key = settings.GNANI_API_KEY
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    async def transcribe_audio_file(self, file_path: str, language_code: str = "en-IN", max_retries: int = 3) -> str:
        """
        Sends an audio file chunk to Gnani's Speech-to-Text API and returns the transcribed text.
        Retries automatically on network timeouts or 5xx server errors.
        """
        duration = audio_processor.get_audio_duration(file_path)
        if duration > self.MAX_AUDIO_DURATION_SECONDS:
            raise ValueError(
                f"Audio segment is {duration:.2f}s; Gnani ASR accepts at most "
                f"{self.MAX_AUDIO_DURATION_SECONDS:.0f}s per request."
            )

        headers = {
            "X-API-Key-ID": self.api_key,
            "User-Agent": self.user_agent,
        }
        if not self.api_key:
            raise RuntimeError("GNANI_API_KEY must be configured before transcription.")

        # Read file bytes
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        filename = file_path.split("/")[-1].split("\\")[-1]
        mime_type = "audio/wav" if filename.endswith(".wav") else "audio/mpeg"

        data = {
            "language_code": language_code
        }

        files = {
            "audio_file": (filename, file_bytes, mime_type)
        }

        last_exception = None

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"Sending audio to Gnani ASR (attempt {attempt}/{max_retries}): {filename}")
                async with httpx.AsyncClient(timeout=45.0) as client:
                    response = await client.post(
                        self.api_url,
                        headers=headers,
                        data=data,
                        files=files
                    )

                if response.status_code == 200:
                    res_json = response.json()
                    logger.info(f"Gnani ASR success response: {res_json}")
                    
                    if res_json.get("success"):
                        transcript = res_json.get("transcript", "").strip()
                        return transcript
                    else:
                        error_msg = res_json.get("message", "Unknown error from Gnani ASR")
                        raise ValueError(f"Gnani ASR returned unsuccessful response: {error_msg}")
                        
                elif response.status_code == 403:
                    raise PermissionError(f"Gnani ASR 403 Forbidden: Invalid API Key or Cloudflare block. Response: {response.text}")
                elif response.status_code == 429:
                    logger.warning("Gnani ASR Rate Limited (429). Retrying after backoff...")
                    await asyncio.sleep(2.0 * attempt)
                    continue
                else:
                    raise RuntimeError(f"Gnani ASR returned HTTP status {response.status_code}: {response.text}")

            except (httpx.TimeoutException, httpx.NetworkError) as e:
                logger.warning(f"Network issue during Gnani ASR call (attempt {attempt}): {e}")
                last_exception = e
                if attempt < max_retries:
                    await asyncio.sleep(1.5 * attempt)
            except Exception as e:
                logger.error(f"Error calling Gnani ASR: {e}")
                raise e

        raise last_exception or RuntimeError("Failed to transcribe audio after multiple retries.")

gnani_asr_service = GnaniASRService()
