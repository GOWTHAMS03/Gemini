package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.InvoiceCreateRequest;
import com.breadfactory.erp.entity.Invoice;
import com.breadfactory.erp.service.SalesInvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final SalesInvoiceService salesInvoiceService;

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody InvoiceCreateRequest request) {
        return ResponseEntity.ok(salesInvoiceService.createInvoice(request));
    }
}
