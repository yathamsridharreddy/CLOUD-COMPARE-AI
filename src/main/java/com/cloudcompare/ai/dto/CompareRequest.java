package com.cloudcompare.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Request body for POST /api/compare
 * Mirrors the express-validator rules from routes.js
 */
@Data
public class CompareRequest {

    @Pattern(regexp = "compute|storage|database|ai", message = "Invalid category")
    private String category;

    @Min(value = 1, message = "Hours must be between 1 and 8760")
    @Max(value = 8760, message = "Hours must be between 1 and 8760")
    private int hours = 730;

    private String region = "all";

    @Min(value = 0, message = "CPU must be between 0 and 1024")
    @Max(value = 1024, message = "CPU must be between 0 and 1024")
    private int cpu = 2;

    @Min(value = 0, message = "RAM must be between 0 and 4096")
    @Max(value = 4096, message = "RAM must be between 0 and 4096")
    private int ram = 4;

    @Min(value = 0, message = "Storage must be between 0 and 100000")
    @Max(value = 100000, message = "Storage must be between 0 and 100000")
    private int storage = 100;

    private String priority = "balanced";
    private String serviceType = "all";
}
