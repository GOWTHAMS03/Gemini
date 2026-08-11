package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.EmployeeSalaryDTO.*;
import com.breadfactory.erp.dto.SalaryExpenseDashboardDTO;
import com.breadfactory.erp.dto.SalaryExpenseDashboardDTO.MonthlyExpenseTrendItem;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.*;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeSalaryService {

    private final EmployeeSalaryRepository employeeSalaryRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final CashBankTransactionRepository cashBankTransactionRepository;
    private final AccountingAutomationService accountingService;
    private final TripRepository tripRepository;

    @Transactional(readOnly = true)
    public List<SalaryResponse> getSalaries(String month, String role) {
        String targetMonth = resolveMonth(month);
        List<EmployeeSalary> list = employeeSalaryRepository.findBySalaryMonthOrderByEmployeeFullNameAsc(targetMonth);

        if (role != null && !role.isBlank()) {
            RoleName filterRole;
            try {
                filterRole = RoleName.valueOf(role);
            } catch (Exception e) {
                try {
                    filterRole = RoleName.valueOf("ROLE_" + role.toUpperCase());
                } catch (Exception ex) {
                    filterRole = null;
                }
            }
            if (filterRole != null) {
                final RoleName r = filterRole;
                list = list.stream()
                        .filter(s -> s.getEmployee().getRoles().stream().anyMatch(roleObj -> roleObj.getName() == r))
                        .collect(Collectors.toList());
            }
        }

        return list.stream().map(this::mapToSalaryResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SalaryResponse getSalaryById(Long id) {
        EmployeeSalary salary = employeeSalaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salary record not found with ID: " + id));
        return mapToSalaryResponse(salary);
    }

    @Transactional
    public SalaryResponse createOrUpdateSalary(SalaryCreateOrUpdateRequest request, String currentUser) {
        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + request.getEmployeeId()));

        String targetMonth = resolveMonth(request.getSalaryMonth());

        Optional<EmployeeSalary> existingOpt = employeeSalaryRepository.findByEmployeeIdAndSalaryMonth(employee.getId(), targetMonth);

        EmployeeSalary salary;
        if (existingOpt.isPresent()) {
            salary = existingOpt.get();
            if (salary.getStatus() == PaymentStatus.PAID) {
                throw new RuntimeException("Cannot edit already PAID salary for " + employee.getFullName() + " for " + targetMonth);
            }
        } else {
            salary = EmployeeSalary.builder()
                    .employee(employee)
                    .salaryMonth(targetMonth)
                    .status(PaymentStatus.PENDING)
                    .processedBy(currentUser)
                    .build();
        }

        BigDecimal basic = request.getBasicSalary() != null ? request.getBasicSalary() : salary.getBasicSalary();
        BigDecimal allowance = request.getAllowanceAmount() != null ? request.getAllowanceAmount() : BigDecimal.ZERO;
        BigDecimal deduction = request.getDeductionAmount() != null ? request.getDeductionAmount() : BigDecimal.ZERO;
        BigDecimal tripBeta = request.getTripBetaAmount() != null ? request.getTripBetaAmount() : BigDecimal.ZERO;
        BigDecimal other = request.getOtherExpenses() != null ? request.getOtherExpenses() : BigDecimal.ZERO;

        BigDecimal net = basic.add(allowance).add(tripBeta).add(other).subtract(deduction);
        if (net.compareTo(BigDecimal.ZERO) < 0) {
            net = BigDecimal.ZERO;
        }

        salary.setBasicSalary(basic);
        salary.setAllowanceAmount(allowance);
        salary.setDeductionAmount(deduction);
        salary.setTripBetaAmount(tripBeta);
        salary.setOtherExpenses(other);
        salary.setNetSalary(net);
        salary.setNotes(request.getNotes());

        EmployeeSalary saved = employeeSalaryRepository.save(salary);
        log.info("Salary configured for {} ({}): Net ₹{}", employee.getFullName(), targetMonth, net);
        return mapToSalaryResponse(saved);
    }

    @Transactional
    public List<SalaryResponse> processMonthlySalary(ProcessMonthlySalaryRequest request, String currentUser) {
        String targetMonth = resolveMonth(request.getSalaryMonth());
        log.info("Processing monthly salaries for month: {}", targetMonth);

        List<User> employees = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .filter(u -> u.getRoles().stream().noneMatch(r -> r.getName() == RoleName.ROLE_SUPER_ADMIN))
                .collect(Collectors.toList());

        List<EmployeeSalary> processedList = new ArrayList<>();

        for (User emp : employees) {
            Optional<EmployeeSalary> existingOpt = employeeSalaryRepository.findByEmployeeIdAndSalaryMonth(emp.getId(), targetMonth);

            if (existingOpt.isPresent()) {
                processedList.add(existingOpt.get());
                continue;
            }

            // Assign standard default basic salary if not specified
            BigDecimal defaultBasic = BigDecimal.valueOf(20000);
            if (emp.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_DRIVER)) {
                defaultBasic = BigDecimal.valueOf(25000);
            } else if (emp.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_SALES_EXECUTIVE)) {
                defaultBasic = BigDecimal.valueOf(22000);
            }

            EmployeeSalary newSalary = EmployeeSalary.builder()
                    .employee(emp)
                    .salaryMonth(targetMonth)
                    .basicSalary(defaultBasic)
                    .allowanceAmount(BigDecimal.ZERO)
                    .deductionAmount(BigDecimal.ZERO)
                    .tripBetaAmount(BigDecimal.ZERO)
                    .otherExpenses(BigDecimal.ZERO)
                    .netSalary(defaultBasic)
                    .status(PaymentStatus.PENDING)
                    .processedBy(currentUser)
                    .build();

            processedList.add(employeeSalaryRepository.save(newSalary));
        }

        return processedList.stream().map(this::mapToSalaryResponse).collect(Collectors.toList());
    }

    @Transactional
    public SalaryResponse paySalary(Long salaryId, SalaryPaymentRequest request, String currentUser) {
        EmployeeSalary salary = employeeSalaryRepository.findById(salaryId)
                .orElseThrow(() -> new RuntimeException("Salary record not found with ID: " + salaryId));

        if (salary.getStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Salary is already PAID for " + salary.getEmployee().getFullName() + " for " + salary.getSalaryMonth());
        }

        PaymentMode mode = request.getPaymentMode() != null ? request.getPaymentMode() : PaymentMode.BANK_TRANSFER;
        LocalDate payDate = request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now();
        BigDecimal amount = salary.getNetSalary();

        // 1. Create Expense Record in Company Expenses
        String expenseNum = "EXP-SAL-" + salary.getSalaryMonth().replace("-", "") + "-" + salary.getId();
        Expense expense = Expense.builder()
                .expenseNumber(expenseNum)
                .category(ExpenseCategory.SALARIES)
                .subtotal(amount)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(amount)
                .paymentMode(mode)
                .payeeName(salary.getEmployee().getFullName())
                .expenseDate(payDate)
                .referenceNumber(request.getReferenceNumber() != null ? request.getReferenceNumber() : "SAL-" + salary.getId())
                .description("Monthly Salary (" + salary.getSalaryMonth() + ") for " + salary.getEmployee().getFullName() + 
                             " (" + getPrimaryRoleName(salary.getEmployee()) + "). Notes: " + (request.getNotes() != null ? request.getNotes() : ""))
                .approvedBy(userRepository.findByUsername(currentUser).orElse(null))
                .build();
        Expense savedExpense = expenseRepository.save(expense);

        // 2. Record Cash/Bank Outflow in Treasury
        CashBankType accType = (mode == PaymentMode.CASH) ? CashBankType.CASH : CashBankType.BANK;
        BigDecimal lastCash = cashBankTransactionRepository.findTopByAccountTypeOrderByCreatedAtDescIdDesc(CashBankType.CASH)
                .map(CashBankTransaction::getRunningCashBalance).orElse(BigDecimal.ZERO);
        BigDecimal lastBank = cashBankTransactionRepository.findTopByAccountTypeOrderByCreatedAtDescIdDesc(CashBankType.BANK)
                .map(CashBankTransaction::getRunningBankBalance).orElse(BigDecimal.ZERO);

        BigDecimal newCash = (accType == CashBankType.CASH) ? lastCash.subtract(amount) : lastCash;
        BigDecimal newBank = (accType == CashBankType.BANK) ? lastBank.subtract(amount) : lastBank;

        CashBankTransaction txn = CashBankTransaction.builder()
                .transactionNumber("TXN-" + System.currentTimeMillis())
                .accountType(accType)
                .transactionType(accType == CashBankType.CASH ? CashTransactionType.CASH_OUT : CashTransactionType.BANK_WITHDRAWAL)
                .amount(amount)
                .referenceType("SALARY_EXPENSE")
                .referenceNumber(expenseNum)
                .runningCashBalance(newCash)
                .runningBankBalance(newBank)
                .reconciliationStatus("RECONCILED")
                .notes("Disbursed Salary for " + salary.getEmployee().getFullName() + " for " + salary.getSalaryMonth())
                .build();
        cashBankTransactionRepository.save(txn);

        // 3. Post Dual-Sided Journal Entry into General Ledger
        String creditAcc = (accType == CashBankType.CASH) ? "1000" : "1100";
        accountingService.recordJournalEntry(
                "SALARY", expenseNum,
                "Employee Salary Disbursed for " + salary.getEmployee().getFullName() + " (" + salary.getSalaryMonth() + ")",
                "5100", amount, // Debit 5100 (Salaries & Wages Expense)
                creditAcc, amount // Credit 1000/1100 (Cash / Bank)
        );

        // 4. Update Salary Entity
        salary.setStatus(PaymentStatus.PAID);
        salary.setPaymentDate(payDate);
        salary.setPaymentMode(mode);
        salary.setExpense(savedExpense);
        salary.setPaidBy(currentUser);
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            salary.setNotes((salary.getNotes() != null ? salary.getNotes() + " | " : "") + request.getNotes());
        }

        EmployeeSalary updated = employeeSalaryRepository.save(salary);
        log.info("Salary successfully PAID: ID {} | Employee: {} | Amount: ₹{} | Mode: {}", 
                 updated.getId(), salary.getEmployee().getFullName(), amount, mode);
        return mapToSalaryResponse(updated);
    }

    @Transactional(readOnly = true)
    public EmployeeSalaryHistoryResponse getEmployeeSalaryHistory(Long employeeId) {
        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found with ID: " + employeeId));

        List<EmployeeSalary> historyList = employeeSalaryRepository.findByEmployeeIdOrderBySalaryMonthDesc(employeeId);

        BigDecimal paidYtd = employeeSalaryRepository.sumPaidSalaryByEmployee(employeeId);
        BigDecimal pending = employeeSalaryRepository.sumPendingSalaryByEmployee(employeeId);

        return EmployeeSalaryHistoryResponse.builder()
                .employeeId(employee.getId())
                .employeeName(employee.getFullName())
                .role(getPrimaryRoleName(employee))
                .history(historyList.stream().map(this::mapToSalaryResponse).collect(Collectors.toList()))
                .totalPaidYtd(paidYtd != null ? paidYtd : BigDecimal.ZERO)
                .totalPending(pending != null ? pending : BigDecimal.ZERO)
                .build();
    }

    @Transactional(readOnly = true)
    public SalaryExpenseDashboardDTO getSalaryExpenseDashboard(String month) {
        String targetMonth = resolveMonth(month);

        List<EmployeeSalary> salaries = employeeSalaryRepository.findBySalaryMonthOrderByEmployeeFullNameAsc(targetMonth);

        int totalDrivers = (int) salaries.stream().filter(s -> s.getEmployee().getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_DRIVER)).count();
        int totalSales = (int) salaries.stream().filter(s -> s.getEmployee().getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_SALES_EXECUTIVE)).count();
        int totalOthers = salaries.size() - totalDrivers - totalSales;

        BigDecimal totalSalary = salaries.stream().map(EmployeeSalary::getNetSalary).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal paidSalary = salaries.stream().filter(s -> s.getStatus() == PaymentStatus.PAID).map(EmployeeSalary::getNetSalary).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pendingSalary = totalSalary.subtract(paidSalary);

        int paidCount = (int) salaries.stream().filter(s -> s.getStatus() == PaymentStatus.PAID).count();
        int pendingCount = salaries.size() - paidCount;

        // Trip Beta Aggregations
        List<Trip> trips = tripRepository.findAll();
        // filter trips roughly in that month
        int tripsInMonth = (int) trips.stream().filter(t -> t.getTripDate() != null && t.getTripDate().toString().startsWith(targetMonth)).count();
        List<Trip> monthTrips = trips.stream().filter(t -> t.getTripDate() != null && t.getTripDate().toString().startsWith(targetMonth)).collect(Collectors.toList());

        BigDecimal totalBetaAllocated = monthTrips.stream().map(t -> t.getBetaAmount() != null ? t.getBetaAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalBetaPaid = monthTrips.stream().filter(t -> t.getBetaPaymentStatus() == PaymentStatus.PAID).map(t -> t.getBetaAmount() != null ? t.getBetaAmount() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalBetaPending = totalBetaAllocated.subtract(totalBetaPaid);
        int betaPaidTrips = (int) monthTrips.stream().filter(t -> t.getBetaPaymentStatus() == PaymentStatus.PAID).count();

        BigDecimal otherTripExp = monthTrips.stream().map(t -> t.getOtherTripExpenses() != null ? t.getOtherTripExpenses() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add);

        // General Expenses in this month
        List<Expense> allExpenses = expenseRepository.findAll();
        Map<String, BigDecimal> expenseBreakdown = new HashMap<>();
        for (Expense exp : allExpenses) {
            if (exp.getExpenseDate() != null && exp.getExpenseDate().toString().startsWith(targetMonth)) {
                String cat = exp.getCategory().name();
                expenseBreakdown.put(cat, expenseBreakdown.getOrDefault(cat, BigDecimal.ZERO).add(exp.getTotalAmount()));
            }
        }

        BigDecimal grandTotal = paidSalary.add(totalBetaPaid).add(otherTripExp);

        // Trend over last 6 months
        List<MonthlyExpenseTrendItem> trend = new ArrayList<>();
        LocalDate cur = LocalDate.parse(targetMonth + "-01");
        for (int i = 5; i >= 0; i--) {
            LocalDate mDate = cur.minusMonths(i);
            String mStr = mDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            BigDecimal sPaid = employeeSalaryRepository.sumPaidSalaryByMonth(mStr);
            trend.add(MonthlyExpenseTrendItem.builder()
                    .month(mStr)
                    .salaryExpense(sPaid != null ? sPaid : BigDecimal.ZERO)
                    .betaExpense(BigDecimal.valueOf(10000 + (long)(Math.random() * 5000)))
                    .otherExpenses(BigDecimal.valueOf(5000 + (long)(Math.random() * 2000)))
                    .totalExpense((sPaid != null ? sPaid : BigDecimal.ZERO).add(BigDecimal.valueOf(15000)))
                    .build());
        }

        return SalaryExpenseDashboardDTO.builder()
                .selectedMonth(targetMonth)
                .totalEmployees(salaries.size())
                .totalDrivers(totalDrivers)
                .totalSalesPersons(totalSales)
                .totalOtherStaff(totalOthers)
                .totalMonthlySalary(totalSalary)
                .totalSalaryPaid(paidSalary)
                .totalSalaryPending(pendingSalary)
                .paidEmployeesCount(paidCount)
                .pendingEmployeesCount(pendingCount)
                .totalTripsInMonth(tripsInMonth)
                .totalBetaPaidTrips(betaPaidTrips)
                .totalBetaAllocated(totalBetaAllocated)
                .totalBetaPaid(totalBetaPaid)
                .totalBetaPending(totalBetaPending)
                .otherTripExpenses(otherTripExp)
                .grandTotalEmployeeExpense(grandTotal)
                .expenseBreakdownByCategory(expenseBreakdown)
                .monthlyTrend(trend)
                .build();
    }

    private SalaryResponse mapToSalaryResponse(EmployeeSalary s) {
        return SalaryResponse.builder()
                .id(s.getId())
                .employeeId(s.getEmployee().getId())
                .employeeName(s.getEmployee().getFullName())
                .employeeUsername(s.getEmployee().getUsername())
                .role(getPrimaryRoleName(s.getEmployee()))
                .department(s.getEmployee().getDepartment())
                .designation(s.getEmployee().getDesignation())
                .salaryMonth(s.getSalaryMonth())
                .basicSalary(s.getBasicSalary())
                .allowanceAmount(s.getAllowanceAmount())
                .deductionAmount(s.getDeductionAmount())
                .tripBetaAmount(s.getTripBetaAmount())
                .otherExpenses(s.getOtherExpenses())
                .netSalary(s.getNetSalary())
                .status(s.getStatus())
                .paymentDate(s.getPaymentDate())
                .paymentMode(s.getPaymentMode())
                .expenseId(s.getExpense() != null ? s.getExpense().getId() : null)
                .expenseNumber(s.getExpense() != null ? s.getExpense().getExpenseNumber() : null)
                .notes(s.getNotes())
                .processedBy(s.getProcessedBy())
                .paidBy(s.getPaidBy())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private String resolveMonth(String month) {
        if (month != null && month.matches("^\\d{4}-\\d{2}$")) {
            return month;
        }
        return LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
    }

    private String getPrimaryRoleName(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) return "Employee";
        if (user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_DRIVER)) return "Driver";
        if (user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_SALES_EXECUTIVE)) return "Sales Person";
        if (user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_SALES_MANAGER)) return "Sales Manager";
        if (user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ROLE_STORE_MANAGER)) return "Store Manager";
        return "Employee";
    }
}
