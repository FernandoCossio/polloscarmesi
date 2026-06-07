### 4.1 MS1 - Gestión Restaurante (Spring Boot)

#### 4.1.1 Responsabilidad y Contexto de Dominio

MS1 es el núcleo transaccional del sistema. Gestiona los dominios de negocio del restaurante: menú, pedidos presenciales, pagos, cocina, documentos y registro blockchain. La gestión de usuarios y autenticación se delega completamente a MS4.

MS1 recibe operaciones GraphQL delegadas desde MS0 (via Schema Stitching) y expone su propio schema GraphQL en `/graphql`. Se comunica con MS2 y MS3 via REST interno cuando necesita datos de sus dominios de forma síncrona. Publica y consume eventos en Redis para coordinación asíncrona. Interactúa con Amazon S3 para almacenamiento de documentos y con el smart contract Solidity via web3j para registro de hashes. La seguridad se basa en validación de tokens JWT emitidos por MS4.

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
| Seguridad | Spring Security (validación de headers internos de MS0) |
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
| Amazon S3 | Almacenamiento de archivos: comprobantes de pago, recibos generados y documentos administrativos. MS1 guarda solo la URL y metadatos en PostgreSQL. |
| Redis | Canal Pub/Sub para publicar y consumir eventos asincrónicos con MS2 y MS3. |

---

#### 4.1.4 Módulos y Casos de Uso

**Módulo de Menú y Productos**
- CRUD de categorías del menú (ej: Pollos, Bebidas, Guarniciones).
- CRUD de productos: nombre, descripción, precio, categoría, imagen (URL S3) y disponibilidad.
- Activar y desactivar disponibilidad de un producto en tiempo real.
- Consultar menú completo con filtro por categoría (consumido por frontends y por MS2 via GraphQL).
- Subir imagen de producto a S3 y guardar URL en PostgreSQL.

**Módulo de Pedidos Presenciales**
- Registrar nuevo pedido presencial con lista de productos, cantidades y número de ficha.
- Calcular subtotal, descuentos y total del pedido.
- Consultar pedidos activos del turno actual.
- Cancelar pedido presencial con motivo.
- Publicar evento `pedido.creado` en Redis al crear un pedido.
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

La arquitectura sigue un patrón modular organizado por funcionalidades, con separación clara entre dominio, infraestructura y características de negocio.

```
ms-restaurante/
├── src/
│   └── main/
│       ├── java/com/restaurante/
│       │   ├── common/                        # Componentes comunes y utilidades
│       │   │   ├── decorators/                # Decoradores y anotaciones personalizadas
│       │   │   ├── errors/                    # Manejador global de excepciones y definiciones de errores
│       │   │   └── response/                  # Wrappers de respuestas API estandarizadas
│       │   ├── config/                        # Configuración de Spring Boot
│       │   │   ├── OpenApiConfig.java
│       │   │   ├── SecurityConfig.java        # Configuración de seguridad con OAuth2 Resource Server
│       │   │   └── WebConfig.java
│       │   ├── domain/                        # Capa de dominio (modelos y DTOs)
│       │   │   └── models/                    # Entidades JPA del dominio
│       │   ├── services/                      # Servicios de infraestructura externos
│       │   │   └── thumbnail/                 # Servicio de generación de thumbnails
│       │   └── RestauranteApplication.java    # Clase principal de Spring Boot
│       └── resources/
│           ├── application.properties         # Configuración de la aplicación
│           └── (graphql/schema.graphqls)      # (Por implementar) Schema GraphQL
│
├── .env
├── .env.example
├── pom.xml
└── mvnw / mvnw.cmd
```

**Descripción de capas y módulos:**

- **`common/`:** Componentes reutilizables: decoradores personalizados (ej: `@CurrentUserId`), manejador global de excepciones, y wrappers de respuestas API estandarizadas.
- **`config/`:** Clases de configuración de Spring Boot: seguridad (validación de tokens JWT de MS4), OpenAPI (Swagger), y configuración web.
- **`domain/`:** Capa de dominio central:
  - **`models/`:** Entidades JPA que mapean las tablas de PostgreSQL.
- **`services/`:** Adaptadores de servicios externos: generación de thumbnails.
- **`resources/`:** Archivos de configuración (`application.properties`) y recursos estáticos.

---

#### 4.1.6 Esquema GraphQL (Queries y Mutations expuestos a MS2 y MS3)

MS1 expone un endpoint GraphQL en `/graphql` consumido por MS0 via Schema Stitching. El frontend accede a estas operaciones a través del Superschema unificado de MS0. Los tipos y operaciones aquí definidos son la fuente de verdad del dominio de gestión del restaurante. Las consultas de usuarios y clientes se delegan a MS4.

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
}

type Mutation {
  # Pedidos (MS2 notifica sincronización de estado delivery)
  sincronizarEstadoDelivery(pedidoId: ID!, estado: EstadoDelivery!): Pedido!
}

type Producto {
  id: ID!
  nombre: String!
  descripcion: String
  precio: Float!
  categoria: Categoria!
  imagenUrl: String
  disponible: Boolean!
}

