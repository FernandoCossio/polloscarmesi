### 4.3 MS3 - IA, Machine Learning y BI (FastAPI)

#### 4.3.1 Responsabilidad y Contexto de Dominio

MS3 es el microservicio de inteligencia del sistema. Concentra cuatro responsabilidades especializadas e independientes entre sí: verificación visual de comprobantes de pago mediante deep learning, estimación de tiempos de preparación mediante ML supervisado, segmentación de clientes mediante ML no supervisado y exposición de indicadores de inteligencia de negocios para el dashboard del Administrador.

MS3 no gestiona datos transaccionales del negocio. Consume datos de MS1 y MS2 via REST interno para alimentar sus modelos. Expone sus resultados via GraphQL hacia el frontend a través de MS0 (Schema Stitching) y via Redis para integración asíncrona con el flujo de pagos y pedidos.

---

#### 4.3.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework web | FastAPI (Python 3.11+) |
| Servidor ASGI | Uvicorn |
| Deep Learning | TensorFlow 2.x + Keras (modelo CNN exportado como `.h5`) |
| ML Supervisado | Scikit-learn (Random Forest Regressor) |
| ML No Supervisado | Scikit-learn (KMeans + método del codo para K óptimo) |
| Procesamiento de imágenes | Pillow + OpenCV |
| GraphQL servidor | Strawberry GraphQL (`strawberry-graphql[fastapi]`) |
| GraphQL cliente | No aplica — MS3 usa REST interno (`httpx`) para llamadas inter-servicios a MS1 y MS2 |
| ORM | SQLAlchemy (async) + Alembic para migraciones |
| Base de datos | PostgreSQL via `asyncpg` |
| Mensajería Redis | `redis-py` (aioredis) para Pub/Sub asíncrono |
| Serialización | Pydantic v2 |
| Variables de entorno | `python-dotenv` + Pydantic Settings |
| Testing | Pytest + pytest-asyncio |

---

#### 4.3.3 Base de Datos Utilizada

| Almacenamiento | Uso |
|---|---|
| PostgreSQL | Resultados de inferencia del modelo CNN, predicciones de tiempo de preparación, segmentos K-Means por cliente e indicadores BI precalculados. |
| Redis | Canal Pub/Sub para consumir eventos (`pago.registrado`, `pedido.presencial.creado`, `pedido.delivery.creado`) y publicar resultados de inferencia (`comprobante.analizado`, `tiempo.estimado`). |

---

#### 4.3.4 Módulos y Casos de Uso

Los cuatro módulos de MS3 son independientes entre sí y comparten únicamente la infraestructura de base de datos, Redis y los clientes GraphQL.

---

#### 4.3.5 Módulo Deep Learning — Verificación de Comprobantes

**Descripción:**
Clasifica imágenes de comprobantes de pago bolivianos (QR, transferencias bancarias, depósitos) como válidos o inválidos usando un modelo CNN preentrenado con TensorFlow/Keras. El modelo fue entrenado offline con un dataset de comprobantes bolivianos y se carga desde un archivo `.h5` al iniciar MS3.

**Ciclo de inferencia:**
1. MS3 consume el evento `pago.registrado` desde Redis con la URL del comprobante en S3 (sin cambios).
2. MS3 descarga la imagen desde S3 y la preprocesa (redimensión, normalización).
3. El modelo CNN clasifica la imagen y retorna un score de confianza (0.0 - 1.0).
4. Lógica de decisión según el score:
   - Score ≥ 0.85 → resultado `ACEPTADO`
   - Score 0.50 - 0.84 → resultado `REVISION_MANUAL` (escala al Administrador)
   - Score < 0.50 → resultado `RECHAZADO`
5. MS3 persiste el resultado en PostgreSQL con `pagoId`, `score`, `resultado` y `timestamp`.
6. MS3 publica el evento `comprobante.analizado` en Redis con el resultado.

