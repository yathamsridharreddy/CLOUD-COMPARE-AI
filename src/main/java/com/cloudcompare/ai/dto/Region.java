package com.cloudcompare.ai.dto;

/**
 * Region DTO — { value, label } pairs.
 * Mirrors the regions array in routes.js GET /api/regions
 */
public class Region {

    private String value;
    private String label;

    public Region() {}

    public Region(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
