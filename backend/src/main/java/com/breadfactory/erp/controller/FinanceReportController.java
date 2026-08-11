package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.BalanceSheetDTO;
import com.breadfactory.erp.dto.FinanceDashboardDTO;
import com.breadfactory.erp.dto.ProfitAndLossDTO;
import com.breadfactory.erp.service.FinanceReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/finance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FinanceReportController {

    private final FinanceReportService financeReportService;

    @GetMapping("/dashboard")
    public ResponseEntity<FinanceDashboardDTO> getDashboardKpis() {
        return ResponseEntity.ok(financeReportService.getDashboardKpis());
    }

    @GetMapping("/reports/profit-and-loss")
    public ResponseEntity<ProfitAndLossDTO> getProfitAndLoss() {
        return ResponseEntity.ok(financeReportService.getProfitAndLoss());
    }

    @GetMapping("/reports/balance-sheet")
    public ResponseEntity<BalanceSheetDTO> getBalanceSheet() {
        return ResponseEntity.ok(financeReportService.getBalanceSheet());
    }
}
