# Pollos Carmesí — Estructura Técnica del Proyecto

---

## 1. Visión General del Sistema

### 1.1 Descripción del Proyecto

Pollos Carmesí es una plataforma inteligente de gestión integral para un restaurante de pollería que opera con atención presencial y delivery. El sistema centraliza y digitaliza todos los procesos operativos del negocio: toma de pedidos, gestión de cocina, control de pagos, seguimiento de delivery, almacenamiento documental, automatización de reportes, inteligencia artificial y registro verificable mediante blockchain.

La plataforma está compuesta por tres microservicios backend independientes (Spring Boot, NestJS, FastAPI), un panel web administrativo (Angular) y una aplicación móvil multiplataforma (React Native), todos integrados bajo una arquitectura orientada a microservicios con comunicación GraphQL inter-servicios y REST hacia los frontends.

### 1.2 Objetivos Técnicos

- Implementar una arquitectura de microservicios con tres servicios backend independientes, desplegados en proveedores distintos, cada uno con su propio lenguaje, base de datos y responsabilidad de dominio.
- Establecer comunicación inter-servicios mediante GraphQL Federation (Apollo Federation), exponiendo un Supergraph unificado hacia los clientes via REST.
- Incorporar inteligencia artificial: deep learning para verificación visual de comprobantes, ML supervisado para estimación de tiempos de preparación y ML no supervisado para segmentación de clientes.
- Integrar blockchain con Solidity para el registro inmutable de hashes de documentos y recibos críticos.
- Automatizar el cierre de caja y reporte gerencial nocturno mediante n8n como orquestador de flujo.
- Utilizar PostgreSQL como base de datos relacional transaccional y DynamoDB para eventos, logs, auditoría y telemetría.
- Gestionar documentos y archivos pesados en Amazon S3, manteniendo solo metadatos en la base relacional.

### 1.3 Alcance del Sistema

| Módulo | Descripción Funcional |
|---|---|
| Gestión de usuarios y roles | Administración de los cinco perfiles del sistema: Administrador, Cajero, Cocina, Repartidor y Cliente, con permisos diferenciados por plataforma. |
| Gestión de menú y productos | Registro y administración de platos, combos, bebidas, precios, disponibilidad, promociones y categorías. |
| Gestión de pedidos | Registro de pedidos presenciales (por Cajero en panel web) y pedidos delivery (por Cliente desde app móvil), con contenido, cantidades, subtotales, descuentos y canal de origen. |
| Gestión de atención y entrega | Diferencia entre pedido presencial con ficha y pedido delivery con dirección, GPS, repartidor asignado y evidencia fotográfica de entrega. |
| Gestión de pagos | Control de métodos de pago (efectivo, QR, transferencia, tarjeta, mixto), validación de comprobantes y verificación visual mediante deep learning. |
| Gestión de cocina | Recepción de pedidos en cola, cambio de estados, visualización de tiempo estimado de preparación (ML supervisado) y marcado de pedido como listo. |
| Gestión documental | Almacenamiento de comprobantes, evidencias de entrega, reportes de caja y documentos administrativos en Amazon S3 con metadatos en PostgreSQL. |
| Reportes e inteligencia de negocios | Dashboard administrativo con indicadores de ventas, pedidos, productos más vendidos, zonas, clientes segmentados (ML no supervisado), horarios y cierre de caja. |
| Automatización | Generación y envío automático del reporte de cierre de caja nocturno al Administrador mediante n8n. |
| Blockchain | Registro verificable del hash de recibos y documentos críticos mediante smart contract en Solidity sobre red testnet. |

### 1.4 Roles y Perfiles de Usuario

El sistema contempla cinco roles con accesos, permisos y plataformas diferenciadas.

---

#### Administrador

- **Plataforma:** Panel web (Angular).
- **Descripción:** Rol de máximo nivel del sistema. Gestiona la configuración general del negocio y tiene visibilidad total sobre las operaciones.
- **Permisos y capacidades:**
  - Crear, editar y desactivar usuarios del sistema (Cajeros, personal de Cocina, Repartidores).
  - Gestionar el menú: crear, editar y eliminar productos, categorías, combos y precios.
  - Acceder al dashboard de inteligencia de negocios y reportes de BI.
  - Visualizar y gestionar el cierre de caja diario.
  - Recibir el reporte gerencial nocturno automatizado por correo.
  - Acceder al módulo de auditoría blockchain para verificar integridad de documentos.
  - Gestionar documentos almacenados en S3 (visualizar, descargar, auditar).
  - Configurar parámetros del sistema.

---

#### Cajero

- **Plataforma:** Panel web (Angular).
- **Descripción:** Responsable de la atención presencial en caja. Registra pedidos de clientes que asisten físicamente al restaurante y gestiona los pagos.
- **Permisos y capacidades:**
  - Registrar pedidos presenciales seleccionando productos del menú.
  - Asignar número de ficha al pedido presencial.
  - Registrar el pago del pedido (efectivo, QR, transferencia, tarjeta o mixto).
  - Subir comprobante de pago para validación visual (deep learning).
  - Visualizar el estado de los pedidos en curso.
  - Emitir y generar recibos de pago.
  - Consultar el historial de pedidos del turno actual.

---

#### Cocina

- **Plataforma:** Panel web (Angular) — vista de panel de cocina dedicada en navegador.
- **Descripción:** Personal encargado de la preparación de pedidos. Opera desde una pantalla fija dentro de la cocina.
- **Permisos y capacidades:**
  - Visualizar la cola de pedidos pendientes en tiempo real ordenados por prioridad y tiempo.
  - Consultar el tiempo estimado de preparación de cada pedido (generado por ML supervisado).
  - Cambiar el estado de cada pedido: `Pendiente` → `En preparación` → `Listo`.
  - No tiene acceso a módulos de pagos, usuarios, reportes ni configuración.

---

#### Repartidor

- **Plataforma:** Aplicación móvil (React Native).
- **Descripción:** Personal encargado de realizar las entregas de pedidos delivery. Opera exclusivamente desde la app móvil.
- **Permisos y capacidades:**
  - Visualizar los pedidos delivery asignados a su perfil.
  - Consultar dirección de entrega, referencia y datos de contacto del cliente.
  - Iniciar navegación GPS hacia el punto de entrega.
  - Registrar eventos de ubicación durante el trayecto (telemetría GPS a DynamoDB).
  - Confirmar entrega del pedido con fotografía de evidencia (almacenada en S3).
  - Rechazar un pedido asignado con motivo justificado.
  - Reportar incidencias durante la entrega (dirección incorrecta, cliente no disponible, etc.).
  - Recibir notificaciones push de nuevos pedidos asignados y cambios de estado.

---

#### Cliente

- **Plataforma:** Aplicación móvil (React Native).
- **Descripción:** Usuario final que realiza pedidos delivery desde la app móvil. Se registra y opera exclusivamente desde el dispositivo móvil.
- **Permisos y capacidades:**
  - Registrarse y autenticarse en la app móvil.
  - Explorar el menú del restaurante (platos, combos, bebidas, precios y disponibilidad).
  - Seleccionar productos y armar su carrito de compra.
  - Dictar su pedido por voz mediante Speech-to-Text para armar el carrito automáticamente.
  - Registrar y gestionar una o más direcciones de entrega en su perfil.
  - Realizar el pedido delivery indicando dirección de entrega.
  - Subir comprobante de pago desde la cámara del dispositivo.
  - Consultar el estado de su pedido en tiempo real.
  - Recibir notificaciones push sobre el progreso del pedido (recibido, en preparación, en camino, entregado).
  - Consultar el historial de pedidos anteriores.
  - Editar su perfil y datos personales.

---

#### Resumen de acceso por plataforma

| Rol | Panel Web (Angular) | App Móvil (React Native) |
|---|---|---|
| Administrador | ✅ Acceso completo | ❌ No aplica |
| Cajero | ✅ Módulo de caja y pedidos | ❌ No aplica |
| Cocina | ✅ Panel de cocina (solo estados y cola) | ❌ No aplica |
| Repartidor | ❌ No aplica | ✅ Módulo de delivery |
| Cliente | ❌ No aplica | ✅ Módulo de pedidos y seguimiento |

---

## 2. Arquitectura General

### 2.1 Estilo Arquitectónico (Microservicios)

El sistema adopta una **arquitectura de microservicios** compuesta por cuatro servicios backend independientes: un API Gateway (MS0) y tres microservicios de negocio (MS1, MS2, MS3). Cada microservicio de negocio tiene responsabilidad de dominio única, lenguaje de programación propio, base de datos independiente y puede desplegarse en proveedores de nube distintos.

Esta arquitectura permite escalar, desplegar y mantener cada servicio de forma independiente sin afectar al resto del sistema. Los frontends (Angular y React Native) interactúan exclusivamente con MS0, sin conocimiento directo de los servicios internos.

Principios que guían la arquitectura:
- **Responsabilidad única por servicio:** cada microservicio tiene un dominio de negocio claro y delimitado.
- **Desacoplamiento:** los servicios no comparten base de datos ni lógica interna entre sí.
- **Comunicación definida por contrato:** las interacciones inter-servicios se realizan mediante GraphQL con esquemas explícitos.
- **Punto de entrada único:** MS0 es el único componente expuesto públicamente hacia los frontends.
- **Tolerancia a fallos:** los eventos asíncronos via Redis Pub/Sub evitan dependencias síncronas innecesarias entre servicios.

---

### 2.2 Mapa de Microservicios y sus Responsabilidades

| Servicio | Nombre | Tecnología | Dominio de Responsabilidad |
|---|---|---|---|
| MS0 | API Gateway GraphQL | NestJS (TypeScript) | Punto de entrada único. Expone Superschema GraphQL via Schema Stitching. Propaga JWT a los microservicios internos. Delega auth a MS4. No contiene lógica de negocio. |
| MS1 | Gestión Restaurante | Spring Boot (Java) | Núcleo transaccional del sistema. Gestiona menú, productos, pedidos presenciales, pagos, recibos, cocina y registro blockchain de documentos. Valida JWT emitidos por MS4. |
| MS2 | Pedidos, Delivery y Automatización | NestJS (TypeScript) | Gestiona pedidos delivery, estados de entrega, asignación de repartidores, notificaciones push, telemetría GPS, eventos DynamoDB y automatización del cierre de caja via n8n. |
| MS3 | IA, Machine Learning y BI | FastAPI (Python) | Procesamiento de imágenes de comprobantes (deep learning), estimación de tiempos de preparación (ML supervisado), segmentación de clientes (ML no supervisado) y exposición de datos para inteligencia de negocios. |
| MS4 | Gestión de Usuarios y Autenticación | Spring Boot (Java) | Responsable exclusivo de autenticación y gestión de usuarios. Emite JWT firmados con RSA (llave privada). Gestiona usuarios, roles y contraseñas. Los demás microservicios validan JWT con la llave pública de MS4. |

Componentes de infraestructura complementarios (no son microservicios de negocio):

| Componente | Tecnología | Rol |
|---|---|---|
| Contrato Blockchain | Solidity + Hardhat | Smart contract desplegado en red testnet. Registra hashes de documentos. Integrado en MS1 via web3j. |
| Base de datos relacional | PostgreSQL | Datos transaccionales principales. Cada microservicio tiene su propio esquema: MS1 (restaurante), MS2 (delivery), MS3 (IA/BI), MS4 (usuarios/auth). |
| Base de datos NoSQL | Amazon DynamoDB | Eventos, logs, auditoría, telemetría GPS y registros de automatización. Gestionada principalmente por MS0 (auditoría) y MS2 (eventos). |
| Almacenamiento de archivos | Amazon S3 | Documentos, comprobantes, evidencias de entrega y reportes. Accedido por MS1, MS2 y MS3. |
| Mensajería asíncrona | Redis Pub/Sub | Canal de eventos entre microservicios para comunicación no bloqueante. |
| Automatización | n8n | Orquestador del flujo de cierre de caja nocturno. Llama a MS2 y coordina el envío del reporte. |

---

### 2.3 Relaciones y Dependencias entre Microservicios

Las dependencias entre servicios siguen un flujo definido. Ningún microservicio accede directamente a la base de datos de otro.

```
MS0 (API Gateway GraphQL)
 ├── expone Superschema GraphQL unificado al frontend (Schema Stitching de MS1+MS2+MS3)
 ├── delega auth (login/registro) a MS4 via REST
 ├── propaga header Authorization a MS1, MS2, MS3 al delegar operaciones GraphQL
 ├── proxy REST de subida de imágenes de producto hacia MS1
 └── registra auditoría de operaciones en DynamoDB

MS1 (Spring Boot — Gestión Restaurante)
 ├── expone schema GraphQL en /graphql (consumido por MS0 via Schema Stitching)
 ├── valida JWT usando clave pública de MS4 (OAuth2 Resource Server)
 ├── consulta a MS2 via REST interno (estado de pedidos delivery)
 ├── consulta a MS3 via REST interno (resultado análisis de comprobante, tiempo estimado)
 ├── publica eventos a Redis (pedido.presencial.creado, pago.registrado)
 └── llama al smart contract via web3j (registro de hash de documentos)

MS2 (NestJS — Pedidos y Delivery)
 ├── expone schema GraphQL en /graphql (consumido por MS0 via Schema Stitching)
 ├── valida JWT usando clave pública de MS4
 ├── consulta a MS1 via REST interno (datos del pedido, productos)
 ├── consulta a MS3 via REST interno (tiempo estimado de preparación)
 ├── publica eventos a Redis (pedido.delivery.creado, delivery.estado, entrega.confirmada)
 ├── escribe eventos y telemetría GPS en DynamoDB
 └── expone endpoint REST interno para n8n (cierre de caja)

MS3 (FastAPI — IA y BI)
 ├── expone schema GraphQL en /graphql (consumido por MS0 via Schema Stitching)
 ├── valida JWT usando clave pública de MS4
 ├── consulta a MS1 via REST interno (datos históricos de pedidos para modelos ML)
 ├── consulta a MS2 via REST interno (datos históricos de delivery)
 ├── publica eventos a Redis (comprobante.analizado, tiempo.estimado)
 └── lee y escribe resultados de modelos en PostgreSQL

MS4 (Spring Boot — Usuarios y Auth)
 ├── expone endpoints REST de login y registro (consumidos por MS0)
 ├── emite JWT firmados con RSA (llave privada)
 ├── provee clave pública (public.pem) para que MS1, MS2, MS3 validen tokens
 └── gestiona usuarios, roles y contraseñas en PostgreSQL
```