**Casos de uso:**
- Cargar modelo CNN `.h5` al iniciar el servicio (singleton en memoria).
- Preprocesar imagen recibida: redimensionar a 224x224, normalizar píxeles.
- Ejecutar inferencia y calcular score de confianza.
- Persistir resultado de análisis en PostgreSQL.
- Publicar resultado via Redis hacia MS1.
- Exponer endpoint GraphQL para consultar el resultado de un análisis por `pagoId`.

---

#### 4.3.6 Módulo ML Supervisado — Estimación de Tiempos de Preparación

**Descripción:**
Predice el tiempo de preparación en minutos de un pedido usando un modelo Random Forest Regressor entrenado con datos históricos del restaurante. El modelo aprende de variables como cantidad de productos, categorías, horario del día y carga actual de cocina.

**Ciclo de predicción:**
1. MS3 consume los eventos `pedido.presencial.creado` (de MS1) y `pedido.delivery.creado` (de MS2) desde Redis.
2. MS3 extrae las features del pedido: cantidad total de ítems, categorías de productos, hora del día, día de la semana y número de pedidos activos en cocina en ese momento.
3. El modelo Random Forest predice el tiempo de preparación en minutos.
4. MS3 persiste la predicción en PostgreSQL con `pedidoId`, `tiempoPredichoMinutos` y `featuresUsadas`.
5. MS3 publica el evento `tiempo.estimado` en Redis hacia MS1 (si fue `pedido.presencial.creado`) o MS1 y MS2 (si fue `pedido.delivery.creado`).

**Ciclo de entrenamiento:**
- El modelo se entrena offline con datos históricos exportados desde PostgreSQL de MS1.
- El modelo entrenado se serializa con `joblib` y se guarda como archivo `.pkl`.
- MS3 carga el archivo `.pkl` al iniciar (singleton en memoria).
- No hay re-entrenamiento automático en producción en esta versión.

**Casos de uso:**
- Cargar modelo Random Forest `.pkl` al iniciar el servicio.
- Extraer y construir el vector de features desde el payload del evento (`pedido.presencial.creado` o `pedido.delivery.creado`).
- Consultar a MS1 via GraphQL la carga actual de cocina (pedidos en estado `EN_PREPARACION`).
- Ejecutar predicción y persistir resultado en PostgreSQL.
- Publicar tiempo estimado via Redis hacia MS1 y MS2.
- Exponer endpoint GraphQL para consultar la predicción por `pedidoId`.

---

#### 4.3.7 Módulo ML No Supervisado — Segmentación de Clientes

**Descripción:**
Agrupa a los clientes de la app móvil en segmentos comportamentales usando K-Means. El número óptimo de clusters K se determina automáticamente mediante el método del codo (Elbow Method) sobre los datos disponibles. La segmentación se ejecuta bajo demanda cuando el Administrador lo solicita desde el dashboard de BI.

**Features usadas para la segmentación:**
- Frecuencia de pedidos (pedidos por mes).
- Ticket promedio por pedido.
- Horario preferido de pedido (mañana, tarde, noche).
- Zona geográfica de entrega más frecuente.
- Días desde el último pedido (recencia).

**Ciclo de segmentación:**
1. El Administrador solicita el reporte de segmentación desde el panel web → REST a MS0 → MS3.
2. MS3 consulta datos históricos de pedidos y clientes a MS1 via REST interno.
3. MS3 construye la matriz de features por cliente.
4. MS3 aplica el método del codo para determinar K óptimo (rango 2-8 clusters).
5. MS3 ejecuta K-Means con K óptimo y asigna cada cliente a un segmento.
6. MS3 etiqueta los segmentos con nombres descriptivos (ej: "Cliente frecuente alto valor", "Cliente ocasional", "Cliente inactivo").
7. MS3 persiste los resultados en PostgreSQL con `clienteId`, `segmento`, `label` y `fechaEjecucion`.
8. MS3 retorna los segmentos al frontend via REST (a través de MS0).

