import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR.parent / ".env")

BGE_MODEL_NAME = os.getenv("BGE_MODEL_NAME", "BAAI/bge-m3")
BGE_USE_FP16 = os.getenv("BGE_USE_FP16", "False").lower() == "true"
BGE_IGNORE_PATTERNS = ["onnx/*", "*.onnx", "*.onnx_data"]

REDIS_IA_HOST = os.getenv("REDIS_IA_HOST", "localhost")
REDIS_IA_PORT = int(os.getenv("REDIS_IA_PORT", "6380"))
REDIS_IA_DB = int(os.getenv("REDIS_IA_DB", "0"))
REDIS_IA_PASSWORD = os.getenv("REDIS_IA_PASSWORD", None)
