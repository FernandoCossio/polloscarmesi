from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.recommendations import router as recommendations_router
from app.core.redis_ia import init_redis_ia, close_redis_ia
from app.services.embeddings import init_embedding_service
from app.services.vacantes_cache import init_vacantes_cache_service, get_vacantes_cache_service
from app.core.logging import get_logger

logger = get_logger("Main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando aplicación IA Match...")
    
    logger.info("Cargando modelo de embeddings...")
    init_embedding_service()
    logger.info("Modelo cargado ✓")
    
    logger.info("Inicializando servicio de caché de vacantes...")
    init_vacantes_cache_service()
    logger.info("Servicio de caché inicializado ✓")
    
    await init_redis_ia()
    logger.info("Redis conectado ✓")
    
    try:
        yield
    finally:
        logger.info("Cerrando aplicación IA Match...")
        await close_redis_ia()


app = FastAPI(title="Puntuacion de Match CV-Vacante", lifespan=lifespan)

origins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations_router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
