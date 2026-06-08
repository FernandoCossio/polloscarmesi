package com.restaurante.features.pago.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class PagoInvalidoException extends AppException {
    public PagoInvalidoException(String message) {
        super(ErrorCode.PAGO_INVALIDO, message);
    }
}
