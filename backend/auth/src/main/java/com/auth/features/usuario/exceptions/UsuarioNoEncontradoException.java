package com.auth.features.usuario.exceptions;

import com.auth.common.errors.AppException;
import com.auth.common.errors.ErrorCode;

public class UsuarioNoEncontradoException extends AppException {
	public UsuarioNoEncontradoException() {
		super(ErrorCode.USUARIO_NO_ENCONTRADO);
	}
}