---

### 2.4 Estrategia de Comunicación

#### 2.4.1 Comunicación Inter-Servicios (REST síncrono)

Los tres microservicios de negocio (MS1, MS2, MS3) se comunican entre sí mediante **llamadas REST directas punto a punto**. Cuando un microservicio necesita datos de otro de forma síncrona, realiza una llamada HTTP REST a la URL interna del servicio destino.

Reglas de comunicación REST inter-servicios:
- Solo se usa para comunicación **síncrona** donde se requiere una respuesta inmediata.
- Las URLs internas de cada microservicio se configuran via variables de entorno.
- Las llamadas REST entre servicios incluyen el header `X-Internal-Service` con el nombre del servicio origen para trazabilidad.
- Los microservicios internos no están expuestos públicamente, solo son accesibles dentro de la red interna.
- Cada microservicio expone endpoints REST internos específicos para ser consumidos por otros servicios (distintos de los endpoints que MS0 enruta hacia el frontend).

#### 2.4.2 Comunicación Frontend → GraphQL via MS0

Los frontends (Angular y React Native) se comunican exclusivamente con **MS0 via GraphQL**. MS0 es el único servicio expuesto públicamente. Los frontends no conocen las URLs de MS1, MS2 ni MS3.

MS0 implementa **Schema Stitching** con `@graphql-tools/stitch`: al iniciar, descarga los schemas GraphQL de MS1, MS2 y MS3 y los unifica en un único Superschema. El frontend realiza todas sus queries y mutations GraphQL contra MS0, que internamente las delega al microservicio correspondiente.

Flujo de un request GraphQL desde el frontend:
1. El frontend envía una query/mutation GraphQL a MS0 con el JWT en el header `Authorization`.
2. MS0 valida el JWT y verifica el rol del usuario contra la operación solicitada.
3. MS0 identifica a qué microservicio pertenece la operación via el Schema Stitching.
4. MS0 inyecta el contexto de identidad (`userId`, `role`) en el request delegado.
5. El microservicio interno resuelve la operación y retorna el resultado a MS0.
6. MS0 retorna la respuesta GraphQL unificada al frontend.

Reglas de comunicación GraphQL Frontend → MS0:
- El frontend usa un único endpoint GraphQL: `MS0_URL/graphql`.
- MS0 gestiona CORS de forma centralizada para todos los frontends.
- Los microservicios internos exponen sus schemas GraphQL en `/graphql` accesible solo por MS0.
- Los errores de autenticación y autorización se manejan centralizadamente en MS0 antes de delegar.

#### 2.4.3 Comunicación Asíncrona (Redis Pub/Sub)

Para escenarios donde no se requiere respuesta inmediata o donde un evento debe ser consumido por múltiples servicios, se utiliza **Redis Pub/Sub** como canal de mensajería asíncrona entre microservicios.

Casos de uso de Redis Pub/Sub en el sistema:

| Canal (Topic) | Publicador | Suscriptor | Descripción |
|---|---|---|---|
| `pedido.presencial.creado` | MS1 | MS3 | Notifica que un nuevo pedido presencial fue registrado. MS3 inicia estimación de tiempo de preparación. |
| `pedido.delivery.creado` | MS2 | MS1, MS3 | Notifica que un nuevo pedido delivery fue registrado. MS1 sincroniza el pedido en su dominio; MS3 inicia estimación de tiempo. |
| `pago.registrado` | MS1 | MS3 | Notifica que un pago fue registrado para iniciar análisis del comprobante. |
| `comprobante.analizado` | MS3 | MS1 | Devuelve el resultado del análisis visual del comprobante (aceptado, rechazado, revisión manual). |
| `tiempo.estimado` | MS3 | MS1, MS2 | Devuelve el tiempo estimado de preparación del pedido. |
| `delivery.estado` | MS2 | MS1 | Notifica cambios de estado del delivery para actualizar el pedido en MS1. |
| `entrega.confirmada` | MS2 | MS1 | Notifica que el repartidor confirmó la entrega con evidencia fotográfica. |

---

### 2.5 API Gateway — MS0 (decisión y justificación)

MS0 es un microservicio NestJS dedicado exclusivamente a funciones de gateway GraphQL. No contiene lógica de negocio del restaurante.

**Estrategia: Schema Stitching con `@graphql-tools/stitch`**

Al iniciar, MS0 descarga remotamente los schemas GraphQL de MS1 (`/graphql`), MS2 (`/graphql`) y MS3 (`/graphql`) y los unifica en un único Superschema. El frontend interactúa con un solo endpoint GraphQL en MS0, sin conocer la existencia de los microservicios internos.

**Justificación de Schema Stitching sobre Apollo Federation:**
- Apollo Federation requiere que cada microservicio implemente el protocolo Federation específico. Con un stack mixto (Spring Boot + NestJS + FastAPI), esto agrega complejidad innecesaria en cada tecnología.
- Schema Stitching solo requiere que cada MS exponga un endpoint GraphQL estándar, sin protocolos adicionales.
- MS0 en NestJS tiene soporte nativo para `@graphql-tools/stitch` con mínima configuración.
- Más pragmático para contexto académico con múltiples tecnologías distintas.

**Responsabilidades de MS0:**
- Exponer un único endpoint GraphQL público: `/graphql`.
- Exponer endpoint REST público para login y logout: `/api/v1/auth/`.
- Al iniciar: descargar y unificar los schemas GraphQL de MS1, MS2 y MS3 (Schema Stitching).
- Validar y decodificar el JWT en cada request GraphQL entrante.
- Verificar que el rol del usuario tenga permiso para ejecutar la operación GraphQL solicitada.
- Inyectar contexto de identidad (`userId`, `role`) en las queries delegadas a los microservicios.
- Delegar cada operación GraphQL al microservicio propietario del tipo/resolver correspondiente.
- Manejar errores de autenticación y autorización de forma centralizada antes de delegar.
- Gestionar CORS de forma centralizada para todos los frontends.
- Registrar eventos de auditoría en DynamoDB por cada operación ejecutada.

**Lo que MS0 NO hace:**
- No accede a PostgreSQL ni a ninguna base de datos de negocio directamente.
- No contiene resolvers de negocio propios (solo delega a MS1/MS2/MS3).
- No se comunica con MS1/MS2/MS3 via REST (solo via GraphQL para delegar operaciones del frontend).
- No participa en la comunicación REST inter-servicios entre MS1/MS2/MS3.

**Despliegue:** MS0 se despliega en el mismo proveedor que MS1 (Proveedor A) pero como contenedor independiente.

---

### 2.6 Flujos Transversales Clave

Los siguientes flujos involucran múltiples microservicios y representan los escenarios más críticos del sistema. Sirven como referencia para entender la coordinación entre servicios durante la implementación.

---

#### Flujo 1: Pedido presencial con pago y registro blockchain

1. El Cajero registra el pedido en Angular → mutation GraphQL a MS0.
2. MS0 valida JWT (rol: Cajero), verifica permiso de la operación y delega la mutation a MS1 via Schema Stitching.
3. MS1 crea el pedido en PostgreSQL y publica evento `pedido.presencial.creado` en Redis.
4. MS3 suscrito a `pedido.presencial.creado` inicia estimación de tiempo y publica `tiempo.estimado` en Redis.
5. MS1 recibe `tiempo.estimado` y lo asocia al pedido.
6. El Cajero registra el pago y sube el comprobante → mutation GraphQL a MS0 → MS1.
7. MS1 guarda el comprobante en S3 y publica evento `pago.registrado` en Redis.
8. MS3 suscrito a `pago.registrado` analiza la imagen del comprobante y publica `comprobante.analizado`.
9. MS1 recibe el resultado del análisis y actualiza el estado del pago.
10. MS1 genera el recibo, calcula su hash y lo registra en el smart contract via web3j.
11. MS1 guarda el txHash en PostgreSQL junto al recibo.

---

#### Flujo 2: Pedido delivery desde app móvil hasta entrega confirmada

1. El Cliente arma su pedido en React Native (o por voz via Speech-to-Text) → mutation GraphQL a MS0.
2. MS0 valida JWT (rol: Cliente), verifica permiso y delega la mutation a MS2 via Schema Stitching.
3. MS2 crea el pedido delivery en PostgreSQL y publica `pedido.delivery.creado` en Redis.
4. MS1 suscrito a `pedido.delivery.creado` sincroniza el pedido en su dominio transaccional.
5. MS3 suscrito a `pedido.delivery.creado` estima el tiempo de preparación y publica `tiempo.estimado`.
6. MS2 asigna un repartidor disponible y envía notificación push via Expo Notifications.
7. El repartidor confirma el pedido en la app → mutation GraphQL a MS0 → MS2.
8. MS2 actualiza el estado y registra el punto clave GPS en DynamoDB.
9. Al llegar, el repartidor toma foto de evidencia → mutation GraphQL a MS0 → MS2 la sube a S3.
10. MS2 confirma la entrega, publica `entrega.confirmada` en Redis y registra el evento en DynamoDB.
11. MS1 suscrito a `entrega.confirmada` cierra el pedido en su dominio y notifica a MS2 via REST.
12. El Cliente recibe notificación push de entrega confirmada.

---

#### Flujo 3: Cierre de caja automatizado nocturno

1. n8n ejecuta el flujo programado a la hora configurada.
2. n8n llama al endpoint REST interno de MS2 solicitando el resumen del día.
3. MS2 consulta a MS1 via REST interno el resumen de ventas presenciales del día.
4. MS2 consolida el resumen delivery desde su propia PostgreSQL.
5. MS2 genera el reporte PDF y lo almacena en S3.
6. MS2 notifica a MS1 via REST interno para registrar el hash del PDF en blockchain.
7. MS2 devuelve la URL del reporte a n8n.
8. n8n envía el reporte por correo al Administrador via Resend.
9. n8n registra el evento de cierre en DynamoDB.

---

#### Flujo 4: Análisis de segmentación de clientes (ML no supervisado)

1. El Administrador solicita el reporte de segmentación en Angular → query GraphQL a MS0.
2. MS0 valida JWT (rol: Administrador) y delega la query a MS3 via Schema Stitching.
3. MS3 consulta datos históricos de pedidos y clientes a MS1 via REST interno.
4. MS3 ejecuta el modelo K-Means con los datos obtenidos.
5. MS3 etiqueta los segmentos y persiste los resultados en PostgreSQL.
6. MS3 retorna los segmentos al dashboard de BI en Angular via MS0.

---

## 3. Clientes / Frontends

### 3.1 Aplicación Web (Angular)

#### 3.1.1 Responsabilidad y Alcance

El panel web es la interfaz de operación interna del restaurante. Está dirigido exclusivamente al personal interno: Administrador, Cajero y Cocina. No es accesible para clientes finales.

Todas las comunicaciones del panel web se realizan via GraphQL hacia MS0 (API Gateway). El panel web nunca se comunica directamente con MS1, MS2 ni MS3. MS0 expone el Superschema unificado de todos los microservicios en un único endpoint `/graphql`.

El acceso se realiza mediante un único login que detecta el rol del usuario autenticado y redirige automáticamente a la vista correspondiente. Cada rol tiene un menú lateral y módulos completamente distintos.

**Alcance por rol:**

| Rol | Vista principal | Acceso |
|---|---|---|
| Administrador | Dashboard general con métricas, acceso a todos los módulos | Completo |
| Cajero | Vista de caja: registro de pedidos presenciales y pagos | Restringido a módulo de caja |
| Cocina | Panel de cola de pedidos con cambio de estados | Restringido a módulo de cocina |

---

#### 3.1.2 Módulos Principales

**Módulos del Administrador:**

- **Dashboard:** Indicadores clave del negocio en tiempo real: ventas del día, pedidos activos, productos más vendidos, ingresos por método de pago y resumen de delivery.
- **Gestión de Usuarios:** CRUD de usuarios internos del sistema (Cajeros, Cocina, Repartidores). Asignación de roles, activación y desactivación de cuentas.
- **Gestión de Menú y Productos:** CRUD de categorías, platos, combos y bebidas. Control de disponibilidad, precios e imágenes de productos.
- **Gestión de Pedidos:** Visualización de todos los pedidos del día (presenciales y delivery) con sus estados, detalles y canal de origen.
- **Reportes e Inteligencia de Negocios (BI):** Dashboard analítico con reportes de ventas por período, segmentación de clientes (K-Means), análisis de horarios pico, zonas de delivery y productos más rentables.
- **Gestión de Caja:** Visualización del resumen de caja del día, métodos de pago utilizados, total de ingresos y acceso al reporte de cierre.
- **Blockchain y Documentos:** Visualización de documentos almacenados en S3, consulta de hashes registrados en blockchain y verificación de integridad de recibos y documentos críticos.
- **Configuración:** Parámetros generales del sistema: datos del restaurante, horarios, configuración de notificaciones y umbrales del sistema.

**Módulos del Cajero:**

- **Registro de Pedido Presencial:** Selección de productos del menú, armado del pedido, asignación de número de ficha y confirmación.
- **Gestión de Pago:** Registro del método de pago (efectivo, QR, transferencia, tarjeta o mixto), subida del comprobante y visualización del resultado del análisis (aceptado/rechazado).
- **Historial de Pedidos del Turno:** Lista de pedidos registrados durante el turno activo con sus estados y montos.

**Módulo de Cocina:**

- **Panel de Cola de Pedidos:** Lista en tiempo real de pedidos pendientes ordenados por prioridad y tiempo estimado de preparación. Permite cambiar el estado de cada pedido: `Pendiente` → `En preparación` → `Listo`.

---

