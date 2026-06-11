### 4.1 MS1 - Gestión Restaurante (Spring Boot)

#### 4.1.1 Responsabilidad y Contexto de Dominio

MS1 es el núcleo transaccional del sistema. Gestiona los dominios de negocio del restaurante: menú, pedidos presenciales, pagos, cocina, documentos y registro blockchain. La gestión de usuarios y autenticación se delega completamente a MS4.

MS1 recibe operaciones GraphQL delegadas desde MS0 (via Schema Stitching) y expone su propio schema GraphQL en `/graphql`. Se comunica con MS2 y MS3 via REST interno cuando necesita datos de sus dominios de forma síncrona. Publica y consume eventos en Redis para coordinación asíncrona. Interactúa con Amazon S3 para almacenamiento de documentos y con el smart contract Solidity via web3j para registro de hashes. La seguridad se basa en validación de tokens JWT emitidos por MS4 usando OAuth2 Resource Server con la clave pública RSA de MS4.

**Ciclo de vida de pedidos gestionados por MS1:**

- **Pedido presencial:** `Pendiente` → `En preparación` → `Listo` → `Entregado` → `Cancelado`
- **Pedido delivery (seguimiento desde MS1):** `Pendiente` → `Confirmado` → `En preparación` → `En camino` → `Entregado` → `Cancelado`

---

#### 4.1.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework | Spring Boot 3.x (Java 17+) |
| ORM | Spring Data JPA + Hibernate |
| Base de datos | PostgreSQL via JDBC |
| GraphQL servidor | Spring for GraphQL (`spring-boot-starter-graphql`) |
| GraphQL cliente | No aplica — MS1 usa REST para llamadas inter-servicios a MS2 y MS3 |
| Seguridad | Spring Security + OAuth2 Resource Server (validación JWT con clave pública RSA de MS4) |
| Almacenamiento S3 | AWS SDK for Java v2 (`software.amazon.awssdk`) |
| Blockchain | web3j para interacción con smart contract Solidity |
| Mensajería Redis | Spring Data Redis (`spring-boot-starter-data-redis`) |
| Validación | Spring Validation (`jakarta.validation`) |
| Variables de entorno | Spring Boot `application.yml` + variables de entorno del sistema |
| Testing | JUnit 5 + Mockito + Spring Boot Test |

---

#### 4.1.3 Base de Datos Utilizada

| Almacenamiento | Uso |
|---|---|
| PostgreSQL | Base de datos principal. Almacena menú, productos, pedidos, pagos, recibos y metadatos de documentos S3. |
| Amazon S3 | Almacenamiento de archivos: imágenes de productos, comprobantes de pago, recibos generados y documentos administrativos. MS1 guarda solo la URL y metadatos en PostgreSQL. |
| Redis | Canal Pub/Sub para publicar y consumir eventos asincrónicos con MS2 y MS3. |

---

#### 4.1.4 Módulos y Casos de Uso

**Módulo de Menú y Productos**
- CRUD de categorías del menú (ej: Pollos, Bebidas, Guarniciones).
- CRUD de productos: nombre, descripción, precio, categoría, imagen (URL S3) y disponibilidad.
- Activar y desactivar disponibilidad de un producto en tiempo real.
- Consultar menú completo con filtro por categoría.
- Recibir imagen de producto desde MS0 (proxy) y subirla a S3, guardando URL en PostgreSQL.

**Módulo de Pedidos Presenciales**
- Registrar nuevo pedido presencial con lista de productos, cantidades y número de ficha.
- Calcular subtotal y total del pedido.
- Consultar pedidos activos del turno actual.
- Cancelar pedido presencial con motivo.
- Publicar evento `pedido.presencial.creado` en Redis al crear un pedido.
- Consultar tiempo estimado de preparación (recibido via evento Redis desde MS3).

