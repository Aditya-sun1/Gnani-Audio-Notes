import os
import shutil
from pathlib import Path
from app.config import settings

class StorageService:
    def __init__(self, storage_dir: str = settings.STORAGE_DIR):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def save_file(self, file_bytes: bytes, filename: str) -> str:
        file_path = self.storage_dir / filename
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        return str(file_path)

    def get_file_path(self, filename: str) -> str:
        return str(self.storage_dir / filename)

    def delete_file(self, filename: str) -> bool:
        file_path = self.storage_dir / filename
        if file_path.exists():
            os.remove(file_path)
            return True
        return False

storage_service = StorageService()
