package com.breadfactory.erp.enums;

public enum TripStatus {
    DRAFT,              // Trip is being created
    ASSIGNED,           // Dispatch Group and Route assigned
    CONFIRMED,          // Shops and products confirmed
    DISPATCHED,         // Products transferred to vehicle
    IN_PROGRESS,        // Trip has started
    COMPLETED,          // Trip finished and reconciled
    CANCELLED,          // Trip cancelled
    REASSIGNED,         // Trip reassigned to different group
    RESCHEDULED         // Trip rescheduled for different date
}