**Módulo de Pagos**
- Registrar pago de pedido presencial con método (efectivo o QR) y monto recibido.
- Subir comprobante de pago a S3 y publicar evento `pago.registrado` en Redis.
- Recibir resultado del análisis del comprobante desde MS3 via evento Redis (`comprobante.analizado`).
- Actualizar estado del pago según resultado: `Aceptado`, `Rechazado` o `Revisión manual`.
- Calcular cambio en pagos en efectivo.
- Generar recibo de pago con detalle del pedido, monto y método de pago.
- Registrar hash del recibo en blockchain via web3j y guardar `txHash` en PostgreSQL.

**Módulo de Cocina**
- Exponer cola de pedidos activos ordenados por tiempo de creación y tiempo estimado.
- Actualizar estado de pedido desde cocina: `Pendiente` → `En preparación` → `Listo`.
- Notificar cambio de estado via evento Redis para actualización en tiempo real en el panel web.

**Módulo de Documentos y Blockchain**
- Listar documentos almacenados en S3 con sus metadatos (tipo, fecha, tamaño, URL).
- Registrar hash de documento administrativo (cierre de caja, reporte) en blockchain via web3j.
- Consultar transacción blockchain por `txHash` para verificar integridad de un documento.
- Descargar documento desde S3 via URL firmada temporal.

**Módulo de Configuración**
- Gestionar parámetros generales del restaurante: nombre, RUC, dirección, teléfono, horario de atención.
- Configurar parámetros operativos: tiempo máximo de preparación, umbral de alerta de cocina.

---

#### 4.1.5 Estructura de Carpetas y Descripción de Capas

La arquitectura sigue un patrón modular organizado por funcionalidades con separación clara entre dominio, infraestructura y características de negocio.

```
ms-restaurante/
├── src/
│   └── main/
│       ├── java/com/restaurante/
│       │   ├── common/                        # Componentes comunes y utilidades
│       │   │   ├── decorators/                # Anotaciones personalizadas (ej: @CurrentUserId)
│       │   │   ├── errors/                    # Manejador global de excepciones y definición de errores
│       │   │   └── response/                  # Wrappers de respuestas API estandarizadas
│       │   │
│       │   ├── config/                        # Configuración de Spring Boot
│       │   │   ├── OpenApiConfig.java         # Documentación Swagger
│       │   │   ├── SecurityConfig.java        # OAuth2 Resource Server: valida JWT con clave pública MS4
│       │   │   ├── RedisConfig.java           # Configuración de conexión Redis
│       │   │   ├── S3Config.java              # Configuración del cliente AWS S3
│       │   │   ├── Web3jConfig.java           # Configuración de conexión blockchain
│       │   │   └── WebConfig.java             # Configuración CORS y web
│       │   │
│       │   ├── domain/                        # Capa de dominio
│       │   │   └── models/                    # Entidades JPA: Categoria, Producto, Pedido,
│       │   │                                  # DetallePedido, Pago, Recibo, Documento, Configuracion
│       │   │
│       │   ├── features/                      # Módulos de negocio organizados por funcionalidad
│       │   │   ├── menu/                      # Controller, Service, Repository de Categoría y Producto
│       │   │   ├── pedidos/                   # Controller, Service, Repository de Pedido y DetallePedido
│       │   │   ├── pagos/                     # Controller, Service, Repository de Pago y Recibo
│       │   │   ├── cocina/                    # Controller, Service de cola de cocina
│       │   │   ├── blockchain/                # Controller, Service de documentos y blockchain (web3j)
│       │   │   └── configuracion/             # Controller, Service, Repository de Configuracion
│       │   │
│       │   ├── graphql/                       # Capa GraphQL expuesta a MS0
│       │   │   └── resolvers/                 # Resolvers GraphQL por módulo (menu, pedidos, pagos, cocina)
│       │   │
│       │   ├── infrastructure/                # Adaptadores de servicios externos
│       │   │   ├── s3/                        # S3Service: upload, download, URLs firmadas
│       │   │   ├── redis/                     # RedisPublisher, RedisSubscriber
│       │   │   └── rest/                      # MS2RestClient, MS3RestClient (llamadas inter-servicios)
│       │   │
│       │   ├── services/
│       │   │   └── thumbnail/                 # Servicio de generación de thumbnails para imágenes
│       │   │
│       │   └── RestauranteApplication.java    # Clase principal de Spring Boot
│       │
│       └── resources/
│           ├── application.yml                # Configuración base
│           ├── application-prod.yml           # Configuración de producción
│           ├── graphql/
│           │   └── schema.graphqls            # Schema GraphQL expuesto por MS1
│           └── certs/
│               └── ms4-public.pem             # Clave pública RSA de MS4 para validar JWT
│
├── .env
├── .env.example
├── pom.xml
└── mvnw / mvnw.cmd
```