**Casos de uso:**
- Consultar datos históricos de clientes y pedidos a MS1 via GraphQL.
- Construir y normalizar matriz de features con Scikit-learn.
- Calcular K óptimo mediante el método del codo.
- Ejecutar K-Means y etiquetar segmentos.
- Persistir resultados de segmentación en PostgreSQL.
- Exponer resultados via endpoint REST hacia el dashboard de BI.

---

#### 4.3.8 Módulo BI — Inteligencia de Negocios y Reportes

**Descripción:**
Consolida y expone indicadores de negocio precalculados para el dashboard del Administrador. Los datos se obtienen consultando a MS1 y MS2 via GraphQL y se persisten en PostgreSQL para respuesta rápida.

**Indicadores expuestos:**

| Indicador | Descripción |
|---|---|
| Ventas por período | Total de ventas por día, semana y mes con comparativa de período anterior |
| Productos más vendidos | Ranking de productos por cantidad vendida y por ingresos generados |
| Horarios pico | Distribución de pedidos por hora del día para identificar horas de mayor demanda |
| Zonas de delivery | Mapa de calor por zona geográfica de entregas, agrupadas por frecuencia |
| Segmentación de clientes | Resultados del módulo K-Means integrados en el dashboard |
| Pedidos por canal | Comparativa presencial vs delivery por período |

**Casos de uso:**
- Consultar datos de ventas y pedidos a MS1 y MS2 via GraphQL.
- Precalcular y persistir indicadores en PostgreSQL para respuesta rápida.
- Exponer todos los indicadores via endpoints REST hacia el dashboard del Administrador (a través de MS0).
- Actualizar indicadores precalculados periódicamente (cada hora via tarea programada con `APScheduler`).

---

#### 4.3.9 Estructura de Carpetas y Descripción de Capas

