package com.restaurante.common.errors;

import org.springframework.http.HttpStatus;

/**
 * Catálogo centralizado de errores de negocio.
 *
 * Convención de códigos: [PREFIJO][CATEGORÍA][SECUENCIA]
 *
 * PREFIJOS por dominio:
 *   AUT → Autenticación de sesión (login, refresh, credenciales)
 *   TKN → Tokens de verificación de cuenta (activación, reset de password)
 *   USR → Usuarios
 *   ROL → Roles
 *   CAT → Categorías
 *   EMP → Empleados
 *   INV → Inventario
 *   VAL → Validación de campos
 *   SEC → Seguridad (autenticación/autorización a nivel de acceso)
 *   SYS → Sistema / errores inesperados
 *
 * CATEGORÍA numérica:
 *   1xx → Not Found
 *   2xx → Conflict / estado inválido (duplicados, reglas de negocio)
 *   3xx → Validación de entrada
 *   4xx → No autenticado / credenciales inválidas
 *   5xx → Acceso denegado
 *   9xx → Error interno del servidor
 */
public enum ErrorCode {

    // -------------------------------------------------------------------------
    // AUT — Autenticación de sesión
    // -------------------------------------------------------------------------
    CREDENCIALES_INVALIDAS("AUT401", HttpStatus.UNAUTHORIZED, "Credenciales inválidas"),
    // -------------------------------------------------------------------------
    // TKN — Tokens de verificación de cuenta (activación, reset de password)
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // USR — Usuarios
    // -------------------------------------------------------------------------
    USUARIO_NO_ENCONTRADO("USR101", HttpStatus.NOT_FOUND, "Usuario no encontrado"),
    USUARIO_DUPLICADO("USR201", HttpStatus.CONFLICT, "Username o email ya existe"),

    // -------------------------------------------------------------------------
    // ROL — Roles
    // -------------------------------------------------------------------------
    ROL_NO_ENCONTRADO("ROL101", HttpStatus.NOT_FOUND, "Rol no encontrado"),
    
    // -------------------------------------------------------------------------
    // CAT — Categorías
    // -------------------------------------------------------------------------
    CATEGORIA_NO_ENCONTRADA("CAT101", HttpStatus.NOT_FOUND, "Categoría no encontrada"),
    CATEGORIA_DUPLICADA("CAT201", HttpStatus.CONFLICT, "El nombre de la categoría ya existe"),

    // -------------------------------------------------------------------------
    // PRD — Productos
    // -------------------------------------------------------------------------
    PRODUCTO_NO_ENCONTRADO("PRD101", HttpStatus.NOT_FOUND, "Producto no encontrado"),
    PRODUCTO_DUPLICADA("PRD201", HttpStatus.CONFLICT, "El nombre del producto ya existe"),

    // -------------------------------------------------------------------------
    // VAL — Validación de campos
    // -------------------------------------------------------------------------
    VALIDACION_CAMPO("VAL301", HttpStatus.BAD_REQUEST, "Error de validación en la solicitud"),

    // -------------------------------------------------------------------------
    // SEC — Seguridad
    // -------------------------------------------------------------------------
    NO_AUTENTICADO("SEC401", HttpStatus.UNAUTHORIZED, "No autenticado"),
    ACCESO_DENEGADO("SEC501", HttpStatus.FORBIDDEN, "Acceso denegado"),

    // -------------------------------------------------------------------------
    // SYS — Sistema
    // -------------------------------------------------------------------------
    ERROR_INTERNO("SYS901", HttpStatus.INTERNAL_SERVER_ERROR, "Ha ocurrido un error inesperado.");

    private final String code;
    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(String code, HttpStatus httpStatus, String defaultMessage) {
        this.code = code;
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }

    public String getCode() { return code; }
    public HttpStatus getHttpStatus() { return httpStatus; }
    public String getDefaultMessage() { return defaultMessage; }
}