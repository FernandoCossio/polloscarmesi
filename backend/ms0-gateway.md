### 4.0 MS0 - API Gateway GraphQL (NestJS)

#### 4.0.1 Responsabilidad y Contexto de Dominio

MS0 es el único punto de entrada público del sistema. Actúa como **API Gateway** para los frontends, exponiendo un endpoint **GraphQL** (`/graphql`) y endpoints **REST** puntuales. Su responsabilidad es exclusivamente de infraestructura de comunicación: no contiene lógica de negocio del restaurante ni gestión de usuarios.

Al iniciar, MS0 descarga remotamente el schema GraphQL de los microservicios configurados via introspection, lo envuelve y lo expone en un único schema en `/graphql`. Cada operación GraphQL se delega al microservicio remoto correspondiente. Además, MS0 ofrece endpoints REST que delegan a otros microservicios.

En la lógica actual, MS0 no “autoriza” centralizadamente las operaciones. En su lugar:
- **Propaga el JWT**: si el request trae `Authorization: Bearer <token>`, MS0 reenvía ese header a los microservicios al delegar la operación (GraphQL y proxy REST).
- **Obtiene `req.user` (sin bloquear)**: en un middleware global, MS0 intenta verificar de forma liviana el JWT (firma RSA y `exp/nbf`) usando la clave pública de MS4 para poblar `req.user` (ej. `{ userId, role }`). Si el token es inválido o está expirado, simplemente no se setea `req.user`; la petición aún puede continuar y el microservicio destino decide si rechaza por autenticación/autorización.
- **Auditoría**: registra operaciones REST/GraphQL y, si existe, asocia `userId/role` desde `req.user`.

Ningún microservicio interno (MS1, MS2, MS3, MS4) está expuesto públicamente. Solo MS0 tiene URL pública accesible desde internet. La autenticación y gestión de usuarios es responsabilidad exclusiva de MS4.

---

#### 4.0.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework | NestJS (TypeScript) |
| GraphQL Gateway | `@nestjs/graphql` + `@graphql-tools/stitch` + `@graphql-tools/wrap` |
| Schema remoto | `@graphql-tools/executor-http` (introspection remota) |
| JWT (para `req.user`) | Verificación ligera con `crypto` (firma RSA + `exp/nbf`) usando clave pública de MS4 |
| Propagación de JWT | Reenvío del header `Authorization` hacia los microservicios al delegar operaciones |
| Cliente HTTP | `@nestjs/axios` + `axios` + `rxjs` (REST hacia MS4 y proxy REST hacia MS1) |
| Subida de archivos (proxy) | `@nestjs/platform-express` (multer) + `form-data` |
| Documentación REST | `@nestjs/swagger` + `swagger-ui-express` |
| Cliente DynamoDB | `@aws-sdk/client-dynamodb` + `@aws-sdk/util-dynamodb` |
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
- `POST /auth/login` — Recibe credenciales, delega validación a MS4 via REST y retorna el JWT emitido por MS4.
- `POST /auth/register` — Delega el registro de nuevos Clientes a MS4 via REST.

**Módulo Schema Stitching (GraphQL Gateway):**
- Al iniciar la aplicación, descarga el schema GraphQL del microservicio remoto configurado (actualmente MS1) via introspection.
- Construye el schema del gateway envolviendo el schema remoto y exponiéndolo en `/graphql`.
- En cada operación GraphQL entrante:
  - Usa el contexto `{ req }` para acceder a headers/usuario.
  - Reenvía el header `Authorization` hacia el microservicio remoto al ejecutar la operación (sin bloquear ni imponer roles en el gateway).
  - Delega la resolución al microservicio remoto.
- Recarga automáticamente el schema remoto con polling configurable.

**Proxy de archivos (REST):**
- `POST /productos/:id/imagen` — Recibe `multipart/form-data` (campo `file`) y reenvía el archivo a MS1 via REST, propagando `Authorization` si está presente.

**Módulo Auditoría:**
- Registra en DynamoDB cada operación GraphQL ejecutada: `timestamp`, `userId`, `role`, `operationName`, `operationType`, `statusCode`, `ip`.
- Registra también operaciones REST expuestas por el gateway (auth y proxy), asociando `userId/role` si el request trae un JWT válido (según la extracción de `req.user`).

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
gateway/
├── src/
│   ├── auth-rest/                         # Auth REST (delegación a MS4)
│   │   ├── dto/                           # DTOs request/response
│   │   ├── auth-rest.controller.ts        # Endpoints REST: /auth/login, /auth/register
│   │   ├── auth-rest.module.ts
│   │   └── auth-rest.service.ts           # Llamadas REST a MS4
│   │
│   ├── gateway/                           # Módulo de Schema Stitching (núcleo del gateway)
│   │   ├── gateway.module.ts
│   │   └── gateway.service.ts             # Descarga schema remoto (MS1) y construye el schema del gateway
│   │
│   ├── audit/                             # Módulo de auditoría en DynamoDB
│   │   ├── audit.module.ts
│   │   ├── audit.service.ts               # Escritura de eventos en DynamoDB
│   │   └── audit.interceptor.ts           # Interceptor que captura cada operación GraphQL
│   │
│   ├── config/
│   │   └── configuration.ts               # Lectura de variables de entorno
│   │
│   ├── productos-proxy.controller.ts      # Proxy REST para subida de imagen de producto hacia MS1
│   ├── app.module.ts                      # Módulo raíz: registra GraphQLModule con Schema Stitching
│   └── main.ts                            # Bootstrap, CORS, puerto
│
├── test/
│   └── jest-e2e.json
├── .env
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Descripción de capas:**

- **`auth-rest/`:** Responsable de login y registro via REST. Delega estas operaciones a MS4.
- **`gateway/`:** Núcleo del Gateway. Descarga el schema remoto (actualmente MS1) al iniciar, lo expone en `/graphql` y reenvía el header `Authorization` al delegar operaciones.
- **`audit/`:** Capa transversal de observabilidad. El interceptor captura automáticamente cada operación sin modificar la lógica del gateway.
- **`productos-proxy.controller.ts`:** Endpoint REST para subida de archivos que actúa como pasarela hacia MS1.
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
| `MS4_REST_URL` | URL interna base de MS4 para llamadas REST (default en config: `http://localhost:8081/api`) |
| `MS4_JWT_PUBLIC_KEY_PATH` | Ruta al archivo PEM con la clave pública de MS4 (default: `./certs/public.pem`) |
| `MS1_GRAPHQL_URL` | URL del endpoint GraphQL interno de MS1 (default: `http://localhost:8082/api/graphql`) |
| `MS1_REST_URL` | URL REST interna de MS1 (default: `http://localhost:8082/api`) |
| `MS2_GRAPHQL_URL` | URL del endpoint GraphQL interno de MS2 (configurado aunque no se usa en la lógica actual del stitching) |
| `MS3_GRAPHQL_URL` | URL del endpoint GraphQL interno de MS3 (configurado aunque no se usa en la lógica actual del stitching) |
| `SCHEMA_POLL_INTERVAL_MS` | Intervalo de recarga de schemas remotos en ms (default: 30000) |
| `AWS_REGION` | Región AWS para DynamoDB |
| `AWS_ACCESS_KEY_ID` | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS |
| `DYNAMODB_AUDIT_TABLE` | Nombre de la tabla DynamoDB de auditoría |
| `DYNAMODB_ENDPOINT` | Endpoint custom para DynamoDB, opcional |
| `CORS_ORIGINS` | Orígenes permitidos para CORS (URLs de los frontends) |

---
