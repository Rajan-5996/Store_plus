from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / "data"

# Origins allowed to call the API (Vite dev server).
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
