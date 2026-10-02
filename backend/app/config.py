import os
from pydantic_settings import BaseSettings

GNANI_AUTO_LANGUAGE = "indic-auto"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Audio Notes Platform"
    API_V1_STR: str = "/api"
    
    # Gnani ASR Configuration
    GNANI_API_KEY: str = os.getenv("GNANI_API_KEY", "")
    GNANI_ASR_URL: str = "https://api.vachana.ai/stt/v3"
    
    # Database Configuration (Postgres default, SQLite async fallback)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./audionotes.db"
    )
    
    # Local Storage Directory (Bucket abstraction)
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "./storage")
    
    # Optional Gemini / OpenAI LLM API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
