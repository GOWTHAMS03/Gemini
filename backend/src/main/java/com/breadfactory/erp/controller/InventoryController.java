package com.breadfactory.erp.controller;

import com.breadfactory.erp.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/dashboard")
    public ResponseEntity<InventoryService.InventoryDashboardDTO> getDashboard() {
        return ResponseEntity.ok(inventoryService.getDashboard());
    }

    @GetMapping("/finished-goods")
    public ResponseEntity<List<InventoryService.FinishedGoodsItemDTO>> getFinishedGoods(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long warehouseId
    ) {
        return ResponseEntity.ok(inventoryService.getFinishedGoods(productId, warehouseId));
    }

    @GetMapping("/transit-stock")
    public ResponseEntity<List<InventoryService.TransitStockItemDTO>> getTransitStock() {
        return ResponseEntity.ok(inventoryService.getTransitStock());
    }

    @GetMapping("/trucks")
    public ResponseEntity<List<InventoryService.TruckInventoryDTO>> getTruckInventories() {
        return ResponseEntity.ok(inventoryService.getTruckInventories());
    }

    @PostMapping("/trucks/refill")
    public ResponseEntity<InventoryService.TruckInventoryDTO> refillTruck(
            @RequestBody InventoryService.TruckRefillRequest request
    ) {
        return ResponseEntity.ok(inventoryService.refillTruck(request));
    }

    @PostMapping("/trucks/audit")
    public ResponseEntity<InventoryService.TruckInventoryDTO> auditTruckStock(
            @RequestBody InventoryService.TruckAuditRequest request
    ) {
        return ResponseEntity.ok(inventoryService.auditTruckStock(request));
    }

    @GetMapping("/ledger")
    public ResponseEntity<List<InventoryService.StockLedgerItemDTO>> getStockLedger(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) String movementType
    ) {
        return ResponseEntity.ok(inventoryService.getStockLedger(productId, movementType));
    }

    @PostMapping("/adjust")
    public ResponseEntity<InventoryService.FinishedGoodsItemDTO> adjustStock(
            @RequestBody InventoryService.StockAdjustmentRequest request
    ) {
        return ResponseEntity.ok(inventoryService.adjustStock(request));
    }
}
