package com.breadfactory.erp.controller;

import com.breadfactory.erp.entity.SupplierLedger;
import com.breadfactory.erp.repository.SupplierLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/supplier-ledgers")
@RequiredArgsConstructor
public class SupplierLedgerController {

    private final SupplierLedgerRepository supplierLedgerRepository;

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<SupplierLedger>> getSupplierLedger(@PathVariable Long supplierId) {
        return ResponseEntity.ok(supplierLedgerRepository.findBySupplierIdOrderByCreatedAtAsc(supplierId));
    }
}
