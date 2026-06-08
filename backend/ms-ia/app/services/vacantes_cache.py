from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
import numpy as np
import json

from app.core.config import VACANTE_TTL_SECONDS
from app.core.redis_ia import get_redis_ia
from app.services.embeddings import get_embedding_service
from app.core.logging import get_logger

logger = get_logger("VacantesCacheService")


class VacantesCacheService:
    def __init__(self) -> None:
        self.ttl_seconds = VACANTE_TTL_SECONDS

    def meta_key(self, id_oferta: int) -> str:
        return f"ia:vacante:{id_oferta}:meta"

    def dense_key(self, id_oferta: int) -> str:
        return f"ia:vacante:{id_oferta}:dense"

    def sparse_key(self, id_oferta: int) -> str:
        return f"ia:vacante:{id_oferta}:sparse"

    async def cachear_vacantes_batch(
        self,
        vacantes: List[Dict[str, Any]],
        batch_size: int = 16,
    ) -> None:
        if not vacantes:
            return
        redis = get_redis_ia()
        embedding_service = get_embedding_service()
        textos = [embedding_service.serializar_vacante_final(v) for v in vacantes]
        outputs = embedding_service.model.encode(
            textos,
            batch_size=batch_size,
            max_length=2048,
            return_dense=True,
            return_sparse=True,
            return_colbert_vecs=False,
        )
        dense_vecs = outputs["dense_vecs"]
        lexical_weights_list = outputs["lexical_weights"]
        now_iso = datetime.now(timezone.utc).isoformat()
        async with redis.pipeline() as pipe:
            for idx, vacante in enumerate(vacantes):
                id_oferta = int(vacante["id_oferta"])
                dense_blob = dense_vecs[idx].astype(np.float32).tobytes()
                sparse_blob = json.dumps({k: float(v) for k, v in lexical_weights_list[idx].items()})
                meta = {
                    "id": str(id_oferta),
                    "estado": "disponible",
                    "updated_at": now_iso,
                }
                pipe.hset(self.meta_key(id_oferta), mapping=meta)
                pipe.expire(self.meta_key(id_oferta), self.ttl_seconds)
                pipe.set(self.dense_key(id_oferta), dense_blob, ex=self.ttl_seconds)
                pipe.set(self.sparse_key(id_oferta), sparse_blob, ex=self.ttl_seconds)
            await pipe.execute()
        logger.info(f"Batch cacheado exitosamente: {len(vacantes)} vacantes.")

    async def cachear_vacante(self, vacante: Dict[str, Any]) -> None:
        await self.cachear_vacantes_batch([vacante])

    async def actualizar_estado_vacante(self, id_oferta: int, estado: str) -> None:
        redis = get_redis_ia()
        now_iso = datetime.now(timezone.utc).isoformat()
        await redis.hset(
            self.meta_key(id_oferta),
            mapping={
                "estado": estado,
                "updated_at": now_iso,
            },
        )

    async def obtener_vacantes_embeddings(
        self,
        ids: List[int],
    ) -> Tuple[np.ndarray, List[Dict[str, float]], List[Dict[str, Any]]]:
        raise NotImplementedError("obtener_vacantes_embeddings aún no está implementado.")

    async def obtener_vacante_embedding(
        self,
        id_oferta: int,
    ) -> Tuple[np.ndarray, Dict[str, float], Dict[str, Any]] | None:
        redis = get_redis_ia()
        
        # 1. Intentar obtener de caché
        async with redis.pipeline() as pipe:
            pipe.hgetall(self.meta_key(id_oferta))
            pipe.get(self.dense_key(id_oferta))
            pipe.get(self.sparse_key(id_oferta))
            meta_raw, dense_blob, sparse_blob = await pipe.execute()
            
        # 2. Si existe en caché, retornar
        if meta_raw and dense_blob is not None and sparse_blob is not None:
            meta_decoded = {k.decode("utf-8"): v.decode("utf-8") for k, v in meta_raw.items()}
            if meta_decoded.get("estado") == "disponible":
                dense_vec = np.frombuffer(dense_blob, dtype=np.float32)
                lexical_weights = json.loads(sparse_blob)

                logger.debug(f"Cache hit para vacante {id_oferta}")
                return dense_vec, lexical_weights, {
                    "id": meta_decoded.get("id"),
                    "estado": meta_decoded.get("estado"),
                    "updated_at": meta_decoded.get("updated_at"),
                }

        logger.info(f"Cache miss para vacante {id_oferta}.")
        return None


vacantes_cache_service: VacantesCacheService | None = None


def init_vacantes_cache_service():
    """Inicializa la instancia global del servicio de caché de vacantes."""
    global vacantes_cache_service
    vacantes_cache_service = VacantesCacheService()


def get_vacantes_cache_service() -> VacantesCacheService:
    """Retorna la instancia global del servicio, lanzando error si no está inicializada."""
    if vacantes_cache_service is None:
        raise RuntimeError("VacantesCacheService no ha sido inicializado en el lifespan.")
    return vacantes_cache_service