#### 3.1.3 Estructura de Carpetas

La estructura sigue las convenciones del template **Sakai de PrimeNG** con organización por módulos lazy-loaded y separación clara entre lógica de dominio, servicios y componentes de UI.

```
pollos-carmesi-web/
├── src/
│   ├── app/
│   │   ├── core/                        # Módulo central, se importa una sola vez
│   │   │   ├── guards/                  # AuthGuard, RoleGuard por rol
│   │   │   ├── interceptors/            # JWT interceptor, error interceptor
│   │   │   ├── services/                # AuthService, StorageService
│   │   │   └── models/                  # Interfaces y tipos globales
│   │   │
│   │   ├── shared/                      # Componentes y utilidades reutilizables
│   │   │   ├── components/              # Componentes UI compartidos
│   │   │   ├── pipes/                   # Pipes personalizados
│   │   │   └── directives/              # Directivas personalizadas
│   │   │
│   │   ├── layout/                      # Layout principal del template Sakai
│   │   │   ├── app.layout.component.ts  # Layout raíz con sidebar y topbar
│   │   │   ├── app.menu.component.ts    # Menú lateral dinámico por rol
│   │   │   ├── app.topbar.component.ts  # Barra superior
│   │   │   └── app.sidebar.component.ts # Sidebar responsivo
│   │   │
│   │   ├── auth/                        # Módulo de autenticación
│   │   │   ├── login/                   # Componente de login único
│   │   │   └── auth.routes.ts           # Rutas del módulo auth
│   │   │
│   │   ├── admin/                       # Módulo del Administrador (lazy-loaded)
│   │   │   ├── dashboard/               # Vista de dashboard con métricas
│   │   │   ├── usuarios/                # CRUD de usuarios internos
│   │   │   ├── menu/                    # Gestión de productos y categorías
│   │   │   ├── pedidos/                 # Visualización de todos los pedidos
│   │   │   ├── reportes/                # Dashboard BI y reportes analíticos
│   │   │   ├── caja/                    # Resumen y cierre de caja
│   │   │   ├── blockchain/              # Documentos y verificación blockchain
│   │   │   ├── configuracion/           # Parámetros del sistema
│   │   │   └── admin.routes.ts          # Rutas del módulo admin
│   │   │
│   │   ├── cajero/                      # Módulo del Cajero (lazy-loaded)
│   │   │   ├── nuevo-pedido/            # Registro de pedido presencial
│   │   │   ├── pago/                    # Gestión de pago y comprobante
│   │   │   ├── historial/               # Historial de pedidos del turno
│   │   │   └── cajero.routes.ts         # Rutas del módulo cajero
│   │   │
│   │   ├── cocina/                      # Módulo de Cocina (lazy-loaded)
│   │   │   ├── cola-pedidos/            # Panel de cola y cambio de estados
│   │   │   └── cocina.routes.ts         # Rutas del módulo cocina
│   │   │
│   │   ├── app.routes.ts                # Rutas raíz con lazy loading por rol
│   │   ├── app.component.ts             # Componente raíz
│   │   └── app.config.ts                # Configuración principal de Angular
│   │
│   ├── environments/                    # Variables por ambiente
│   │   ├── environment.ts               # Desarrollo
│   │   └── environment.prod.ts          # Producción
│   │
│   └── assets/                          # Recursos estáticos
│       ├── images/
│       └── icons/
│
├── angular.json
├── package.json
└── tsconfig.json
```

---

#### 3.1.4 Tecnologías y Librerías

| Tecnología / Librería | Versión | Uso |
|---|---|---|
| Angular | v17+ | Framework principal, standalone components |
| TypeScript | v5+ | Lenguaje base |
| PrimeNG | v17+ | Librería de componentes UI |
| Sakai Template | - | Template base del layout del panel |
| PrimeFlex | v3+ | Sistema de grid y utilidades CSS |
| PrimeIcons | - | Iconografía del sistema |
| Angular Router | - | Navegación y lazy loading por módulo |
| Apollo Client Angular | `apollo-angular` | Comunicación GraphQL con MS0 (queries, mutations, subscriptions) |
| RxJS | v7+ | Manejo de observables y streams reactivos |
| Chart.js (via PrimeNG) | - | Gráficas del dashboard y reportes BI |

---

### 3.2 Aplicación Móvil (React Native)

#### 3.2.1 Responsabilidad y Alcance

La aplicación móvil está dirigida a dos perfiles de usuario con experiencias completamente distintas: el **Cliente** (realiza pedidos delivery) y el **Repartidor** (gestiona y confirma entregas). Ambos acceden con el mismo login pero son redirigidos a flujos de navegación separados según su rol.

La app hace uso intensivo de los recursos nativos del dispositivo: cámara, GPS, micrófono y notificaciones push. Todas las comunicaciones se realizan via GraphQL hacia MS0 (API Gateway), que expone el Superschema unificado en un único endpoint `/graphql`.

---

#### 3.2.2 Módulos Principales

**Módulos del Cliente:**

- **Autenticación:** Registro, login y recuperación de contraseña.
- **Menú:** Exploración del catálogo de productos por categoría con imágenes, descripciones y precios.
- **Carrito y Pedido:** Armado del carrito de compra, selección de dirección de entrega y confirmación del pedido. Incluye dictado por voz via Speech-to-Text para armar el carrito automáticamente.
- **Pago:** Selección de método de pago y subida del comprobante desde la cámara del dispositivo.
- **Seguimiento de Pedido:** Vista en tiempo real del estado del pedido con notificaciones push de cada cambio de estado.
- **Historial de Pedidos:** Lista de pedidos anteriores con detalle de productos y montos.
- **Perfil:** Edición de datos personales y gestión de direcciones de entrega guardadas.

**Módulos del Repartidor:**

- **Autenticación:** Login con credenciales de repartidor.
- **Pedidos Asignados:** Lista de pedidos delivery asignados al repartidor con dirección, referencia y datos del cliente.
- **Navegación GPS:** Apertura de ruta hacia la dirección de entrega con integración a Google Maps / Mapbox.
- **Confirmación de Entrega:** Toma de fotografía de evidencia de entrega y confirmación del pedido.
- **Reporte de Incidencias:** Formulario para rechazar un pedido o reportar incidencias durante la entrega.
- **Notificaciones:** Recepción de notificaciones push de nuevos pedidos asignados y cambios de estado.

---

#### 3.2.3 Recursos Nativos del Dispositivo

| Recurso Nativo | Librería Expo | Usado por | Caso de uso |
|---|---|---|---|
| Cámara | `expo-camera` | Cliente, Repartidor | Subida de comprobante de pago y fotografía de evidencia de entrega |
| GPS / Ubicación | `expo-location` | Repartidor | Telemetría de ubicación durante el trayecto de entrega |
| Notificaciones Push | `expo-notifications` | Cliente, Repartidor | Alertas de estado de pedido y asignación de nuevos pedidos |
| Micrófono / Voz | `expo-av` + `react-native-voice` | Cliente | Dictado por voz para armar el carrito mediante Speech-to-Text |
| Mapas | `react-native-maps` | Repartidor | Visualización de ruta hacia dirección de entrega |
| Galería / Archivos | `expo-image-picker` | Cliente, Repartidor | Selección de imagen de comprobante desde galería |

---

#### 3.2.4 Estructura de Carpetas

La estructura sigue las convenciones de Expo con organización por features (módulos de dominio) y separación clara entre navegación, estado global, servicios y componentes.

