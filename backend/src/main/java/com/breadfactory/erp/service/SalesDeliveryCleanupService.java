package com.breadfactory.erp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalesDeliveryCleanupService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Purges and deletes all transactional data created under the Sales and Delivery module.
     * Deletes records in strict foreign key order to prevent relational constraint violations.
     *
     * @return Summary map of deleted record counts by table.
     */
    @Transactional
    public Map<String, Object> clearAllSalesAndDeliveryData() {
        log.info("Starting complete purge of all Sales and Delivery module data...");
        Map<String, Object> deletionSummary = new HashMap<>();

        // Helper method to safely execute table deletion and record deleted count
        executeDelete("credit_notes", deletionSummary);
        executeDelete("sales_return_items", deletionSummary);
        executeDelete("sales_returns", deletionSummary);
        executeDelete("invoice_items", deletionSummary);
        executeDelete("invoices", deletionSummary);
        executeDelete("delivery_acknowledgements", deletionSummary);
        executeDelete("deliveries", deletionSummary);
        executeDelete("trip_items", deletionSummary);
        
        // Deleting trip shop visits junction tables if present
        executeDeleteIfExists("trip_shop_visits", deletionSummary);
        executeDelete("driver_collections", deletionSummary);
        
        // Delete trips
        executeDelete("trips", deletionSummary);
        
        // Delete weekly and daily trip planning tables
        executeDeleteIfExists("daily_trip_shops", deletionSummary);
        executeDeleteIfExists("daily_trip_plans", deletionSummary);
        executeDeleteIfExists("weekly_trip_plans", deletionSummary);
        
        // Delete dispatch groups and route configurations
        executeDeleteIfExists("dispatch_group_sales_persons", deletionSummary);
        executeDeleteIfExists("dispatch_groups", deletionSummary);
        executeDeleteIfExists("shop_routes", deletionSummary);
        executeDeleteIfExists("route_groups", deletionSummary);
        executeDeleteIfExists("delivery_routes", deletionSummary);
        
        // Delete shop visits
        executeDeleteIfExists("shop_visits", deletionSummary);
        
        // Delete expired/damaged product tracking logs
        executeDeleteIfExists("expired_product_tracking", deletionSummary);
        executeDeleteIfExists("damaged_product_tracking", deletionSummary);
        
        // Clean ledger entries associated with sales and returns
        executeDeleteIfExists("shop_ledger", deletionSummary);
        executeDeleteIfExists("supplier_ledger", deletionSummary);
        executeDeleteIfExists("journal_entry_lines", deletionSummary);
        executeDeleteIfExists("journal_entries", deletionSummary);
        executeDeleteIfExists("employee_salaries", deletionSummary);
        executeDeleteIfExists("purchase_return_items", deletionSummary);
        executeDeleteIfExists("purchase_returns", deletionSummary);
        executeDeleteIfExists("purchase_invoice_items", deletionSummary);
        executeDeleteIfExists("purchase_invoices", deletionSummary);

        // Purge Treasury Cash & Bank logs, Expenses, and Closings
        executeDeleteIfExists("expenses", deletionSummary);
        executeDeleteIfExists("daily_cash_closings", deletionSummary);
        executeDeleteIfExists("cash_bank_transactions", deletionSummary);
        
        // Clear stock ledger movements related to trips, sales, and returns
        try {
            int stockLedgerDeleted = jdbcTemplate.update(
                "DELETE FROM product_stock_ledger WHERE movement_type IN ('TRIP_LOAD', 'SALE', 'RETURN_EXPIRED', 'RETURN_DAMAGED', 'RETURN')"
            );
            deletionSummary.put("product_stock_ledger_sales_entries", stockLedgerDeleted);
        } catch (Exception e) {
            log.warn("Could not delete sales entries from product_stock_ledger: {}", e.getMessage());
        }

        // Reset shop and supplier outstanding balances to 0.00
        try {
            int shopsReset = jdbcTemplate.update("UPDATE shops SET outstanding_amount = 0.00");
            deletionSummary.put("shops_outstanding_reset_count", shopsReset);
            int suppliersReset = jdbcTemplate.update("UPDATE suppliers SET outstanding_balance = 0.00");
            deletionSummary.put("suppliers_outstanding_reset_count", suppliersReset);
        } catch (Exception e) {
            log.warn("Could not reset shops/suppliers outstanding: {}", e.getMessage());
        }

        log.info("Successfully purged all Sales and Delivery data. Summary: {}", deletionSummary);
        return deletionSummary;
    }

    private void executeDelete(String tableName, Map<String, Object> summary) {
        try {
            int count = jdbcTemplate.update("DELETE FROM " + tableName);
            summary.put(tableName, count);
            log.info("Deleted {} records from {}", count, tableName);
        } catch (Exception e) {
            log.error("Failed to delete from table {}: {}", tableName, e.getMessage());
            summary.put(tableName + "_error", e.getMessage());
        }
    }

    private void executeDeleteIfExists(String tableName, Map<String, Object> summary) {
        try {
            int count = jdbcTemplate.update("DELETE FROM " + tableName);
            summary.put(tableName, count);
            log.info("Deleted {} records from {}", count, tableName);
        } catch (Exception e) {
            log.debug("Table {} might not exist or already clean: {}", tableName, e.getMessage());
        }
    }
}
