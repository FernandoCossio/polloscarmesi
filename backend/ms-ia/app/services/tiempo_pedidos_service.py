from datetime import datetime
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from app.core.logging import get_logger

logger = get_logger("TiempoPedidosService")

PROJECT_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = PROJECT_DIR / "artifacts" / "tiempo_pedidos_model.pkl"

modelo_tiempo_pedidos: Any | None = None


def init_tiempo_pedidos_service() -> None:
    """Carga el Pipeline entrenado una sola vez al iniciar FastAPI."""
    global modelo_tiempo_pedidos

    if modelo_tiempo_pedidos is not None:
        return

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"No se encontró el modelo supervisado en: {MODEL_PATH}"
        )

    logger.info("Cargando modelo supervisado de tiempos de pedidos...")
    modelo_tiempo_pedidos = joblib.load(MODEL_PATH)
    logger.info("Modelo supervisado cargado correctamente ✓")


def preparar_pedido_nuevo(
    fecha_hora_pedido: datetime,
    cantidad_items: int,
    total_pedido: float,
    pedidos_pendientes: int,
    tipo_pedido: str,
    distancia_km: float,
    requiere_coccion: str,
) -> pd.DataFrame:
    """Transforma un pedido nuevo al formato utilizado durante el entrenamiento."""
    dias_es = {
        0: "LUNES",
        1: "MARTES",
        2: "MIERCOLES",
        3: "JUEVES",
        4: "VIERNES",
        5: "SABADO",
        6: "DOMINGO",
    }

    return pd.DataFrame(
        [
            {
                "cantidad_items": cantidad_items,
                "total_pedido": total_pedido,
                "minutos_del_dia": (
                    fecha_hora_pedido.hour * 60
                    + fecha_hora_pedido.minute
                ),
                "dia_semana": dias_es[fecha_hora_pedido.weekday()],
                "pedidos_pendientes": pedidos_pendientes,
                "tipo_pedido": tipo_pedido,
                "distancia_km": distancia_km,
                "requiere_coccion": requiere_coccion,
            }
        ]
    )


def estimar_tiempo_pedido(
    fecha_hora_pedido: datetime,
    cantidad_items: int,
    total_pedido: float,
    pedidos_pendientes: int,
    tipo_pedido: str,
    distancia_km: float,
    requiere_coccion: str,
) -> float:
    """Predice el tiempo estimado de preparación o entrega en minutos."""
    if modelo_tiempo_pedidos is None:
        raise RuntimeError(
            "El modelo de tiempos de pedidos todavía no fue inicializado."
        )

    pedido_df = preparar_pedido_nuevo(
        fecha_hora_pedido=fecha_hora_pedido,
        cantidad_items=cantidad_items,
        total_pedido=total_pedido,
        pedidos_pendientes=pedidos_pendientes,
        tipo_pedido=tipo_pedido,
        distancia_km=distancia_km,
        requiere_coccion=requiere_coccion,
    )

    prediccion = modelo_tiempo_pedidos.predict(pedido_df)[0]

    return round(float(prediccion), 2)