type Categoria {
  id: ID!
  nombre: String!
}

type Pedido {
  id: ID!
  numerFicha: String
  tipo: TipoPedido!
  estado: String!
  total: Float!
  detalles: [DetallePedido!]!
  fechaCreacion: String!
}

type DetallePedido {
  producto: Producto!
  cantidad: Int!
  subtotal: Float!
}

enum TipoPedido { PRESENCIAL DELIVERY }
enum EstadoDelivery { CONFIRMADO EN_PREPARACION EN_CAMINO ENTREGADO CANCELADO }
```

---

#### 4.1.7 Endpoints REST expuestos hacia MS0

Todos los endpoints requieren un token JWT válido emitido por MS4.

| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| GET | `/api/menu` | Obtener menú completo | Todos |
| POST | `/api/menu/productos` | Crear producto | Administrador |
| PUT | `/api/menu/productos/{id}` | Editar producto | Administrador |
| PATCH | `/api/menu/productos/{id}/disponibilidad` | Cambiar disponibilidad | Administrador |
| POST | `/api/pedidos` | Registrar pedido presencial | Cajero |
| GET | `/api/pedidos/turno` | Pedidos del turno activo | Cajero |
| GET | `/api/pedidos/{id}` | Detalle de pedido | Cajero, Administrador |
| DELETE | `/api/pedidos/{id}` | Cancelar pedido | Cajero |
| POST | `/api/pagos` | Registrar pago y subir comprobante | Cajero, Cliente |
| GET | `/api/cocina/cola` | Cola de pedidos activos | Cocina |
| PATCH | `/api/cocina/pedidos/{id}/estado` | Cambiar estado de pedido | Cocina |
| GET | `/api/blockchain/documentos` | Listar documentos con metadatos | Administrador |
| POST | `/api/blockchain/registrar` | Registrar hash de documento | Administrador |
| GET | `/api/blockchain/verificar/{txHash}` | Verificar integridad de documento | Administrador |
| GET | `/api/configuracion` | Obtener configuración del restaurante | Administrador |
| PUT | `/api/configuracion` | Actualizar configuración | Administrador |

---

#### 4.1.8 Eventos publicados / consumidos

| Acción | Canal Redis | Tipo | Payload principal |
|---|---|---|---|
| **Publica** | `pedido.creado` | Publicador | `pedidoId`, `tipo`, `productos`, `clienteId` |
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
| `BLOCKCHAIN_NETWORK_URL` | URL RPC de la red testnet (Sepolia/Polygon) |
| `BLOCKCHAIN_WALLET_PRIVATE_KEY` | Clave privada de la wallet para firmar transacciones |
| `MS2_REST_INTERNAL_URL` | URL interna REST de MS2 para comunicación inter-servicios |
| `MS3_REST_INTERNAL_URL` | URL interna REST de MS3 para comunicación inter-servicios |
| `MS4_JWT_PUBLIC_KEY` | Clave pública para validar tokens JWT de MS4 |

---

### 4.2 MS4 - Autenticación y Usuarios (Spring Boot)

#### 4.2.1 Responsabilidad y Contexto de Dominio

MS4 es el microservicio dedicado a la gestión de usuarios, autenticación y autorización. Se encarga de:
- Generación y validación de tokens JWT
- Registro y gestión de usuarios (clientes y personal interno)
- Gestión de roles y permisos
- Carga inicial de datos (seed)
- Envío de correos electrónicos

MS4 expone endpoints REST para autenticación y gestión de usuarios, y actúa como OAuth2 Authorization Server emitiendo tokens JWT que son validados por los otros microservicios (MS1, MS2, MS3).

#### 4.2.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework | Spring Boot 4.x (Java 21) |
| ORM | Spring Data JPA + Hibernate |
| Base de datos | PostgreSQL via JDBC |
| Seguridad | Spring Security + JWT (con claves pública/privada) |
| Validación | Spring Validation (jakarta.validation) |
| Documentación | SpringDoc OpenAPI (Swagger) |
| Email | Spring Boot Starter Mail |
| Variables de entorno | Spring Boot + springboot4-dotenv |

#### 4.2.3 Base de Datos Utilizada

| Almacenamiento | Uso |
|---|---|
| PostgreSQL | Almacena usuarios, roles y relaciones entre ellos |
| Certificados (resources/certs) | Claves pública y privada para firmar/verificar tokens JWT |

#### 4.2.4 Módulos y Casos de Uso

**Módulo de Autenticación**
- Inicio de sesión (login) con credenciales (username/contraseña)
- Generación de tokens JWT con roles integrados
- Validación de tokens (para otros microservicios)

**Módulo de Usuarios**
- Registro de nuevos clientes
- CRUD de usuarios internos (solo Administrador)
- Consulta de perfil de usuario autenticado
- Actualización de datos de perfil
- Activación/desactivación de usuarios
- Gestión de direcciones de entrega para clientes

**Módulo de Roles**
- Definición y gestión de roles (Administrador, Cajero, Cocina, Repartidor, Cliente)
- Asignación de roles a usuarios

#### 4.2.5 Estructura de Carpetas y Descripción de Capas

```
auth/
├── src/
│   └── main/
│       ├── java/com/auth/
│       │   ├── auth/                          # Capa de autenticación y seguridad
│       │   │   ├── jwt/                       # Servicios de generación y validación de tokens JWT
│       │   │   └── userdetails/               # Implementación de UserDetails para Spring Security
│       │   ├── common/                        # Componentes comunes y utilidades
│       │   │   ├── decorators/                # Decoradores y anotaciones personalizadas
│       │   │   ├── errors/                    # Manejador global de excepciones y definiciones de errores
│       │   │   └── response/                  # Wrappers de respuestas API estandarizadas
│       │   ├── config/                        # Configuración de Spring Boot
│       │   │   ├── JwtConfig.java
│       │   │   ├── OpenApiConfig.java
│       │   │   ├── SecurityConfig.java
│       │   │   └── WebConfig.java
│       │   ├── domain/                        # Capa de dominio (modelos y DTOs)
│       │   │   ├── dtos/                      # Objetos de transferencia de datos
│       │   │   │   ├── auth/
│       │   │   │   └── usuario/
│       │   │   ├── enums/                     # Enumeraciones del dominio
│       │   │   └── models/                    # Entidades JPA del dominio
│       │   ├── features/                      # Módulos de funcionalidad (features)
│       │   │   ├── auth/                      # Feature de autenticación
│       │   │   ├── rol/                       # Feature de gestión de roles
│       │   │   └── usuario/                   # Feature de gestión de usuarios
│       │   ├── seed/                          # Carga inicial de datos
│       │   ├── services/                      # Servicios de infraestructura externos
│       │   │   └── email/                     # Servicio de envío de correos
│       │   └── AuthApplication.java           # Clase principal de Spring Boot
│       └── resources/
│           ├── application.properties         # Configuración de la aplicación
│           └── certs/                         # Certificados para JWT
│               ├── private.pem                # Clave privada para firmar tokens
│               └── public.pem                 # Clave pública para verificar tokens
│
├── .env
├── .env.example
├── pom.xml
└── mvnw / mvnw.cmd
```

**Descripción de capas y módulos:**

- **`auth/`:** Contiene la lógica de seguridad: generación y validación de tokens JWT (`jwt/`), y la implementación de `UserDetailsService` para integración con Spring Security (`userdetails/`).
- **`common/`:** Componentes reutilizables: decoradores personalizados (ej: `@CurrentUserId`), manejador global de excepciones, y wrappers de respuestas API estandarizadas.
- **`config/`:** Clases de configuración de Spring Boot: seguridad, JWT, OpenAPI (Swagger), y configuración web.
- **`domain/`:** Capa de dominio central:
  - **`dtos/`:** Objetos de transferencia de datos para requests y responses.
  - **`enums/`:** Enumeraciones del dominio (ej: `RolNombre`).
  - **`models/`:** Entidades JPA que mapean las tablas de PostgreSQL (ej: `Usuario`, `Rol`).
- **`features/`:** Módulos organizados por funcionalidades de negocio. Cada feature contiene Controller, Service, Repository y Exceptions específicas.
- **`seed/`:** Componentes para carga inicial de datos en la base de datos (roles y usuarios de prueba).
- **`services/`:** Adaptadores de servicios externos: envío de emails.
- **`resources/certs/`:** Certificados para firma y verificación de tokens JWT.

#### 4.2.6 Endpoints REST

| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| POST | `/api/auth/login` | Inicio de sesión, retorna token JWT | Público |
| POST | `/api/auth/register` | Registro de nuevo cliente | Público |
| GET | `/api/usuarios` | Listar usuarios internos | Administrador |
| POST | `/api/usuarios` | Crear usuario interno | Administrador |
| PUT | `/api/usuarios/{id}` | Editar usuario | Administrador |
| PATCH | `/api/usuarios/{id}/estado` | Activar/desactivar usuario | Administrador |
| GET | `/api/usuarios/me` | Obtener perfil del usuario autenticado | Todos |

#### 4.2.7 Variables de Entorno

| Variable | Descripción |
|---|---|
| `SERVER_PORT` | Puerto del servidor (default: 8081) |
| `SPRING_DATASOURCE_URL` | URL de conexión PostgreSQL (db auth_restaurante) |
| `SPRING_DATASOURCE_USERNAME` | Usuario PostgreSQL |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña PostgreSQL |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | Estrategia DDL (validate en producción) |
| `APP_JWT_ISSUER` | Emisor de tokens JWT |
| `APP_JWT_ACCESS_TOKEN_TTL` | Tiempo de vida de tokens de acceso |
| `SPRING_MAIL_HOST` | Host de servidor de correo |
| `SPRING_MAIL_PORT` | Puerto de servidor de correo |
| `SPRING_MAIL_USERNAME` | Usuario de correo |
| `SPRING_MAIL_PASSWORD` | Contraseña de correo |
| `APP_BASE_URL` | URL base del microservicio |
