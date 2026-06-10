package com.auth.features.usuario.exceptions;

import com.auth.common.errors.AppException;
import com.auth.common.errors.ErrorCode;

public class UsuarioRolNoPermitidoException extends AppException {
    public UsuarioRolNoPermitidoException() {
        super(ErrorCode.USUARIO_ROL_NO_PERMITIDO);
    }
}
