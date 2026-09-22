package com.cloudcompare.ai.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * Response wrapper for POST /api/compare
 * Mirrors the JSON shape returned by rankAndRespond() in routes.js
 */
@Data
public class CompareResponse {

    private String category;
    private Map<String, Object> filters;
    private int totalResults;
    private List<ServiceResult> services;
    private List<ProviderStat> providerStats;
    private ServiceResult recommendation;
}
