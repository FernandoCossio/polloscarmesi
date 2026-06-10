from __future__ import annotations

import base64
import json
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib import request

from app.core.config import (
    AUTH_BASE_URL,
    INTERNAL_AUTH_CACHE_SKEW_SECONDS,
    INTERNAL_AUTH_CLIENT_ID,
    INTERNAL_AUTH_CLIENT_SECRET,
)
from app.core.logging import get_logger

logger = get_logger("InternalAuthService")


@dataclass
class InternalAuthService:
    auth_base_url: str
    client_id: str
    client_secret: str
    cache_skew_seconds: int

    def __post_init__(self) -> None:
        self._cached_access_token: str | None = None
        self._cached_expires_at: datetime | None = None
        self._lock = threading.Lock()

    def get_access_token(self) -> str:
        with self._lock:
            if self._has_valid_cached_token():
                return self._cached_access_token or ""

            if not self.client_secret:
                raise RuntimeError(
                    "La credencial interna no esta configurada en INTERNAL_AUTH_CLIENT_SECRET."
                )

            payload = json.dumps(
                {
                    "clientId": self.client_id,
                    "clientSecret": self.client_secret,
                }
            ).encode("utf-8")
            token_request = request.Request(
                url=f"{self.auth_base_url}/auth/service-token",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            with request.urlopen(token_request, timeout=10) as response:
                response_body = json.loads(response.read().decode("utf-8"))

            access_token = self._extract_access_token(response_body)
            self._cached_access_token = access_token
            self._cached_expires_at = self._extract_expiration(access_token)

            logger.debug(
                "Token tecnico actualizado para %s.", self.client_id
            )
            return access_token

    def get_authorization_header(self) -> str:
        return f"Bearer {self.get_access_token()}"

    def _has_valid_cached_token(self) -> bool:
        if (
            self._cached_access_token is None
            or self._cached_expires_at is None
        ):
            return False

        now = datetime.now(timezone.utc)
        return now.timestamp() < (
            self._cached_expires_at.timestamp() - self.cache_skew_seconds
        )

    def _extract_access_token(self, response_body: dict[str, Any]) -> str:
        access_token = response_body.get("data", {}).get("accessToken")
        if not isinstance(access_token, str) or not access_token.strip():
            raise RuntimeError(
                "Auth no devolvio un accessToken tecnico valido."
            )
        return access_token

    def _extract_expiration(self, access_token: str) -> datetime:
        try:
            parts = access_token.split(".")
            if len(parts) != 3:
                return datetime.now(timezone.utc)

            payload_part = parts[1]
            padding = "=" * (-len(payload_part) % 4)
            payload_data = base64.urlsafe_b64decode(payload_part + padding)
            payload = json.loads(payload_data.decode("utf-8"))
            exp = payload.get("exp")

            if isinstance(exp, int | float) and exp > 0:
                return datetime.fromtimestamp(exp, tz=timezone.utc)
        except Exception as error:
            logger.warning(
                "No se pudo leer la expiracion del token tecnico: %s",
                str(error),
            )

        return datetime.now(timezone.utc)


internal_auth_service: InternalAuthService | None = None


def init_internal_auth_service() -> None:
    global internal_auth_service
    internal_auth_service = InternalAuthService(
        auth_base_url=AUTH_BASE_URL,
        client_id=INTERNAL_AUTH_CLIENT_ID,
        client_secret=INTERNAL_AUTH_CLIENT_SECRET,
        cache_skew_seconds=INTERNAL_AUTH_CACHE_SKEW_SECONDS,
    )


def get_internal_auth_service() -> InternalAuthService:
    if internal_auth_service is None:
        raise RuntimeError(
            "InternalAuthService no ha sido inicializado en el lifespan."
        )
    return internal_auth_service
