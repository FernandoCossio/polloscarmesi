package com.restaurante.features.configuracion.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class ConfiguracionNoEncontradaException extends AppException {
    public ConfiguracionNoEncontradaException() {
        super(ErrorCode.CONFIGURACION_NO_ENCONTRADA);
    }
}