```
pollos-carmesi-app/
├── app/                                 # Punto de entrada Expo
│   └── index.tsx                        # Entry point principal
│
├── src/
│   ├── navigation/                      # Configuración de React Navigation
│   │   ├── RootNavigator.tsx            # Navigator raíz, redirige por rol
│   │   ├── AuthNavigator.tsx            # Stack de autenticación
│   │   ├── ClienteNavigator.tsx         # Tab + Stack navigator del Cliente
│   │   └── RepartidorNavigator.tsx      # Stack navigator del Repartidor
│   │
│   ├── features/                        # Módulos por dominio (feature-based)
│   │   ├── auth/
│   │   │   ├── screens/                 # LoginScreen, RegisterScreen
│   │   │   ├── hooks/                   # useLogin, useRegister
│   │   │   └── services/                # authService (llamadas REST)
│   │   │
│   │   ├── menu/
│   │   │   ├── screens/                 # MenuScreen, ProductoDetalleScreen
│   │   │   ├── components/              # ProductoCard, CategoriaTab
│   │   │   ├── hooks/                   # useMenu, useCategorias
│   │   │   └── services/                # menuService
│   │   │
│   │   ├── carrito/
│   │   │   ├── screens/                 # CarritoScreen, ConfirmarPedidoScreen
│   │   │   ├── components/              # CarritoItem, ResumenPedido
│   │   │   ├── hooks/                   # useCarrito, useVozPedido
│   │   │   └── store/                   # carritoStore (Zustand)
│   │   │
│   │   ├── pago/
│   │   │   ├── screens/                 # PagoScreen, SubirComprobanteScreen
│   │   │   ├── components/              # MetodoPagoSelector, ComprobantePreview
│   │   │   ├── hooks/                   # usePago, useComprobante
│   │   │   └── services/                # pagoService
│   │   │
│   │   ├── seguimiento/
│   │   │   ├── screens/                 # SeguimientoScreen
│   │   │   ├── components/              # EstadoPedidoStepper, MapaEntrega
│   │   │   └── hooks/                   # useSeguimiento
│   │   │
│   │   ├── historial/
│   │   │   ├── screens/                 # HistorialScreen, DetallePedidoScreen
│   │   │   ├── components/              # PedidoHistorialCard
│   │   │   └── hooks/                   # useHistorial
│   │   │
│   │   ├── perfil/
│   │   │   ├── screens/                 # PerfilScreen, DireccionesScreen
│   │   │   ├── components/              # DireccionCard, FormDireccion
│   │   │   └── hooks/                   # usePerfil, useDirecciones
│   │   │
│   │   └── repartidor/
│   │       ├── screens/                 # PedidosAsignadosScreen, EntregaScreen, IncidenciaScreen
│   │       ├── components/              # PedidoAsignadoCard, MapaRuta
│   │       ├── hooks/                   # usePedidosAsignados, useGPS, useEntrega
│   │       └── services/                # repartidorService
│   │
│   ├── store/                           # Estado global con Zustand
│   │   ├── authStore.ts                 # Usuario autenticado, token JWT, rol
│   │   ├── carritoStore.ts              # Items del carrito activo
│   │   └── notificacionStore.ts         # Estado de notificaciones push
│   │
│   ├── services/                        # Capa de comunicación REST con MS0
│   │   ├── apolloClient.ts              # Instancia Apollo Client con JWT en headers
│   │   └── endpoints.ts                 # Constantes de endpoints por microservicio
│   │
│   ├── shared/                          # Componentes y utilidades reutilizables
│   │   ├── components/                  # Button, Input, Card, LoadingSpinner
│   │   ├── hooks/                       # useNotificaciones, usePermisos
│   │   └── utils/                       # Formatters, validadores, helpers
│   │
│   └── constants/                       # Colores, tipografía, tamaños, rutas
│       ├── theme.ts                     # Tema global de React Native Paper
│       └── routes.ts                    # Nombres de rutas de navegación
│
├── assets/                              # Recursos estáticos
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── app.json                             # Configuración Expo
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

#### 3.2.5 Tecnologías y Librerías

| Tecnología / Librería | Versión | Uso |
|---|---|---|
| Expo (Managed Workflow) | SDK 51+ | Base del proyecto, acceso a APIs nativas |
| React Native | v0.74+ | Framework de UI multiplataforma |
| TypeScript | v5+ | Lenguaje base |
| React Navigation | v6+ | Navegación entre pantallas y flujos por rol |
| Zustand | v4+ | Estado global (auth, carrito, notificaciones) |
| TanStack React Query | v5+ | Cache y sincronización de llamadas REST |
| React Native Paper | v5+ | Librería de componentes UI (Material Design) |
| Apollo Client | `@apollo/client` v3+ | Cliente GraphQL para comunicación con MS0 (queries y mutations) |
| expo-camera | - | Cámara para comprobantes y evidencias |
| expo-location | - | GPS y telemetría del repartidor |
| expo-notifications | - | Notificaciones push (FCM via Expo) |
| expo-image-picker | - | Selección de imágenes desde galería |
| expo-av + react-native-voice | - | Micrófono y Speech-to-Text para dictado |
| react-native-maps | - | Mapas y rutas para el repartidor |

---

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

### 4.3 MS3 - IA, Machine Learning y BI (FastAPI)

#### 4.3.1 Responsabilidad y Contexto de Dominio

MS3 es el microservicio de inteligencia del sistema. Concentra cuatro responsabilidades especializadas e independientes entre sí: verificación visual de comprobantes de pago mediante deep learning, estimación de tiempos de preparación mediante ML supervisado, segmentación de clientes mediante ML no supervisado y exposición de indicadores de inteligencia de negocios para el dashboard del Administrador.

MS3 no gestiona datos transaccionales del negocio. Consume datos de MS1 y MS2 via REST interno para alimentar sus modelos. Expone sus resultados via GraphQL hacia el frontend a través de MS0 (Schema Stitching) y via Redis para integración asíncrona con el flujo de pagos y pedidos.

---

#### 4.3.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework web | FastAPI (Python 3.11+) |
| Servidor ASGI | Uvicorn |
| Deep Learning | TensorFlow 2.x + Keras (modelo CNN exportado como `.h5`) |
| ML Supervisado | Scikit-learn (Random Forest Regressor) |
| ML No Supervisado | Scikit-learn (KMeans + método del codo para K óptimo) |
| Procesamiento de imágenes | Pillow + OpenCV |
| GraphQL servidor | Strawberry GraphQL (`strawberry-graphql[fastapi]`) |
| GraphQL cliente | No aplica — MS3 usa REST interno (`httpx`) para llamadas inter-servicios a MS1 y MS2 |
| ORM | SQLAlchemy (async) + Alembic para migraciones |
| Base de datos | PostgreSQL via `asyncpg` |
| Mensajería Redis | `redis-py` (aioredis) para Pub/Sub asíncrono |
| Serialización | Pydantic v2 |
| Variables de entorno | `python-dotenv` + Pydantic Settings |
| Testing | Pytest + pytest-asyncio |

---

#### 4.3.3 Base de Datos Utilizada

| Almacenamiento | Uso |
|---|---|
| PostgreSQL | Resultados de inferencia del modelo CNN, predicciones de tiempo de preparación, segmentos K-Means por cliente e indicadores BI precalculados. |
| Redis | Canal Pub/Sub para consumir eventos (`pago.registrado`, `pedido.presencial.creado`, `pedido.delivery.creado`) y publicar resultados de inferencia (`comprobante.analizado`, `tiempo.estimado`). |

---

#### 4.3.4 Módulos y Casos de Uso

Los cuatro módulos de MS3 son independientes entre sí y comparten únicamente la infraestructura de base de datos, Redis y los clientes GraphQL.

---

#### 4.3.5 Módulo Deep Learning — Verificación de Comprobantes

**Descripción:**
Clasifica imágenes de comprobantes de pago bolivianos (QR, transferencias bancarias, depósitos) como válidos o inválidos usando un modelo CNN preentrenado con TensorFlow/Keras. El modelo fue entrenado offline con un dataset de comprobantes bolivianos y se carga desde un archivo `.h5` al iniciar MS3.

**Ciclo de inferencia:**
1. MS3 consume el evento `pago.registrado` desde Redis con la URL del comprobante en S3 (sin cambios).
2. MS3 descarga la imagen desde S3 y la preprocesa (redimensión, normalización).
3. El modelo CNN clasifica la imagen y retorna un score de confianza (0.0 - 1.0).
4. Lógica de decisión según el score:
   - Score ≥ 0.85 → resultado `ACEPTADO`
   - Score 0.50 - 0.84 → resultado `REVISION_MANUAL` (escala al Administrador)
   - Score < 0.50 → resultado `RECHAZADO`
5. MS3 persiste el resultado en PostgreSQL con `pagoId`, `score`, `resultado` y `timestamp`.
6. MS3 publica el evento `comprobante.analizado` en Redis con el resultado.

**Casos de uso:**
- Cargar modelo CNN `.h5` al iniciar el servicio (singleton en memoria).
- Preprocesar imagen recibida: redimensionar a 224x224, normalizar píxeles.
- Ejecutar inferencia y calcular score de confianza.
- Persistir resultado de análisis en PostgreSQL.
- Publicar resultado via Redis hacia MS1.
- Exponer endpoint GraphQL para consultar el resultado de un análisis por `pagoId`.

---

#### 4.3.6 Módulo ML Supervisado — Estimación de Tiempos de Preparación

**Descripción:**
Predice el tiempo de preparación en minutos de un pedido usando un modelo Random Forest Regressor entrenado con datos históricos del restaurante. El modelo aprende de variables como cantidad de productos, categorías, horario del día y carga actual de cocina.

**Ciclo de predicción:**
1. MS3 consume los eventos `pedido.presencial.creado` (de MS1) y `pedido.delivery.creado` (de MS2) desde Redis.
2. MS3 extrae las features del pedido: cantidad total de ítems, categorías de productos, hora del día, día de la semana y número de pedidos activos en cocina en ese momento.
3. El modelo Random Forest predice el tiempo de preparación en minutos.
4. MS3 persiste la predicción en PostgreSQL con `pedidoId`, `tiempoPredichoMinutos` y `featuresUsadas`.
5. MS3 publica el evento `tiempo.estimado` en Redis hacia MS1 (si fue `pedido.presencial.creado`) o MS1 y MS2 (si fue `pedido.delivery.creado`).

**Ciclo de entrenamiento:**
- El modelo se entrena offline con datos históricos exportados desde PostgreSQL de MS1.
- El modelo entrenado se serializa con `joblib` y se guarda como archivo `.pkl`.
- MS3 carga el archivo `.pkl` al iniciar (singleton en memoria).
- No hay re-entrenamiento automático en producción en esta versión.

**Casos de uso:**
- Cargar modelo Random Forest `.pkl` al iniciar el servicio.
- Extraer y construir el vector de features desde el payload del evento (`pedido.presencial.creado` o `pedido.delivery.creado`).
- Consultar a MS1 via GraphQL la carga actual de cocina (pedidos en estado `EN_PREPARACION`).
- Ejecutar predicción y persistir resultado en PostgreSQL.
- Publicar tiempo estimado via Redis hacia MS1 y MS2.
- Exponer endpoint GraphQL para consultar la predicción por `pedidoId`.

---

#### 4.3.7 Módulo ML No Supervisado — Segmentación de Clientes

**Descripción:**
Agrupa a los clientes de la app móvil en segmentos comportamentales usando K-Means. El número óptimo de clusters K se determina automáticamente mediante el método del codo (Elbow Method) sobre los datos disponibles. La segmentación se ejecuta bajo demanda cuando el Administrador lo solicita desde el dashboard de BI.

**Features usadas para la segmentación:**
- Frecuencia de pedidos (pedidos por mes).
- Ticket promedio por pedido.
- Horario preferido de pedido (mañana, tarde, noche).
- Zona geográfica de entrega más frecuente.
- Días desde el último pedido (recencia).

**Ciclo de segmentación:**
1. El Administrador solicita el reporte de segmentación desde el panel web → REST a MS0 → MS3.
2. MS3 consulta datos históricos de pedidos y clientes a MS1 via REST interno.
3. MS3 construye la matriz de features por cliente.
4. MS3 aplica el método del codo para determinar K óptimo (rango 2-8 clusters).
5. MS3 ejecuta K-Means con K óptimo y asigna cada cliente a un segmento.
6. MS3 etiqueta los segmentos con nombres descriptivos (ej: "Cliente frecuente alto valor", "Cliente ocasional", "Cliente inactivo").
7. MS3 persiste los resultados en PostgreSQL con `clienteId`, `segmento`, `label` y `fechaEjecucion`.
8. MS3 retorna los segmentos al frontend via REST (a través de MS0).

**Casos de uso:**
- Consultar datos históricos de clientes y pedidos a MS1 via GraphQL.
- Construir y normalizar matriz de features con Scikit-learn.
- Calcular K óptimo mediante el método del codo.
- Ejecutar K-Means y etiquetar segmentos.
- Persistir resultados de segmentación en PostgreSQL.
- Exponer resultados via endpoint REST hacia el dashboard de BI.

---

#### 4.3.8 Módulo BI — Inteligencia de Negocios y Reportes

**Descripción:**
Consolida y expone indicadores de negocio precalculados para el dashboard del Administrador. Los datos se obtienen consultando a MS1 y MS2 via GraphQL y se persisten en PostgreSQL para respuesta rápida.

**Indicadores expuestos:**

| Indicador | Descripción |
|---|---|
| Ventas por período | Total de ventas por día, semana y mes con comparativa de período anterior |
| Productos más vendidos | Ranking de productos por cantidad vendida y por ingresos generados |
| Horarios pico | Distribución de pedidos por hora del día para identificar horas de mayor demanda |
| Zonas de delivery | Mapa de calor por zona geográfica de entregas, agrupadas por frecuencia |
| Segmentación de clientes | Resultados del módulo K-Means integrados en el dashboard |
| Pedidos por canal | Comparativa presencial vs delivery por período |

**Casos de uso:**
- Consultar datos de ventas y pedidos a MS1 y MS2 via GraphQL.
- Precalcular y persistir indicadores en PostgreSQL para respuesta rápida.
- Exponer todos los indicadores via endpoints REST hacia el dashboard del Administrador (a través de MS0).
- Actualizar indicadores precalculados periódicamente (cada hora via tarea programada con `APScheduler`).

---

#### 4.3.9 Estructura de Carpetas y Descripción de Capas

```
ms3-ia-ml-bi/
├── src/
│   ├── comprobantes/                      # Módulo Deep Learning CNN
│   │   ├── router.py                      # Endpoints REST del módulo
│   │   ├── service.py                     # Orquesta preprocesamiento e inferencia
│   │   ├── inference.py                   # Carga del modelo .h5 y lógica de inferencia
│   │   ├── preprocessing.py               # Redimensión, normalización de imagen
│   │   ├── repository.py                  # Persistencia de resultados en PostgreSQL
│   │   └── schemas.py                     # Schemas Pydantic de request/response
│   │
│   ├── tiempos/                           # Módulo ML Supervisado (Random Forest)
│   │   ├── router.py
│   │   ├── service.py                     # Orquesta extracción de features y predicción
│   │   ├── predictor.py                   # Carga del modelo .pkl y lógica de predicción
│   │   ├── features.py                    # Construcción del vector de features
│   │   ├── repository.py                  # Persistencia de predicciones
│   │   └── schemas.py
│   │
│   ├── segmentacion/                      # Módulo ML No Supervisado (K-Means)
│   │   ├── router.py
│   │   ├── service.py                     # Orquesta obtención de datos y ejecución K-Means
│   │   ├── clustering.py                  # Método del codo + K-Means + etiquetado
│   │   ├── features.py                    # Construcción de matriz de features por cliente
│   │   ├── repository.py                  # Persistencia de segmentos
│   │   └── schemas.py
│   │
│   ├── bi/                                # Módulo Business Intelligence
│   │   ├── router.py                      # Endpoints REST de indicadores BI
│   │   ├── service.py                     # Consolidación y cálculo de indicadores
│   │   ├── scheduler.py                   # APScheduler para actualización periódica
│   │   ├── repository.py                  # Lectura y escritura de indicadores precalculados
│   │   └── schemas.py
│   │
│   ├── graphql/                           # Capa GraphQL
│   │   ├── schema.py                      # Schema Strawberry GraphQL de MS3
│   │   ├── resolvers/
│   │   │   ├── comprobantes_resolver.py   # Query: resultado de análisis por pagoId
│   │   │   └── tiempos_resolver.py        # Query: predicción de tiempo por pedidoId
│   │   └── clients/
│   │       ├── ms1_client.py              # Cliente httpx para queries GraphQL a MS1
│   │       └── ms2_client.py              # Cliente httpx para queries GraphQL a MS2
│   │
│   ├── infrastructure/                    # Adaptadores de servicios externos
│   │   ├── redis/
│   │   │   ├── publisher.py               # Publicación de eventos en Redis
│   │   │   └── subscriber.py              # Suscripción a eventos Redis (async)
│   │   ├── s3/
│   │   │   └── s3_client.py               # Descarga de imágenes de comprobantes desde S3
│   │   └── database/
│   │       ├── connection.py              # Configuración de conexión SQLAlchemy async
│   │       └── models.py                  # Modelos SQLAlchemy de todas las tablas de MS3
│   │
│   ├── models/                            # Archivos de modelos ML entrenados (no código)
│   │   ├── cnn_comprobantes.h5            # Modelo CNN TensorFlow/Keras preentrenado
│   │   └── rf_tiempos.pkl                 # Modelo Random Forest serializado con joblib
│   │
│   ├── common/                            # Utilidades transversales
│   │   ├── exceptions.py                  # Excepciones personalizadas
│   │   ├── responses.py                   # Wrapper estándar de respuestas REST
│   │   └── security.py                    # Validación de header X-User-Role
│   │
│   ├── config/
│   │   └── settings.py                    # Configuración via Pydantic Settings
│   │
│   └── main.py                            # Bootstrap FastAPI, registro de routers y GraphQL
│
├── alembic/                               # Migraciones de base de datos
│   └── versions/
├── tests/
├── .env
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

**Descripción de capas:**

- **`router.py`:** Define los endpoints REST del módulo. Recibe requests, valida schemas Pydantic y delega al service. Equivalente al Controller en Spring Boot / NestJS.
- **`service.py`:** Orquesta la lógica de negocio del módulo. Coordina inferencia/predicción, clientes GraphQL, repositorio e infraestructura Redis/S3.
- **`inference.py` / `predictor.py` / `clustering.py`:** Capa de modelos ML. Carga el artefacto entrenado al inicio y expone métodos de inferencia. Completamente desacoplada del resto.
- **`features.py`:** Construcción y transformación del vector de features para alimentar el modelo.
- **`repository.py`:** Acceso a PostgreSQL via SQLAlchemy async. Solo queries de base de datos.
- **`schemas.py`:** Schemas Pydantic para validación de entrada y serialización de respuestas.
- **`graphql/`:** Schema Strawberry para exponer resultados de IA al frontend via MS0 (Schema Stitching). Los clientes REST consumen datos históricos de MS1 y MS2.
- **`infrastructure/`:** Adaptadores desacoplados para Redis, S3 y PostgreSQL.
- **`models/`:** Directorio de artefactos ML. Los archivos `.h5` y `.pkl` se montan en el contenedor Docker.

---

#### 4.3.10 Esquema GraphQL (Queries expuestos a MS1 y MS2)

MS3 expone un endpoint GraphQL en `/graphql` consumido por MS0 via Schema Stitching. El frontend accede a estas operaciones a través del Superschema unificado de MS0. Los tipos y operaciones aquí definidos son la fuente de verdad del dominio de IA y BI.

```graphql
type Query {
  # Resultados de verificación de comprobantes
  obtenerResultadoComprobante(pagoId: ID!): ResultadoComprobante

  # Predicciones de tiempo de preparación
  obtenerTiempoEstimado(pedidoId: ID!): TiempoEstimado

  # Segmentación de clientes (último resultado disponible)
  obtenerSegmentosClientes: [SegmentoCliente!]!
  obtenerSegmentoCliente(clienteId: ID!): SegmentoCliente
}

type ResultadoComprobante {
  pagoId: ID!
  resultado: ResultadoAnalisis!
  scoreConfianza: Float!
  timestamp: String!
}

type TiempoEstimado {
  pedidoId: ID!
  tiempoPredichoMinutos: Int!
  featuresUsadas: String
  timestamp: String!
}

type SegmentoCliente {
  clienteId: ID!
  segmento: Int!
  label: String!
  fechaEjecucion: String!
}

enum ResultadoAnalisis {
  ACEPTADO
  RECHAZADO
  REVISION_MANUAL
}
```

