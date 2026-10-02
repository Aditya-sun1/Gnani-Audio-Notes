# Vachana Audio Notes

A local audio upload, transcription, and review app built for the Gnani.ai internship task.

## What it does

- Uploads MP3, WAV, OGG, M4A, FLAC, and AAC recordings.
- Uses Gnani ASR `indic-auto` to detect English and supported Indian languages.
- Converts long recordings to mono 16 kHz WAV and sends 25-second segments, below Gnani's 30-second limit.
- Stores recordings and transcripts locally in SQLite and `backend/storage`.
- Provides playback, transcript search, copy, download, and processing status.
- Generates summaries when `GEMINI_API_KEY` is configured. Without it, the app shows transcript statistics only.

ASR can return incomplete or inaccurate text, especially for music. The note page reports when segments contain no recognized text; compare transcripts with the recording.

## Run locally

Requirements: Python 3.10 or later, Node.js 20 or later, and npm.

1. Configure `backend/.env` with your own credentials:

```env
GNANI_API_KEY=your_gnani_api_key
GNANI_ASR_URL=https://api.vachana.ai/stt/v3
DATABASE_URL=sqlite+aiosqlite:///./audionotes.db
STORAGE_DIR=./storage
GEMINI_API_KEY=
```

2. Install backend dependencies and start FastAPI:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

3. In a second terminal, install frontend dependencies and start Next.js:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The API docs are at `http://127.0.0.1:8000/docs`.

On Windows, `./run_dev.ps1` starts both services in separate PowerShell windows.