```
ms3-ia-ml-bi/
├── src/
│   ├── comprobantes/                      # Módulo Deep Learning CNN
│   │   ├── router.py                      # Endpoints REST del módulo
│   │   ├── service.py                     # Orquesta preprocesamiento e inferencia
│   │   ├── inference.py                   # Carga del modelo .h5 y lógica de inferencia
│   │   ├── preprocessing.py               # Redimensión, normalización de imagen
│   │   ├── repository.py                  # Persistencia de resultados en PostgreSQL
│   │   └── schemas.py                     # Schemas Pydantic de request/response
│   │
│   ├── tiempos/                           # Módulo ML Supervisado (Random Forest)
│   │   ├── router.py
│   │   ├── service.py                     # Orquesta extracción de features y predicción
│   │   ├── predictor.py                   # Carga del modelo .pkl y lógica de predicción
│   │   ├── features.py                    # Construcción del vector de features
│   │   ├── repository.py                  # Persistencia de predicciones
│   │   └── schemas.py
│   │
│   ├── segmentacion/                      # Módulo ML No Supervisado (K-Means)
│   │   ├── router.py
│   │   ├── service.py                     # Orquesta obtención de datos y ejecución K-Means
│   │   ├── clustering.py                  # Método del codo + K-Means + etiquetado
│   │   ├── features.py                    # Construcción de matriz de features por cliente
│   │   ├── repository.py                  # Persistencia de segmentos
│   │   └── schemas.py
│   │
│   ├── bi/                                # Módulo Business Intelligence
│   │   ├── router.py                      # Endpoints REST de indicadores BI
│   │   ├── service.py                     # Consolidación y cálculo de indicadores
│   │   ├── scheduler.py                   # APScheduler para actualización periódica
│   │   ├── repository.py                  # Lectura y escritura de indicadores precalculados
│   │   └── schemas.py
│   │
│   ├── graphql/                           # Capa GraphQL
│   │   ├── schema.py                      # Schema Strawberry GraphQL de MS3
│   │   ├── resolvers/
│   │   │   ├── comprobantes_resolver.py   # Query: resultado de análisis por pagoId
│   │   │   └── tiempos_resolver.py        # Query: predicción de tiempo por pedidoId
│   │   └── clients/
│   │       ├── ms1_client.py              # Cliente httpx para queries GraphQL a MS1
│   │       └── ms2_client.py              # Cliente httpx para queries GraphQL a MS2
│   │
│   ├── infrastructure/                    # Adaptadores de servicios externos
│   │   ├── redis/
│   │   │   ├── publisher.py               # Publicación de eventos en Redis
│   │   │   └── subscriber.py              # Suscripción a eventos Redis (async)
│   │   ├── s3/
│   │   │   └── s3_client.py               # Descarga de imágenes de comprobantes desde S3
│   │   └── database/
│   │       ├── connection.py              # Configuración de conexión SQLAlchemy async
│   │       └── models.py                  # Modelos SQLAlchemy de todas las tablas de MS3
│   │
│   ├── models/                            # Archivos de modelos ML entrenados (no código)
│   │   ├── cnn_comprobantes.h5            # Modelo CNN TensorFlow/Keras preentrenado
│   │   └── rf_tiempos.pkl                 # Modelo Random Forest serializado con joblib
│   │
│   ├── common/                            # Utilidades transversales
│   │   ├── exceptions.py                  # Excepciones personalizadas
│   │   ├── responses.py                   # Wrapper estándar de respuestas REST
│   │   └── security.py                    # Validación de header X-User-Role
│   │
│   ├── config/
│   │   └── settings.py                    # Configuración via Pydantic Settings
│   │
│   └── main.py                            # Bootstrap FastAPI, registro de routers y GraphQL
│
├── alembic/                               # Migraciones de base de datos
│   └── versions/
├── tests/
├── .env
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

**Descripción de capas:**

- **`router.py`:** Define los endpoints REST del módulo. Recibe requests, valida schemas Pydantic y delega al service. Equivalente al Controller en Spring Boot / NestJS.
- **`service.py`:** Orquesta la lógica de negocio del módulo. Coordina inferencia/predicción, clientes GraphQL, repositorio e infraestructura Redis/S3.
- **`inference.py` / `predictor.py` / `clustering.py`:** Capa de modelos ML. Carga el artefacto entrenado al inicio y expone métodos de inferencia. Completamente desacoplada del resto.
- **`features.py`:** Construcción y transformación del vector de features para alimentar el modelo.
- **`repository.py`:** Acceso a PostgreSQL via SQLAlchemy async. Solo queries de base de datos.
- **`schemas.py`:** Schemas Pydantic para validación de entrada y serialización de respuestas.
- **`graphql/`:** Schema Strawberry para exponer resultados de IA al frontend via MS0 (Schema Stitching). Los clientes REST consumen datos históricos de MS1 y MS2.
- **`infrastructure/`:** Adaptadores desacoplados para Redis, S3 y PostgreSQL.
- **`models/`:** Directorio de artefactos ML. Los archivos `.h5` y `.pkl` se montan en el contenedor Docker.

---

#### 4.3.10 Esquema GraphQL (Queries expuestos a MS1 y MS2)

MS3 expone un endpoint GraphQL en `/graphql` consumido por MS0 via Schema Stitching. El frontend accede a estas operaciones a través del Superschema unificado de MS0. Los tipos y operaciones aquí definidos son la fuente de verdad del dominio de IA y BI.

```graphql
type Query {
  # Resultados de verificación de comprobantes
  obtenerResultadoComprobante(pagoId: ID!): ResultadoComprobante

  # Predicciones de tiempo de preparación
  obtenerTiempoEstimado(pedidoId: ID!): TiempoEstimado

  # Segmentación de clientes (último resultado disponible)
  obtenerSegmentosClientes: [SegmentoCliente!]!
  obtenerSegmentoCliente(clienteId: ID!): SegmentoCliente
}

