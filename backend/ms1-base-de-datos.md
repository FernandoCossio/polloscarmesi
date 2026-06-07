## 8. Modelo de Datos por Microservicio

### 8.1 MS1 - Spring Boot

#### 8.1.1 Motor de Base de Datos

| Almacenamiento | Motor | Uso |
|---|---|---|
| Principal | PostgreSQL | Datos transaccionales: usuarios, menú, pedidos, pagos, documentos |
| Archivos | Amazon S3 | Binarios: imágenes, comprobantes, recibos, documentos (solo metadatos en PostgreSQL) |
| Mensajería | Redis | Pub/Sub para eventos inter-servicios |

---

#### 8.1.2 Tablas principales y relaciones

**Esquema: `ms1`**

---

**`usuarios`**
Almacena todos los usuarios del sistema independientemente de su rol: Administrador, Cajero, Cocina, Repartidor y Cliente.

Relaciones:
- Un usuario tiene un rol (`rol`: enum `ADMINISTRADOR | CAJERO | COCINA | REPARTIDOR | CLIENTE`).
- Un usuario de rol CLIENTE puede tener múltiples direcciones → `direcciones`.
- Un usuario de rol CAJERO puede registrar múltiples pedidos presenciales → `pedidos`.
- Un usuario puede registrar múltiples documentos → `documentos`.

---

**`direcciones`**
Direcciones de entrega guardadas por los Clientes en su perfil de la app móvil.

Relaciones:
- Pertenece a un usuario (rol CLIENTE) → `usuarios.id`.
- Una dirección puede estar marcada como predeterminada (booleano).
- Una dirección puede estar referenciada por múltiples pedidos delivery en MS2 (referencia por `direccion_id` sin FK cruzada entre microservicios).

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
Pedidos del restaurante. Unifica pedidos presenciales y delivery bajo un mismo dominio en MS1. Los pedidos delivery son creados originalmente en MS2 y sincronizados a MS1 via GraphQL.

Relaciones:
- Tiene un tipo: enum `PRESENCIAL | DELIVERY`.
- Tiene un estado: enum diferenciado por tipo:
  - Presencial: `PENDIENTE | EN_PREPARACION | LISTO | ENTREGADO | CANCELADO`
  - Delivery: `PENDIENTE | CONFIRMADO | EN_PREPARACION | EN_CAMINO | ENTREGADO | CANCELADO`
- Un pedido presencial es registrado por un Cajero → `usuarios.id` (cajero_id).
- Un pedido (ambos tipos) puede tener un cliente asociado → `usuarios.id` (cliente_id, nullable para presencial sin cuenta).
- Un pedido tiene múltiples líneas de producto → `detalle_pedidos`.
- Un pedido tiene como máximo un pago → `pagos`.
- Un pedido puede tener un tiempo estimado de preparación asignado (recibido desde MS3 via Redis).
- Un pedido presencial tiene un número de ficha asignado.

---

**`detalle_pedidos`**
Líneas de producto dentro de un pedido. Registra el producto, cantidad y precio al momento del pedido.

Relaciones:
- Pertenece a un pedido → `pedidos.id`.
- Referencia un producto → `productos.id`.
- El precio unitario se guarda al momento del pedido (no referencia el precio actual del producto para preservar histórico).

---

**`pagos`**
Registro de pagos de pedidos. Gestiona el método de pago, comprobante y resultado del análisis CNN.

Relaciones:
- Pertenece a un pedido → `pedidos.id` (relación 1:1).
- Tiene un método: enum `EFECTIVO | QR`.
- Tiene un estado: enum `PENDIENTE | ACEPTADO | RECHAZADO | REVISION_MANUAL`.
- Tiene un comprobante almacenado en S3 (s3_key y URL guardados en la tabla).
- Al ser aceptado genera un recibo → `recibos`.

---

**`recibos`**
Recibos generados al confirmar un pago. Contienen el detalle del pedido y el registro blockchain del hash.

Relaciones:
- Pertenece a un pago → `pagos.id` (relación 1:1).
- Pertenece a un pedido → `pedidos.id`.
- Tiene un hash SHA-256 calculado del contenido del recibo.
- Tiene el `tx_hash` de la transacción blockchain donde se registró el hash.
- El PDF del recibo se almacena en S3 (s3_key guardado en la tabla).

---

**`documentos`**
Documentos administrativos almacenados en S3 con registro de integridad en blockchain. Incluye reportes de cierre de caja y documentos registrados manualmente por el Administrador.

Relaciones:
- Registrado por un usuario → `usuarios.id` (registrado_por).
- Tiene un tipo: enum `RECIBO_PAGO | CIERRE_CAJA | REPORTE_ADMINISTRATIVO`.
- Tiene un hash SHA-256 del contenido del documento.
- Tiene el `tx_hash` de la transacción blockchain.
- El archivo se almacena en S3 (s3_key y URL guardados en la tabla).

---

**`configuracion`**
Parámetros de configuración general del restaurante. Tabla clave-valor para configuración dinámica sin necesidad de redespliegue.

Relaciones:
- No tiene relaciones con otras tablas.
- Parámetros almacenados: nombre del restaurante, RUC, dirección, teléfono, horario de atención, tiempo máximo de preparación, umbral de alerta de cocina.

---

**Diagrama de relaciones MS1:**

```
usuarios ──────────────────────────────┐
   │                                   │
   ├── (1:N) direcciones               │
   │                                   │
   ├── (1:N) pedidos (como cajero)     │
   │                                   │
   └── (1:N) documentos               │
                                       │
categorias ──── (1:N) productos        │
                    │                  │
                    └── (1:N) detalle_pedidos ──── (N:1) pedidos
                                                        │
                                               (1:1) pagos
                                                    │
                                           (1:1) recibos
```

---