package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.*;
import com.breadfactory.erp.entity.JournalEntry;
import com.breadfactory.erp.service.FinanceReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/finance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FinanceReportController {

    private final FinanceReportService financeReportService;

    @GetMapping("/dashboard")
    public ResponseEntity<FinanceDashboardDTO> getDashboardKpis(
            @RequestParam(required = false, defaultValue = "MTD") String period
    ) {
        return ResponseEntity.ok(financeReportService.getDashboardKpis(period));
    }

    @GetMapping("/reports/profit-and-loss")
    public ResponseEntity<ProfitAndLossDTO> getProfitAndLoss(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(financeReportService.getProfitAndLoss(startDate, endDate));
    }

    @GetMapping("/reports/balance-sheet")
    public ResponseEntity<BalanceSheetDTO> getBalanceSheet(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate
    ) {
        return ResponseEntity.ok(financeReportService.getBalanceSheet(asOfDate));
    }

    @GetMapping("/reports/cash-flow")
    public ResponseEntity<CashFlowDTO> getCashFlow(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(financeReportService.getCashFlow(startDate, endDate));
    }

    @GetMapping("/reports/trial-balance")
    public ResponseEntity<TrialBalanceDTO> getTrialBalance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate
    ) {
        return ResponseEntity.ok(financeReportService.getTrialBalance(asOfDate));
    }

    @GetMapping("/reports/gst-summary")
    public ResponseEntity<GstSummaryDTO> getGstSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(financeReportService.getGstTaxReport(startDate, endDate));
    }

    @GetMapping("/reports/journal-entries")
    public ResponseEntity<List<JournalEntry>> getJournalEntries() {
        return ResponseEntity.ok(financeReportService.getAllJournalEntries());
    }
}
