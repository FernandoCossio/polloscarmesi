package com.restaurante.features.rol.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class RolNoEncontradoException extends AppException {
	public RolNoEncontradoException() {
		super(ErrorCode.ROL_NO_ENCONTRADO);
	}
}
