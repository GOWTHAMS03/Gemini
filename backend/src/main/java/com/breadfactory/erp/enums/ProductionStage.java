package com.breadfactory.erp.enums;

public enum ProductionStage {
    STAGE_DISPENSING,      // Raw material staging & precision weighing
    STAGE_MIXING,          // Spiral mixing & kneading
    STAGE_DIVIDING,        // Dividing, rounding & resting
    STAGE_PROOFING,        // Temperature/humidity proofing chamber
    STAGE_BAKING,          // Oven baking & crust coloration
    STAGE_COOLING_PACKING, // Cooling conveyor, slicing & polybag flow-wrap
    STAGE_QC_RELEASE,      // Final QC inspection & release
    STAGE_COMPLETED        // Finished goods deposited into warehouse
}
