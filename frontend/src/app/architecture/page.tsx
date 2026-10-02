'use client';

export default function ArchitecturePage() {
  return (
    <div className="architecture-page">
      <header>
        <h1>Architecture</h1>
        <p>How an audio file moves through the application.</p>
      </header>

      <section className="architecture-section">
        <h2>Processing flow</h2>
        <ol>
          <li>The frontend uploads an audio file to FastAPI.</li>
          <li>The backend stores the file and creates a note in SQLite.</li>
          <li>A background task decodes audio to mono, 16 kHz WAV and creates segments of up to 25 seconds.</li>
          <li>Each segment with an audio signal is sent to Gnani ASR using automatic language detection.</li>
          <li>Recognized text is combined in segment order and saved with the note.</li>
        </ol>
      </section>

      <section className="architecture-section">
        <h2>Audio and transcription</h2>
        <p>
          Gnani accepts up to 30 seconds per request. The 25-second segment size leaves a margin below that limit.
          Silent segments are skipped. Notes report when no text is returned or when only some audio segments produce text.
        </p>
        <p>
          Speech recognition can miss or mishear words, especially in music. A completed job means processing finished;
          it does not guarantee a verbatim transcript.
        </p>
      </section>

      <section className="architecture-section">
        <h2>Storage and summaries</h2>
        <p>
          Audio files are kept in <code>backend/storage</code>. Note metadata and transcripts are stored in the local SQLite database.
          Gemini summaries are optional; without a Gemini key, the app reports that a summary is unavailable.
        </p>
      </section>

      <section className="architecture-section">
        <h2>Local services</h2>
        <ul>
          <li>FastAPI: <code>http://127.0.0.1:8000</code></li>
          <li>Next.js: <code>http://localhost:3000</code></li>
          <li>Gnani ASR: <code>https://api.vachana.ai/stt/v3</code></li>
        </ul>
      </section>
    </div>
  );
}
