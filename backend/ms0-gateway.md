### 4.0 MS0 - API Gateway GraphQL (NestJS)

#### 4.0.1 Responsabilidad y Contexto de Dominio

MS0 es el único punto de entrada público del sistema. Actúa como **GraphQL Gateway** para todos los frontends (Angular y React Native) usando la estrategia de **Schema Stitching**. Su responsabilidad es exclusivamente de infraestructura de comunicación: no contiene lógica de negocio del restaurante ni gestión de usuarios.

Al iniciar, MS0 descarga remotamente los schemas GraphQL de MS1, MS2 y MS3 y los unifica en un único Superschema. El frontend realiza todas sus queries y mutations contra MS0 en un único endpoint `/graphql`. MS0 delega cada operación al microservicio propietario del tipo correspondiente.

Centraliza dos funciones críticas:
- **Autorización:** valida tokens JWT emitidos por MS4 y verifica que el rol del usuario tenga permiso para ejecutar la operación GraphQL solicitada via guards declarativos por operación.
- **Schema Stitching:** unifica los schemas GraphQL de MS1, MS2 y MS3 en un Superschema y delega cada operación al microservicio correcto.

Ningún microservicio interno (MS1, MS2, MS3, MS4) está expuesto públicamente. Solo MS0 tiene URL pública accesible desde internet. La autenticación y gestión de usuarios es responsabilidad exclusiva de MS4.

---

#### 4.0.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework | NestJS (TypeScript) |
| GraphQL Gateway | `@nestjs/graphql` + `@graphql-tools/stitch` + `@graphql-tools/wrap` |
| Schema remoto | `@graphql-tools/executor-http` para descargar schemas de MS1/MS2/MS3 |
| Validación JWT | `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` (verifica tokens emitidos por MS4) |
| Autorización | Guards por operación GraphQL con decorador `@Roles()` |
| Cliente HTTP | `@nestjs/axios` para llamadas REST a MS4 (auth) |
| Cliente DynamoDB | `@aws-sdk/client-dynamodb` |
| Variables de entorno | `@nestjs/config` |

---

#### 4.0.3 Base de Datos Utilizada

MS0 no tiene base de datos propia. Escribe logs de auditoría directamente en **Amazon DynamoDB**.

| Almacenamiento | Uso |
|---|---|
| Amazon DynamoDB | Registro de eventos de auditoría: logins, logouts, accesos denegados, errores de operaciones GraphQL y requests por usuario. |

---

#### 4.0.4 Módulos y Casos de Uso

**Módulo Auth (REST):**
- `POST /api/auth/login` — Recibe credenciales, delega validación a MS4 via REST, retorna JWT emitido por MS4.
- `POST /api/auth/logout` — Registra el evento en DynamoDB.
- `POST /api/auth/registro` — Delega el registro de nuevos Clientes a MS4 via REST.

**Módulo Schema Stitching (GraphQL Gateway):**
- Al iniciar la aplicación, descarga el schema GraphQL de MS1, MS2 y MS3 via introspection.
- Unifica los tres schemas en un Superschema con `@graphql-tools/stitch`.
- Expone el Superschema unificado en el endpoint `/graphql`.
- En cada operación GraphQL entrante:
  - Valida el JWT del header `Authorization` usando la clave pública de MS4.
  - Verifica el rol del usuario contra la operación solicitada.
  - Inyecta el contexto `{ userId, role }` en el request delegado.
  - Delega la operación al microservicio propietario del tipo/resolver correspondiente.
- Recarga automáticamente los schemas remotos si un microservicio se reinicia (polling configurable).

**Módulo Auditoría:**
- Registra en DynamoDB cada operación GraphQL ejecutada: `timestamp`, `userId`, `role`, `operationName`, `operationType`, `statusCode`, `ip`.
- Registra eventos críticos: login exitoso, login fallido, acceso denegado por rol.

**Tabla de permisos por operación GraphQL:**

| Operación GraphQL | Microservicio propietario | Roles permitidos |
|---|---|---|
| `login`, `registro` | MS4 (via REST, no GraphQL) | Público |
| `obtenerMenu`, `obtenerProducto` | MS1 | Todos autenticados |
| `crearPedido`, `cancelarPedido` | MS1 | Cajero |
| `actualizarEstadoCocina` | MS1 | Cocina |
| `registrarPago` | MS1 | Cajero, Cliente |
| `gestionarUsuarios` | MS4 | Administrador |
| `crearPedidoDelivery` | MS2 | Cliente |
| `confirmarEntrega`, `reportarIncidencia` | MS2 | Repartidor |
| `obtenerPedidosAsignados` | MS2 | Repartidor |
| `obtenerReportesBI`, `ejecutarSegmentacion` | MS3 | Administrador |
| `obtenerResultadoComprobante` | MS3 | Administrador, Cajero |

---

