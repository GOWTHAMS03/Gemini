package com.breadfactory.erp.enums;

public enum ProductionStage {
    // 3 Standard Stages
    STAGE_1_PREP_BAKE_COOL,   // Mixing -> Cup Divide -> Oven Baking -> Cooling & Dry
    STAGE_2_SLICE_PACK_STACK,  // Slicing & Primary Bag Packing -> Stacker (Horizontal to Plate / Plate to Horizontal)
    STAGE_3_ROLL_PACKAGING,    // Roll Packing & Bulk Packaging Module (Boxes & Bundles)
    STAGE_COMPLETED,           // Handover to Finished Goods Warehouse & Dispatch

    // Legacy Aliases (Preserved for backward database compatibility)
    STAGE_DISPENSING,
    STAGE_MIXING,
    STAGE_DIVIDING,
    STAGE_PROOFING,
    STAGE_BAKING,
    STAGE_COOLING_PACKING,
    STAGE_QC_RELEASE
}
