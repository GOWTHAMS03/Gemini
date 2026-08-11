package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.ExpiredProductDTO;
import com.breadfactory.erp.dto.ShopLedgerDTO;
import com.breadfactory.erp.entity.ProductStockLedger;
import com.breadfactory.erp.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ledgers")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<ShopLedgerDTO>> getShopLedger(@PathVariable Long shopId) {
        return ResponseEntity.ok(ledgerService.getShopLedger(shopId));
    }

    @GetMapping("/stock")
    public ResponseEntity<List<ProductStockLedger>> getProductStockLedger(
            @RequestParam(required = false) Long productId) {
        return ResponseEntity.ok(ledgerService.getProductStockLedger(productId));
    }

    @GetMapping("/expired")
    public ResponseEntity<List<ExpiredProductDTO>> getExpiredProductTracking(
            @RequestParam(required = false) Long shopId) {
        return ResponseEntity.ok(ledgerService.getExpiredProductTracking(shopId));
    }
}
