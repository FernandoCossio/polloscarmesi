from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
import tensorflow as tf
from PIL import Image, UnidentifiedImageError

from app.core.logging import get_logger

logger = get_logger("ComprobantesService")

PROJECT_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_DIR
    / "artifacts"
    / "comprobantes_model.keras"
)

CLASS_NAMES_PATH = (
    PROJECT_DIR
    / "artifacts"
    / "comprobantes_class_names.txt"
)

modelo_comprobantes: Any | None = None
class_names: list[str] = []

UMBRAL_CONFIANZA = 0.65

CLASES_REVISION_MANUAL = {
    "imagen_borrosa",
    "revision_manual",
}


def init_comprobantes_service() -> None:
    """Carga el modelo de comprobantes una sola vez al iniciar FastAPI."""
    global modelo_comprobantes
    global class_names

    if modelo_comprobantes is not None:
        return

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"No se encontró el modelo de comprobantes en: {MODEL_PATH}"
        )

    if not CLASS_NAMES_PATH.exists():
        raise FileNotFoundError(
            f"No se encontró el archivo de clases en: {CLASS_NAMES_PATH}"
        )

    class_names = [
        linea.strip()
        for linea in CLASS_NAMES_PATH.read_text(
            encoding="utf-8"
        ).splitlines()
        if linea.strip()
    ]

    if not class_names:
        raise ValueError(
            "El archivo de clases de comprobantes está vacío."
        )

    logger.info("Cargando modelo Deep Learning de comprobantes...")

    modelo_comprobantes = tf.keras.models.load_model(
        MODEL_PATH,
        compile=False,
    )

    cantidad_salidas = int(
        modelo_comprobantes.output_shape[-1]
    )

    if cantidad_salidas != len(class_names):
        raise ValueError(
            "La cantidad de salidas del modelo no coincide "
            "con la cantidad de clases configuradas."
        )

    logger.info(
        "Modelo Deep Learning cargado correctamente ✓ "
        f"Clases: {class_names}"
    )


def analizar_comprobante(
    contenido_archivo: bytes,
) -> dict[str, Any]:
    """
    Clasifica una imagen y devuelve la decisión final del sistema.

    El modelo ya contiene internamente:
    - recorte inferior;
    - redimensionamiento;
    - augmentación desactivada durante inferencia;
    - preprocesamiento de MobileNetV2.
    """
    if modelo_comprobantes is None:
        raise RuntimeError(
            "El modelo de comprobantes todavía no fue inicializado."
        )

    try:
        imagen = Image.open(
            BytesIO(contenido_archivo)
        ).convert("RGB")
    except UnidentifiedImageError as error:
        raise ValueError(
            "El archivo enviado no contiene una imagen válida."
        ) from error

    imagen = imagen.resize((224, 224))

    imagen_array = np.asarray(
        imagen,
        dtype=np.float32,
    )

    imagen_array = np.expand_dims(
        imagen_array,
        axis=0,
    )

    predicciones = modelo_comprobantes.predict(
        imagen_array,
        verbose=0,
    )[0]

    indice_predicho = int(
        np.argmax(predicciones)
    )

    clase_predicha = class_names[
        indice_predicho
    ]

    confianza = float(
        predicciones[indice_predicho]
    )

    probabilidades_por_clase = {
        nombre_clase: round(
            float(probabilidad),
            4,
        )
        for nombre_clase, probabilidad in zip(
            class_names,
            predicciones,
        )
    }

    if clase_predicha == "no_es_comprobante":
        decision = "RECHAZADO"
        requiere_revision_manual = False
        formato_detectado = None

    elif (
        clase_predicha in CLASES_REVISION_MANUAL
        or confianza < UMBRAL_CONFIANZA
    ):
        decision = "REVISION_MANUAL"
        requiere_revision_manual = True
        formato_detectado = None

    else:
        decision = "FORMATO_DETECTADO"
        requiere_revision_manual = False
        formato_detectado = clase_predicha

    return {
        "clase_visual_predicha": clase_predicha,
        "confianza": round(confianza, 4),
        "confianza_porcentaje": round(
            confianza * 100,
            2,
        ),
        "decision": decision,
        "requiere_revision_manual": (
            requiere_revision_manual
        ),
        "formato_detectado": formato_detectado,
        "probabilidades_por_clase": (
            probabilidades_por_clase
        ),
    }