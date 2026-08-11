package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.ExpenseCreateRequest;
import com.breadfactory.erp.entity.CashBankTransaction;
import com.breadfactory.erp.entity.Expense;
import com.breadfactory.erp.enums.CashBankType;
import com.breadfactory.erp.enums.CashTransactionType;
import com.breadfactory.erp.enums.ExpenseCategory;
import com.breadfactory.erp.enums.PaymentMode;
import com.breadfactory.erp.repository.CashBankTransactionRepository;
import com.breadfactory.erp.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CashBankTransactionRepository cashBankTransactionRepository;
    private final AccountingAutomationService accountingService;

    @Transactional(readOnly = true)
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAllByOrderByExpenseDateDesc();
    }

    @Transactional(readOnly = true)
    public List<Expense> getExpensesByCategory(ExpenseCategory category) {
        return expenseRepository.findByCategoryOrderByExpenseDateDesc(category);
    }

    @Transactional
    public Expense createExpense(ExpenseCreateRequest request) {
        String expenseNum = "EXP-" + System.currentTimeMillis();

        BigDecimal tax = request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal total = request.getAmount().add(tax);

        Expense expense = Expense.builder()
                .expenseNumber(expenseNum)
                .category(request.getCategory())
                .subtotal(request.getAmount())
                .taxAmount(tax)
                .totalAmount(total)
                .paymentMode(request.getPaymentMode())
                .payeeName(request.getPayeeName())
                .expenseDate(request.getExpenseDate())
                .referenceNumber(request.getReferenceNumber())
                .description(request.getDescription())
                .build();

        Expense savedExpense = expenseRepository.save(expense);

        // Record Cash/Bank Outflow
        CashBankType accType = (request.getPaymentMode() == PaymentMode.CASH) ? CashBankType.CASH : CashBankType.BANK;

        BigDecimal lastCash = cashBankTransactionRepository.findTopByAccountTypeOrderByCreatedAtDescIdDesc(CashBankType.CASH)
                .map(CashBankTransaction::getRunningCashBalance).orElse(BigDecimal.ZERO);
        BigDecimal lastBank = cashBankTransactionRepository.findTopByAccountTypeOrderByCreatedAtDescIdDesc(CashBankType.BANK)
                .map(CashBankTransaction::getRunningBankBalance).orElse(BigDecimal.ZERO);

        BigDecimal newCash = (accType == CashBankType.CASH) ? lastCash.subtract(total) : lastCash;
        BigDecimal newBank = (accType == CashBankType.BANK) ? lastBank.subtract(total) : lastBank;

        CashBankTransaction txn = CashBankTransaction.builder()
                .transactionNumber("TXN-" + System.currentTimeMillis())
                .accountType(accType)
                .transactionType(accType == CashBankType.CASH ? CashTransactionType.CASH_OUT : CashTransactionType.BANK_WITHDRAWAL)
                .amount(total)
                .referenceType("EXPENSE")
                .referenceNumber(expenseNum)
                .runningCashBalance(newCash)
                .runningBankBalance(newBank)
                .reconciliationStatus("RECONCILED")
                .notes("Expense: " + request.getCategory() + " (" + (request.getDescription() != null ? request.getDescription() : "") + ")")
                .build();
        cashBankTransactionRepository.save(txn);

        // Map Category to Chart of Account Code
        String expenseAccountCode = switch (request.getCategory()) {
            case SALARIES -> "5100";
            case TRIP_BETA -> "5250";
            case TRIP_EXPENSE -> "5260";
            case FUEL -> "5200";
            case VEHICLE_MAINTENANCE -> "5300";
            case ELECTRICITY -> "5400";
            case RENT -> "5500";
            case PACKAGING -> "5600";
            default -> "5700";
        };

        String creditAcc = (accType == CashBankType.CASH) ? "1000" : "1100";
        accountingService.recordJournalEntry(
                "EXPENSE", expenseNum,
                "Expense incurred for " + request.getCategory(),
                expenseAccountCode, total,
                creditAcc, total
        );

        return savedExpense;
    }
}
