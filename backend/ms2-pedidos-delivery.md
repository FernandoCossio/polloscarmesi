### 4.2 MS2 - Pedidos, Delivery y Automatización (NestJS)

#### 4.2.1 Responsabilidad y Contexto de Dominio

MS2 es el microservicio responsable de la **gestión de pedidos delivery**, la **asignación de repartidores**, el **rastreo de entregas** y la **automatización de procesos nocturnos**. Su contexto de dominio abarca desde la creación del pedido por el cliente hasta su entrega final o cancelación por incidencias.

Funciones principales:
- **Ciclo de vida del pedido delivery**: Flujo de estados del pedido (`PENDIENTE` → `CONFIRMADO` → `EN_PREPARACION` → `EN_CAMINO` → `ENTREGADO` / `CANCELADO`).
- **Asignación de repartidores**: Algoritmo automático de geocercanía (Haversine) para asignar el repartidor disponible más cercano al cliente, con fallback de asignación directa.
- **Rastreo GPS de entregas (Tracking)**: Registro de puntos clave y coordenadas GPS del repartidor durante la ruta de despacho.
- **Confirmación con evidencia**: Carga de capturas fotográficas de entrega a Amazon S3 y registro de la URL de evidencia en PostgreSQL.
- **Gestión de incidencias**: Reporte de contratiempos (ej. cliente ausente) y reasignación automática de pedidos cuando un repartidor los rechaza (`RECHAZO_PEDIDO`).
- **Notificaciones Push**: Registro de tokens de dispositivos Expo y despacho asíncrono de alertas push a clientes y repartidores.
- **Cierre de Caja nocturno**: Proceso automatizado invocado externamente por n8n que consolida datos de ventas presenciales (desde MS1) y delivery (locales), genera un reporte PDF consolidado, lo almacena en Amazon S3 e inserta logs de control en DynamoDB.

---

#### 4.2.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework | NestJS (TypeScript / Node.js) |
| Persistencia | TypeORM (Active Record / Repository) |
| Base de datos relacional | PostgreSQL |
| Gateway de GraphQL | Apollo Driver (`@nestjs/graphql` + `@nestjs/apollo`) |
| Integración de AWS S3 | `@aws-sdk/client-s3` (con soporte mock de almacenamiento local) |
| Integración de DynamoDB | `@aws-sdk/client-dynamodb` + `@aws-sdk/util-dynamodb` (con mock local en disco) |
| Mensajería en tiempo real | Redis Pub/Sub (`ioredis` con fallback mock en memoria) |
| Generación de PDF | `pdfkit` |
| Servidor de Notificaciones | Expo Push SDK (`expo-server-sdk` con reintentos y backoff) |
| Seguridad y Roles | JWT con decodificación RSA local usando la llave pública de MS4 (`public.pem`) |
| Variables de entorno | `@nestjs/config` cargado globalmente |

---

#### 4.2.3 Base de Datos Utilizada

MS2 interactúa de manera híbrida con bases de datos relacionales, base de datos NoSQL y almacenamiento de objetos, adaptándose a mocks locales en desarrollo:

| Almacenamiento | Uso |
|---|---|
| PostgreSQL (`pedidos`) | Pedidos delivery, detalles, asignaciones, incidencias, disponibilidad GPS de repartidores y tokens de dispositivos Expo. |
| Amazon DynamoDB | Telemetría GPS en tiempo real e historial cronológico de incidencias y cierres de caja. |
| Amazon S3 | Almacenamiento de evidencias fotográficas de entrega y reportes consolidados en PDF de cierres de caja. |
| Redis (en memoria) | Mensajería Pub/Sub para coordinar estados y tiempos de entrega estimados. |

---

#### 4.2.4 Módulos y Casos de Uso

