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