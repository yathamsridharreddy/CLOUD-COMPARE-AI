package com.cloudcompare.ai.exception;

import org.springframework.http.HttpStatus;

/**
 * Custom exception for all business-logic validation failures.
 * Carries an HTTP status code so the GlobalExceptionHandler can respond correctly,
 * while keeping genuine RuntimeExceptions (NPE, etc.) mapped to 500.
 */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    public BusinessException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
