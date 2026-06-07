package com.restaurante.features.categoria.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class CategoriaNoEncontradaException extends AppException {
    public CategoriaNoEncontradaException() {
        super(ErrorCode.CATEGORIA_NO_ENCONTRADA);
    }
}
