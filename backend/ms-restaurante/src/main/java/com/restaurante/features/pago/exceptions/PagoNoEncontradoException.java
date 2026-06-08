package com.restaurante.features.pago.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class PagoNoEncontradoException extends AppException {
    public PagoNoEncontradoException() {
        super(ErrorCode.PAGO_NO_ENCONTRADO);
    }
}
