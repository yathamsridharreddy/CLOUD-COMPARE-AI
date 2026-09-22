package com.cloudcompare.ai.dto;

/**
 * Service type DTO — { value, label } pairs.
 * Mirrors the SERVICE_TYPES objects in routes.js
 */
public class ServiceType {

    private String value;
    private String label;

    public ServiceType() {}

    public ServiceType(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