---

#### 4.3.11 Endpoints REST expuestos hacia MS0

| Método | Endpoint | Descripción | Rol requerido |
|---|---|---|---|
| GET | `/api/v1/bi/ventas` | Indicadores de ventas por período | Administrador |
| GET | `/api/v1/bi/productos` | Ranking de productos más vendidos | Administrador |
| GET | `/api/v1/bi/horarios` | Distribución de pedidos por hora del día | Administrador |
| GET | `/api/v1/bi/zonas` | Mapa de frecuencia de zonas de delivery | Administrador |
| GET | `/api/v1/bi/canales` | Comparativa presencial vs delivery | Administrador |
| POST | `/api/v1/segmentacion/ejecutar` | Ejecutar segmentación K-Means bajo demanda | Administrador |
| GET | `/api/v1/segmentacion/resultados` | Obtener últimos resultados de segmentación | Administrador |
| GET | `/api/v1/comprobantes/{pagoId}` | Consultar resultado de análisis de comprobante | Administrador, Cajero |

---

#### 4.3.12 Eventos publicados / consumidos

| Acción | Canal Redis | Tipo | Payload principal |
|---|---|---|---|
| **Consume** | `pago.registrado` | Suscriptor | `pagoId`, `comprobanteUrl` — dispara inferencia CNN |
| **Consume** | `pedido.presencial.creado` | Suscriptor | `pedidoId`, `productos`, `cantidadItems`, `hora` — dispara predicción RF |
| **Consume** | `pedido.delivery.creado` | Suscriptor | `pedidoId`, `productos`, `cantidadItems`, `hora`, `coordenadasEntrega` — dispara predicción RF |
| **Publica** | `comprobante.analizado` | Publicador | `pagoId`, `resultado`, `scoreConfianza` |
| **Publica** | `tiempo.estimado` | Publicador | `pedidoId`, `tiempoPredichoMinutos` |

---

#### 4.3.13 Variables de Entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 8000) |
| `DATABASE_URL` | URL de conexión PostgreSQL async (`postgresql+asyncpg://...`) |
| `REDIS_URL` | URL de conexión Redis (`redis://:password@host:port`) |
| `AWS_REGION` | Región AWS |
| `AWS_ACCESS_KEY_ID` | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Credencial AWS |
| `AWS_S3_BUCKET_NAME` | Bucket S3 para descarga de imágenes de comprobantes |
| `MS1_REST_INTERNAL_URL` | URL interna REST de MS1 para comunicación inter-servicios |
| `MS2_REST_INTERNAL_URL` | URL interna REST de MS2 para comunicación inter-servicios |
| `CNN_MODEL_PATH` | Ruta al archivo del modelo CNN (`/app/models/cnn_comprobantes.h5`) |
| `RF_MODEL_PATH` | Ruta al archivo del modelo Random Forest (`/app/models/rf_tiempos.pkl`) |
| `CNN_CONFIDENCE_THRESHOLD_ACCEPT` | Umbral de confianza para ACEPTADO (default: 0.85) |
| `CNN_CONFIDENCE_THRESHOLD_REVIEW` | Umbral mínimo para REVISION_MANUAL (default: 0.50) |
| `BI_REFRESH_INTERVAL_MINUTES` | Intervalo de actualización de indicadores BI precalculados (default: 60) |

---

### 4.4 MS4 - Gestión de Usuarios y Autenticación (Spring Boot)

#### 4.4.1 Responsabilidad y Contexto de Dominio

MS4 es el microservicio dedicado exclusivamente a la **gestión de usuarios** y **autenticación** del sistema. Es la autoridad de identidad: emite tokens JWT firmados con RSA (llave privada) y administra la persistencia de usuarios y roles. Los demás microservicios (MS1, MS2, MS3) validan los tokens usando la llave pública de MS4 de forma autónoma sin consultar a MS4 en tiempo real.

MS0 delega las operaciones de login y registro a MS4 via REST. MS4 no participa en la comunicación GraphQL ni en los flujos de negocio del restaurante.

**Funciones principales:**
- Autenticar credenciales (username/email + password) y emitir JWT con claim `roles`.
- Registrar nuevos Clientes (por defecto con rol `CLIENTE`).
- Proveer la clave pública RSA (`public.pem`) para que los demás microservicios validen tokens de forma autónoma.
- Gestionar roles del sistema: `ADMINISTRADOR`, `CAJERO`, `COCINA`, `REPARTIDOR`, `CLIENTE`.
- Sembrar datos iniciales en ambiente `dev` (roles y usuarios base).

---

#### 4.4.2 Tecnología Principal

| Elemento | Tecnología |
|---|---|
| Framework | Spring Boot 4.0.x (Java 21) |
| Persistencia | Spring Data JPA + Hibernate |
| Base de datos | PostgreSQL |
| Seguridad | Spring Security + OAuth2 Resource Server (JWT) |
| Firma/validación JWT | Nimbus JOSE/JWT (`JwtEncoder`/`JwtDecoder`) con RSA (PEM) |
| Documentación | SpringDoc OpenAPI (Swagger UI) |
| Email | Spring Boot Starter Mail (`JavaMailSender`) |
| Variables de entorno | Spring Boot `application.properties` + `springboot4-dotenv` |

---

#### 4.4.3 Base de Datos Utilizada

| Almacenamiento | Uso |
|---|---|
| PostgreSQL | Usuarios, roles y relaciones usuario-rol. Esquema independiente del resto de microservicios. |
| Certificados (classpath) | `certs/private.pem` para firmar JWT y `certs/public.pem` para verificación. |

---

#### 4.4.4 Módulos y Casos de Uso

**Módulo de Autenticación (REST)**
- Login: autentica con `AuthenticationManager` y genera un access token JWT firmado con RSA.
- JWT emitido contiene: `sub` (username), `roles` (lista con prefijo `ROLE_`), `iss`, `iat`, `exp`.

**Módulo de Usuarios**
- Registro de Cliente: crea usuario, valida duplicados (username/email), encripta password con BCrypt, asigna rol `CLIENTE` y persiste.
- CRUD de usuarios internos gestionado por el Administrador (Cajeros, Cocina, Repartidores).
- Gestión de direcciones de entrega del Cliente (crear, editar, eliminar, predeterminada).

**Módulo de Roles**
- CRUD de roles del sistema: `ADMINISTRADOR`, `CAJERO`, `COCINA`, `REPARTIDOR`, `CLIENTE`.
- Asignación y revocación de roles a usuarios.

**Semillas (solo perfil `dev`)**
- Carga inicial de roles y usuarios base mediante `CommandLineRunner`.

**Infraestructura**
- Servicio de email (SMTP) via `JavaMailSender` para notificaciones de cuenta.
- Exposición de la clave pública RSA en endpoint público para que otros servicios puedan descargarla si es necesario.

---

#### 4.4.5 Estructura de Carpetas y Descripción de Capas

```
auth/
├── src/
│   ├── main/
│   │   ├── java/com/auth/
│   │   │   ├── auth/
│   │   │   │   ├── jwt/                       # JwtService: generación y firma de JWT con RSA
│   │   │   │   └── userdetails/               # UserDetailsService y principal desde base de datos
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── decorators/                # @CurrentUserId: extrae userId del JWT en controllers
│   │   │   │   ├── errors/                    # Excepciones de aplicación y handler global
│   │   │   │   └── response/                  # ApiResponse y estructuras de error estandarizadas
│   │   │   │
│   │   │   ├── config/                        # SecurityConfig, JwtConfig, WebConfig, OpenApiConfig
│   │   │   │
│   │   │   ├── domain/
│   │   │   │   ├── dtos/                      # DTOs de auth y usuario (LoginRequest, RegisterRequest)
│   │   │   │   ├── enums/                     # Enum de roles del sistema
│   │   │   │   └── models/                    # Entidades JPA: Usuario, Rol, Direccion
│   │   │   │
│   │   │   ├── features/
│   │   │   │   ├── auth/                      # AuthController, AuthService (login)
│   │   │   │   ├── rol/                       # RolRepository, RolService, excepciones
│   │   │   │   └── usuario/                   # UsuarioController, UsuarioService, UsuarioRepository
│   │   │   │
│   │   │   ├── seed/                          # Seeder de roles y usuarios (solo perfil dev)
│   │   │   │
│   │   │   ├── services/
│   │   │   │   └── email/                     # EmailService via JavaMailSender
│   │   │   │
│   │   │   └── AuthApplication.java           # Clase principal de Spring Boot
│   │   │
│   │   └── resources/
│   │       ├── application.properties         # Configuración base
│   │       └── certs/
│   │           ├── private.pem                # Clave privada RSA para firmar JWT (nunca expuesta)
│   │           └── public.pem                 # Clave pública RSA para verificación (compartida con MS1/MS2/MS3)
│   │
│   └── test/
│       └── java/com/auth/AuthApplicationTests.java
│
├── .env
├── .env.example
├── pom.xml
└── mvnw / mvnw.cmd
```

**Descripción de capas:**

- **`auth/jwt/`:** Lógica de generación y firma de JWT usando RSA con Nimbus JOSE. El token incluye `sub`, `roles`, `iss`, `iat` y `exp`.
- **`auth/userdetails/`:** Implementación de `UserDetailsService` para cargar el usuario desde PostgreSQL durante la autenticación.
- **`common/`:** Decoradores personalizados, handler global de excepciones y wrapper de respuestas estandarizadas.
- **`config/`:** `SecurityConfig` configura autenticación y `JwtConfig` configura el encoder/decoder RSA.
- **`domain/`:** Entidades JPA (`Usuario`, `Rol`, `Direccion`) y DTOs de entrada/salida.
- **`features/`:** Módulos de negocio: auth (login), rol (CRUD de roles) y usuario (CRUD de usuarios y direcciones).
- **`seed/`:** Datos iniciales para ambiente de desarrollo: roles base y usuarios de prueba.
- **`certs/`:** Par de claves RSA. La `private.pem` firma los tokens. La `public.pem` se comparte con MS0, MS1, MS2 y MS3 para validación autónoma.

---

#### 4.4.6 Esquema GraphQL

MS4 **no expone GraphQL**. Su comunicación es exclusivamente REST. La gestión de usuarios desde el frontend se realiza via MS0 que delega a MS4 via REST.

---

#### 4.4.7 Endpoints REST expuestos hacia MS0

Context-path global: `/api`

| Método | Endpoint | Descripción | Autenticación |
|---|---|---|---|
| POST | `/api/auth/login` | Autentica credenciales y retorna JWT firmado con RSA | Pública |
| POST | `/api/auth/register` | Registra nuevo Cliente, retorna JWT | Pública |
| GET | `/api/usuarios` | Listar usuarios internos | JWT — rol ADMINISTRADOR |
| POST | `/api/usuarios` | Crear usuario interno (Cajero, Cocina, Repartidor) | JWT — rol ADMINISTRADOR |
| PUT | `/api/usuarios/{id}` | Editar usuario | JWT — rol ADMINISTRADOR |
| PATCH | `/api/usuarios/{id}/estado` | Activar / desactivar usuario | JWT — rol ADMINISTRADOR |
| GET | `/api/usuarios/perfil` | Obtener perfil del usuario autenticado | JWT requerido |
| PUT | `/api/usuarios/perfil` | Actualizar datos de perfil | JWT requerido |
| GET | `/api/usuarios/direcciones` | Listar direcciones del Cliente | JWT — rol CLIENTE |
| POST | `/api/usuarios/direcciones` | Agregar nueva dirección | JWT — rol CLIENTE |
| PUT | `/api/usuarios/direcciones/{id}` | Editar dirección | JWT — rol CLIENTE |
| DELETE | `/api/usuarios/direcciones/{id}` | Eliminar dirección | JWT — rol CLIENTE |

---

#### 4.4.8 Eventos publicados / consumidos

MS4 **no publica ni consume eventos de Redis** en la implementación actual. Su comunicación es exclusivamente REST síncrono.

---

#### 4.4.9 Seguridad JWT

| Parámetro | Valor |
|---|---|
| Algoritmo | RSA (RS256) |
| Firma | Llave privada (`certs/private.pem`) — solo en MS4 |
| Verificación | Llave pública (`certs/public.pem`) — compartida con MS0, MS1, MS2, MS3 |
| Claims emitidos | `iss`, `iat`, `exp`, `sub` (username), `roles` (lista con prefijo `ROLE_`) |
| TTL access token | Configurable (default: 1 día — `P1D`) |

---

#### 4.4.10 Variables de Entorno

| Variable | Descripción |
|---|---|
| `server.port` | Puerto del servidor (default: 8081) |
| `server.servlet.context-path` | Prefijo global (default: `/api`) |
| `spring.datasource.url` | URL de PostgreSQL (ej: `jdbc:postgresql://localhost:5432/auth_restaurante`) |
| `DB_USER` | Usuario de PostgreSQL |
| `DB_PASSWORD` | Contraseña de PostgreSQL |
| `app.jwt.issuer` | Emisor del JWT (default: `restaurante`) |
| `app.jwt.access-token-ttl` | TTL del access token (default: `P1D`) |
| `app.jwt.private-key` | Ubicación llave privada (default: `classpath:certs/private.pem`) |
| `app.jwt.public-key` | Ubicación llave pública (default: `classpath:certs/public.pem`) |
| `MAIL_USERNAME` | Usuario SMTP para envío de correos |
| `MAIL_PASSWORD` | Contraseña SMTP |
| `app.base-url` | URL base del microservicio (default: `http://localhost:8081/api`) |

---

## 5. Blockchain

### 5.1 Descripción y Justificación

El módulo blockchain provee un registro inmutable y verificable de documentos críticos del sistema: recibos de pago y documentos administrativos (cierres de caja, reportes). En lugar de almacenar los documentos completos en la blockchain (costoso e ineficiente), se registra únicamente el **hash SHA-256** del documento. Esto permite verificar en cualquier momento que un documento no ha sido alterado comparando su hash actual contra el hash registrado en la red.

