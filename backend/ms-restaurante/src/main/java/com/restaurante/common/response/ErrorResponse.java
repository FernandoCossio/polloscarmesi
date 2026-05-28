package com.restaurante.common.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ErrorResponse(String status, String code, String message, @JsonProperty("trace_id") String traceId) {
}
