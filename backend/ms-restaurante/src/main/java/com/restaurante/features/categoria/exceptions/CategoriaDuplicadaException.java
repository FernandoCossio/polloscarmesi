package com.restaurante.features.categoria.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class CategoriaDuplicadaException extends AppException {
    public CategoriaDuplicadaException() {
        super(ErrorCode.CATEGORIA_DUPLICADA);
    }
}
