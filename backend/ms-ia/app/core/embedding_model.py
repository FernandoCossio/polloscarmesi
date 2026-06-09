from FlagEmbedding import BGEM3FlagModel
from huggingface_hub import snapshot_download
from app.core.config import BGE_MODEL_NAME, BGE_USE_FP16, BGE_IGNORE_PATTERNS
from app.core.logging import get_logger

logger = get_logger("EmbeddingModel")

_model = None

def get_embedding_model() -> BGEM3FlagModel:
    global _model
    if _model is None:
        logger.info(f"Cargando modelo de embeddings: {BGE_MODEL_NAME}...")
        try:
            model_path = snapshot_download(
                repo_id=BGE_MODEL_NAME,
                ignore_patterns=BGE_IGNORE_PATTERNS,
                local_files_only=True,
            )
        except Exception:
            logger.warning("Modelo no encontrado localmente. Descargando desde Hugging Face...")
            model_path = snapshot_download(
                repo_id=BGE_MODEL_NAME,
                ignore_patterns=BGE_IGNORE_PATTERNS,
            )
        _model = BGEM3FlagModel(model_path, use_fp16=BGE_USE_FP16)
        logger.info("Modelo de embeddings cargado exitosamente.")
    return _model
