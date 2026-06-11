## 4. Microservicios

### 4.0 MS0 - API Gateway GraphQL (NestJS)

#### 4.0.1 Responsabilidad y Contexto de Dominio

MS0 es el único punto de entrada público del sistema. Actúa como **API Gateway** para los frontends, exponiendo un endpoint **GraphQL** (`/graphql`) y endpoints **REST** puntuales. Su responsabilidad es exclusivamente de infraestructura de comunicación: no contiene lógica de negocio del restaurante ni gestión de usuarios.

Al iniciar, MS0 descarga remotamente el schema GraphQL de los microservicios configurados via introspection, lo unifica y lo expone en un único schema en `/graphql`. Cada operación GraphQL se delega al microservicio remoto correspondiente. Además, MS0 ofrece endpoints REST que delegan a otros microservicios.

**Manejo de JWT en MS0:**
MS0 no actúa como autoridad de autorización centralizada. En su lugar:
- **Propaga el JWT:** si el request trae `Authorization: Bearer <token>`, MS0 reenvía ese header a los microservicios al delegar la operación (GraphQL y proxy REST).
- **Verifica ligeramente para auditoría:** en un middleware global, MS0 intenta verificar de forma liviana el JWT (firma RSA y `exp/nbf`) usando la clave pública de MS4 para poblar `req.user` (`{ userId, role }`). Si el token es inválido, simplemente no se setea `req.user` y la petición continúa. Es el microservicio destino quien decide si rechaza por autenticación/autorización.
- La autenticación y gestión de usuarios es responsabilidad exclusiva de MS4.

Ningún microservicio interno (MS1, MS2, MS3, MS4) está expuesto públicamente. Solo MS0 tiene URL pública accesible desde internet.

---

#### 4.0.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework | NestJS (TypeScript) |
| GraphQL Gateway | `@nestjs/graphql` + `@graphql-tools/stitch` + `@graphql-tools/wrap` |
| Schema remoto | `@graphql-tools/executor-http` (introspection remota de MS1, MS2, MS3) |
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
| Amazon DynamoDB | Registro de eventos de auditoría: logins, logouts, operaciones GraphQL, errores y requests por usuario. |

---

#### 4.0.4 Módulos y Casos de Uso

**Módulo Auth REST (delegación a MS4):**
- `POST /auth/login` — Recibe credenciales, delega validación a MS4 via REST y retorna el JWT emitido por MS4.
- `POST /auth/register` — Delega el registro de nuevos Clientes a MS4 via REST.

**Módulo Schema Stitching (GraphQL Gateway):**
- Al iniciar, descarga el schema GraphQL de MS1, MS2 y MS3 via introspection.
- Construye el Superschema envolviendo los schemas remotos y lo expone en `/graphql`.
- En cada operación GraphQL entrante:
  - Usa el contexto `{ req }` para acceder a headers y usuario extraído del JWT.
  - Reenvía el header `Authorization` hacia el microservicio remoto al ejecutar la operación.
  - Delega la resolución al microservicio propietario del tipo sin imponer bloqueos de rol en el gateway.
- Recarga automáticamente los schemas remotos con polling configurable (`SCHEMA_POLL_INTERVAL_MS`).

**Proxy de archivos (REST):**
- `POST /productos/:id/imagen` — Recibe `multipart/form-data` (campo `file`) y reenvía el archivo a MS1 via REST, propagando `Authorization` si está presente.

**Módulo Auditoría:**
- Registra en DynamoDB cada operación GraphQL ejecutada: `timestamp`, `userId`, `role`, `operationName`, `operationType`, `statusCode`, `ip`.
- Registra también operaciones REST (auth y proxy), asociando `userId/role` si el request trae un JWT válido.

**Tabla de operaciones GraphQL por microservicio propietario:**

| Operación GraphQL | Microservicio propietario | Descripción |
|---|---|---|
| `login`, `registro` | MS4 (via REST, no GraphQL) | Auth delegada a MS4 |
| `obtenerMenu`, `obtenerProducto` | MS1 | Consulta de menú |
| `crearPedido`, `cancelarPedido` | MS1 | Pedidos presenciales |
| `actualizarEstadoCocina` | MS1 | Panel de cocina |
| `registrarPago` | MS1 | Pagos |
| `gestionarUsuarios` | MS4 | Gestión de usuarios (via REST delegado) |
| `crearPedidoDelivery` | MS2 | Pedidos delivery |
| `confirmarEntrega`, `reportarIncidencia` | MS2 | Operaciones del repartidor |
| `obtenerPedidosAsignados` | MS2 | Vista del repartidor |
| `obtenerReportesBI`, `ejecutarSegmentacion` | MS3 | Dashboard BI |
| `obtenerResultadoComprobante` | MS3 | Análisis CNN |

---

#### 4.0.5 Estructura de Carpetas y Descripción de Capas

