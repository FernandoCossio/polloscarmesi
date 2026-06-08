package com.restaurante.features.pedido.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class PedidoNoEncontradoException extends AppException {
    public PedidoNoEncontradoException() {
        super(ErrorCode.PEDIDO_NO_ENCONTRADO);
    }
}
