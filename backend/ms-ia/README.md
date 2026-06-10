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
      responses.py            # Modelos y helpers de respuestas estándar
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
### 5.2 Configuración de entorno
1. Crea un archivo `.env` en la raíz del proyecto basado en el ejemplo:
   ```bash
   cp .env.example .env
   ```

### 5.3 Instalación y ejecución
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

El proyecto incluye un archivo `docker-compose.yml` para levantar el microservicio.

### 7.1 Requisitos previos
- Docker y Docker Compose instalados.
- Archivo `.env` configurado en la raíz del proyecto.

### 7.2 Levantar servicios
Para iniciar todos los servicios en segundo plano:

```bash
docker compose up -d
```

Este comando:
1.  Construye la imagen del microservicio.
2.  Mapea el microservicio al puerto `PORT` del host.

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
