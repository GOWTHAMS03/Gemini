package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.PurchaseInvoiceCreateRequest;
import com.breadfactory.erp.dto.SupplierPaymentRequest;
import com.breadfactory.erp.entity.PurchaseInvoice;
import com.breadfactory.erp.entity.Supplier;
import com.breadfactory.erp.repository.PurchaseInvoiceRepository;
import com.breadfactory.erp.service.PurchaseBillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/purchases")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PurchaseBillingController {

    private final PurchaseBillingService purchaseBillingService;
    private final PurchaseInvoiceRepository purchaseInvoiceRepository;

    @GetMapping
    public ResponseEntity<List<PurchaseInvoice>> getAllPurchaseInvoices() {
        return ResponseEntity.ok(purchaseBillingService.getAllPurchaseInvoices());
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<PurchaseInvoice>> getPurchaseInvoicesBySupplier(@PathVariable Long supplierId) {
        return ResponseEntity.ok(purchaseBillingService.getPurchaseInvoicesBySupplier(supplierId));
    }

    @PostMapping
    public ResponseEntity<PurchaseInvoice> createPurchaseInvoice(@Valid @RequestBody PurchaseInvoiceCreateRequest request) {
        return ResponseEntity.ok(purchaseBillingService.createPurchaseInvoice(request));
    }

    @PostMapping("/pay-supplier")
    public ResponseEntity<Supplier> recordSupplierPayment(@Valid @RequestBody SupplierPaymentRequest request) {
        return ResponseEntity.ok(purchaseBillingService.recordSupplierPayment(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePurchaseInvoice(@PathVariable Long id) {
        if (purchaseInvoiceRepository.existsById(id)) {
            purchaseInvoiceRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
