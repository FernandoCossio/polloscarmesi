package com.restaurante.features.productos.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class ProductoNoEncontradoException extends AppException {
    public ProductoNoEncontradoException() {
        super(ErrorCode.PRODUCTO_NO_ENCONTRADO);
    }
}