**Módulo Pedido Delivery**
- `crearPedidoDelivery` — Registra la cabecera y el detalle de un pedido delivery, asocia coordenadas de entrega, registra un log en DynamoDB y publica el evento `pedido.creado` en Redis.
- `actualizarEstadoDelivery` — Modifica el estado del pedido, libera al repartidor si finaliza o se cancela, notifica al cliente por push y publica el evento `delivery.estado` en Redis.
- `cancelarPedido` — Permite al cliente cancelar un pedido si este se encuentra en estado `PENDIENTE`.

**Módulo Asignación**
- `asignarRepartidorAutomaticamente` — Calcula las distancias Haversine desde el pedido hasta los repartidores con estado `DISPONIBLE` y auto-asigna el más cercano.
- `actualizarDisponibilidad` — Actualiza las coordenadas actuales del repartidor y su disponibilidad (`DISPONIBLE`, `OCUPADO`, `OFFLINE`).

**Módulo Tracking**
- `registrarPuntoClave` — Guarda registros de telemetría GPS del recorrido (`EN_CAMINO`, `LLEGADA`, etc.) en DynamoDB actualizando las coordenadas de disponibilidad del chofer en PostgreSQL.
- `confirmarEntrega` — Sube la foto de evidencia a S3, actualiza el estado a `ENTREGADO`, libera al repartidor y publica `entrega.confirmada` en Redis.

**Módulo Incidencias**
- `reportarIncidencia` — Registra incidentes en PostgreSQL y DynamoDB. Si el tipo de incidencia es `RECHAZO_PEDIDO`, libera al conductor involucrado, devuelve el pedido a `PENDIENTE` y dispara una reasignación automática programada.

**Módulo Notificaciones**
- `registrarToken` — Guarda tokens de dispositivos Expo vinculados al usuario autenticado (Cliente/Repartidor) para el envío de notificaciones push personalizadas.

**Módulo Automatización (n8n)**
- `/internal/caja/cierre` — Endpoint interno protegido por cabecera `X-N8N-Secret`. Al llamarse, consulta a MS1 vía GraphQL por ventas presenciales, consolida con las ventas delivery locales, escribe un PDF consolidado, lo sube a S3 y guarda el historial en DynamoDB.

---

#### 4.2.5 Estructura de Carpetas y Descripción de Capas

```
ms-pedidos/
├── src/
│   ├── asignacion/                    # Lógica de conductores y geocercanía
│   │   ├── asignacion.module.ts
│   │   └── asignacion.service.ts
│   │
│   ├── automatizacion/                # Cierre nocturno y generación de reportes PDF
│   │   ├── automatizacion.controller.ts
│   │   ├── automatizacion.module.ts
│   │   └── automatizacion.service.ts
│   │
│   ├── common/                        # Guards, decoradores y helpers compartidos
│   │   ├── decorators/                # Decorador @CurrentUser para extraer info del JWT
│   │   └── guards/                    # JwtAuthGuard para decodificar JWT vía llave pública
│   │
│   ├── config/                        # Carga y mapeo de variables de entorno
│   │   └── configuration.ts
│   │
│   ├── entities/                      # Modelos/Entidades de TypeORM (PostgreSQL)
│   │   ├── asignacion.entity.ts
│   │   ├── detalle-pedido-delivery.entity.ts
│   │   ├── dispositivo-token.entity.ts
│   │   ├── incidencia.entity.ts
│   │   ├── pedido-delivery.entity.ts
│   │   └── repartidor-disponibilidad.entity.ts
│   │
│   ├── graphql/                       # Archivos GraphQL y cliente de consumo inter-servicios
│   │   ├── client/                    # Ms1GraphqlClient para consultar ventas presenciales
│   │   └── schema.graphqls            # Definiciones de tipo para Schema Stitching
│   │
│   ├── incidencias/                   # Flujo de incidencias y rechazo de órdenes
│   │   ├── dto/                       # Validaciones con class-validator
│   │   ├── incidencias.controller.ts
│   │   ├── incidencias.module.ts
│   │   └── incidencias.service.ts
│   │
│   ├── infrastructure/                # Adaptadores de infraestructura de AWS/Redis
│   │   ├── dynamodb/                  # DynamoDbService (soporta mock en disco local)
│   │   ├── redis/                     # RedisService (Pub/Sub con fallback en memoria)
│   │   ├── s3/                        # S3Service (soporta mock en disco local)
│   │   └── infrastructure.module.ts
│   │
│   ├── notificaciones/                # Tokens Expo y envíos de notificaciones push
│   │   ├── dto/
│   │   ├── notificaciones.controller.ts
│   │   ├── notificaciones.module.ts
│   │   └── notificaciones.service.ts
│   │
│   ├── pedido-delivery/               # Negocio de órdenes delivery, controladores y resolvers
│   │   ├── dto/
│   │   ├── pedido-delivery.controller.ts
│   │   ├── pedido-delivery.module.ts
│   │   ├── pedido-delivery.resolver.ts
│   │   └── pedido-delivery.service.ts
│   │
│   ├── app.module.ts                  # Módulo raíz que unifica todos los módulos locales
│   ├── main.ts                        # Punto de entrada de la aplicación
│   └── ...
```

