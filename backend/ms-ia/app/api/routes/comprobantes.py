from typing import Annotated

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
    status,
)
from starlette.concurrency import run_in_threadpool

from app.services.comprobantes_service import (
    analizar_comprobante,
)

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)

from app.core.security import (
    UsuarioAutenticado,
    requerir_usuario_actual,
)

router = APIRouter(
    prefix="/comprobantes",
    tags=["comprobantes"],
)

TIPOS_IMAGEN_PERMITIDOS = {
    "image/jpeg",
    "image/png",
}

TAMANIO_MAXIMO_BYTES = 5 * 1024 * 1024


@router.post(
    "/analizar",
    status_code=status.HTTP_200_OK,
)
async def analizar_comprobante_endpoint(
    archivo: Annotated[
        UploadFile,
        File(
            description=(
                "Imagen JPG, JPEG o PNG del comprobante de pago."
            )
        ),
    ],
    _usuario: Annotated[
        UsuarioAutenticado,
        Depends(requerir_usuario_actual),
    ],
):
    if archivo.content_type not in TIPOS_IMAGEN_PERMITIDOS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                "Formato no permitido. "
                "Debe enviar una imagen JPG, JPEG o PNG."
            ),
        )

    contenido = await archivo.read()

    if not contenido:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo enviado está vacío.",
        )

    if len(contenido) > TAMANIO_MAXIMO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                "La imagen supera el límite permitido de 5 MB."
            ),
        )

    try:
        resultado = await run_in_threadpool(
            analizar_comprobante,
            contenido,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    return {
        "status": "success",
        "data": {
            "nombre_archivo": archivo.filename,
            **resultado,
        },
        "message": "Comprobante analizado correctamente.",
    }