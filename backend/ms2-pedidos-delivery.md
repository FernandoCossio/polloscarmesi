### 4.2 MS2 - Pedidos, Delivery y Automatización (NestJS)

#### 4.2.1 Responsabilidad y Contexto de Dominio

MS2 gestiona el ciclo completo del pedido delivery: desde su creación por el Cliente en la app móvil hasta la confirmación de entrega por el Repartidor. También es responsable de la asignación automática de repartidores, el tracking GPS por puntos clave, las notificaciones push y la automatización del cierre de caja nocturno via n8n.

MS2 recibe operaciones GraphQL delegadas desde MS0 (via Schema Stitching) y expone su propio schema GraphQL en `/graphql`. Se comunica con MS1 y MS3 via REST interno cuando necesita datos de sus dominios de forma síncrona. Publica y consume eventos en Redis para coordinación asíncrona. Escribe eventos de trazabilidad y telemetría GPS en DynamoDB. Expone un endpoint REST interno para ser llamado por n8n en el proceso de cierre de caja.

**Ciclo de vida del pedido delivery gestionado por MS2:**
`Pendiente` → `Confirmado` → `En preparación` → `En camino` → `Entregado` → `Cancelado`

---

#### 4.2.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework | NestJS (TypeScript) |
| ORM | TypeORM con PostgreSQL |
| GraphQL servidor | `@nestjs/graphql` + Apollo Server |
| GraphQL cliente | No aplica — MS2 usa REST interno para llamadas inter-servicios a MS1 y MS3 |
| Mensajería Redis | `ioredis` + `@nestjs/bull` para Pub/Sub |
| Cliente DynamoDB | `@aws-sdk/client-dynamodb` |
| Notificaciones Push | Expo Push Notifications API (`expo-server-sdk`) |
| Cliente S3 | `@aws-sdk/client-s3` |
| Variables de entorno | `@nestjs/config` |
| Validación | `class-validator` + `class-transformer` |
| Testing | Jest + Supertest |

---

#### 4.2.3 Base de Datos Utilizada

| Almacenamiento | Uso |
|---|---|
| PostgreSQL | Pedidos delivery, repartidores, asignaciones, estados e incidencias. Esquema separado del dominio de MS1. |
| Amazon DynamoDB | Eventos de trazabilidad del pedido delivery y registros GPS de puntos clave del repartidor. |
| Amazon S3 | Fotografías de evidencia de entrega subidas por el Repartidor. |
| Redis | Canal Pub/Sub para publicar y consumir eventos asincrónicos con MS1 y MS3. |

---

#### 4.2.4 Módulos y Casos de Uso

**Módulo de Pedidos Delivery**
- Recibir y registrar nuevo pedido delivery desde el Cliente (via MS0).
- Consultar datos del cliente y productos desde MS1 via GraphQL para completar el pedido.
- Calcular subtotal y total del pedido.
- Publicar evento `pedido.delivery.creado` en Redis al registrar el pedido.
- Consultar y actualizar el estado del pedido durante su ciclo de vida.
- Cancelar pedido con motivo antes de que sea asignado a un repartidor.
- Registrar evento de trazabilidad en DynamoDB en cada cambio de estado.
- Sincronizar estado del pedido con MS1 via GraphQL mutation `sincronizarEstadoDelivery`.

**Módulo de Asignación de Repartidores**
- Mantener el estado de disponibilidad de cada repartidor (disponible / en entrega).
- Al recibir un nuevo pedido delivery, identificar automáticamente al repartidor disponible más cercano a la dirección de entrega usando las coordenadas registradas.
- Asignar el pedido al repartidor seleccionado y actualizar su estado a `en entrega`.
- Enviar notificación push al repartidor asignado via Expo Notifications.
- Liberar al repartidor (estado `disponible`) al confirmar la entrega o al cancelarse el pedido.

**Módulo de Tracking y Entrega**
- Registrar punto clave GPS `ACEPTADO` cuando el repartidor acepta el pedido (coordenadas actuales).
- Registrar punto clave GPS `EN_CAMINO` cuando el repartidor inicia el trayecto.
- Registrar punto clave GPS `LLEGADA` cuando el repartidor llega a la dirección de entrega.
- Confirmar entrega: recibir fotografía de evidencia, subirla a S3 y registrar punto clave `ENTREGADO`.
- Cada punto clave GPS se persiste en DynamoDB con `pedidoId`, `repartidorId`, `evento`, `coordenadas` y `timestamp`.

