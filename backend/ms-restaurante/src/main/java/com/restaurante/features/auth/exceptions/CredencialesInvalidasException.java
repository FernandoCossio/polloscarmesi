package com.restaurante.features.auth.exceptions;

import com.restaurante.common.errors.AppException;
import com.restaurante.common.errors.ErrorCode;

public class CredencialesInvalidasException extends AppException {
	public CredencialesInvalidasException() {
		super(ErrorCode.CREDENCIALES_INVALIDAS);
	}
}