```
gateway/
├── src/
│   ├── auth-rest/                         # Auth REST (delegación a MS4)
│   │   ├── dto/                           # DTOs request/response de login y registro
│   │   ├── auth-rest.controller.ts        # Endpoints REST: /auth/login, /auth/register
│   │   ├── auth-rest.module.ts
│   │   └── auth-rest.service.ts           # Llamadas REST a MS4
│   │
│   ├── gateway/                           # Módulo Schema Stitching (núcleo del gateway)
│   │   ├── gateway.module.ts
│   │   └── gateway.service.ts             # Descarga schemas de MS1, MS2, MS3 y construye Superschema
│   │
│   ├── audit/                             # Módulo de auditoría en DynamoDB
│   │   ├── audit.module.ts
│   │   ├── audit.service.ts               # Escritura de eventos en DynamoDB
│   │   └── audit.interceptor.ts           # Interceptor que captura cada operación GraphQL y REST
│   │
│   ├── config/
│   │   └── configuration.ts               # Lectura de variables de entorno
│   │
│   ├── productos-proxy.controller.ts      # Proxy REST para subida de imagen de producto hacia MS1
│   ├── app.module.ts                      # Módulo raíz: registra GraphQLModule con Schema Stitching
│   └── main.ts                            # Bootstrap, CORS, puerto
│
├── certs/
│   └── public.pem                         # Clave pública de MS4 para verificación ligera del JWT
├── .env
├── Dockerfile
├── package.json
└── tsconfig.json
```

**Descripción de capas:**

- **`auth-rest/`:** Responsable de login y registro via REST. Delega estas operaciones completamente a MS4.
- **`gateway/`:** Núcleo del Gateway. Descarga schemas de MS1, MS2 y MS3 al iniciar, los une con Schema Stitching y expone el Superschema en `/graphql`. Reenvía el header `Authorization` al delegar operaciones.
- **`audit/`:** Capa transversal de observabilidad. El interceptor captura automáticamente cada operación sin modificar la lógica del gateway.
- **`productos-proxy.controller.ts`:** Endpoint REST para subida de archivos que actúa como pasarela hacia MS1.
- **`certs/`:** Contiene la clave pública RSA de MS4 para verificación ligera del JWT en el middleware de auditoría.
- **`config/`:** Centraliza la lectura de variables de entorno.

---

#### 4.0.6 Esquema GraphQL

MS0 **no define tipos ni resolvers propios**. Su schema GraphQL es el Superschema resultante de unificar los schemas de MS1, MS2 y MS3 via Schema Stitching. MS0 es un delegador puro: cada operación es resuelta por el microservicio propietario del tipo.

---

#### 4.0.7 Endpoints expuestos hacia el Frontend

| Tipo | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| REST POST | `/auth/login` | Login, delega a MS4 y retorna JWT firmado por MS4 | Pública |
| REST POST | `/auth/register` | Registro de nuevo Cliente, delega a MS4 | Pública |
| REST POST | `/productos/:id/imagen` | Proxy de subida de imagen de producto hacia MS1 | JWT propagado |
| GraphQL | `/graphql` | Superschema unificado: todas las queries y mutations del sistema | JWT propagado a MS destino |

---

#### 4.0.8 Eventos publicados / consumidos

MS0 **no publica ni consume eventos de Redis**. Su comunicación es GraphQL (frontend → MS1/MS2/MS3) y REST (MS0 → MS4 para auth).

---

#### 4.0.9 Variables de Entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 4000) |
| `MS4_REST_URL` | URL interna base de MS4 para llamadas REST (ej: `http://ms4:8081/api`) |
| `MS4_JWT_PUBLIC_KEY_PATH` | Ruta al archivo PEM con la clave pública de MS4 (default: `./certs/public.pem`) |
| `MS1_GRAPHQL_URL` | URL del endpoint GraphQL interno de MS1 (ej: `http://ms1:8080/graphql`) |
| `MS1_REST_URL` | URL REST interna de MS1 para proxy de archivos (ej: `http://ms1:8080/api`) |
| `MS2_GRAPHQL_URL` | URL del endpoint GraphQL interno de MS2 |
| `MS3_GRAPHQL_URL` | URL del endpoint GraphQL interno de MS3 |
| `SCHEMA_POLL_INTERVAL_MS` | Intervalo de recarga de schemas remotos en ms (default: 30000) |
| `AWS_REGION` | Región AWS para DynamoDB |
| `AWS_ACCESS_KEY_ID` | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS |
| `DYNAMODB_AUDIT_TABLE` | Nombre de la tabla DynamoDB de auditoría |
| `DYNAMODB_ENDPOINT` | Endpoint custom para DynamoDB local (opcional) |
| `CORS_ORIGINS` | Orígenes permitidos para CORS (URLs de los frontends) |

---