**Módulo de Incidencias**
- Registrar rechazo de pedido por parte del repartidor con motivo (y reasignar si hay otro disponible).
- Registrar incidencia durante la entrega: dirección incorrecta, cliente no disponible, etc.
- Persistir incidencias en PostgreSQL y registrar evento en DynamoDB.
- Notificar al Administrador via push notification ante una incidencia crítica.

**Módulo de Notificaciones Push**
- Enviar notificaciones push al Cliente en cada cambio de estado de su pedido delivery.
- Enviar notificaciones push al Repartidor al ser asignado a un nuevo pedido.
- Gestionar tokens de dispositivo Expo: registrar, actualizar y eliminar tokens por usuario.
- Reintentar envío de notificación fallida hasta 3 veces.

**Módulo de Automatización — Cierre de Caja (n8n)**
- Exponer endpoint REST interno `/internal/caja/cierre` consumido exclusivamente por n8n.
- Al ser invocado, consultar a MS1 via GraphQL el resumen de ventas y pagos del día.
- Consolidar el resumen: total de pedidos delivery del día, montos, estados y repartidores activos.
- Generar reporte PDF de cierre de caja consolidado (presencial desde MS1 + delivery desde MS2).
- Subir el reporte PDF a S3 y retornar la URL firmada a n8n.
- n8n usa la URL para enviar el reporte por correo al Administrador via SendGrid/SES.
- Registrar evento de cierre de caja en DynamoDB.

---

#### 4.2.5 Estructura de Carpetas y Descripción de Capas

