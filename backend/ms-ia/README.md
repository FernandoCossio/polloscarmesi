# Servicio IA 

Microservicio `ms-ia` del proyecto **Pollos Carmesí**. Expone capacidades de IA para:

- Clasificación de comprobantes a partir de imágenes (REST).
- Estimación de tiempo de preparación/entrega de pedidos (GraphQL).
- Segmentación de clientes usando reglas + K-Means (GraphQL).

## 1. Descripción del proyecto

Este servicio corre con **FastAPI** y expone:

- **REST** bajo `/api` (por ahora: comprobantes).
- **GraphQL** bajo `/graphql` (predicción de tiempo y segmentación).

El servicio está protegido por **JWT (RS256/RS512)**:

- REST exige `Authorization: Bearer <token>` en endpoints protegidos.
- GraphQL valida el token y rechaza mutaciones si no hay usuario autenticado.

## 2. Estructura de carpetas

```text
ms-ia/
  app/
    api/
      routes/                     # Endpoints REST (FastAPI)
        comprobantes.py
    core/
      logging.py                  # Logger del servicio
      responses.py                # Helpers de respuesta estándar
      security.py                 # JWT + contexto GraphQL
    graphql/
      schema.py                   # Schema de GraphQL (queries/mutations)
    services/
      comprobantes_service.py     # Inferencia de comprobantes (TensorFlow)
      tiempo_pedidos_service.py   # Predicción tiempo de pedidos (joblib)
      segmentacion_clientes_service.py # Segmentación clientes (bundle joblib)
    main.py                       # Inicialización FastAPI + routers
  artifacts/                      # Modelos/artefactos
    comprobantes_model.keras
    comprobantes_class_names.txt
    tiempo_pedidos_model.pkl
    segmentacion_clientes_bundle_v3.pkl
  requirements.txt
  docker-compose.yml
  Dockerfile
  .env.example
  README.md
```

## 3. Modelos utilizados y funcionamiento

### 3.1 Clasificación de comprobantes (TensorFlow)

- Archivo: `artifacts/comprobantes_model.keras`
- Clases: `artifacts/comprobantes_class_names.txt`
- Lógica: [comprobantes_service.py]

Salida principal:

- `decision`: `RECHAZADO` | `REVISION_MANUAL` | `FORMATO_DETECTADO`
- `formato_detectado`: clase predicha cuando aplica
- `confianza` y `probabilidades_por_clase`

### 3.2 Estimación de tiempo de pedidos (joblib / scikit-learn)

- Archivo: `artifacts/tiempo_pedidos_model.pkl`
- Lógica: [tiempo_pedidos_service.py]

### 3.3 Segmentación de clientes (bundle joblib + reglas)

- Archivo: `artifacts/segmentacion_clientes_bundle_v3.pkl`
- Lógica: [segmentacion_clientes_service.py]

El flujo aplica reglas primero (inactivo / nuevo / sensible a promociones) y para el resto utiliza K-Means.

## 4. Variables de entorno

El servicio lee variables desde `.env` (ver `app/core/config.py` y `app/core/security.py`).

### 4.1 Variables usadas por Docker Compose

- `PORT`: puerto local donde se expone el servicio (mapea a `8000` dentro del contenedor).

### 4.2 JWT (requerido para arrancar el servicio)

Al iniciar FastAPI se valida que exista una llave pública JWT en disco.

- `JWT_PUBLIC_KEY_PATH` (default: `certs/public.pem`)
- `JWT_ISSUER` (default: `restaurante`)

Nota: si no existe la llave pública, el servicio fallará al iniciar con un error de archivo faltante.

## 5. Ejecución local (Windows)

### 5.1 Requisitos previos

- Python 3.12 recomendado (el Dockerfile usa `python:3.12-slim`).
- Tener los artefactos en `artifacts/`.
- Tener la llave pública JWT disponible (ver sección 4.2).

### 5.2 Configuración de entorno

1. Crea el archivo `.env` en la raíz de `ms-ia`:

   ```bash
   copy .env.example .env
   ```

2. Ajusta `PORT` según tu necesidad.

### 5.3 Instalación y ejecución

1. Crear el entorno virtual:

   ```bash
   python -m venv .venv
   ```
2. Activar el entorno virtual:
   - **Windows**: `.\venv\Scripts\activate`
   - **Linux/macOS**: `source venv/bin/activate`
3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## 6. Despliegue con Docker Compose

### 6.1 Levantar el servicio

```bash
docker compose up -d --build
```

### 6.2 Logs

```bash
docker compose logs -f
```

### 6.3 Detener

```bash
docker compose down
```

Nota: el `Dockerfile` actualmente ejecuta `python -m spacy download es_core_news_sm`. Si la imagen falla al construir por `spacy` no instalado, agrega `spacy` a `requirements.txt` o elimina ese paso del Dockerfile.

## 7. Probar la API

### 7.1 Salud

GET:

```text
http://localhost:8000/health
```

### 7.2 REST: Comprobantes

Endpoint:

- `POST /api/comprobantes/analizar` (multipart form-data, campo `archivo`)

Requiere header:

- `Authorization: Bearer <token>`

Ejemplo con curl (Windows):

```bash
curl -X POST "http://localhost:8000/api/comprobantes/analizar" ^
  -H "Authorization: Bearer <token>" ^
  -F "archivo=@ruta\\a\\comprobante.png"
```

### 7.3 GraphQL

URL:

```text
http://localhost:8000/graphql
```

Query simple:

```graphql
query {
  estadoMsia
}
```

Mutación: estimar tiempo de pedido (requiere JWT):

```graphql
mutation {
  estimarTiempoPedido(
    input: {
      fechaHoraPedido: "2026-06-10T12:30:00"
      cantidadItems: 3
      totalPedido: 42000
      pedidosPendientes: 5
      tipoPedido: DELIVERY
      distanciaKm: 2.4
      requiereCoccion: SI
    }
  ) {
    tiempoEstimadoMin
    tipoPedido
    requiereCoccion
  }
}
```

Mutación: segmentar cliente (requiere JWT):

```graphql
mutation {
  segmentarCliente(
    input: {
      clienteId: 10
      cantidadPedidos: 12
      ticketPromedio: 31000
      diasDesdeUltimaCompra: 8
      cantidadPedidosPromocion: 3
    }
  ) {
    clienteId
    numeroSegmento
    etiquetaSegmento
    origenSegmentacion
    clusterKmeans
    distanciaAlCentroide
  }
}
```
