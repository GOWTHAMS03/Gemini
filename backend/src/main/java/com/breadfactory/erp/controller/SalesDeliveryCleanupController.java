package com.breadfactory.erp.controller;

import com.breadfactory.erp.service.SalesDeliveryCleanupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/sales-delivery")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SalesDeliveryCleanupController {

    private final SalesDeliveryCleanupService salesDeliveryCleanupService;

    /**
     * Purge and delete all created Sales and Delivery module data
     * (trips, dispatches, weekly plans, shop visits, invoices, returns, credit notes, collections).
     */
    @DeleteMapping("/clear-all")
    public ResponseEntity<Map<String, Object>> clearAllSalesAndDeliveryData() {
        Map<String, Object> result = salesDeliveryCleanupService.clearAllSalesAndDeliveryData();
        return ResponseEntity.ok(result);
    }
}
