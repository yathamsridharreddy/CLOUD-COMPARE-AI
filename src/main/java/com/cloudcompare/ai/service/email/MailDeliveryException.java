package com.cloudcompare.ai.service.email;

/** Messages contain status/context only, never provider payloads or credentials. */
public class MailDeliveryException extends RuntimeException {
    public MailDeliveryException(String message) {
        super(message);
    }
}
