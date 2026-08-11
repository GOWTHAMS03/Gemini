package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.PurchaseReturnCreateRequest;
import com.breadfactory.erp.entity.PurchaseReturn;
import com.breadfactory.erp.service.PurchaseReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/purchase-returns")
@RequiredArgsConstructor
public class PurchaseReturnController {

    private final PurchaseReturnService purchaseReturnService;

    @GetMapping
    public ResponseEntity<List<PurchaseReturn>> getAllPurchaseReturns() {
        return ResponseEntity.ok(purchaseReturnService.getAllPurchaseReturns());
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<PurchaseReturn>> getPurchaseReturnsBySupplier(@PathVariable Long supplierId) {
        return ResponseEntity.ok(purchaseReturnService.getPurchaseReturnsBySupplier(supplierId));
    }

    @PostMapping
    public ResponseEntity<PurchaseReturn> createPurchaseReturn(@Valid @RequestBody PurchaseReturnCreateRequest request) {
        return ResponseEntity.ok(purchaseReturnService.createPurchaseReturn(request));
    }
}
