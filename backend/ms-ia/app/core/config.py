import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR.parent / ".env")

REDIS_IA_HOST = os.getenv("REDIS_IA_HOST", "localhost")
REDIS_IA_PORT = int(os.getenv("REDIS_IA_PORT", "6380"))
REDIS_IA_DB = int(os.getenv("REDIS_IA_DB", "0"))
REDIS_IA_PASSWORD = os.getenv("REDIS_IA_PASSWORD", None)

AUTH_BASE_URL = os.getenv("AUTH_BASE_URL", "http://localhost:8081/api")
INTERNAL_AUTH_CLIENT_ID = os.getenv("INTERNAL_AUTH_CLIENT_ID", "ms-ia")
INTERNAL_AUTH_CLIENT_SECRET = os.getenv("INTERNAL_AUTH_CLIENT_SECRET", "")
INTERNAL_AUTH_CACHE_SKEW_SECONDS = int(os.getenv("INTERNAL_AUTH_CACHE_SKEW_SECONDS", "60"))
