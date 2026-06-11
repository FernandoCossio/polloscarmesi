from datetime import datetime
from enum import Enum
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.security import UsuarioAutenticado, requerir_usuario_actual
from app.services.tiempo_pedidos_service import estimar_tiempo_pedido


class TipoPedido(str, Enum):
    PRESENCIAL = "PRESENCIAL"
    PARA_LLEVAR = "PARA_LLEVAR"
    DELIVERY = "DELIVERY"


class RequiereCoccion(str, Enum):
    SI = "SI"
    NO = "NO"


class TiempoPedidoRequest(BaseModel):
    fecha_hora_pedido: datetime
    cantidad_items: int = Field(gt=0)
    total_pedido: float = Field(ge=0)
    pedidos_pendientes: int = Field(ge=0)
    tipo_pedido: TipoPedido
    distancia_km: float = Field(ge=0)
    requiere_coccion: RequiereCoccion


class TiempoPedidoPayload(BaseModel):
    tiempo_estimado_min: float
    tipo_pedido: TipoPedido
    requiere_coccion: RequiereCoccion


router = APIRouter(
    prefix="/tiempo-pedidos",
    tags=["tiempo-pedidos"],
)


@router.post(
    "/estimar",
    status_code=status.HTTP_200_OK,
)
async def estimar_tiempo_pedido_endpoint(
    request: TiempoPedidoRequest,
    _usuario: Annotated[
        UsuarioAutenticado,
        Depends(requerir_usuario_actual),
    ],
):
    try:
        tiempo_estimado = estimar_tiempo_pedido(
            fecha_hora_pedido=request.fecha_hora_pedido,
            cantidad_items=request.cantidad_items,
            total_pedido=request.total_pedido,
            pedidos_pendientes=request.pedidos_pendientes,
            tipo_pedido=request.tipo_pedido.value,
            distancia_km=request.distancia_km,
            requiere_coccion=request.requiere_coccion.value,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error

    return {
        "status": "success",
        "data": TiempoPedidoPayload(
            tiempo_estimado_min=tiempo_estimado,
            tipo_pedido=request.tipo_pedido,
            requiere_coccion=request.requiere_coccion,
        ),
        "message": "Tiempo estimado calculado correctamente.",
    }