**Justificación técnica:**
- Los documentos físicos o digitales pueden ser alterados. El hash en blockchain es inmutable por diseño.
- El costo de registrar un hash en Polygon Mumbai es mínimo comparado con Ethereum mainnet.
- Provee una capa de auditoría verificable públicamente sin necesidad de confiar en el sistema central.

**Componentes del módulo:**

| Componente | Tecnología | Rol |
|---|---|---|
| Smart Contract | Solidity 0.8.x | Lógica de registro y consulta de hashes en la blockchain |
| Framework de desarrollo | Hardhat | Compilación, testing y despliegue del contrato |
| Red de despliegue | Polygon Mumbai (testnet) | Red donde vive el contrato desplegado |
| Integración backend | web3j (dentro de MS1) | Llamadas al contrato desde Spring Boot |
| Wallet del sistema | Una wallet compartida | Firma todas las transacciones de registro |

---

### 5.2 Smart Contract en Solidity

El contrato es simple y deliberadamente minimalista. Su única responsabilidad es registrar hashes, consultarlos y emitir eventos por cada registro.

**Estructura del contrato `DocumentRegistry.sol`:**

```
Contrato: DocumentRegistry
├── Mapping: documentHash → DocumentRecord
│   └── DocumentRecord: { hash, tipo, timestamp, registradoPor }
├── Función: registrarDocumento(hash, tipo) → emite DocumentoRegistrado
├── Función: consultarDocumento(hash) → retorna DocumentRecord
├── Función: existeDocumento(hash) → retorna bool
└── Evento: DocumentoRegistrado(hash, tipo, timestamp, registradoPor)
```

**Descripción de funciones:**

| Función | Visibilidad | Descripción |
|---|---|---|
| `registrarDocumento(string hash, string tipo)` | public | Registra el hash del documento con su tipo y timestamp. Solo puede ser llamado por la wallet autorizada del sistema. Emite el evento `DocumentoRegistrado`. |
| `consultarDocumento(string hash)` | public view | Retorna el registro completo asociado al hash: tipo, timestamp y dirección del registrador. |
| `existeDocumento(string hash)` | public view | Retorna `true` si el hash ya fue registrado, `false` en caso contrario. Usado para verificación de integridad. |

**Evento emitido:**

| Evento | Parámetros | Descripción |
|---|---|---|
| `DocumentoRegistrado` | `hash`, `tipo`, `timestamp`, `registradoPor` | Emitido en cada registro exitoso. Indexado en la blockchain para búsqueda eficiente. |

**Tipos de documento registrables:**

| Tipo | Descripción |
|---|---|
| `RECIBO_PAGO` | Hash del recibo de pago generado al confirmar un pago |
| `CIERRE_CAJA` | Hash del reporte PDF de cierre de caja diario |
| `REPORTE_ADMINISTRATIVO` | Hash de reportes administrativos generados por el Administrador |

**Control de acceso:**
El contrato implementa un modificador `soloAutorizado` que verifica que la dirección que llama (`msg.sender`) sea la wallet del sistema configurada en el despliegue. Esto evita que wallets externas registren documentos falsos.

---

### 5.3 Red de Despliegue (Polygon Mumbai Testnet)

| Parámetro | Valor |
|---|---|
| Red | Polygon Mumbai (testnet) |
| Chain ID | 80001 |
| Token de gas | MATIC (test) |
| RPC URL | `https://rpc-mumbai.maticvigil.com` o via Alchemy/Infura |
| Explorador de bloques | `https://mumbai.polygonscan.com` |

**Justificación de Polygon Mumbai sobre Sepolia:**
- Transacciones más baratas en gas, relevante cuando el sistema registra múltiples documentos diarios.
- Tiempos de confirmación más rápidos (~2 segundos vs ~12 segundos en Ethereum).
- Compatible con las mismas herramientas de desarrollo (Hardhat, web3j, ethers.js).

**Repositorio del contrato:**
El smart contract y los scripts de Hardhat viven en un directorio independiente dentro del repositorio del proyecto, no dentro de ningún microservicio.

```
blockchain/
├── contracts/
│   └── DocumentRegistry.sol       # Contrato principal
├── scripts/
│   ├── deploy.js                  # Script de despliegue a Polygon Mumbai
│   └── verify.js                  # Script de verificación en Polygonscan
├── test/
│   └── DocumentRegistry.test.js   # Tests del contrato con Hardhat
├── hardhat.config.js              # Configuración de Hardhat: redes, compilador
├── .env                           # PRIVATE_KEY y RPC_URL (nunca en repositorio)
└── package.json
```

**Variables de entorno del directorio blockchain:**

| Variable | Descripción |
|---|---|
| `PRIVATE_KEY` | Clave privada de la wallet del sistema para firmar el despliegue |
| `POLYGON_MUMBAI_RPC_URL` | URL RPC de Polygon Mumbai (via Alchemy o Infura) |
| `POLYGONSCAN_API_KEY` | API key para verificar el contrato en Polygonscan |

**Proceso de despliegue:**
1. Compilar el contrato: `npx hardhat compile`
2. Ejecutar tests locales: `npx hardhat test`
3. Desplegar a Mumbai: `npx hardhat run scripts/deploy.js --network mumbai`
4. Hardhat retorna la dirección del contrato desplegado: `0xABCD...1234`
5. Copiar la dirección a la variable `BLOCKCHAIN_CONTRACT_ADDRESS` de MS1.
6. Verificar el contrato en Polygonscan: `npx hardhat run scripts/verify.js --network mumbai`

---

### 5.4 Integración con MS1 (web3j)

MS1 (Spring Boot) es el único microservicio que interactúa con el contrato desplegado. La integración se realiza via **web3j**, la librería oficial de Java para interacción con redes Ethereum-compatibles.

**Flujo de integración en MS1:**

```
BlockchainService.java (MS1)
├── Al iniciar: carga el ABI del contrato y crea instancia web3j apuntando a Polygon Mumbai
├── registrarHash(contenidoDocumento, tipoDocumento):
│   ├── Calcula SHA-256 del contenido del documento
│   ├── Firma la transacción con la wallet del sistema (clave privada en variable de entorno)
│   ├── Envía la transacción al contrato función registrarDocumento(hash, tipo)
│   ├── Espera confirmación de la transacción
│   └── Retorna el txHash de la transacción confirmada
└── verificarHash(hash):
    ├── Llama a existeDocumento(hash) — lectura, sin costo de gas
    └── Retorna true/false con los datos del registro si existe
```

**Consideraciones de seguridad:**
- La clave privada de la wallet nunca se hardcodea en el código. Se lee exclusivamente desde la variable de entorno `BLOCKCHAIN_WALLET_PRIVATE_KEY`.
- Las llamadas de lectura (`consultarDocumento`, `existeDocumento`) no consumen gas.
- Las llamadas de escritura (`registrarDocumento`) consumen MATIC de test. La wallet del sistema debe mantenerse fondeada con MATIC de la testnet.
- El ABI del contrato compilado por Hardhat se incluye como archivo `.json` en los recursos de MS1.

---

### 5.5 Flujo de Registro de Hash de Documentos

**Flujo 1 — Registro de recibo de pago:**
1. MS1 confirma un pago y genera el recibo con todos sus datos.
2. `ReciboService` serializa el recibo a JSON y calcula su hash SHA-256.
3. `BlockchainService` llama a `registrarDocumento(hash, "RECIBO_PAGO")` en el contrato via web3j.
4. La blockchain confirma la transacción y retorna el `txHash`.
5. MS1 persiste el `txHash` junto al recibo en PostgreSQL.
6. El Administrador puede verificar la integridad del recibo en cualquier momento desde el panel web.

**Flujo 2 — Registro de cierre de caja:**
1. n8n genera el reporte PDF de cierre de caja y lo sube a S3 via MS2.
2. MS2 llama a MS1 via REST interno (`POST /api/internal/registrar-documento`) con la URL del PDF en S3 y su contenido en bytes.
3. MS1 calcula el hash SHA-256 del PDF.
4. `BlockchainService` llama a `registrarDocumento(hash, "CIERRE_CAJA")` via web3j.
5. MS1 persiste el `txHash` y los metadatos del documento en PostgreSQL.

**Flujo 3 — Verificación de integridad desde el panel web:**
1. El Administrador selecciona un documento en el módulo blockchain del panel Angular.
2. Angular solicita verificación a MS0 → MS1.
3. MS1 descarga el documento desde S3 y recalcula su hash SHA-256.
4. `BlockchainService` llama a `existeDocumento(hash)` en el contrato (lectura, sin gas).
5. Si el hash coincide con el registrado en blockchain → documento íntegro ✅.
6. Si el hash no coincide → documento fue alterado ⚠️.
7. MS1 retorna el resultado al panel web con los datos de la transacción original.

---

## 6. Almacenamiento de Archivos (Amazon S3)

### 6.1 Responsabilidad y Uso en el Sistema

Amazon S3 es el sistema de almacenamiento de archivos binarios del sistema. Ningún microservicio almacena archivos en su propio sistema de ficheros ni en la base de datos. Todo archivo generado o recibido por el sistema se persiste en S3, y los microservicios guardan únicamente la URL y metadatos del archivo en PostgreSQL.

**Tipos de archivos gestionados en S3:**

| Tipo de archivo | Generado por | Consumido por | Acceso |
|---|---|---|---|
| Imágenes de productos del menú | MS1 (subida por Administrador) | Frontend web y app móvil | Público |
| Comprobantes de pago | MS1, MS2 (subida por Cajero o Cliente) | MS3 (inferencia CNN), MS1 (blockchain) | Privado |
| Fotografías de evidencia de entrega | MS2 (subida por Repartidor) | MS1, Administrador | Privado |
| Reportes PDF de cierre de caja | MS2 (generado por automatización n8n) | Administrador, MS1 (blockchain) | Privado |
| Documentos administrativos | MS1 (generado por Administrador) | MS1 (blockchain), Administrador | Privado |

---

### 6.2 Estructura de Buckets y Organización

Se utiliza **un único bucket** con organización interna por prefijos (carpetas). Esta estrategia simplifica la administración, la configuración de permisos y el monitoreo de costos.

**Nombre del bucket:** `pollos-carmesi-storage` (ajustar según disponibilidad en AWS)

**Estructura interna de carpetas:**

```
pollos-carmesi-storage/
│
├── menu/                              ← PÚBLICO
│   └── productos/
│       └── {productoId}.{ext}        # Imágenes de productos del menú
│
├── comprobantes/                      ← PRIVADO
│   └── {año}/{mes}/{dia}/
│       └── {pagoId}.{ext}            # Comprobantes de pago subidos por Cajero o Cliente
│
├── evidencias/                        ← PRIVADO
│   └── {año}/{mes}/{dia}/
│       └── {pedidoId}.{ext}          # Fotografías de evidencia de entrega del Repartidor
│
├── reportes/                          ← PRIVADO
│   └── {año}/{mes}/
│       └── cierre-caja-{fecha}.pdf   # Reportes PDF de cierre de caja generados por n8n
│
└── documentos/                        ← PRIVADO
    └── {año}/{mes}/
        └── {documentoId}.{ext}       # Documentos administrativos registrados en blockchain
```

**Política de acceso por carpeta:**

| Carpeta | Política | Razón |
|---|---|---|
| `menu/` | Pública (lectura) | Las imágenes del menú deben cargarse directamente en el frontend sin autenticación |
| `comprobantes/` | Privada + URL firmada | Documentos financieros sensibles, acceso temporal controlado |
| `evidencias/` | Privada + URL firmada | Fotografías de entrega, acceso solo para auditoría |
| `reportes/` | Privada + URL firmada | Reportes de caja confidenciales, acceso solo para Administrador |
| `documentos/` | Privada + URL firmada | Documentos con registro blockchain, acceso auditado |

**URLs firmadas (Presigned URLs):**
Para los archivos privados, los microservicios generan URLs firmadas temporales con expiración configurable (default: 15 minutos). El frontend recibe la URL firmada y puede descargar el archivo directamente desde S3 sin pasar por el backend, reduciendo el consumo de ancho de banda del servidor.

---

### 6.3 Relación con PostgreSQL (metadatos)

Ningún microservicio almacena el contenido binario de los archivos en PostgreSQL. Solo se persisten los metadatos necesarios para referenciar y administrar cada archivo.

**Metadatos guardados en PostgreSQL por tipo de archivo:**

| Tipo | Tabla (referencial) | Metadatos persistidos |
|---|---|---|
| Imagen de producto | `productos` en MS1 | `imagen_url` (URL pública S3) |
| Comprobante de pago | `pagos` en MS1 | `comprobante_url`, `comprobante_s3_key`, `fecha_subida` |
| Evidencia de entrega | `entregas` en MS2 | `evidencia_url`, `evidencia_s3_key`, `fecha_subida` |
| Reporte de cierre | `documentos` en MS1 | `s3_key`, `s3_url`, `tipo`, `fecha_generacion`, `tx_hash_blockchain` |
| Documento administrativo | `documentos` en MS1 | `s3_key`, `s3_url`, `tipo`, `fecha_subida`, `tx_hash_blockchain` |

**Convención de `s3_key`:**
El `s3_key` es la ruta completa del archivo dentro del bucket (ej: `comprobantes/2025/01/15/pago-abc123.jpg`). Es el identificador primario para operar sobre el archivo desde cualquier microservicio.

---

### 6.4 Integración por Microservicio

**MS1 — Spring Boot:**
- Usa AWS SDK for Java v2 (`software.amazon.awssdk:s3`).
- `S3Service.java` centraliza todas las operaciones: upload, download, generación de URL firmada y eliminación.
- Operaciones: subida de imágenes de productos, subida de comprobantes, subida y descarga de documentos administrativos, generación de URLs firmadas para el panel web.

**MS2 — NestJS:**
- Usa `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`.
- `s3.service.ts` centraliza todas las operaciones S3 del microservicio.
- Operaciones: subida de fotografías de evidencia de entrega, subida de reportes PDF de cierre de caja, generación de URL firmada del reporte para n8n.

