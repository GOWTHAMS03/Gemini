package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.InvoiceCreateRequest;
import com.breadfactory.erp.entity.Invoice;
import com.breadfactory.erp.repository.InvoiceRepository;
import com.breadfactory.erp.service.SalesInvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final SalesInvoiceService salesInvoiceService;
    private final InvoiceRepository invoiceRepository;

    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody InvoiceCreateRequest request) {
        return ResponseEntity.ok(salesInvoiceService.createInvoice(request));
    }

    @GetMapping("/shop/{shopId}")
    public ResponseEntity<List<Invoice>> getInvoicesByShop(@PathVariable Long shopId) {
        return ResponseEntity.ok(salesInvoiceService.getInvoicesByShop(shopId));
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<Invoice>> getInvoicesByTrip(@PathVariable Long tripId) {
        return ResponseEntity.ok(salesInvoiceService.getInvoicesByTrip(tripId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        if (invoiceRepository.existsById(id)) {
            invoiceRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
