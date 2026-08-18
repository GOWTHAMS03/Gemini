package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.CashTransactionRequest;
import com.breadfactory.erp.dto.DailyCashClosingRequest;
import com.breadfactory.erp.entity.CashBankTransaction;
import com.breadfactory.erp.entity.DailyCashClosing;
import com.breadfactory.erp.enums.CashBankType;
import com.breadfactory.erp.service.CashBankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/cash-bank")
@RequiredArgsConstructor
public class CashBankController {

    private final CashBankService cashBankService;

    @GetMapping("/transactions")
    public ResponseEntity<List<CashBankTransaction>> getAllTransactions() {
        return ResponseEntity.ok(cashBankService.getAllTransactions());
    }

    @GetMapping("/transactions/{accountType}")
    public ResponseEntity<List<CashBankTransaction>> getTransactionsByAccount(@PathVariable CashBankType accountType) {
        return ResponseEntity.ok(cashBankService.getTransactionsByAccount(accountType));
    }

    @GetMapping("/balances")
    public ResponseEntity<Map<String, BigDecimal>> getBalances() {
        return ResponseEntity.ok(Map.of(
                "cashBalance", cashBankService.getCurrentCashBalance(),
                "bankBalance", cashBankService.getCurrentBankBalance()
        ));
    }

    @PostMapping("/transaction")
    public ResponseEntity<CashBankTransaction> recordTransaction(@Valid @RequestBody CashTransactionRequest request) {
        return ResponseEntity.ok(cashBankService.recordTransaction(request));
    }

    @PostMapping("/transfer")
    public ResponseEntity<CashBankTransaction> recordTransfer(@Valid @RequestBody com.breadfactory.erp.dto.CashTransferRequest request) {
        return ResponseEntity.ok(cashBankService.recordTransfer(request));
    }

    @PostMapping("/daily-closing")
    public ResponseEntity<DailyCashClosing> executeDailyCashClosing(@Valid @RequestBody DailyCashClosingRequest request) {
        return ResponseEntity.ok(cashBankService.executeDailyCashClosing(request));
    }
}