**MS3 — FastAPI:**
- Usa `boto3` (AWS SDK para Python).
- `s3_client.py` en la capa de infraestructura gestiona la descarga de imágenes.
- Operaciones: descarga de imágenes de comprobantes desde S3 para inferencia del modelo CNN.

**Convención de nomenclatura de archivos en S3:**

| Carpeta | Formato del nombre | Ejemplo |
|---|---|---|
| `menu/productos/` | `{productoId}.{ext}` | `prod-123.jpg` |
| `comprobantes/` | `{pagoId}-{timestamp}.{ext}` | `pago-456-20250115.jpg` |
| `evidencias/` | `{pedidoId}-entrega.{ext}` | `pedido-789-entrega.jpg` |
| `reportes/` | `cierre-caja-{YYYY-MM-DD}.pdf` | `cierre-caja-2025-01-15.pdf` |
| `documentos/` | `{documentoId}-{tipo}.{ext}` | `doc-012-reporte.pdf` |

---

## 7. Integraciones con Servicios Externos

### 7.1 n8n — Automatización

**Descripción:**
n8n es una plataforma de automatización de flujos de trabajo (workflow automation) de código abierto. En este sistema cumple el rol de orquestador del proceso nocturno de cierre de caja. No forma parte de ningún microservicio: se despliega como un contenedor Docker independiente y se comunica con MS2 via HTTP.

**Rol en el sistema:**
Ejecutar automáticamente el flujo de cierre de caja diario a una hora programada, sin intervención humana.

**Flujo implementado en n8n:**

| Paso | Nodo n8n | Acción |
|---|---|---|
| 1 | Cron Trigger | Se activa a la hora configurada (ej: 11:59 PM) todos los días |
| 2 | HTTP Request | Llama a `POST /internal/caja/cierre` en MS2 con header `X-N8N-Secret` |
| 3 | Resend Node | Envía correo al Administrador con el PDF adjunto via Resend API |
| 4 | DynamoDB Node | Registra el evento de ejecución del cierre en DynamoDB |

**Despliegue:**
n8n se despliega como contenedor Docker en el mismo proveedor que MS0 y MS1 (Proveedor A). El workflow se exporta como archivo JSON y se versiona en el repositorio del proyecto bajo el directorio `/n8n/workflows/`.

**Variables de entorno de n8n:**

| Variable | Descripción |
|---|---|
| `N8N_SECRET` | Token compartido con MS2 para autenticar llamadas al endpoint interno |
| `RESEND_API_KEY` | API key de Resend para envío de correos |
| `ADMIN_EMAIL` | Correo del Administrador que recibe el reporte nocturno |
| `MS2_INTERNAL_URL` | URL interna de MS2 para el endpoint de cierre de caja |

---

### 7.2 Expo Notifications — Notificaciones Push

**Descripción:**
Expo Notifications es el servicio de notificaciones push integrado en el Expo SDK. Actúa como capa de abstracción sobre Firebase Cloud Messaging (Android) y APNs (iOS), simplificando el envío desde el backend sin necesidad de configurar FCM ni APNs directamente.

**Rol en el sistema:**
MS2 usa el servicio Expo Push Notifications API para enviar notificaciones push a los dispositivos móviles de Clientes y Repartidores.

**Flujo de notificaciones:**

1. La app móvil (Expo) solicita permiso de notificaciones al dispositivo.
2. Expo genera un `ExpoPushToken` único para ese dispositivo e instalación.
3. La app envía el token a MS2 via `POST /api/v1/delivery/notificaciones/token`.
4. MS2 persiste el token asociado al `userId` en PostgreSQL.
5. Cuando ocurre un evento relevante, MS2 llama a la Expo Push API con el token del destinatario y el mensaje.
6. Expo entrega la notificación al dispositivo via FCM (Android) o APNs (iOS).

**Eventos que disparan notificaciones push:**

| Evento | Destinatario | Mensaje |
|---|---|---|
| Pedido delivery creado y asignado | Repartidor | "Tienes un nuevo pedido asignado" |
| Pedido en preparación | Cliente | "Tu pedido está siendo preparado" |
| Pedido en camino | Cliente | "Tu pedido está en camino" |
| Pedido entregado | Cliente | "Tu pedido ha sido entregado" |
| Pedido cancelado | Cliente | "Tu pedido fue cancelado" |
| Incidencia crítica | Administrador | "Incidencia reportada en pedido #{id}" |

**Integración en MS2:**
- Librería: `expo-server-sdk` (Node.js).
- `notificaciones.service.ts` gestiona el envío, reintento (hasta 3 veces) y limpieza de tokens inválidos.
- Los tokens inválidos retornados por Expo se eliminan automáticamente de PostgreSQL.

---

### 7.3 Resend — Envío de Correos

**Descripción:**
Resend es un servicio de envío de correos transaccionales con tier gratuito permanente de 3,000 correos/mes y 100/día. Se integra de forma nativa con n8n mediante su nodo oficial.

**Rol en el sistema:**
Envío del reporte PDF de cierre de caja nocturno al Administrador, orquestado por n8n.

**Datos del correo enviado:**

| Campo | Valor |
|---|---|
| Destinatario | Correo del Administrador (configurable en n8n) |
| Asunto | `Reporte de Cierre de Caja — {fecha}` |
| Cuerpo | Resumen del día: total de ventas, pedidos presenciales y delivery |
| Adjunto | URL firmada del PDF generado en S3 |

**Integración:**
La integración se realiza exclusivamente desde n8n usando el nodo oficial de Resend. MS2 no llama directamente a Resend; solo genera el reporte y retorna la URL a n8n, que se encarga del envío.