---

#### 4.2.6 Esquema GraphQL (Queries y Mutations expuestos a MS0)

El microservicio expone su esquema GraphQL en `/graphql` que es consumido dinámicamente por MS0 mediante introspección:

```graphql
type Query {
  obtenerPedidoDelivery(id: ID!): PedidoDelivery
  obtenerPedidosDeliveryPorCliente(clienteId: ID!): [PedidoDelivery!]!
  obtenerPedidosDeliverySinAsignar: [PedidoDelivery!]!
  obtenerPedidosPorRepartidor(repartidorId: ID!): [PedidoDelivery!]!
  obtenerPedidosDeliveryPorFecha(fecha: String!): [PedidoDelivery!]!
  obtenerRepartidoresDisponibles: [Repartidor!]!
  obtenerRepartidor(id: ID!): Repartidor
  obtenerResumenDeliveryDia(fecha: String!): ResumenDelivery!
}

type Mutation {
  crearPedidoDelivery(input: PedidoDeliveryInput!): PedidoDelivery!
  asignarRepartidor(pedidoId: ID!, repartidorId: ID!): PedidoDelivery!
  actualizarEstadoDelivery(pedidoId: ID!, estado: EstadoDelivery!): PedidoDelivery!
}

type PedidoDelivery {
  id: ID!
  clienteId: ID!
  direccionId: ID
  estado: EstadoDelivery!
  direccionEntrega: String!
  referencia: String
  latitud: Float
  longitud: Float
  subtotal: Float!
  descuento: Float!
  total: Float!
  tiempoEstimado: Int
  evidenciaS3Key: String
  evidenciaUrl: String
  createdAt: String!
  updatedAt: String!
  detalles: [DetallePedidoDelivery!]!
  
  # Campos adicionales para UI y reportabilidad
  coordenadasEntrega: String
  repartidorAsignado: Repartidor
  evidenciaEntregaUrl: String
  fechaCreacion: String!
  fechaEntrega: String
}

type DetallePedidoDelivery {
  id: ID!
  productoId: ID!
  nombreProducto: String!
  cantidad: Int!
  precioUnitario: Float!
  subtotal: Float!
}

type Repartidor {
  id: ID!
  nombre: String!
  disponible: Boolean!
  coordenadasActuales: String
}

type ResumenDelivery {
  fecha: String!
  totalPedidos: Int!
  pedidosEntregados: Int!
  pedidosCancelados: Int!
  montoTotalDelivery: Float!
  incidencias: Int!
}

enum EstadoDelivery {
  PENDIENTE
  CONFIRMADO
  EN_PREPARACION
  EN_CAMINO
  ENTREGADO
  CANCELADO
}
```

---

#### 4.2.7 Endpoints REST expuestos hacia MS0 / n8n

| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| POST | `/api/v1/delivery/pedidos` | Crear un nuevo pedido delivery | `CLIENTE` |
| GET | `/api/v1/delivery/pedidos/:id` | Obtener el detalle de un pedido | `CLIENTE`, `ADMINISTRADOR` |
| GET | `/api/v1/delivery/pedidos/cliente` | Historial de pedidos del cliente autenticado | `CLIENTE` |
| DELETE | `/api/v1/delivery/pedidos/:id` | Cancelar pedido (antes de asignación) | `CLIENTE` |
| GET | `/api/v1/delivery/repartidor/pedidos` | Pedidos asignados al repartidor autenticado | `REPARTIDOR` |
| POST | `/api/v1/delivery/tracking/punto-clave` | Registrar punto clave en el tracking GPS | `REPARTIDOR` |
| POST | `/api/v1/delivery/tracking/confirmar-entrega` | Confirmar entrega subiendo evidencia fotográfica | `REPARTIDOR` |
| POST | `/api/v1/delivery/incidencias` | Reportar incidentes o rechazar pedido | `REPARTIDOR` |
| POST | `/api/v1/delivery/notificaciones/token` | Registrar token de dispositivo Expo push | `CLIENTE`, `REPARTIDOR` |
| GET | `/api/v1/delivery/pedidos` | Listar todos los pedidos del día | `ADMINISTRADOR` |
| POST | `/internal/caja/cierre` | Endpoint nocturno de cierre de caja (n8n) | Requiere cabecera `X-N8N-Secret` |

---

#### 4.2.8 Eventos publicados / consumidos (Redis Pub/Sub)

| Canal Redis | Acción | Tipo de Canal | Payload Principal |
|---|---|---|---|
| `pedido.creado` | Publica | Emitir evento | `{ pedidoId, tipo: "DELIVERY", clienteId, productos, coordenadasEntrega }` |
| `delivery.estado` | Publica | Emitir evento | `{ pedidoId, nuevoEstado, timestamp }` |
| `entrega.confirmada` | Publica | Emitir evento | `{ pedidoId, repartidorId, evidenciaUrl, timestamp }` |
| `tiempo.estimado` | Consume | Escuchar evento | `{ pedidoId, tiempoEstimadoMinutos }` |
| `comprobante.analizado` | Consume | Escuchar evento | `{ pedidoId, resultado }` |

---

#### 4.2.9 Variables de Entorno / Configuración

| Variable | Descripción | Valor por Defecto / Configuración |
|---|---|---|
| `PORT` | Puerto de escucha de NestJS | `3001` |
| `DB_HOST` | Servidor base de datos PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de la base de datos PostgreSQL | `5432` |
| `DB_USERNAME` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `0910` (ambiente local) |
| `DB_NAME` | Nombre de la base de datos | `pedidos` |
| `REDIS_HOST` | Host del servidor de Redis | `localhost` |
| `REDIS_PORT` | Puerto del servidor de Redis | `6379` |
| `REDIS_PASSWORD` | Contraseña del servidor de Redis | `""` (vía vacía en local) |
| `JWT_PUBLIC_KEY_PATH` | Ruta de la clave pública RSA (MS4) | `../gateway/certs/public.pem` |
| `N8N_SECRET` | Token secreto compartido para n8n | `n8n_consolidated_secret_2026` |
| `AWS_REGION` | Región asignada en AWS | `us-east-1` |
| `AWS_ENDPOINT_URL` | URL del endpoint de AWS (para local con Floci) | `""` (o `http://localhost:4566` para Floci) |
| `AWS_ACCESS_KEY_ID` | Llave de acceso AWS | `""` (dispara fallback mock) |
| `AWS_SECRET_ACCESS_KEY` | Llave secreta AWS | `""` (dispara fallback mock) |
| `AWS_S3_BUCKET_NAME` | Bucket de evidencias y reportes | `polloscarmesi-delivery-evidence` |
| `DYNAMODB_EVENTS_TABLE` | Tabla de eventos de auditoría | `polloscarmesi-events` |
| `DYNAMODB_GPS_TABLE` | Tabla de telemetría GPS | `polloscarmesi-gps` |
| `EXPO_ACCESS_TOKEN` | Token para servicio de notificaciones Expo | `""` (dispara fallback en consola) |