#### 4.0.5 Estructura de Carpetas y Descripción de Capas

```
ms0-api-gateway/
├── src/
│   ├── auth/                              # Módulo de autenticación REST
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts             # Endpoints REST: /api/auth/login, logout, registro
│   │   ├── auth.service.ts                # Delega auth a MS4, valida tokens JWT emitidos por MS4
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts            # Estrategia Passport para validar JWT en GraphQL (usa clave pública de MS4)
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts          # Guard que valida el JWT en cada operación GraphQL
│   │       └── roles.guard.ts             # Guard que verifica el rol por operación GraphQL
│   │
│   ├── gateway/                           # Módulo de Schema Stitching (núcleo del gateway)
│   │   ├── gateway.module.ts
│   │   ├── gateway.service.ts             # Descarga schemas remotos y construye el Superschema
│   │   ├── gateway.plugin.ts              # Plugin Apollo para inyectar contexto JWT en cada operación
│   │   └── permissions.config.ts          # Mapa declarativo: operación GraphQL → roles permitidos
│   │
│   ├── audit/                             # Módulo de auditoría en DynamoDB
│   │   ├── audit.module.ts
│   │   ├── audit.service.ts               # Escritura de eventos en DynamoDB
│   │   └── audit.interceptor.ts           # Interceptor que captura cada operación GraphQL
│   │
│   ├── common/                            # Utilidades transversales
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts         # Decorador @Roles() para permisos por operación
│   │   ├── filters/
│   │   │   └── graphql-exception.filter.ts # Formato estándar de errores GraphQL
│   │   └── interfaces/
│   │       └── jwt-payload.interface.ts   # Interfaz del payload JWT: { userId, role, iat, exp }
│   │
│   ├── config/
│   │   └── configuration.ts               # Lectura de variables de entorno
│   │
│   ├── app.module.ts                      # Módulo raíz: registra GraphQLModule con Schema Stitching
│   └── main.ts                            # Bootstrap, CORS, puerto
│
├── .env
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Descripción de capas:**

- **`auth/`:** Responsable de login, logout y registro via REST. Delega todas las operaciones de auth a MS4. Valida tokens JWT emitidos por MS4 usando su clave pública.
- **`gateway/`:** Núcleo del Gateway. Descarga schemas de MS1/MS2/MS3 al iniciar, los une con Schema Stitching y expone el Superschema en `/graphql`. El plugin inyecta el contexto de identidad en cada operación delegada.
- **`audit/`:** Capa transversal de observabilidad. El interceptor captura automáticamente cada operación sin modificar la lógica del gateway.
- **`common/`:** Decoradores de roles, filtro de errores GraphQL e interfaces compartidas.
- **`config/`:** Centraliza la lectura de variables de entorno.

---

#### 4.0.6 Esquema GraphQL

MS0 **no define tipos ni resolvers propios**. Su schema GraphQL es el Superschema resultante de unificar los schemas de MS1, MS2 y MS3 via Schema Stitching. MS0 es un delegador puro: cada operación es resuelta por el microservicio propietario del tipo. Las operaciones relacionadas con usuarios son resueltas por MS4.

---

#### 4.0.7 Endpoints expuestos hacia el Frontend

| Tipo | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| REST POST | `/api/auth/login` | Login, delega a MS4 y retorna JWT | Pública |
| REST POST | `/api/auth/logout` | Cierre de sesión | JWT requerido |
| REST POST | `/api/auth/registro` | Registro de nuevo Cliente, delega a MS4 | Pública |
| GraphQL | `/graphql` | Superschema unificado: todas las queries y mutations del sistema | JWT + Rol requerido (excepto operaciones públicas) |

---

#### 4.0.8 Eventos publicados / consumidos

MS0 **no publica ni consume eventos de Redis**. Su comunicación es exclusivamente GraphQL (hacia frontends) y REST (hacia MS4 para auth).

---

#### 4.0.9 Variables de Entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 4000) |
| `MS4_JWT_PUBLIC_KEY` | Clave pública de MS4 para verificar tokens JWT |
| `MS1_GRAPHQL_URL` | URL del endpoint GraphQL interno de MS1 |
| `MS4_REST_URL` | URL interna de MS4 para llamadas REST de auth |
| `MS2_GRAPHQL_URL` | URL del endpoint GraphQL interno de MS2 |
| `MS3_GRAPHQL_URL` | URL del endpoint GraphQL interno de MS3 |
| `SCHEMA_POLL_INTERVAL_MS` | Intervalo de recarga de schemas remotos en ms (default: 30000) |
| `AWS_REGION` | Región AWS para DynamoDB |
| `AWS_ACCESS_KEY_ID` | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS |
| `DYNAMODB_AUDIT_TABLE` | Nombre de la tabla DynamoDB de auditoría |
| `CORS_ORIGINS` | Orígenes permitidos para CORS (URLs de los frontends) |

---