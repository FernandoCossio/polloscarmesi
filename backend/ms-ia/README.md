# Servicio IA 

---

## 1. Descripción del proyecto

---

## 2. Estructura de carpetas

Estructura principal del proyecto `ms-ia`:

```text
ms-ia/
  app/
    api/
      routes/                 # Carpeta que guarda archivos para exponer rutas (GraphQl o Rest)
    core/
      config.py               # Configuración global (modelo, Redis, etc.)
      responses.py            # Modelos y helpers de respuestas estándar
      redis_ia.py             # Cliente Redis async para caché de vacantes
    models/
      schemas.py              # Esquemas Pydantic (request/response)
    services/                 # Carpeta para guardar diferente servicios donde va la logica de negocio
    resources/                # Carpeta para guardar algun tipo de recurso que se necesite para el proyecto
  Dockerfile                  # Definición de la imagen Docker del servicio
  requirements.txt            # Dependencias de Python del servicio
  README.md                   # Documentación del servicio
```

---

## 3. Modelo utilizado y funcionamiento actual


## 4. Archivos y datos de prueba en `app/resources`


## 5. Configuración y ejecución local

### 5.1 Requisitos previos
- Python 3.10 o superior.
- Docker (para el contenedor de Redis).

### 5.2 Levantar Redis Stack
El servicio requiere Redis para cachear los embeddings de las vacantes. Puedes levantarlo usando Docker:

```bash
docker run -d   -p 6380:6379   -p 8002:8001   --name redis-stack-ia   -e REDIS_ARGS="--requirepass tu-clave-segura"   redis/redis-stack
```

### 5.3 Configuración de entorno
1. Crea un archivo `.env` en la raíz del proyecto basado en el ejemplo:
   ```bash
   cp .env.example .env
   ```
2. Asegúrate de que las variables en `.env` coincidan con tu configuración de Redis (por defecto apunta a `localhost:6380`).

### 5.4 Instalación y ejecución
1. Crear un entorno virtual:
   ```bash
   python -m venv venv
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

## 7. Despliegue con Docker Compose

El proyecto incluye un archivo `docker-compose.yml` que levanta tanto el microservicio de IA como la instancia de Redis Stack configurada para persistencia.

### 7.1 Requisitos previos
- Docker y Docker Compose instalados.
- Archivo `.env` configurado en la raíz del proyecto.

### 7.2 Levantar servicios
Para iniciar todos los servicios en segundo plano:

```bash
docker compose up -d
```

Este comando:
1.  Levanta un contenedor `redis-stack-ia` con volumen de datos persistente.
2.  Construye la imagen de `ia-match` y la levanta una vez que Redis está saludable.
3.  Mapea el microservicio al puerto `PORT` del host.
4.  Crea un volumen para el caché de Hugging Face, evitando descargar el modelo cada vez que se reinicie el contenedor.

### 7.3 Ver logs
```bash
docker compose logs -f
```

### 7.4 Detener servicios
```bash
docker compose down
```

---

## 8. Construir la imagen Docker manualmente

---

## 9. Probar la API

Con el contenedor en ejecución, puedes acceder a:

- Documentación interactiva (Swagger UI):

  ```text
  http://localhost:8000/docs
  ```

- Documentación alternativa (ReDoc):

  ```text
  http://localhost:8000/redoc
  ```

### 7.1 Endpoints principales

### 7.2 Ejemplos de peticiones

---
