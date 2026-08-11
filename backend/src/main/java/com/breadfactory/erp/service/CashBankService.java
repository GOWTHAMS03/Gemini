package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.CashTransactionRequest;
import com.breadfactory.erp.dto.DailyCashClosingRequest;
import com.breadfactory.erp.entity.CashBankTransaction;
import com.breadfactory.erp.entity.DailyCashClosing;
import com.breadfactory.erp.enums.CashBankType;
import com.breadfactory.erp.enums.CashTransactionType;
import com.breadfactory.erp.repository.CashBankTransactionRepository;
import com.breadfactory.erp.repository.DailyCashClosingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CashBankService {

    private final CashBankTransactionRepository cashBankTransactionRepository;
    private final DailyCashClosingRepository dailyCashClosingRepository;
    private final AccountingAutomationService accountingService;

    @Transactional(readOnly = true)
    public List<CashBankTransaction> getAllTransactions() {
        return cashBankTransactionRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<CashBankTransaction> getTransactionsByAccount(CashBankType type) {
        return cashBankTransactionRepository.findByAccountTypeOrderByCreatedAtDesc(type);
    }

    @Transactional(readOnly = true)
    public BigDecimal getCurrentCashBalance() {
        return cashBankTransactionRepository.findTopByAccountTypeOrderByCreatedAtDescIdDesc(CashBankType.CASH)
                .map(CashBankTransaction::getRunningCashBalance).orElse(BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public BigDecimal getCurrentBankBalance() {
        return cashBankTransactionRepository.findTopByAccountTypeOrderByCreatedAtDescIdDesc(CashBankType.BANK)
                .map(CashBankTransaction::getRunningBankBalance).orElse(BigDecimal.ZERO);
    }

    @Transactional
    public CashBankTransaction recordTransaction(CashTransactionRequest request) {
        String txnNum = "TXN-" + System.currentTimeMillis();

        BigDecimal lastCash = getCurrentCashBalance();
        BigDecimal lastBank = getCurrentBankBalance();

        BigDecimal newCash = lastCash;
        BigDecimal newBank = lastBank;

        if (request.getAccountType() == CashBankType.CASH) {
            if (request.getTransactionType() == CashTransactionType.CASH_IN) {
                newCash = lastCash.add(request.getAmount());
            } else if (request.getTransactionType() == CashTransactionType.CASH_OUT) {
                newCash = lastCash.subtract(request.getAmount());
            }
        } else {
            if (request.getTransactionType() == CashTransactionType.BANK_DEPOSIT || request.getTransactionType() == CashTransactionType.CASH_IN) {
                newBank = lastBank.add(request.getAmount());
            } else if (request.getTransactionType() == CashTransactionType.BANK_WITHDRAWAL || request.getTransactionType() == CashTransactionType.CASH_OUT) {
                newBank = lastBank.subtract(request.getAmount());
            }
        }

        CashBankTransaction txn = CashBankTransaction.builder()
                .transactionNumber(txnNum)
                .accountType(request.getAccountType())
                .transactionType(request.getTransactionType())
                .amount(request.getAmount())
                .referenceType(request.getReferenceType() != null ? request.getReferenceType() : "MANUAL_ADJUSTMENT")
                .referenceNumber(request.getReferenceNumber() != null ? request.getReferenceNumber() : txnNum)
                .runningCashBalance(newCash)
                .runningBankBalance(newBank)
                .reconciliationStatus("RECONCILED")
                .notes(request.getNotes())
                .build();

        return cashBankTransactionRepository.save(txn);
    }

    @Transactional
    public DailyCashClosing executeDailyCashClosing(DailyCashClosingRequest request) {
        LocalDate date = request.getClosingDate() != null ? request.getClosingDate() : LocalDate.now();

        BigDecimal expectedBalance = getCurrentCashBalance();
        BigDecimal actualCounted = request.getActualCashCounted() != null ? request.getActualCashCounted() : expectedBalance;
        BigDecimal discrepancy = actualCounted.subtract(expectedBalance);

        // Aggregate actual cash transactions for the date
        List<CashBankTransaction> cashTxns = cashBankTransactionRepository.findByAccountTypeOrderByCreatedAtDesc(CashBankType.CASH);

        BigDecimal cashIn = cashTxns.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().toLocalDate().equals(date))
                .filter(t -> t.getTransactionType() == CashTransactionType.CASH_IN)
                .map(CashBankTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashOut = cashTxns.stream()
                .filter(t -> t.getCreatedAt() != null && t.getCreatedAt().toLocalDate().equals(date))
                .filter(t -> t.getTransactionType() == CashTransactionType.CASH_OUT || t.getTransactionType() == CashTransactionType.BANK_DEPOSIT)
                .map(CashBankTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal openingBalance = expectedBalance.subtract(cashIn).add(cashOut).max(BigDecimal.ZERO);

        DailyCashClosing closing = DailyCashClosing.builder()
                .closingDate(date)
                .openingBalance(openingBalance)
                .totalCashIn(cashIn)
                .totalCashOut(cashOut)
                .expectedCashBalance(expectedBalance)
                .actualCashCounted(actualCounted)
                .discrepancyAmount(discrepancy)
                .notes(request.getNotes())
                .build();

        return dailyCashClosingRepository.save(closing);
    }
}