**Configuración requerida:**
- Cuenta en [resend.com](https://resend.com) con dominio verificado o usando el dominio de prueba de Resend.
- `RESEND_API_KEY` configurado en las variables de entorno de n8n.

---

### 7.4 Mapbox — GPS y Rutas

**Descripción:**
Mapbox es una plataforma de mapas y navegación con un tier gratuito generoso (50,000 cargas de mapa/mes). Se usa exclusivamente en la app móvil del Repartidor para visualizar la ruta hacia la dirección de entrega.

**Rol en el sistema:**
Mostrar al Repartidor el mapa con la ruta desde su ubicación actual hasta la dirección de entrega del pedido delivery.

**Integración en la app móvil:**
- Librería: `react-native-maps` con proveedor Mapbox o `@rnmapbox/maps` (librería oficial de Mapbox para React Native).
- Se usa únicamente en el módulo `repartidor/screens/EntregaScreen`.
- Al confirmar que inicia el trayecto, la app abre la ruta en el mapa con las coordenadas de entrega obtenidas del pedido.

**Datos usados:**

| Dato | Origen |
|---|---|
| Coordenadas de origen | GPS del dispositivo del Repartidor (`expo-location`) |
| Coordenadas de destino | Dirección de entrega del pedido (guardada en MS2/PostgreSQL) |

**Configuración requerida:**
- Cuenta en [mapbox.com](https://mapbox.com) y obtención del `MAPBOX_ACCESS_TOKEN`.
- Token configurado en las variables de entorno de la app móvil (`app.json` de Expo).

---

### 7.5 Speech-to-Text — Dictado de Pedidos

**Descripción:**
El módulo de dictado por voz permite al Cliente armar su carrito de compra dictando su pedido en lugar de navegar manualmente por el menú. La conversión de voz a texto se realiza en el dispositivo mediante las APIs nativas del sistema operativo.

**Rol en el sistema:**
Funcionalidad exclusiva de la app móvil del Cliente. Convierte el audio dictado en texto, lo procesa para identificar productos del menú y los agrega automáticamente al carrito.

**Tecnología usada:**
- `expo-av` para captura del audio desde el micrófono del dispositivo.
- `react-native-voice` para reconocimiento de voz usando las APIs nativas de Android (SpeechRecognizer) e iOS (SFSpeechRecognizer). El reconocimiento se ejecuta **on-device**, sin llamadas a APIs externas de pago.

**Flujo de dictado:**

1. El Cliente presiona el botón de micrófono en la pantalla del menú o carrito.
2. La app solicita permiso de micrófono al dispositivo (si aún no fue concedido).
3. `react-native-voice` inicia el reconocimiento de voz en tiempo real.
4. El usuario dicta su pedido (ej: "quiero un pollo a la brasa mediano y dos gaseosas").
5. El texto reconocido se muestra en pantalla para confirmación del usuario.
6. El hook `useVozPedido` parsea el texto, busca coincidencias con los nombres de productos del menú cargado en memoria (React Query cache) y construye los ítems del carrito.
7. Los productos identificados se agregan al carrito. Si un producto no se reconoce, se muestra al usuario para selección manual.

**Consideraciones:**
- El reconocimiento de voz es completamente offline (on-device), no requiere conexión a internet ni API key externa.
- La precisión depende del idioma configurado en el dispositivo. Se recomienda configurar el reconocedor en español latinoamericano (`es-BO` o `es-419`).
- El parsing de texto a productos del menú es fuzzy: busca coincidencias parciales en nombres de productos para tolerar variaciones en el dictado.

---

## 8. Modelo de Datos por Microservicio

### 8.1 MS1 - Spring Boot

#### 8.1.1 Motor de Base de Datos

| Almacenamiento | Motor | Uso |
|---|---|---|
| Principal | PostgreSQL | Datos transaccionales del restaurante: menú, pedidos, pagos, documentos. Usuarios y direcciones se gestionan en MS4. |
| Archivos | Amazon S3 | Binarios: imágenes de productos, comprobantes, recibos, documentos (solo metadatos en PostgreSQL) |
| Mensajería | Redis | Pub/Sub para eventos inter-servicios |

---

#### 8.1.2 Tablas principales y relaciones

**Esquema: `ms1`**

> **Nota:** Las tablas `usuarios` y `direcciones` se movieron a MS4. MS1 referencia usuarios por `usuario_id` (sin FK cruzada) cuando necesita asociar un cajero o cliente a un pedido o documento.

---

**`categorias`**
Categorías del menú del restaurante (ej: Pollos, Bebidas, Guarniciones).

Relaciones:
- Una categoría contiene múltiples productos → `productos`.

---

**`productos`**
Productos del menú del restaurante. Solo productos simples (sin combos ni variantes).

Relaciones:
- Pertenece a una categoría → `categorias.id`.
- Un producto puede aparecer en múltiples detalles de pedido → `detalle_pedidos`.
- Tiene una imagen almacenada en S3 (URL pública guardada en la tabla).

---

**`pedidos`**
Pedidos del restaurante. Unifica pedidos presenciales y delivery bajo un mismo dominio en MS1. Los pedidos delivery son creados en MS2 y sincronizados a MS1 via evento Redis `pedido.delivery.creado`.

Relaciones:
- Tiene un tipo: enum `PRESENCIAL | DELIVERY`.
- Tiene un estado diferenciado por tipo:
  - Presencial: `PENDIENTE | EN_PREPARACION | LISTO | ENTREGADO | CANCELADO`
  - Delivery: `PENDIENTE | CONFIRMADO | EN_PREPARACION | EN_CAMINO | ENTREGADO | CANCELADO`
- Guarda `cajero_id` (referencia sin FK cruzada al usuario cajero en MS4).
- Guarda `cliente_id` (referencia sin FK cruzada al usuario cliente en MS4, nullable para presencial sin cuenta).
- Tiene múltiples líneas de producto → `detalle_pedidos`.
- Tiene como máximo un pago → `pagos`.
- Tiene un tiempo estimado de preparación (recibido desde MS3 via Redis).
- Un pedido presencial tiene un número de ficha asignado.

---

**`detalle_pedidos`**
Líneas de producto dentro de un pedido. Snapshot de producto y precio al momento del pedido.

Relaciones:
- Pertenece a un pedido → `pedidos.id`.
- Referencia un producto → `productos.id`.
- El precio unitario se guarda al momento del pedido para preservar histórico (no referencia el precio actual).

---

**`pagos`**
Registro de pagos de pedidos. Gestiona método de pago, comprobante y resultado del análisis CNN de MS3.

Relaciones:
- Pertenece a un pedido → `pedidos.id` (relación 1:1).
- Tiene un método: enum `EFECTIVO | QR`.
- Tiene un estado: enum `PENDIENTE | ACEPTADO | RECHAZADO | REVISION_MANUAL`.
- Tiene comprobante almacenado en S3 (s3_key y URL guardados en la tabla).
- Al ser aceptado genera un recibo → `recibos`.

---

**`recibos`**
Recibos generados al confirmar un pago. Incluyen hash SHA-256 y registro blockchain.

Relaciones:
- Pertenece a un pago → `pagos.id` (relación 1:1).
- Pertenece a un pedido → `pedidos.id`.
- Tiene hash SHA-256 del contenido del recibo.
- Tiene `tx_hash` de la transacción blockchain registrada via web3j.
- PDF del recibo almacenado en S3 (s3_key guardado en la tabla).

---

**`documentos`**
Documentos administrativos en S3 con registro de integridad blockchain. Incluye reportes de cierre de caja y documentos registrados por el Administrador.

Relaciones:
- Guarda `registrado_por_id` (referencia sin FK cruzada al usuario Administrador en MS4).
- Tiene un tipo: enum `RECIBO_PAGO | CIERRE_CAJA | REPORTE_ADMINISTRATIVO`.
- Tiene hash SHA-256 del documento.
- Tiene `tx_hash` de la transacción blockchain.
- Archivo almacenado en S3 (s3_key y URL guardados en la tabla).

---

**`configuracion`**
Parámetros de configuración general del restaurante. Tabla clave-valor para configuración dinámica.

Relaciones:
- No tiene relaciones con otras tablas.
- Parámetros: nombre del restaurante, RUC, dirección, teléfono, horario, tiempo máximo de preparación, umbral de alerta de cocina.

---

**Diagrama de relaciones MS1:**

```
categorias ──── (1:N) productos
                    │
                    └── (1:N) detalle_pedidos ──── (N:1) pedidos
                                                        │
                                                  (1:1) pagos
                                                        │
                                                  (1:1) recibos

pedidos ──── cajero_id (ref. MS4.usuarios, sin FK cruzada)
        └─── cliente_id (ref. MS4.usuarios, sin FK cruzada, nullable)

documentos ── registrado_por_id (ref. MS4.usuarios, sin FK cruzada)

configuracion (tabla independiente)
```

---

### 8.2 MS2 - NestJS

#### 8.2.1 Motor de Base de Datos

| Almacenamiento | Motor | Uso |
|---|---|---|
| Principal | PostgreSQL | Pedidos delivery, asignaciones, incidencias, tokens de dispositivo |
| Eventos y trazabilidad | Amazon DynamoDB | Eventos de estado del pedido y puntos clave GPS del repartidor |
| Archivos | Amazon S3 | Fotografías de evidencia de entrega y reportes PDF de cierre de caja |
| Mensajería | Redis | Pub/Sub para eventos inter-servicios |

---

#### 8.2.2 Tablas principales y relaciones

**Esquema PostgreSQL: `ms2`**

---

**`pedidos_delivery`**
Pedidos de tipo delivery creados por Clientes desde la app móvil. Es la tabla central del dominio de MS2.

Relaciones:
- Pertenece a un cliente (referencia a `usuarios.id` de MS1, sin FK cruzada — se guarda solo el `cliente_id`).
- Tiene un estado: enum `PENDIENTE | CONFIRMADO | EN_PREPARACION | EN_CAMINO | ENTREGADO | CANCELADO`.
- Tiene una dirección de entrega con coordenadas (referencia a `direcciones` de MS1 via `direccion_id`).
- Tiene múltiples líneas de producto → `detalle_pedidos_delivery`.
- Puede tener una asignación de repartidor → `asignaciones`.
- Puede tener incidencias → `incidencias`.
- Tiene campo para tiempo estimado de preparación (recibido desde MS3 via Redis).
- Tiene campo para URL de evidencia de entrega en S3 (s3_key y URL).

---

**`detalle_pedidos_delivery`**
Líneas de producto del pedido delivery. Snapshot de producto y precio al momento del pedido.

Relaciones:
- Pertenece a un pedido delivery → `pedidos_delivery.id`.
- Guarda el `producto_id`, nombre y precio del producto al momento del pedido (sin FK cruzada a MS1).

---

**`asignaciones`**
Registro de la asignación de un repartidor a un pedido delivery. Incluye historial de reasignaciones.

Relaciones:
- Pertenece a un pedido delivery → `pedidos_delivery.id`.
- Referencia al repartidor asignado (guarda `repartidor_id` de MS1, sin FK cruzada).
- Tiene un estado: enum `ASIGNADO | EN_ENTREGA | COMPLETADO | RECHAZADO | REASIGNADO`.
- Un pedido puede tener múltiples registros de asignación si hay reasignaciones por rechazo.

---

**`repartidores_disponibilidad`**
Estado de disponibilidad en tiempo real de cada repartidor. Se actualiza constantemente durante la operación.

Relaciones:
- Referencia al repartidor (guarda `repartidor_id` de MS1, sin FK cruzada).
- Un registro por repartidor (relación 1:1 con el repartidor).
- Tiene estado: enum `DISPONIBLE | EN_ENTREGA | INACTIVO`.
- Tiene coordenadas actuales del repartidor (actualizadas en puntos clave GPS).

---

**`incidencias`**
Registro de rechazos e incidencias reportadas por el Repartidor durante la entrega.

Relaciones:
- Pertenece a un pedido delivery → `pedidos_delivery.id`.
- Referencia al repartidor que reportó (guarda `repartidor_id`).
- Tiene un tipo: enum `RECHAZO_PEDIDO | DIRECCION_INCORRECTA | CLIENTE_NO_DISPONIBLE | OTRO`.

---

**`dispositivos_tokens`**
Tokens de dispositivo Expo Push para envío de notificaciones push a Clientes y Repartidores.

Relaciones:
- Referencia al usuario propietario del dispositivo (guarda `user_id` y `rol`).
- Un usuario puede tener múltiples tokens si usa varios dispositivos.
- Los tokens inválidos se desactivan automáticamente (campo `activo`).

---

**Tablas DynamoDB de MS2:**

**`EventosDelivery`**
Registro cronológico de todos los cambios de estado de pedidos delivery para trazabilidad completa.

| Clave | Tipo | Descripción |
|---|---|---|
| PK | `pedidoId` (String) | Identificador del pedido delivery |
| SK | `timestamp` (String) | Timestamp ISO del evento |
| Atributos | `estado`, `repartidorId`, `actorId`, `metadata` | Datos del evento |

---

**`PuntosClaveGPS`**
Registro de los 4 puntos clave de ubicación GPS del Repartidor durante el trayecto de entrega.

| Clave | Tipo | Descripción |
|---|---|---|
| PK | `pedidoId` (String) | Identificador del pedido delivery |
| SK | `evento#timestamp` (String) | Tipo de evento + timestamp para ordenamiento |
| Atributos | `repartidorId`, `latitud`, `longitud`, `evento` | Datos del punto GPS |

Eventos registrados: `ACEPTADO`, `EN_CAMINO`, `LLEGADA`, `ENTREGADO`.

---

**`AuditoriaAccesos`** *(gestionada por MS0)*
Registro de auditoría de todos los accesos al sistema. Escrita por MS0.

| Clave | Tipo | Descripción |
|---|---|---|
| PK | `userId` (String) | Identificador del usuario |
| SK | `timestamp` (String) | Timestamp ISO del acceso |
| Atributos | `rol`, `method`, `path`, `statusCode`, `ip` | Datos del request |

---

**Diagrama de relaciones MS2 (PostgreSQL):**

```
pedidos_delivery
   │
   ├── (1:N) detalle_pedidos_delivery
   │
   ├── (1:N) asignaciones ──── repartidores_disponibilidad
   │
   └── (1:N) incidencias

dispositivos_tokens  (independiente, por usuario)
```

---

### 8.3 MS3 - FastAPI

#### 8.3.1 Motor de Base de Datos

| Almacenamiento | Motor | Uso |
|---|---|---|
| Principal | PostgreSQL | Resultados de modelos ML, segmentos, indicadores BI precalculados |
| Mensajería | Redis | Pub/Sub para consumir eventos y publicar resultados de inferencia |

---

#### 8.3.2 Tablas principales y relaciones

**Esquema PostgreSQL: `ms3`**

---

**`resultados_comprobantes`**
Resultados del análisis CNN de cada comprobante de pago. Persistidos para auditoría y consulta posterior.

Relaciones:
- Referencia al pago analizado (guarda `pago_id` de MS1, sin FK cruzada).
- Tiene un resultado: enum `ACEPTADO | RECHAZADO | REVISION_MANUAL`.
- Tiene el score de confianza del modelo (0.0 - 1.0).
- No tiene relaciones con otras tablas de MS3.

---

**`predicciones_tiempo`**
Predicciones del tiempo de preparación generadas por el modelo Random Forest para cada pedido.

Relaciones:
- Referencia al pedido (guarda `pedido_id`, sin FK cruzada a MS1 ni MS2).
- Tiene el tiempo predicho en minutos.
- Guarda el vector de features usado para la predicción (JSON) para trazabilidad del modelo.
- No tiene relaciones con otras tablas de MS3.

---

**`ejecuciones_segmentacion`**
Registro de cada ejecución del algoritmo K-Means. Permite mantener histórico de segmentaciones.

Relaciones:
- Una ejecución genera múltiples segmentos de clientes → `segmentos_clientes`.
- Guarda el K óptimo determinado por el método del codo.
- Guarda el total de clientes procesados y la fecha de ejecución.

---

**`segmentos_clientes`**
Asignación de cada cliente a un segmento resultante de la última ejecución de K-Means.

Relaciones:
- Pertenece a una ejecución de segmentación → `ejecuciones_segmentacion.id`.
- Referencia al cliente (guarda `cliente_id` de MS1, sin FK cruzada).
- Tiene el número de segmento y su etiqueta descriptiva (ej: "Cliente frecuente alto valor").

---

**`indicadores_bi`**
Indicadores de inteligencia de negocios precalculados para el dashboard del Administrador. Se actualizan periódicamente cada hora via APScheduler.

Relaciones:
- No tiene relaciones con otras tablas.
- Tiene un tipo: enum `VENTAS_PERIODO | PRODUCTOS_TOP | HORARIOS_PICO | ZONAS_DELIVERY | CANALES_COMPARATIVA`.
- Tiene el período al que corresponde (día, semana, mes).
- El valor del indicador se almacena como JSON para flexibilidad de estructura por tipo.
- Tiene la fecha y hora del último cálculo.

---

**Diagrama de relaciones MS3 (PostgreSQL):**

```
ejecuciones_segmentacion ──── (1:N) segmentos_clientes

resultados_comprobantes   (independiente, por pago_id)
predicciones_tiempo       (independiente, por pedido_id)
indicadores_bi            (independiente, por tipo y período)
```

---

**Resumen general del modelo de datos por motor:**

| Motor | Microservicio | Tablas / Colecciones |
|---|---|---|
| PostgreSQL (MS1) | MS1 Spring Boot | `usuarios`, `direcciones`, `categorias`, `productos`, `pedidos`, `detalle_pedidos`, `pagos`, `recibos`, `documentos`, `configuracion` |
| PostgreSQL (MS2) | MS2 NestJS | `pedidos_delivery`, `detalle_pedidos_delivery`, `asignaciones`, `repartidores_disponibilidad`, `incidencias`, `dispositivos_tokens` |
| PostgreSQL (MS3) | MS3 FastAPI | `resultados_comprobantes`, `predicciones_tiempo`, `ejecuciones_segmentacion`, `segmentos_clientes`, `indicadores_bi` |
| DynamoDB | MS0 + MS2 | `EventosDelivery`, `PuntosClaveGPS`, `AuditoriaAccesos` |

---

### 8.4 MS4 - Spring Boot (Usuarios y Autenticación)

#### 8.4.1 Motor de Base de Datos

| Almacenamiento | Motor | Uso |
|---|---|---|
| Principal | PostgreSQL | Usuarios, roles y relaciones usuario-rol. Esquema completamente separado del resto. |
| Certificados | Classpath (`certs/`) | `private.pem` para firmar JWT y `public.pem` para verificación distribuida. |

---

#### 8.4.2 Tablas principales y relaciones

**Esquema: `ms4`**

---

**`usuarios`**
Almacena todos los usuarios del sistema independientemente de su rol: Administrador, Cajero, Cocina, Repartidor y Cliente. Es la tabla central de identidad del sistema.

Relaciones:
- Un usuario tiene múltiples roles → `usuario_roles`.
- Un usuario de rol CLIENTE puede tener múltiples direcciones → `direcciones`.
- Los demás microservicios (MS1, MS2) referencian usuarios por `usuario_id` sin FK cruzada.

---

**`roles`**
Catálogo de roles del sistema.

Relaciones:
- Un rol puede estar asignado a múltiples usuarios → `usuario_roles`.
- Valores: `ADMINISTRADOR`, `CAJERO`, `COCINA`, `REPARTIDOR`, `CLIENTE`.

---

**`usuario_roles`**
Tabla de relación muchos a muchos entre usuarios y roles.

Relaciones:
- Pertenece a un usuario → `usuarios.id`.
- Pertenece a un rol → `roles.id`.

---

**`direcciones`**
Direcciones de entrega registradas por los Clientes en su perfil de la app móvil.

Relaciones:
- Pertenece a un usuario de rol CLIENTE → `usuarios.id`.
- Una dirección puede estar marcada como predeterminada (booleano).
- MS2 referencia `direccion_id` para los pedidos delivery (sin FK cruzada entre microservicios).

---

**Diagrama de relaciones MS4:**

```
usuarios ──── (N:M via usuario_roles) ──── roles

usuarios ──── (1:N) direcciones
  (rol CLIENTE)
```

---

**Resumen general del modelo de datos actualizado:**

| Motor | Microservicio | Tablas / Colecciones |
|---|---|---|
| PostgreSQL (MS1) | MS1 Spring Boot | `categorias`, `productos`, `pedidos`, `detalle_pedidos`, `pagos`, `recibos`, `documentos`, `configuracion` |
| PostgreSQL (MS2) | MS2 NestJS | `pedidos_delivery`, `detalle_pedidos_delivery`, `asignaciones`, `repartidores_disponibilidad`, `incidencias`, `dispositivos_tokens` |
| PostgreSQL (MS3) | MS3 FastAPI | `resultados_comprobantes`, `predicciones_tiempo`, `ejecuciones_segmentacion`, `segmentos_clientes`, `indicadores_bi` |
| PostgreSQL (MS4) | MS4 Spring Boot | `usuarios`, `roles`, `usuario_roles`, `direcciones` |
| DynamoDB | MS0 + MS2 | `EventosDelivery`, `PuntosClaveGPS`, `AuditoriaAccesos` |

---

## 9. Infraestructura y Despliegue

### 9.1 Containerización con Docker

#### 9.1.1 Estrategia de Dockerización por servicio

#### 9.1.2 Docker Compose (entorno local)

### 9.2 Proveedores de Despliegue por Servicio

### 9.3 Gestión de Variables de Entorno

#### 9.3.1 Estándar de nomenclatura de variables

#### 9.3.2 Variables globales del sistema

---

## 10. Seguridad

### 10.1 Estrategia de Autenticación y Autorización

### 10.2 Manejo de Tokens (JWT)

### 10.3 Consideraciones por Microservicio

---

## 11. Convenciones y Estándares de Código

### 11.1 Nomenclatura General

### 11.2 Estándares por Tecnología

#### 11.2.1 Spring Boot

#### 11.2.2 NestJS

#### 11.2.3 FastAPI

#### 11.2.4 Angular

#### 11.2.5 React Native

#### 11.2.6 Solidity

### 11.3 Estándares GraphQL

### 11.4 Estándares de Git (ramas, commits, PRs)

---

## 12. Glosario Técnico