package com.restaurante.features.pedido.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class PedidoEstadoInvalidoException extends AppException {
    public PedidoEstadoInvalidoException() {
        super(ErrorCode.PEDIDO_ESTADO_INVALIDO);
    }

    public PedidoEstadoInvalidoException(String message) {
        super(ErrorCode.PEDIDO_ESTADO_INVALIDO, message);
    }
}
