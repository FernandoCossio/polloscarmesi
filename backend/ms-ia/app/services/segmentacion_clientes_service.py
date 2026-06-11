from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.core.logging import get_logger

logger = get_logger("SegmentacionClientesService")

PROJECT_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = (
    PROJECT_DIR
    / "artifacts"
    / "segmentacion_clientes_bundle_v3.pkl"
)

bundle_segmentacion: dict[str, Any] | None = None


def init_segmentacion_clientes_service() -> None:
    """Carga el bundle híbrido una sola vez al iniciar FastAPI."""
    global bundle_segmentacion

    if bundle_segmentacion is not None:
        return

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"No se encontró el bundle de segmentación en: {MODEL_PATH}"
        )

    logger.info("Cargando bundle híbrido de segmentación de clientes...")

    bundle_cargado = joblib.load(MODEL_PATH)

    claves_obligatorias = {
        "version_modelo",
        "modelo",
        "scaler",
        "features_modelo",
        "mapa_segmentos_estable",
        "mapa_cluster_kmeans",
        "max_pedidos_cliente_nuevo",
        "umbral_inactivo_dias",
        "min_pedidos_promocion",
        "umbral_uso_promociones",
        "limites_clip",
    }

    claves_faltantes = claves_obligatorias - set(bundle_cargado.keys())

    if claves_faltantes:
        raise ValueError(
            "El bundle de segmentación está incompleto. "
            f"Faltan las claves: {sorted(claves_faltantes)}"
        )

    bundle_segmentacion = bundle_cargado

    logger.info(
        "Bundle de segmentación cargado correctamente ✓ "
        f"Versión: {bundle_segmentacion['version_modelo']}"
    )


def clasificar_cliente(
    cantidad_pedidos: int,
    ticket_promedio: float,
    dias_desde_ultima_compra: int,
    cantidad_pedidos_promocion: int,
) -> dict[str, Any]:
    """
    Clasifica un cliente utilizando reglas de negocio y K-Means.

    Las reglas se aplican antes del modelo:
    1. Cliente inactivo.
    2. Cliente nuevo o poco recurrente.
    3. Cliente sensible a promociones.
    4. Cliente frecuente u ocasional mediante K-Means.
    """
    if bundle_segmentacion is None:
        raise RuntimeError(
            "El bundle de segmentación todavía no fue inicializado."
        )

    if cantidad_pedidos <= 0:
        raise ValueError(
            "cantidad_pedidos debe ser mayor que cero."
        )

    if ticket_promedio < 0:
        raise ValueError(
            "ticket_promedio no puede ser negativo."
        )

    if dias_desde_ultima_compra < 0:
        raise ValueError(
            "dias_desde_ultima_compra no puede ser negativo."
        )

    if (
        cantidad_pedidos_promocion < 0
        or cantidad_pedidos_promocion > cantidad_pedidos
    ):
        raise ValueError(
            "cantidad_pedidos_promocion no es válida."
        )

    uso_promociones = (
        cantidad_pedidos_promocion
        / cantidad_pedidos
    )

    # Regla 1: cliente inactivo
    if (
        dias_desde_ultima_compra
        > bundle_segmentacion["umbral_inactivo_dias"]
    ):
        return {
            "numero_segmento": 3,
            "etiqueta_segmento": (
                bundle_segmentacion[
                    "mapa_segmentos_estable"
                ][3]
            ),
            "origen_segmentacion": "REGLA_NEGOCIO",
            "cluster_kmeans": None,
            "distancia_al_centroide": None,
        }

    # Regla 2: cliente nuevo o poco recurrente
    if (
        cantidad_pedidos
        <= bundle_segmentacion[
            "max_pedidos_cliente_nuevo"
        ]
    ):
        return {
            "numero_segmento": 0,
            "etiqueta_segmento": (
                bundle_segmentacion[
                    "mapa_segmentos_estable"
                ][0]
            ),
            "origen_segmentacion": "REGLA_NEGOCIO",
            "cluster_kmeans": None,
            "distancia_al_centroide": None,
        }

    # Regla 3: cliente sensible a promociones
    if (
        cantidad_pedidos_promocion
        >= bundle_segmentacion[
            "min_pedidos_promocion"
        ]
        and uso_promociones
        >= bundle_segmentacion[
            "umbral_uso_promociones"
        ]
    ):
        return {
            "numero_segmento": 4,
            "etiqueta_segmento": (
                bundle_segmentacion[
                    "mapa_segmentos_estable"
                ][4]
            ),
            "origen_segmentacion": "REGLA_NEGOCIO",
            "cluster_kmeans": None,
            "distancia_al_centroide": None,
        }

    # Clientes restantes: clasificación con K-Means
    fila = pd.DataFrame(
        [
            {
                "cantidad_pedidos": cantidad_pedidos,
                "ticket_promedio": ticket_promedio,
                "dias_desde_ultima_compra": (
                    dias_desde_ultima_compra
                ),
            }
        ]
    )

    limites_clip = bundle_segmentacion["limites_clip"]

    fila["cantidad_pedidos_clip"] = (
        fila["cantidad_pedidos"]
        .clip(
            lower=limites_clip["cantidad_pedidos"][0],
            upper=limites_clip["cantidad_pedidos"][1],
        )
    )

    fila["ticket_promedio_clip"] = (
        fila["ticket_promedio"]
        .clip(
            lower=limites_clip["ticket_promedio"][0],
            upper=limites_clip["ticket_promedio"][1],
        )
    )

    fila["log_cantidad_pedidos"] = np.log1p(
        fila["cantidad_pedidos_clip"]
    )

    fila["log_ticket_promedio"] = np.log1p(
        fila["ticket_promedio_clip"]
    )

    fila_escalada = (
        bundle_segmentacion["scaler"]
        .transform(
            fila[
                bundle_segmentacion[
                    "features_modelo"
                ]
            ]
        )
    )

    cluster_kmeans = int(
        bundle_segmentacion["modelo"]
        .predict(fila_escalada)[0]
    )

    informacion_segmento = (
        bundle_segmentacion[
            "mapa_cluster_kmeans"
        ][cluster_kmeans]
    )

    distancia_al_centroide = float(
        bundle_segmentacion["modelo"]
        .transform(fila_escalada)[0][cluster_kmeans]
    )

    return {
        "numero_segmento": (
            informacion_segmento["numero_segmento"]
        ),
        "etiqueta_segmento": (
            informacion_segmento["etiqueta_segmento"]
        ),
        "origen_segmentacion": "KMEANS",
        "cluster_kmeans": cluster_kmeans,
        "distancia_al_centroide": round(
            distancia_al_centroide,
            4,
        ),
    }