**Descripción de capas:**

- **`common/`:** Decoradores personalizados (ej: `@CurrentUserId` para extraer el userId del JWT), manejador global de excepciones y wrappers de respuestas API estandarizadas.
- **`config/`:** Clases de configuración Spring Boot. `SecurityConfig` configura OAuth2 Resource Server para validar JWT emitidos por MS4 usando su clave pública RSA.
- **`domain/models/`:** Entidades JPA que mapean las tablas de PostgreSQL del dominio del restaurante.
- **`features/`:** Módulos de negocio organizados por funcionalidad. Cada módulo contiene su Controller (REST + GraphQL resolver), Service (lógica de negocio) y Repository (acceso a datos JPA).
- **`graphql/resolvers/`:** Resolvers GraphQL que exponen las operaciones de MS1 al Superschema de MS0.
- **`infrastructure/`:** Adaptadores desacoplados para S3, Redis y clientes REST inter-servicios hacia MS2 y MS3.
- **`services/thumbnail/`:** Servicio utilitario para generación de thumbnails de imágenes de productos.

---

#### 4.1.6 Esquema GraphQL (expuesto al frontend via MS0)

MS1 expone un endpoint GraphQL en `/graphql` consumido por MS0 via Schema Stitching. El frontend accede a estas operaciones a través del Superschema unificado de MS0.

```graphql
type Query {
  # Menú
  obtenerMenu: [Producto!]!
  obtenerProducto(id: ID!): Producto
  obtenerCategorias: [Categoria!]!

  # Pedidos
  obtenerPedido(id: ID!): Pedido
  obtenerPedidosPorFecha(fecha: String!): [Pedido!]!
  obtenerPedidosHistoricos(clienteId: ID!, limit: Int): [Pedido!]!
  obtenerColaCocina: [Pedido!]!

  # Pagos y documentos
  obtenerResultadoPago(pagoId: ID!): Pago
  obtenerDocumentos: [Documento!]!
  obtenerConfiguracion: Configuracion!
}

type Mutation {
  # Menú
  crearProducto(input: ProductoInput!): Producto!
  editarProducto(id: ID!, input: ProductoInput!): Producto!
  cambiarDisponibilidadProducto(id: ID!, disponible: Boolean!): Producto!

  # Pedidos presenciales
  crearPedido(input: PedidoInput!): Pedido!
  cancelarPedido(id: ID!, motivo: String!): Pedido!

  # Cocina
  actualizarEstadoCocina(pedidoId: ID!, estado: EstadoPedido!): Pedido!

  # Sincronización delivery (llamado internamente por MS2 via REST)
  sincronizarEstadoDelivery(pedidoId: ID!, estado: EstadoDelivery!): Pedido!

  # Pagos
  registrarPago(input: PagoInput!): Pago!

  # Blockchain y documentos
  registrarHashDocumento(documentoId: ID!, tipo: TipoDocumento!): String!
  actualizarConfiguracion(input: ConfiguracionInput!): Configuracion!
}

enum EstadoPedido { PENDIENTE EN_PREPARACION LISTO ENTREGADO CANCELADO }
enum EstadoDelivery { CONFIRMADO EN_PREPARACION EN_CAMINO ENTREGADO CANCELADO }
enum TipoDocumento { RECIBO_PAGO CIERRE_CAJA REPORTE_ADMINISTRATIVO }
enum MetodoPago { EFECTIVO QR }
enum EstadoPago { PENDIENTE ACEPTADO RECHAZADO REVISION_MANUAL }
```

---

#### 4.1.7 Endpoints REST expuestos

Todos los endpoints validan el JWT emitido por MS4 via OAuth2 Resource Server.

| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| GET | `/api/menu` | Obtener menú completo | Todos |
| POST | `/api/menu/productos` | Crear producto | Administrador |
| PUT | `/api/menu/productos/{id}` | Editar producto | Administrador |
| PATCH | `/api/menu/productos/{id}/disponibilidad` | Cambiar disponibilidad | Administrador |
| POST | `/api/menu/productos/{id}/imagen` | Recibir imagen desde MS0 proxy y subir a S3 | Administrador |
| POST | `/api/pedidos` | Registrar pedido presencial | Cajero |
| GET | `/api/pedidos/turno` | Pedidos del turno activo | Cajero |
| GET | `/api/pedidos/{id}` | Detalle de pedido | Cajero, Administrador |
| DELETE | `/api/pedidos/{id}` | Cancelar pedido | Cajero |
| POST | `/api/pagos` | Registrar pago y subir comprobante | Cajero, Cliente |
| GET | `/api/cocina/cola` | Cola de pedidos activos | Cocina |
| PATCH | `/api/cocina/pedidos/{id}/estado` | Cambiar estado de pedido | Cocina |
| GET | `/api/blockchain/documentos` | Listar documentos | Administrador |
| POST | `/api/blockchain/registrar` | Registrar hash de documento | Administrador |
| GET | `/api/blockchain/verificar/{txHash}` | Verificar integridad | Administrador |
| GET | `/api/configuracion` | Obtener configuración | Administrador |
| PUT | `/api/configuracion` | Actualizar configuración | Administrador |
| GET | `/api/internal/resumen-dia` | Resumen de ventas del día (solo para MS2 inter-servicios) | Interno |

---

#### 4.1.8 Eventos publicados / consumidos

| Acción | Canal Redis | Tipo | Payload principal |
|---|---|---|---|
| **Publica** | `pedido.presencial.creado` | Publicador | `pedidoId`, `tipo: PRESENCIAL`, `productos`, `clienteId` |
| **Publica** | `pago.registrado` | Publicador | `pedidoId`, `pagoId`, `comprobanteUrl` |
| **Consume** | `comprobante.analizado` | Suscriptor | `pagoId`, `resultado` (ACEPTADO/RECHAZADO/REVISION) |
| **Consume** | `tiempo.estimado` | Suscriptor | `pedidoId`, `tiempoEstimadoMinutos` |
| **Consume** | `entrega.confirmada` | Suscriptor | `pedidoId`, `evidenciaUrl`, `timestamp` |
| **Consume** | `delivery.estado` | Suscriptor | `pedidoId`, `nuevoEstado` |

---

#### 4.1.9 Variables de Entorno

| Variable | Descripción |
|---|---|
| `SERVER_PORT` | Puerto del servidor (default: 8080) |
| `SPRING_DATASOURCE_URL` | URL de conexión PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | Usuario PostgreSQL |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña PostgreSQL |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | Estrategia DDL (validate en producción) |
| `REDIS_HOST` | Host del servidor Redis |
| `REDIS_PORT` | Puerto Redis (default: 6379) |
| `REDIS_PASSWORD` | Contraseña Redis |
| `AWS_REGION` | Región AWS |
| `AWS_ACCESS_KEY_ID` | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS |
| `AWS_S3_BUCKET_NAME` | Nombre del bucket S3 |
| `BLOCKCHAIN_CONTRACT_ADDRESS` | Dirección del smart contract desplegado en testnet |
| `BLOCKCHAIN_NETWORK_URL` | URL RPC de la red testnet (Polygon Mumbai) |
| `BLOCKCHAIN_WALLET_PRIVATE_KEY` | Clave privada de la wallet para firmar transacciones |
| `MS2_REST_INTERNAL_URL` | URL interna REST de MS2 para comunicación inter-servicios |
| `MS3_REST_INTERNAL_URL` | URL interna REST de MS3 para comunicación inter-servicios |
| `MS4_JWT_PUBLIC_KEY` | Ruta a la clave pública RSA de MS4 para validar JWT (`classpath:certs/ms4-public.pem`) |

---