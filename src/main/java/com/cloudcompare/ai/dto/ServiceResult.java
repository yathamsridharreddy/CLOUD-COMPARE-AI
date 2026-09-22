package com.cloudcompare.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Individual service result — mirrors the processed object in rankAndRespond().
 * JSON field names match the original exactly (snake_case).
 */
@Data
@JsonInclude(JsonInclude.Include.ALWAYS)
public class ServiceResult {

    private int id;
    private String platform;

    @JsonProperty("service_name")
    private String serviceName;

    private String category;
    private int cpu;
    private int ram;
    private int storage;

    @JsonProperty("price_per_hour")
    private double pricePerHour;

    @JsonProperty("price_per_gb")
    private double pricePerGb;

    @JsonProperty("performance_score")
    private double performanceScore;

    @JsonProperty("popularity_score")
    private double popularityScore;

    private String region;
    private String description;

    private double cost;

    @JsonProperty("cost_per_hour")
    private double costPerHour;

    @JsonProperty("cost_per_day")
    private double costPerDay;

    @JsonProperty("cost_per_week")
    private double costPerWeek;

    @JsonProperty("cost_per_month")
    private double costPerMonth;

    private double score;
    private String performanceLevel;
    private double costScore;
    private int rank;

    // Only present on recommendation
    private String reason;
}
