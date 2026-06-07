package com.auth.features.usuario.exceptions;

import com.auth.common.errors.AppException;
import com.auth.common.errors.ErrorCode;

public class UsuarioDuplicadoException extends AppException {
	public UsuarioDuplicadoException() {
		super(ErrorCode.USUARIO_DUPLICADO);
	}
}
