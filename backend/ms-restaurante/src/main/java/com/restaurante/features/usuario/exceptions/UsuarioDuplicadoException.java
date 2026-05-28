package com.restaurante.features.usuario.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class UsuarioDuplicadoException extends AppException {
	public UsuarioDuplicadoException() {
		super(ErrorCode.USUARIO_DUPLICADO);
	}
}
