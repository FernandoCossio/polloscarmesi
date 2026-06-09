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