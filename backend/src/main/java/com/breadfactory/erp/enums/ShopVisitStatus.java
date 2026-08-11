package com.breadfactory.erp.enums;

public enum ShopVisitStatus {
    PENDING,        // Shop visit pending (not yet started)
    SCHEDULED,      // Shop visit scheduled
    IN_PROGRESS,    // Sales person currently visiting
    ARRIVED,        // Sales person/driver arrived at shop
    VISITED,        // Visit completed (alias)
    COMPLETED,      // Visit completed
    SKIPPED,        // Visit skipped
    MISSED,         // Visit missed
    RESCHEDULED,    // Visit rescheduled
    CANCELLED       // Visit cancelled
}