type ResultadoComprobante {
  pagoId: ID!
  resultado: ResultadoAnalisis!
  scoreConfianza: Float!
  timestamp: String!
}

type TiempoEstimado {
  pedidoId: ID!
  tiempoPredichoMinutos: Int!
  featuresUsadas: String
  timestamp: String!
}

type SegmentoCliente {
  clienteId: ID!
  segmento: Int!
  label: String!
  fechaEjecucion: String!
}

enum ResultadoAnalisis {
  ACEPTADO
  RECHAZADO
  REVISION_MANUAL
}
```

---

#### 4.3.11 Endpoints REST expuestos hacia MS0

| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| GET | `/api/v1/bi/ventas` | Indicadores de ventas por período | Administrador |
| GET | `/api/v1/bi/productos` | Ranking de productos más vendidos | Administrador |
| GET | `/api/v1/bi/horarios` | Distribución de pedidos por hora del día | Administrador |
| GET | `/api/v1/bi/zonas` | Mapa de frecuencia de zonas de delivery | Administrador |
| GET | `/api/v1/bi/canales` | Comparativa presencial vs delivery | Administrador |
| POST | `/api/v1/segmentacion/ejecutar` | Ejecutar segmentación K-Means bajo demanda | Administrador |
| GET | `/api/v1/segmentacion/resultados` | Obtener últimos resultados de segmentación | Administrador |
| GET | `/api/v1/comprobantes/{pagoId}` | Consultar resultado de análisis de comprobante | Administrador, Cajero |

---

#### 4.3.12 Eventos publicados / consumidos

| Acción | Canal Redis | Tipo | Payload principal |
|---|---|---|---|
| **Consume** | `pago.registrado` | Suscriptor | `pagoId`, `comprobanteUrl` — dispara inferencia CNN |
| **Consume** | `pedido.presencial.creado` | Suscriptor | `pedidoId`, `productos`, `cantidadItems`, `hora` — dispara predicción RF |
| **Consume** | `pedido.delivery.creado` | Suscriptor | `pedidoId`, `productos`, `cantidadItems`, `hora`, `coordenadasEntrega` — dispara predicción RF |
| **Publica** | `comprobante.analizado` | Publicador | `pagoId`, `resultado`, `scoreConfianza` |
| **Publica** | `tiempo.estimado` | Publicador | `pedidoId`, `tiempoPredichoMinutos` |

---

#### 4.3.13 Variables de Entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 8000) |
| `DATABASE_URL` | URL de conexión PostgreSQL async (`postgresql+asyncpg://...`) |
| `REDIS_URL` | URL de conexión Redis (`redis://:password@host:port`) |
| `AWS_REGION` | Región AWS |
| `AWS_ACCESS_KEY_ID` | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS |
| `AWS_S3_BUCKET_NAME` | Bucket S3 para descarga de imágenes de comprobantes |
| `MS1_REST_INTERNAL_URL` | URL interna REST de MS1 para comunicación inter-servicios |
| `MS2_REST_INTERNAL_URL` | URL interna REST de MS2 para comunicación inter-servicios |
| `CNN_MODEL_PATH` | Ruta al archivo del modelo CNN (`/app/models/cnn_comprobantes.h5`) |
| `RF_MODEL_PATH` | Ruta al archivo del modelo Random Forest (`/app/models/rf_tiempos.pkl`) |
| `CNN_CONFIDENCE_THRESHOLD_ACCEPT` | Umbral de confianza para ACEPTADO (default: 0.85) |
| `CNN_CONFIDENCE_THRESHOLD_REVIEW` | Umbral mínimo para REVISION_MANUAL (default: 0.50) |
| `BI_REFRESH_INTERVAL_MINUTES` | Intervalo de actualización de indicadores BI precalculados (default: 60) |

---