```
ms2-delivery-automatizacion/
├── src/
│   ├── pedido-delivery/               # Módulo de pedidos delivery
│   │   ├── pedido-delivery.module.ts
│   │   ├── pedido-delivery.controller.ts   # Endpoints REST desde MS0
│   │   ├── pedido-delivery.service.ts      # Lógica de negocio del pedido
│   │   ├── pedido-delivery.repository.ts   # Acceso a PostgreSQL via TypeORM
│   │   ├── entities/
│   │   │   ├── pedido-delivery.entity.ts   # Entidad TypeORM
│   │   │   └── detalle-pedido.entity.ts
│   │   └── dto/
│   │       ├── crear-pedido.dto.ts
│   │       └── pedido-response.dto.ts
│   │
│   ├── asignacion/                    # Módulo de asignación de repartidores
│   │   ├── asignacion.module.ts
│   │   ├── asignacion.service.ts      # Lógica de asignación automática por cercanía
│   │   ├── asignacion.repository.ts
│   │   ├── entities/
│   │   │   └── asignacion.entity.ts   # Relación pedido-repartidor con timestamps
│   │   └── dto/
│   │       └── asignacion-response.dto.ts
│   │
│   ├── tracking/                      # Módulo de tracking GPS y confirmación de entrega
│   │   ├── tracking.module.ts
│   │   ├── tracking.controller.ts     # Endpoints: puntos clave GPS, confirmar entrega
│   │   ├── tracking.service.ts        # Lógica de registro de puntos clave y evidencia
│   │   └── dto/
│   │       ├── punto-clave.dto.ts     # { evento, coordenadas, timestamp }
│   │       └── confirmar-entrega.dto.ts
│   │
│   ├── incidencias/                   # Módulo de incidencias y rechazos
│   │   ├── incidencias.module.ts
│   │   ├── incidencias.controller.ts
│   │   ├── incidencias.service.ts
│   │   ├── entities/
│   │   │   └── incidencia.entity.ts
│   │   └── dto/
│   │       └── reportar-incidencia.dto.ts
│   │
│   ├── notificaciones/                # Módulo de notificaciones push
│   │   ├── notificaciones.module.ts
│   │   ├── notificaciones.service.ts  # Envío via Expo Push Notifications API
│   │   ├── entities/
│   │   │   └── dispositivo-token.entity.ts  # Token Expo por usuario
│   │   └── dto/
│   │       └── registrar-token.dto.ts
│   │
│   ├── automatizacion/                # Módulo de cierre de caja para n8n
│   │   ├── automatizacion.module.ts
│   │   ├── automatizacion.controller.ts    # Endpoint interno /internal/caja/cierre
│   │   ├── automatizacion.service.ts       # Consolidación de reporte y subida a S3
│   │   └── dto/
│   │       └── cierre-caja-response.dto.ts
│   │
│   ├── graphql/                       # Capa GraphQL
│   │   ├── resolver/
│   │   │   └── delivery.resolver.ts   # Queries y mutations GraphQL expuestos a MS1 y MS3
│   │   └── client/
│   │       ├── ms1-graphql.client.ts  # Cliente para consultar MS1
│   │       └── ms3-graphql.client.ts  # Cliente para consultar MS3
│   │
│   ├── infrastructure/                # Adaptadores de servicios externos
│   │   ├── dynamodb/
│   │   │   └── dynamodb.service.ts    # Escritura de eventos y GPS en DynamoDB
│   │   ├── s3/
│   │   │   └── s3.service.ts          # Upload de evidencias y reportes a S3
│   │   └── redis/
│   │       ├── redis.publisher.ts     # Publicación de eventos en Redis
│   │       └── redis.subscriber.ts    # Suscripción a eventos de Redis
│   │
│   ├── common/                        # Utilidades transversales
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   └── internal-header.guard.ts  # Verifica headers X-User-Id y X-User-Role
│   │   └── interceptors/
│   │       └── logging.interceptor.ts
│   │
│   ├── config/                        # Configuración de variables de entorno
│   │   └── configuration.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── src/graphql/
│   └── schema.graphqls                # Schema GraphQL expuesto por MS2
│
├── .env
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Descripción de capas:**

- **`controller/`:** Recibe requests REST desde MS0 o desde n8n (endpoint interno). Valida DTOs y delega al servicio.
- **`service/`:** Contiene la lógica de negocio del módulo. Coordina repositorios, infraestructura y clientes GraphQL.
- **`repository/`:** Acceso a PostgreSQL via TypeORM. Solo queries de base de datos.
- **`entities/`:** Entidades TypeORM que mapean tablas de PostgreSQL y enums de dominio.
- **`dto/`:** Objetos de transferencia para requests y responses. Las entidades nunca se exponen directamente.
- **`graphql/resolver/`:** Expone el schema GraphQL de MS2. Los resolvers son consumidos por MS0 via Schema Stitching y delegados al frontend.
- **`graphql/client/`:** Clientes REST HTTP para consultas síncronas salientes hacia MS1 y MS3.
- **`infrastructure/`:** Adaptadores para DynamoDB, S3 y Redis, desacoplados de la lógica de negocio.
- **`common/`:** Guard de headers internos, filtros de excepción e interceptores transversales.

---

#### 4.2.6 Esquema GraphQL (Queries y Mutations expuestos a MS1 y MS3)

MS2 expone un endpoint GraphQL en `/graphql` consumido por MS0 via Schema Stitching. El frontend accede a estas operaciones a través del Superschema unificado de MS0. Los tipos y operaciones aquí definidos son la fuente de verdad del dominio de delivery.

```graphql
type Query {
  # Pedidos delivery
  obtenerPedidoDelivery(id: ID!): PedidoDelivery
  obtenerPedidosDeliveryPorFecha(fecha: String!): [PedidoDelivery!]!
  obtenerPedidosDeliveryPorCliente(clienteId: ID!): [PedidoDelivery!]!

  # Repartidores
  obtenerRepartidoresDisponibles: [Repartidor!]!
  obtenerRepartidor(id: ID!): Repartidor

  # Resumen delivery del día (para MS3 y cierre de caja)
  obtenerResumenDeliveryDia(fecha: String!): ResumenDelivery!
}

