import os
import logging
import httpx
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class LLMSummaryService:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY

    async def generate_summary(self, transcript: str) -> str:
        """
        Generates a structured summary from the provided transcript.
        Returns markdown containing Overview, Key Takeaways, Action Items, and Main Topics.
        """
        if not transcript or not transcript.strip():
            return "### Summary unavailable\nNo transcript was produced for this audio."

        # Try Google Gemini if key is provided
        if self.gemini_key:
            try:
                summary = await self._call_gemini_api(transcript)
                if summary:
                    return summary
            except Exception as e:
                logger.warning(f"Gemini API summary generation failed: {e}. Using fallback summarizer.")

        # Do not present transcript fragments as inferred insights.
        return self._generate_structured_fallback_summary(transcript)

    async def _call_gemini_api(self, transcript: str) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
        prompt = (
            "Summarize only information explicitly supported by this audio transcript. Do not infer missing words, "
            "invent action items, or claim a transcript is complete. If it appears to be song lyrics, identify it as "
            "lyrics and summarize only clear themes; state when recognition is too fragmentary for a reliable summary.\n\n"
            f"Transcript:\n\"\"\"{transcript}\"\"\""
        )
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
            else:
                raise RuntimeError(f"Gemini API returned status {resp.status_code}: {resp.text}")

    def _generate_structured_fallback_summary(self, transcript: str) -> str:
        total_words = len(transcript.split())
        return (
            "### Summary unavailable\n"
            "Configure GEMINI_API_KEY to generate an AI summary. The transcript is available in the Transcript tab.\n\n"
            f"### Transcript statistics\n- Word count: {total_words}"
        )

llm_summary_service = LLMSummaryService()
