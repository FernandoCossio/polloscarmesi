package com.auth.features.rol.exceptions;

import com.auth.common.errors.AppException;
import com.auth.common.errors.ErrorCode;

public class RolNoEncontradoException extends AppException {
	public RolNoEncontradoException() {
		super(ErrorCode.ROL_NO_ENCONTRADO);
	}
}
