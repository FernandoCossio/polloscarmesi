export interface ApiResponse<T> {
    status: string;
    data: T;
    message: string | null;
}

export interface ApiErrorResponse {
    status: string;
    code: string;
    message: string;
    trace_id: string | null;
}

export interface ApiValidationFieldError {
    campo: string;
    codigo: string;
    mensaje: string;
}

export interface ApiValidationErrorResponse {
    errores_validacion: ApiValidationFieldError[];
}
