package com.breadfactory.erp.enums;

public enum InventoryTransactionType {
    WAREHOUSE_TO_TRIP,          // Products loaded from warehouse to trip
    TRIP_RETURN_TO_WAREHOUSE,   // Unsold products returned to warehouse
    TRIP_SALE,                  // Products sold from trip
    TRIP_DAMAGED,               // Products marked as damaged
    TRIP_RECONCILIATION,        // Reconciliation adjustment
    WAREHOUSE_ADJUSTMENT,       // Direct warehouse inventory adjustment
    RAW_MATERIAL_TO_PRODUCTION, // Raw material consumed for manufacturing batch
    PRODUCTION_TO_FINISHED_GOODS // Finished goods deposited from production line
}
