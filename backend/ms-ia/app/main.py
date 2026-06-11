from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.logging import get_logger
from app.graphql.schema import graphql_router
from app.services.tiempo_pedidos_service import init_tiempo_pedidos_service
from app.services.segmentacion_clientes_service import (
    init_segmentacion_clientes_service,
)
logger = get_logger("Main")
from app.api.routes.comprobantes import (
    router as comprobantes_router,
)
from app.api.routes.tiempo_pedidos import (
    router as tiempo_pedidos_router,
)
from app.services.comprobantes_service import (
    init_comprobantes_service,
)
from app.services.internal_auth import (
    init_internal_auth_service,
)

from app.core.security import (
    validar_configuracion_jwt,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Iniciando Microservicio de IA...")

    validar_configuracion_jwt()
    logger.info("Llave pública JWT cargada correctamente ✓")
    
    init_tiempo_pedidos_service()
    init_segmentacion_clientes_service()
    init_comprobantes_service()
    init_internal_auth_service()

    logger.info("GraphQL disponible en /graphql")

    try:
        yield
    finally:
        logger.info("Cerrando Microservicio de IA...")


app = FastAPI(
    title="Microservicio de Inteligencia Artificial",
    description=(
        "Clasificación de comprobantes, estimación de tiempos "
        "de pedidos y segmentación de clientes."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

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

app.include_router(graphql_router, prefix="/graphql")

app.include_router(
    comprobantes_router,
    prefix="/api",
)

app.include_router(
    tiempo_pedidos_router,
    prefix="/api",
)

@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "service": "ms-ia",
    }
