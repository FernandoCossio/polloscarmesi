# MS2 - Pedidos, Delivery y Automatización (NestJS)

Este microservicio gestiona el ciclo completo del pedido delivery en el ecosistema **Pollos Carmesí**: desde la creación del pedido por el Cliente en la app móvil hasta la confirmación de entrega por el Repartidor, incluyendo el tracking GPS por puntos clave, las notificaciones push y la automatización del cierre de caja nocturno.

---

## 🚀 Arquitectura y Tecnologías
* **Framework**: NestJS (TypeScript)
* **Base de Datos Relacional**: PostgreSQL (TypeORM) para el almacenamiento transaccional de pedidos y asignaciones.
* **Base de Datos NoSQL**: DynamoDB (AWS SDK v3) para telemetría GPS, logs de auditoría y trazabilidad.
* **Almacenamiento de Objetos**: AWS S3 para evidencia fotográfica de entregas y reportes PDF consolidados.
* **Mensajería Asíncrona (Pub/Sub)**: Redis para eventos en tiempo real.
* **Notificaciones**: Expo Server SDK para notificaciones push en tiempo real.
* **Automatización**: Endpoints REST consumidos por **n8n** para cierres nocturnos y generación de PDFs consolidados mediante `pdfkit`.

---

## 🛠️ Requisitos e Instalación

1. **Instalar Dependencias:**
   ```bash
   npm install
   ```

2. **Configurar el Entorno (`.env`):**
   Copia el archivo `.env.example` y rellena las variables de conexión a la base de datos y AWS local:
   ```bash
   cp .env.example .env
   ```

---

## 🐳 Infraestructura Local con Floci (S3 y DynamoDB)

Utilizamos **Floci** como emulador local compatible con AWS (S3/DynamoDB) y Redis.

### 1. Iniciar el contenedor
Ve al directorio del repositorio de `floci` y ejecuta:
```bash
docker-compose up -d
```

### 2. Configurar el CLI de AWS en tu terminal
Si es la primera vez que configuras AWS CLI en tu máquina local, ejecuta:
```bash
aws configure
```
E ingresa los siguientes valores de prueba:
* **Access Key ID**: `test`
* **Secret Access Key**: `test`
* **Region**: `us-east-1`
* **Output format**: `json`

### 3. Crear los recursos en el Emulador Local
Cada vez que el contenedor de Floci sea recreado o resetado (`docker-compose down` y luego `up`), debes recrear los buckets y tablas. Puedes ejecutar los siguientes comandos en tu terminal de Windows:

#### buckets S3:
```bash
# Bucket para imágenes de evidencia de entrega
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket polloscarmesi-delivery-evidence

# Bucket para otros almacenamientos del sistema
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket pollos-carmesi-storage
```

#### Tablas DynamoDB:
```bash
# Tabla para registro de eventos del ciclo del pedido
aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name polloscarmesi-events --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST

# Tabla para logs de coordenadas GPS en tiempo real
aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name polloscarmesi-gps --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST

# Tabla para logs de auditoría global (Usado por el API Gateway)
aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name polloscarmesi-audit --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST
```

---

## 📈 Ejecución en Desarrollo

Para iniciar el servidor de desarrollo NestJS en watch mode (puerto `3001` por defecto):
```bash
npm run start:dev
```

---

## 🔗 Integración y Endpoints REST expuestos

### 1. Cierre Nocturno Automático (Llamado por n8n)
* **Endpoint**: `POST /internal/caja/cierre`
* **Seguridad**: Requiere cabecera de autenticación `X-N8N-Secret` alineada con la clave del servidor.
* **Funcionalidad**: Calcula las estadísticas del día, genera un reporte PDF consolidado y lo sube al bucket S3.

### 2. Tracking de Entregas (Llamado por App Móvil)
* **Endpoint**: `POST /api/v1/delivery/tracking/confirmar-entrega`
* **Seguridad**: Requiere cabecera `Authorization: Bearer <token_jwt>`.
* **Cuerpo**: Multipart/form-data con los parámetros `pedidoId` y archivo `file` de la foto.
* **Funcionalidad**: Registra el estado `ENTREGADO`, guarda los datos en DynamoDB y sube la foto de evidencia a S3.
