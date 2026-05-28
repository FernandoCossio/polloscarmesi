package com.restaurante.features.usuario.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class UsuarioNoEncontradoException extends AppException {
	public UsuarioNoEncontradoException() {
		super(ErrorCode.USUARIO_NO_ENCONTRADO);
	}
}
