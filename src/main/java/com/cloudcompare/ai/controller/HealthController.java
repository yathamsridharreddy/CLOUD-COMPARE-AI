package com.cloudcompare.ai.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Process liveness only: no database, authentication, or external service calls.
 * Render must poll this endpoint, not the rate-limited legacy /api/test route.
 */
@RestController
public class HealthController {

    @GetMapping(value = "/health", produces = MediaType.TEXT_PLAIN_VALUE)
    public String health() {
        return "OK";
    }
}
