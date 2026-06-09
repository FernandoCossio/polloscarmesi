### 4.2 MS4 - Gestión de Usuarios y Autenticación (Spring Boot)

#### 4.2.1 Responsabilidad y Contexto de Dominio

MS4 es el microservicio dedicado a la **gestión de usuarios** y **autenticación**. Su responsabilidad principal es emitir tokens JWT (firmados con llave privada RSA) y administrar la persistencia de usuarios/roles.

MS4 expone endpoints REST bajo el prefijo `/api` (context-path) y es consumido por MS0 para operaciones públicas como login y registro. Los demás microservicios (por ejemplo MS1) validan el JWT usando la **llave pública** de MS4; MS4 no es un proxy de autorización en tiempo real.

Funciones principales:
- Autenticar credenciales (username/email + password) y emitir JWT con claim `roles`.
- Registrar nuevos clientes (por defecto con rol `CLIENTE`).
- Sembrar datos iniciales en ambiente `dev` (roles y usuarios).
- Proveer utilidades de infraestructura como envío de emails y hosting de archivos locales en `/uploads/**` (según configuración).

---

#### 4.2.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework | Spring Boot 4.0.x (Java 21) |
| Persistencia | Spring Data JPA + Hibernate |
| Base de datos | PostgreSQL |
| Seguridad | Spring Security + OAuth2 Resource Server (JWT) |
| Firma/validación JWT | Nimbus JOSE/JWT (`JwtEncoder`/`JwtDecoder`) con RSA (PEM) |
| Documentación | SpringDoc OpenAPI (Swagger UI) |
| Email | Spring Boot Starter Mail |
| Variables de entorno | Spring Boot `application.properties` + `springboot4-dotenv` |

---

#### 4.2.3 Base de Datos Utilizada

| Almacenamiento | Uso |
|---|---|
| PostgreSQL | Usuarios, roles y relaciones usuario-rol |
| Certificados (classpath) | `certs/private.pem` (firma) y `certs/public.pem` (verificación) |

---

#### 4.2.4 Módulos y Casos de Uso

**Autenticación (REST)**
- Login: autentica con `AuthenticationManager` y genera un access token JWT.
- Emisión de JWT:
  - `sub` = `username`
  - `roles` = lista de authorities con prefijo `ROLE_...`
  - `iss`, `iat`, `exp` según configuración.

**Usuarios**
- Registro de cliente: crea usuario, valida duplicados (username/email), encripta password (BCrypt), asigna rol `CLIENTE` y lo persiste.

**Semillas (solo `dev`)**
- Carga inicial de roles y usuarios (se ejecuta como `CommandLineRunner` con profile `dev`).

**Infraestructura**
- Servicio de email (SMTP) vía `JavaMailSender`.
- Publicación de carpeta local por `/uploads/**` según `app.upload.dir`.

---

#### 4.2.5 Estructura de Carpetas y Descripción de Capas

```
auth/
├── src/
│   ├── main/
│   │   ├── java/com/auth/
│   │   │   ├── auth/
│   │   │   │   ├── jwt/                       # Generación de JWT (JwtService)
│   │   │   │   └── userdetails/               # UserDetailsService y principal (DB)
│   │   │   ├── common/
│   │   │   │   ├── decorators/                # Resolver/annotation para extraer usuario del JWT (infra)
│   │   │   │   ├── errors/                    # Excepciones de aplicación y handler global
│   │   │   │   └── response/                  # ApiResponse y estructuras de error
│   │   │   ├── config/                        # SecurityConfig, JwtConfig, WebConfig, OpenApiConfig
│   │   │   ├── domain/
│   │   │   │   ├── dtos/                      # DTOs de auth/usuario
│   │   │   │   ├── enums/                     # Enum de roles
│   │   │   │   └── models/                    # Entidades JPA (Usuario, Rol)
│   │   │   ├── features/
│   │   │   │   ├── auth/                      # AuthController/AuthService
│   │   │   │   ├── rol/                       # Repositorio y exceptions de rol
│   │   │   │   └── usuario/                   # UsuarioService/Repositorio/exceptions
│   │   │   ├── seed/                          # Seeder de roles/usuarios (solo dev)
│   │   │   ├── services/
│   │   │   │   └── email/                     # Servicio de email
│   │   │   └── AuthApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── certs/
│   │           ├── private.pem
│   │           └── public.pem
│   └── test/
│       └── java/com/auth/AuthApplicationTests.java
│
├── .env
├── .env.example
├── pom.xml
└── mvnw / mvnw.cmd
```

---

#### 4.2.6 Endpoints REST expuestos hacia MS0

Context-path global: `/api`

| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| POST | `/api/auth/login` | Inicia sesión y retorna JWT (access token) | Pública |
| POST | `/api/auth/register` | Registra un nuevo cliente | Pública |

---

#### 4.2.7 Eventos publicados / consumidos

MS4 no publica ni consume eventos de Redis en la implementación actual.

---

#### 4.2.8 Seguridad (JWT)

- Algoritmo: RSA (llave privada para firmar, pública para verificar).
- Claims emitidos: `iss`, `iat`, `exp`, `sub`, `roles`.
- Los microservicios consumidores validan el JWT usando la llave pública (`certs/public.pem`).

---

#### 4.2.9 Variables de Entorno / Configuración

| Variable / Propiedad | Descripción |
|---|---|
| `server.port` | Puerto del servidor (default: 8081) |
| `server.servlet.context-path` | Prefijo global (default: `/api`) |
| `spring.datasource.url` | URL de PostgreSQL (default: `jdbc:postgresql://localhost:5432/auth_restaurante`) |
| `DB_USER` | Usuario de DB (usado por `spring.datasource.username`) |
| `DB_PASSWORD` | Password de DB (usado por `spring.datasource.password`) |
| `app.jwt.issuer` | Emisor del JWT (default: `restaurante`) |
| `app.jwt.access-token-ttl` | TTL del access token (default: `P1D`) |
| `app.jwt.refresh-token-ttl` | TTL de refresh (default: `P7D`, configurado aunque no se expone endpoint de refresh) |
| `app.jwt.private-key` | Ubicación de llave privada (default: `classpath:certs/private.pem`) |
| `app.jwt.public-key` | Ubicación de llave pública (default: `classpath:certs/public.pem`) |
| `MAIL_USERNAME` | Usuario SMTP (usado por `spring.mail.username`) |
| `MAIL_PASSWORD` | Password SMTP (usado por `spring.mail.password`) |
| `APP_UPLOAD_DIR` | Ruta local para servir `/uploads/**` (usado por `app.upload.dir`) |
| `app.base-url` | URL base del microservicio (default: `http://localhost:8081/api`) |

