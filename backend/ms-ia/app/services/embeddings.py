from typing import List, Dict, Any
import re
import unicodedata
import numpy as np
from FlagEmbedding import BGEM3FlagModel
from datetime import datetime
from app.core.embedding_model import get_embedding_model
from app.models.schemas import MatchResult


class EmbeddingService:
    def __init__(self, model_instance: BGEM3FlagModel) -> None:
        self.model = model_instance
        self.basura_rrhh: List[str] = []
        self.w_dense: float = 0.6
        self.w_sparse: float = 0.4

    def limpiar_texto(self, texto_bruto: str) -> str:
        if not texto_bruto:
            return ""
        texto = unicodedata.normalize("NFKC", texto_bruto)
        texto = texto.lower()
        texto = re.sub(r"\S+@\S+", " ", texto)
        texto = re.sub(r"http\S+|www\S+", " ", texto)
        texto = re.sub(r"[^\w\s\.,+#\-\/]", " ", texto)
        for basura in self.basura_rrhh:
            texto = texto.replace(basura, " ")
        texto = re.sub(r"\s+", " ", texto).strip()
        return texto

    def limpiar_texto_estructurado(self, texto_bruto: str) -> str:
        if not texto_bruto:
            return ""
        texto = unicodedata.normalize("NFKC", texto_bruto)
        texto = texto.lower()
        texto = re.sub(r"\S+@\S+", " ", texto)
        texto = re.sub(r"http\S+|www\S+", " ", texto)
        texto = re.sub(r"[^\w\s\.,+#\-\/]", " ", texto)
        for basura in self.basura_rrhh:
            texto = texto.replace(basura, " ")
        lines = texto.split("\n")
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in lines]
        texto = "\n".join(lines)
        texto = re.sub(r"\n{3,}", "\n\n", texto).strip()
        return texto

    def sparse_dot(self, lw_query: Dict[str, float], lw_item: Dict[str, float]) -> float:
        return sum(peso * lw_item[token] for token, peso in lw_query.items() if token in lw_item)

    def experiencia_vacante_a_texto(self, exp_str: str) -> str:
        if not exp_str:
            return ""
        exp_str = exp_str.strip().lower()
        match = re.search(r"(\d+)\s*a", exp_str)
        if match:
            años = match.group(1)
            return f"requiere {años} años de experiencia profesional"
        return f"nivel de experiencia requerido: {exp_str}"

    def serializar_vacante_final(self, vacante_json: Dict[str, Any]) -> str:
        titulo = self.limpiar_texto(vacante_json.get("titulo", ""))
        descripcion = self.limpiar_texto_estructurado(vacante_json.get("descripcion", ""))
        tipo = self.limpiar_texto(vacante_json.get("tipo", ""))
        experiencia_raw = vacante_json.get("experiencia", "")
        experiencia_txt = self.limpiar_texto(self.experiencia_vacante_a_texto(experiencia_raw))
        texto_final = f"""
        Oferta laboral:
        Tipo de posición: {tipo}

        Título del puesto:
        {titulo}

        Experiencia requerida:
        {experiencia_txt}

        Descripción del puesto:
        {descripcion}
        """
        return texto_final.strip()

    def calcular_duracion_meses(self, fecha_inicio: str, fecha_fin: str):
        try:
            inicio = datetime.strptime(fecha_inicio, "%Y-%m-%d")
            fin = datetime.strptime(fecha_fin, "%Y-%m-%d")
            return (fin.year - inicio.year) * 12 + (fin.month - inicio.month)
        except:
            return None

    def experiencia_a_texto(self, exp: Dict[str, Any]) -> str:
        cargo = exp.get("cargo", "")
        empresa = exp.get("nombre_empresa", "")
        tipo = exp.get("tipo_experiencia", "").lower()
        fecha_inicio = exp.get("fecha_inicio")
        fecha_fin = exp.get("fecha_finalizacion")
        duracion = None
        if fecha_inicio and fecha_fin:
            duracion = self.calcular_duracion_meses(fecha_inicio, fecha_fin)
        if duracion:
            return f"{cargo} en {empresa} durante {duracion} meses experiencia {tipo}"
        else:
            return f"{cargo} en {empresa} experiencia {tipo}"

    def formacion_a_texto(self, edu: Dict[str, Any]) -> str:
        titulo = edu.get("titulo", "")
        centro = edu.get("centro_estudio", "")
        fecha = edu.get("fecha_finalizacion")
        if fecha:
            return f"{titulo} graduado en {fecha} en {centro}"
        else:
            return f"{titulo} en curso en {centro}"

    def logro_a_texto(self, logro: Dict[str, Any]) -> str:
        nombre = logro.get("nombre", "")
        fecha = logro.get("fecha")
        if not fecha:
            return nombre
        try:
            year = int(str(fecha)[:4])
            current_year = datetime.now().year
            if current_year - year <= 2:
                return f"{nombre} certificación reciente"
            else:
                return f"{nombre} obtenido en {year}"
        except:
            return nombre

    def serializar_cv_final(self, data_json: Dict[str, Any]) -> str:
        cv = data_json.get("cv_digital", {})
        perfil = self.limpiar_texto(cv.get("resumen_perfil", ""))
        skills = self.limpiar_texto(" ".join([h.get("nombre", "") for h in cv.get("habilidades", [])]))
        formacion = self.limpiar_texto(" ".join([self.formacion_a_texto(edu) for edu in cv.get("formacion_academica", [])]))
        idiomas = self.limpiar_texto(" ".join([f"{i.get('nombre')} nivel {i.get('nivel')}" if i.get('nivel') else i.get('nombre', '')for i in cv.get("idiomas", [])]))
        logros = self.limpiar_texto(" ".join([self.logro_a_texto(l) for l in cv.get("logro_personal", [])]))
        experiencia = self.limpiar_texto(" ".join([self.experiencia_a_texto(e) for e in cv.get("experiencia", [])]))
        texto_final = f"""
        Perfil profesional:
        {perfil}

        Habilidades técnicas:
        {skills}

        Formación académica:
        {formacion}

        Idiomas:
        {idiomas}

        Logros y certificaciones:
        {logros}

        Experiencia profesional:
        {experiencia}
        """
        return texto_final.strip()

    def calcular_similitud_final(
        self,
        json_cv: Dict[str, Any],
        dense_vec: np.ndarray,
        lw_vacante: Dict[str, float],
        id_oferta: int | str,
    ) -> MatchResult:
        texto_cv = self.serializar_cv_final(json_cv)
        output_cv = self.model.encode(
            [texto_cv],
            batch_size=1,
            max_length=2048,
            return_dense=True,
            return_sparse=True,
            return_colbert_vecs=False,
        )
        emb_cv_dense = output_cv["dense_vecs"][0]
        lw_cv = output_cv["lexical_weights"][0]
        dense_score = float(dense_vec @ emb_cv_dense)
        sparse_score = float(self.sparse_dot(lw_cv, lw_vacante))
        score_final = self.w_dense * dense_score + self.w_sparse * sparse_score
        
        return MatchResult(
            idOferta=int(id_oferta),
            idPersona=int(json_cv.get("id_persona", 0)),
            score=round(score_final * 100, 2),
            dense=round(dense_score * 100, 2),
            sparse=round(sparse_score * 100, 2),
        )


embedding_service: EmbeddingService | None = None


def init_embedding_service():
    """Inicializa la instancia global del servicio de embeddings."""
    global embedding_service
    embedding_service = EmbeddingService(get_embedding_model())


def get_embedding_service() -> EmbeddingService:
    """Retorna la instancia global del servicio, lanzando error si no está inicializada."""
    if embedding_service is None:
        raise RuntimeError("EmbeddingService no ha sido inicializado en el lifespan.")
    return embedding_service


