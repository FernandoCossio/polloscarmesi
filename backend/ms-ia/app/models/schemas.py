from typing import Any, List, Optional
from pydantic import BaseModel

class Habilidad(BaseModel):
    nombre: str

class Idioma(BaseModel):
    nombre: str
    nivel: Optional[str] = None

class Formacion(BaseModel):
    titulo: str
    fecha_finalizacion: Optional[str] = None
    centro_estudio: Optional[str] = None

class Experiencia(BaseModel):
    nombre_empresa: Optional[str] = None
    cargo: Optional[str] = None
    fecha_inicio: Optional[str] = None
    fecha_finalizacion: Optional[str] = None
    tipo_experiencia: Optional[str] = None

class Logro(BaseModel):
    nombre: str
    fecha: Optional[str] = None

class CvDigital(BaseModel):
    resumen_perfil: Optional[str] = ""
    habilidades: List[Habilidad] = []
    idiomas: List[Idioma] = []
    formacion_academica: List[Formacion] = []
    experiencia: List[Experiencia] = []
    logro_personal: List[Logro] = []

class CV(BaseModel):
    id_persona: int
    cv_digital: CvDigital

class Vacante(BaseModel):
    id_oferta: int
    titulo: str = None
    tipo: str = None
    experiencia: Optional[str] = None
    descripcion: Optional[str] = None

class VacanteEmbeddingRequest(BaseModel):
    vacantes: List[Vacante]

class MatchSingleRequest(BaseModel):
    cv: CV
    id_oferta: int

class MatchResult(BaseModel):
    idOferta: int
    idPersona: int
    score: float
    dense: float
    sparse: float

class RespuestaAPI(BaseModel):
    status: str
    data: Any
    message: Optional[str] = None
