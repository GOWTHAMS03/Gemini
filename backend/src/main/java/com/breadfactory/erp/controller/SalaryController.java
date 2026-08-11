package com.breadfactory.erp.controller;

import com.breadfactory.erp.dto.EmployeeSalaryDTO.*;
import com.breadfactory.erp.dto.SalaryExpenseDashboardDTO;
import com.breadfactory.erp.service.EmployeeSalaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/salaries")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SalaryController {

    private final EmployeeSalaryService employeeSalaryService;

    /**
     * Get all employee salary records for a specific month with optional role filter.
     */
    @GetMapping
    public ResponseEntity<List<SalaryResponse>> getSalaries(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(employeeSalaryService.getSalaries(month, role));
    }

    /**
     * Get single salary record by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SalaryResponse> getSalaryById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeSalaryService.getSalaryById(id));
    }

    /**
     * Create or configure salary for an individual employee for a month.
     */
    @PostMapping
    public ResponseEntity<SalaryResponse> createOrUpdateSalary(
            @Valid @RequestBody SalaryCreateOrUpdateRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        SalaryResponse response = employeeSalaryService.createOrUpdateSalary(request, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Bulk process monthly salaries for all active employees for a given month.
     */
    @PostMapping("/process")
    public ResponseEntity<List<SalaryResponse>> processMonthlySalary(
            @Valid @RequestBody ProcessMonthlySalaryRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(employeeSalaryService.processMonthlySalary(request, username));
    }

    /**
     * Pay/disburse salary - posts to company expenses, updates cash/bank ledger, and posts journal entry.
     */
    @PostMapping("/{id}/pay")
    public ResponseEntity<SalaryResponse> paySalary(
            @PathVariable Long id,
            @RequestBody SalaryPaymentRequest request,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(employeeSalaryService.paySalary(id, request, username));
    }

    /**
     * Get historical salary disbursement records for a specific employee.
     */
    @GetMapping("/employee/{employeeId}/history")
    public ResponseEntity<EmployeeSalaryHistoryResponse> getEmployeeSalaryHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(employeeSalaryService.getEmployeeSalaryHistory(employeeId));
    }

    /**
     * Get management salary & employee expense dashboard KPIs and trends.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<SalaryExpenseDashboardDTO> getSalaryDashboard(@RequestParam(required = false) String month) {
        return ResponseEntity.ok(employeeSalaryService.getSalaryExpenseDashboard(month));
    }
}
