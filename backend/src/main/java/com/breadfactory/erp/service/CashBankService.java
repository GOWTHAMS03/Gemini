package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.CashTransactionRequest;
import com.breadfactory.erp.dto.CashTransferRequest;
import com.breadfactory.erp.dto.DailyCashClosingRequest;
import com.breadfactory.erp.entity.CashBankTransaction;
import com.breadfactory.erp.entity.DailyCashClosing;
import com.breadfactory.erp.enums.CashBankType;
import com.breadfactory.erp.enums.CashTransactionType;
import com.breadfactory.erp.repository.CashBankTransactionRepository;
import com.breadfactory.erp.repository.DailyCashClosingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
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
        return cashBankTransactionRepository.findTopByOrderByCreatedAtDescIdDesc()
                .map(CashBankTransaction::getRunningCashBalance)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public BigDecimal getCurrentBankBalance() {
        return cashBankTransactionRepository.findTopByOrderByCreatedAtDescIdDesc()
                .map(CashBankTransaction::getRunningBankBalance)
                .orElse(BigDecimal.ZERO);
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

        CashBankTransaction savedTxn = cashBankTransactionRepository.save(txn);

        // Auto post double-entry journal for manual treasury adjustment
        String refType = request.getReferenceType() != null ? request.getReferenceType() : "TREASURY_ADJUSTMENT";
        if ("MANUAL_ADJUSTMENT".equalsIgnoreCase(refType) || "OTHER_INCOME".equalsIgnoreCase(refType)) {
            if (request.getAccountType() == CashBankType.CASH) {
                if (request.getTransactionType() == CashTransactionType.CASH_IN) {
                    accountingService.recordJournalEntry("TREASURY_INFLOW", txnNum, "Cash Drawer Inflow: " + request.getNotes(), "1000", request.getAmount(), "4100", request.getAmount());
                } else {
                    accountingService.recordJournalEntry("TREASURY_OUTFLOW", txnNum, "Cash Drawer Outflow: " + request.getNotes(), "5700", request.getAmount(), "1000", request.getAmount());
                }
            } else {
                if (request.getTransactionType() == CashTransactionType.BANK_DEPOSIT || request.getTransactionType() == CashTransactionType.CASH_IN) {
                    accountingService.recordJournalEntry("BANK_INFLOW", txnNum, "Bank Deposit Inflow: " + request.getNotes(), "1100", request.getAmount(), "4100", request.getAmount());
                } else {
                    accountingService.recordJournalEntry("BANK_OUTFLOW", txnNum, "Bank Withdrawal Outflow: " + request.getNotes(), "5700", request.getAmount(), "1100", request.getAmount());
                }
            }
        }

        return savedTxn;
    }

    /**
     * Records a Contra Transfer between Cash and Bank accounts.
     */
    @Transactional
    public CashBankTransaction recordTransfer(CashTransferRequest request) {
        if (request.getFromAccount() == request.getToAccount()) {
            throw new IllegalArgumentException("Source and destination accounts must be different.");
        }

        BigDecimal lastCash = getCurrentCashBalance();
        BigDecimal lastBank = getCurrentBankBalance();

        BigDecimal amount = request.getAmount();

        if (request.getFromAccount() == CashBankType.CASH && lastCash.compareTo(amount) < 0) {
            log.warn("Transferring amount ₹{} exceeds current cash drawer balance ₹{}", amount, lastCash);
        }
        if (request.getFromAccount() == CashBankType.BANK && lastBank.compareTo(amount) < 0) {
            log.warn("Transferring amount ₹{} exceeds current bank balance ₹{}", amount, lastBank);
        }

        BigDecimal newCash = (request.getFromAccount() == CashBankType.CASH)
                ? lastCash.subtract(amount)
                : lastCash.add(amount);

        BigDecimal newBank = (request.getFromAccount() == CashBankType.BANK)
                ? lastBank.subtract(amount)
                : lastBank.add(amount);

        String txnNum = "XFER-" + System.currentTimeMillis();
        String refNum = request.getReferenceNumber() != null ? request.getReferenceNumber() : txnNum;
        String notes = request.getNotes() != null ? request.getNotes() :
                String.format("Transfer from %s to %s", request.getFromAccount(), request.getToAccount());

        CashBankTransaction txn = CashBankTransaction.builder()
                .transactionNumber(txnNum)
                .accountType(request.getToAccount())
                .transactionType(CashTransactionType.TRANSFER)
                .amount(amount)
                .referenceType("CONTRA_TRANSFER")
                .referenceNumber(refNum)
                .runningCashBalance(newCash)
                .runningBankBalance(newBank)
                .reconciliationStatus("RECONCILED")
                .notes(notes)
                .build();

        CashBankTransaction savedTxn = cashBankTransactionRepository.save(txn);

        // Auto post double-entry Contra Journal Entry
        accountingService.recordContraTransfer(
                refNum,
                request.getFromAccount().name(),
                request.getToAccount().name(),
                amount,
                notes
        );

        return savedTxn;
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
