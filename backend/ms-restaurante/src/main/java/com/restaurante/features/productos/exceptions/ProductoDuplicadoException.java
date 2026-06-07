package com.restaurante.features.productos.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class ProductoDuplicadoException extends AppException {
    public ProductoDuplicadoException() {
        super(ErrorCode.PRODUCTO_DUPLICADA);
    }
}
