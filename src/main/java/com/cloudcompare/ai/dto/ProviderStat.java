package com.cloudcompare.ai.dto;

/**
 * Provider statistics — mirrors providerStats in routes.js
 */
public class ProviderStat {

    private String platform;
    private double avgCost;
    private double avgPerformance;
    private int count;

    public ProviderStat() {}

    public ProviderStat(String platform, double avgCost, double avgPerformance, int count) {
        this.platform = platform;
        this.avgCost = avgCost;
        this.avgPerformance = avgPerformance;
        this.count = count;
    }

    // Getters and Setters
    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public double getAvgCost() { return avgCost; }
    public void setAvgCost(double avgCost) { this.avgCost = avgCost; }

    public double getAvgPerformance() { return avgPerformance; }
    public void setAvgPerformance(double avgPerformance) { this.avgPerformance = avgPerformance; }

    public int getCount() { return count; }
    public void setCount(int count) { this.count = count; }
}
