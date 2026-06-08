from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List
import uuid

from app.models.schemas import (
    RespuestaAPI,
    Vacante,
    VacanteEmbeddingRequest,
    MatchSingleRequest,
    MatchResult,
)
from app.services.embeddings import get_embedding_service
from app.services.vacantes_cache import get_vacantes_cache_service
from app.core.responses import (
    crear_respuesta_exitosa,
    crear_respuesta_error,
    crear_respuesta_fallo,
    ErrorValidacion,
)
from app.core.logging import get_logger

router = APIRouter(prefix="/match", tags=["match"])
logger = get_logger("RecommendationsRoute")


def construir_respuesta_exitosa(resultados: List[Dict[str, Any]]) -> Dict[str, Any]:
    return crear_respuesta_exitosa(
        data=resultados,
        message=f"Se encontraron {len(resultados)} resultados exitosamente.",
        data_key=None
    )


def manejar_error_inesperado(e: Exception) -> None:
    trace_id = str(uuid.uuid4())[:8].upper()
    logger.error(f"Error {trace_id}: {str(e)}", exc_info=True)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=crear_respuesta_error(
            code="E500",
            message=f"Ha ocurrido un error inesperado. Por favor, contacte a soporte con el código {trace_id}.",
            trace_id=trace_id
        )
    )


def validar_payload_una(payload: MatchSingleRequest) -> None:
    if payload.cv is None or payload.cv.cv_digital is None:
        error = ErrorValidacion(
            campo="cv",
            codigo="E001",
            mensaje="El CV es obligatorio.",
        )
        detalle = crear_respuesta_fallo([error])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detalle,
        )


@router.post("/puntuar/cv", response_model=RespuestaAPI, status_code=status.HTTP_200_OK)
async def puntuar_cv(payload: MatchSingleRequest) -> Dict[str, Any]:
    try:
        validar_payload_una(payload)
        vacantes_cache_service = get_vacantes_cache_service()
        item = await vacantes_cache_service.obtener_vacante_embedding(int(payload.id_oferta))
        if item is None:
            detalle = {
                "status": "fail",
                "data": {
                    "campo": "id_oferta",
                    "codigo": "VACANTE_NO_ENCONTRADA",
                    "mensaje": "No se encontró la vacante en el caché o no está disponible.",
                    "id_oferta": payload.id_oferta,
                    "id_persona": payload.cv.id_persona
                },
                "message": "Error en la validación de datos"
            }
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detalle)
        dense_vec, lw_vacante, meta = item
        embedding_service = get_embedding_service()
        resultado: MatchResult = embedding_service.calcular_similitud_final(
            payload.cv.model_dump(),
            dense_vec,
            lw_vacante,
            meta["id"],
        )
        return crear_respuesta_exitosa(
            data=resultado.model_dump(),
            message="Similitud calculada correctamente.",
            data_key=None,
        )
    except HTTPException:
        raise
    except Exception as e:
        manejar_error_inesperado(e)


@router.post("/cachear/vacante", response_model=RespuestaAPI, status_code=status.HTTP_200_OK)
async def cachear_vacante_endpoint(vacante: Vacante) -> Dict[str, Any]:
    try:
        vacantes_cache_service = get_vacantes_cache_service()
        await vacantes_cache_service.cachear_vacante(vacante.model_dump())
        return crear_respuesta_exitosa(
            data={"id_oferta": vacante.id_oferta},
            message="Vacante cacheada correctamente.",
            data_key=None,
        )
    except Exception as e:
        manejar_error_inesperado(e)


@router.post("/cachear-lote/vacantes", response_model=RespuestaAPI, status_code=status.HTTP_200_OK)
async def cachear_vacantes_endpoint(payload: VacanteEmbeddingRequest) -> Dict[str, Any]:
    if not payload.vacantes:
        error = ErrorValidacion(
            campo="vacantes",
            codigo="E004",
            mensaje="Debe proporcionar al menos una vacante para cachear.",
        )
        detalle = crear_respuesta_fallo([error])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detalle,
        )
    try:
        vacantes_cache_service = get_vacantes_cache_service()
        await vacantes_cache_service.cachear_vacantes_batch([v.model_dump() for v in payload.vacantes])
        ids = [v.id_oferta for v in payload.vacantes]
        return crear_respuesta_exitosa(
            data={"ids": ids, "count": len(ids)},
            message=f"Se cachearon {len(ids)} vacantes correctamente.",
            data_key=None,
        )
    except Exception as e:
        manejar_error_inesperado(e)