type PedidoDelivery {
  id: ID!
  clienteId: ID!
  estado: EstadoDelivery!
  direccionEntrega: String!
  coordenadasEntrega: String
  total: Float!
  repartidorAsignado: Repartidor
  evidenciaEntregaUrl: String
  fechaCreacion: String!
  fechaEntrega: String
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

#### 4.2.7 Endpoints REST expuestos hacia MS0

| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| POST | `/api/v1/delivery/pedidos` | Crear pedido delivery | Cliente |
| GET | `/api/v1/delivery/pedidos/:id` | Detalle de pedido delivery | Cliente, Administrador |
| GET | `/api/v1/delivery/pedidos/cliente` | Historial de pedidos del cliente autenticado | Cliente |
| DELETE | `/api/v1/delivery/pedidos/:id` | Cancelar pedido (antes de asignación) | Cliente |
| GET | `/api/v1/delivery/repartidor/pedidos` | Pedidos asignados al repartidor autenticado | Repartidor |
| POST | `/api/v1/delivery/tracking/punto-clave` | Registrar punto clave GPS | Repartidor |
| POST | `/api/v1/delivery/tracking/confirmar-entrega` | Confirmar entrega con foto de evidencia | Repartidor |
| POST | `/api/v1/delivery/incidencias` | Reportar incidencia o rechazar pedido | Repartidor |
| POST | `/api/v1/delivery/notificaciones/token` | Registrar token de dispositivo Expo | Cliente, Repartidor |
| GET | `/api/v1/delivery/pedidos` | Listar todos los pedidos delivery del día | Administrador |

**Endpoint interno (solo para n8n, no pasa por MS0):**

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/internal/caja/cierre` | Genera reporte de cierre de caja, lo sube a S3 y retorna URL |

---

#### 4.2.8 Integración con n8n (Automatización de Cierre de Caja)

n8n orquesta el flujo nocturno de cierre de caja de forma completamente automática. MS2 no inicia este flujo, solo responde cuando n8n lo invoca.

**Flujo de automatización:**

1. n8n ejecuta el workflow programado a la hora configurada (ej: 11:59 PM).
2. n8n llama al endpoint interno de MS2: `POST /internal/caja/cierre`.
3. MS2 consulta a MS1 via GraphQL el resumen de ventas presenciales del día.
4. MS2 consolida el resumen delivery del día desde su propia base de datos PostgreSQL.
5. MS2 genera el PDF del reporte consolidado (presencial + delivery).
6. MS2 sube el PDF a S3 en el bucket de reportes y genera una URL firmada temporal.
7. MS2 registra el evento de cierre en DynamoDB con timestamp y URL del reporte.
8. MS2 retorna la URL del reporte a n8n.
9. n8n envía el correo al Administrador adjuntando el reporte via SendGrid/Amazon SES.

**Consideración de seguridad:** el endpoint `/internal/caja/cierre` valida un header `X-N8N-Secret` con un token compartido configurado en variables de entorno para evitar llamadas no autorizadas.

---

#### 4.2.9 Eventos publicados / consumidos

| Acción | Canal Redis | Tipo | Payload principal |
|---|---|---|---|
| **Publica** | `pedido.delivery.creado` | Publicador | `pedidoId`, `tipo: DELIVERY`, `clienteId`, `productos`, `coordenadasEntrega` |
| **Publica** | `delivery.estado` | Publicador | `pedidoId`, `nuevoEstado`, `timestamp` |
| **Publica** | `entrega.confirmada` | Publicador | `pedidoId`, `repartidorId`, `evidenciaUrl`, `timestamp` |
| **Consume** | `tiempo.estimado` | Suscriptor | `pedidoId`, `tiempoEstimadoMinutos` — solo para pedidos delivery |
| **Consume** | `comprobante.analizado` | Suscriptor | `pedidoId`, `resultado` |

---

#### 4.2.10 Variables de Entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 3001) |
| `DB_HOST` | Host PostgreSQL |
| `DB_PORT` | Puerto PostgreSQL |
| `DB_USERNAME` | Usuario PostgreSQL |
| `DB_PASSWORD` | Contraseña PostgreSQL |
| `DB_NAME` | Nombre de la base de datos |
| `REDIS_HOST` | Host del servidor Redis |
| `REDIS_PORT` | Puerto Redis |
| `REDIS_PASSWORD` | Contraseña Redis |
| `AWS_REGION` | Región AWS |
| `AWS_ACCESS_KEY_ID` | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS |
| `AWS_S3_BUCKET_NAME` | Bucket S3 para evidencias y reportes |
| `DYNAMODB_EVENTS_TABLE` | Tabla DynamoDB para eventos de trazabilidad |
| `DYNAMODB_GPS_TABLE` | Tabla DynamoDB para puntos clave GPS |
| `MS1_REST_INTERNAL_URL` | URL interna REST de MS1 para comunicación inter-servicios |
| `MS3_REST_INTERNAL_URL` | URL interna REST de MS3 para comunicación inter-servicios |
| `N8N_SECRET` | Token secreto compartido con n8n para el endpoint interno |
| `EXPO_ACCESS_TOKEN` | Token de acceso para Expo Push Notifications API |
