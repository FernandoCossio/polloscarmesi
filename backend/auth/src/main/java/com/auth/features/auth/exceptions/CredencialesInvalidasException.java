package com.auth.features.auth.exceptions;

import com.auth.common.errors.AppException;
import com.auth.common.errors.ErrorCode;

public class CredencialesInvalidasException extends AppException {
	public CredencialesInvalidasException() {
		super(ErrorCode.CREDENCIALES_INVALIDAS);
	}
}
