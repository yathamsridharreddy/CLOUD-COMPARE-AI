package com.cloudcompare.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Individual AI tool result from Groq API / AI Compare feature.
 */
@JsonInclude(JsonInclude.Include.ALWAYS)
public class AiToolResult {

    private int rank;
    
    @JsonProperty("tool_name")
    private String toolName;

    private String provider;

    @JsonProperty("model_number")
    private String modelNumber;

    private double score;
    private String pricing;
    private String description;

    // Getters and Setters
    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }

    public String getToolName() { return toolName; }
    public void setToolName(String toolName) { this.toolName = toolName; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getModelNumber() { return modelNumber; }
    public void setModelNumber(String modelNumber) { this.modelNumber = modelNumber; }

    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }

    public String getPricing() { return pricing; }
    public void setPricing(String pricing) { this.pricing = pricing; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
