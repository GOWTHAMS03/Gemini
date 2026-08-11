package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.CreditNoteDTO;
import com.breadfactory.erp.service.LedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/credit-notes")
@RequiredArgsConstructor
public class CreditNoteController {

    private final LedgerService ledgerService;

    @GetMapping
    public ResponseEntity<List<CreditNoteDTO>> getAllCreditNotes() {
        return ResponseEntity.ok(ledgerService.getAllCreditNotes());
    }

    @GetMapping("/shop/{shopId}/active")
    public ResponseEntity<List<CreditNoteDTO>> getActiveCreditNotesForShop(@PathVariable Long shopId) {
        return ResponseEntity.ok(ledgerService.getActiveCreditNotesForShop(shopId));
    }
}
