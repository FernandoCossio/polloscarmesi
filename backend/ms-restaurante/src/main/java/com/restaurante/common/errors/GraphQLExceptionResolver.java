package com.restaurante.common.errors;

import com.restaurante.common.response.FieldError;
import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.execution.DataFetcherExceptionResolver;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindException;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class GraphQLExceptionResolver implements DataFetcherExceptionResolver {

    private static final Logger log = LoggerFactory.getLogger(GraphQLExceptionResolver.class);

    @Override
    public Mono<List<GraphQLError>> resolveException(Throwable exception, DataFetchingEnvironment environment) {
        if (exception instanceof AppException appEx) {
            return Mono.just(handleAppException(appEx, environment));
        } else if (exception instanceof AccessDeniedException) {
            return Mono.just(handleAccessDeniedException(environment));
        } else if (exception instanceof ConstraintViolationException cve) {
            return Mono.just(handleConstraintViolationException(cve, environment));
        } else if (exception instanceof BindException be) {
            return Mono.just(handleBindException(be, environment));
        } else {
            return Mono.just(handleGenericException(exception, environment));
        }
    }

    private List<GraphQLError> handleAppException(AppException ex, DataFetchingEnvironment env) {
        ErrorCode errorCode = ex.getErrorCode();
        Map<String, Object> extensions = new LinkedHashMap<>();
        extensions.put("code", errorCode.getCode());

        return List.of(GraphqlErrorBuilder.newError(env)
            .errorType(ErrorType.BAD_REQUEST)
            .message(errorCode.getDefaultMessage())
            .extensions(extensions)
            .build());
    }

    private List<GraphQLError> handleAccessDeniedException(DataFetchingEnvironment env) {
        ErrorCode errorCode = ErrorCode.ACCESO_DENEGADO;
        Map<String, Object> extensions = new LinkedHashMap<>();
        extensions.put("code", errorCode.getCode());

        return List.of(GraphqlErrorBuilder.newError(env)
            .errorType(ErrorType.FORBIDDEN)
            .message(errorCode.getDefaultMessage())
            .extensions(extensions)
            .build());
    }

    private List<GraphQLError> handleConstraintViolationException(ConstraintViolationException ex, DataFetchingEnvironment env) {
        List<FieldError> fieldErrors = ex.getConstraintViolations().stream()
            .map(this::toFieldError)
            .collect(Collectors.toList());

        Map<String, Object> extensions = new LinkedHashMap<>();
        extensions.put("code", ErrorCode.VALIDACION_CAMPO.getCode());
        extensions.put("validationErrors", fieldErrors.stream()
            .map(fe -> Map.of(
                "campo", fe.campo(),
                "codigo", fe.codigo(),
                "mensaje", fe.mensaje()
            ))
            .collect(Collectors.toList()));

        return List.of(GraphqlErrorBuilder.newError(env)
            .errorType(ErrorType.BAD_REQUEST)
            .message(ErrorCode.VALIDACION_CAMPO.getDefaultMessage())
            .extensions(extensions)
            .build());
    }



    private List<GraphQLError> handleBindException(BindException ex, DataFetchingEnvironment env) {
        List<FieldError> fieldErrors = ex.getFieldErrors().stream()
            .map(fieldError -> new FieldError(
                fieldError.getField(),
                ErrorCode.VALIDACION_CAMPO.getCode(),
                fieldError.getDefaultMessage()
            ))
            .collect(Collectors.toList());

        Map<String, Object> extensions = new LinkedHashMap<>();
        extensions.put("code", ErrorCode.VALIDACION_CAMPO.getCode());
        extensions.put("validationErrors", fieldErrors.stream()
            .map(fe -> Map.of(
                "campo", fe.campo(),
                "codigo", fe.codigo(),
                "mensaje", fe.mensaje()
            ))
            .collect(Collectors.toList()));

        return List.of(GraphqlErrorBuilder.newError(env)
            .errorType(ErrorType.BAD_REQUEST)
            .message(ErrorCode.VALIDACION_CAMPO.getDefaultMessage())
            .extensions(extensions)
            .build());
    }

    private List<GraphQLError> handleGenericException(Throwable ex, DataFetchingEnvironment env) {
        String traceId = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        log.error("Error no manejado [traceId={}]", traceId, ex);

        ErrorCode errorCode = ErrorCode.ERROR_INTERNO;
        Map<String, Object> extensions = new LinkedHashMap<>();
        extensions.put("code", errorCode.getCode());
        extensions.put("traceId", traceId);

        return List.of(GraphqlErrorBuilder.newError(env)
            .errorType(ErrorType.INTERNAL_ERROR)
            .message(errorCode.getDefaultMessage())
            .extensions(extensions)
            .build());
    }

    private FieldError toFieldError(ConstraintViolation<?> violation) {
        String propertyPath = violation.getPropertyPath() != null ? violation.getPropertyPath().toString() : "";
        String campo = extractLastPathSegment(propertyPath);
        return new FieldError(
            campo,
            ErrorCode.VALIDACION_CAMPO.getCode(),
            violation.getMessage()
        );
    }

    private static String extractLastPathSegment(String path) {
        int idx = path.lastIndexOf('.');
        if (idx >= 0 && idx + 1 < path.length()) {
            return path.substring(idx + 1);
        }
        return path;
    }
}
