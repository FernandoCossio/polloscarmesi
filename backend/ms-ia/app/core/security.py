import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

import jwt
from fastapi import HTTPException, Request, status
from fastapi.security.utils import get_authorization_scheme_param
from graphql import GraphQLError
from strawberry.types import Info

PROJECT_DIR = Path(__file__).resolve().parents[2]

JWT_ISSUER = os.getenv(
    "JWT_ISSUER",
    "restaurante",
)

JWT_PUBLIC_KEY_PATH_RAW = os.getenv(
    "JWT_PUBLIC_KEY_PATH",
    "certs/public.pem",
)


@dataclass(frozen=True)
class UsuarioAutenticado:
    user_id: str
    roles: tuple[str, ...]
    claims: dict[str, Any]


def obtener_ruta_llave_publica() -> Path:
    ruta = Path(JWT_PUBLIC_KEY_PATH_RAW)

    if ruta.is_absolute():
        return ruta

    return PROJECT_DIR / ruta


@lru_cache
def obtener_llave_publica() -> str:
    ruta = obtener_ruta_llave_publica()

    if not ruta.exists():
        raise FileNotFoundError(
            f"No se encontró la llave pública JWT en: {ruta}"
        )

    return ruta.read_text(
        encoding="utf-8",
    )


def validar_configuracion_jwt() -> None:
    """
    Comprueba al iniciar FastAPI que la llave pública JWT exista
    y pueda leerse correctamente.
    """
    obtener_llave_publica()


def decodificar_token(
    token: str,
) -> UsuarioAutenticado:
    try:
        claims = jwt.decode(
            token,
            obtener_llave_publica(),
            algorithms=[
                "RS256",
                "RS512",
            ],
            issuer=JWT_ISSUER,
            options={
                "require": [
                    "iss",
                    "iat",
                    "exp",
                    "sub",
                ]
            },
        )
    except jwt.ExpiredSignatureError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token JWT ha expirado.",
        ) from error

    except jwt.InvalidTokenError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token JWT no es válido.",
        ) from error

    user_id = claims.get("sub")

    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token JWT no contiene un usuario válido.",
        )

    roles_raw = claims.get(
        "roles",
        [],
    )

    if not isinstance(roles_raw, list):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token JWT contiene roles inválidos.",
        )

    roles = tuple(
        rol
        for rol in roles_raw
        if isinstance(rol, str)
    )

    return UsuarioAutenticado(
        user_id=user_id,
        roles=roles,
        claims=claims,
    )


def obtener_token_desde_request(
    request: Request,
) -> str | None:
    authorization = request.headers.get(
        "Authorization"
    )

    scheme, credentials = (
        get_authorization_scheme_param(
            authorization,
        )
    )

    if (
        scheme.lower() != "bearer"
        or not credentials
    ):
        return None

    return credentials


def obtener_usuario_opcional(
    request: Request,
) -> UsuarioAutenticado | None:
    token = obtener_token_desde_request(
        request
    )

    if token is None:
        return None

    try:
        return decodificar_token(token)
    except HTTPException:
        return None


def requerir_usuario_actual(
    request: Request,
) -> UsuarioAutenticado:
    token = obtener_token_desde_request(
        request
    )

    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Debe enviar un token JWT mediante "
                "Authorization: Bearer <token>."
            ),
        )

    return decodificar_token(token)


async def crear_contexto_graphql(
    request: Request,
) -> dict[str, Any]:
    return {
        "request": request,
        "usuario_actual": obtener_usuario_opcional(
            request
        ),
    }


def requerir_usuario_graphql(
    info: Info,
) -> UsuarioAutenticado:
    usuario = info.context.get(
        "usuario_actual"
    )

    if usuario is None:
        raise GraphQLError(
            "No autenticado. Debe enviar un token JWT válido."
        )

    return usuario