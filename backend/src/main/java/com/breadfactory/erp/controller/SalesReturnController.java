package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.ReplacementBillingRequest;
import com.breadfactory.erp.dto.ReplacementBillingResponse;
import com.breadfactory.erp.dto.SalesReturnCreateRequest;
import com.breadfactory.erp.dto.SalesReturnResponse;
import com.breadfactory.erp.entity.Invoice;
import com.breadfactory.erp.repository.SalesReturnRepository;
import com.breadfactory.erp.service.SalesReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/returns")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SalesReturnController {

    private final SalesReturnService salesReturnService;
    private final SalesReturnRepository salesReturnRepository;

    @GetMapping
    public ResponseEntity<List<SalesReturnResponse>> getAllReturns() {
        return ResponseEntity.ok(salesReturnService.getAllReturns());
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<SalesReturnResponse>> getReturnsByShop(@PathVariable Long shopId) {
        return ResponseEntity.ok(salesReturnService.getReturnsByShop(shopId));
    }

    @GetMapping("/eligible-invoices/{shopId}")
    public ResponseEntity<List<Invoice>> getEligibleInvoicesForShop(@PathVariable Long shopId) {
        return ResponseEntity.ok(salesReturnService.getEligibleInvoicesForShop(shopId));
    }

    @PostMapping
    public ResponseEntity<SalesReturnResponse> createReturn(@Valid @RequestBody SalesReturnCreateRequest request) {
        return ResponseEntity.ok(salesReturnService.createReturn(request));
    }

    @PostMapping("/replacement-billing")
    public ResponseEntity<ReplacementBillingResponse> processReplacementBilling(
            @Valid @RequestBody ReplacementBillingRequest request) {
        return ResponseEntity.ok(salesReturnService.processReplacementBilling(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReturn(@PathVariable Long id) {
        if (salesReturnRepository.existsById(id)) {
            salesReturnRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
