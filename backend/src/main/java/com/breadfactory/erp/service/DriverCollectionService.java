package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.DriverSettlementRequest;
import com.breadfactory.erp.entity.CashBankTransaction;
import com.breadfactory.erp.entity.DriverCollection;
import com.breadfactory.erp.entity.Invoice;
import com.breadfactory.erp.entity.Trip;
import com.breadfactory.erp.entity.User;
import com.breadfactory.erp.enums.CashBankType;
import com.breadfactory.erp.enums.CashTransactionType;
import com.breadfactory.erp.enums.SettlementStatus;
import com.breadfactory.erp.repository.CashBankTransactionRepository;
import com.breadfactory.erp.repository.DriverCollectionRepository;
import com.breadfactory.erp.repository.InvoiceRepository;
import com.breadfactory.erp.repository.TripRepository;
import com.breadfactory.erp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverCollectionService {

    private final DriverCollectionRepository collectionRepository;
    private final TripRepository tripRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final CashBankTransactionRepository cashBankTransactionRepository;
    private final CashBankService cashBankService;
    private final AccountingAutomationService accountingService;

    @Transactional
    public DriverCollection settleDriverCollection(DriverSettlementRequest request) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        User driver = userRepository.findById(request.getDriverId())
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        List<Invoice> tripInvoices = invoiceRepository.findByTripId(trip.getId());

        BigDecimal expectedTotal = tripInvoices.stream()
                .filter(i -> i.getPaymentMode() != com.breadfactory.erp.enums.PaymentMode.CREDIT)
                .map(Invoice::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashCol = request.getCashCollected() != null ? request.getCashCollected() : BigDecimal.ZERO;
        BigDecimal upiCol = request.getUpiCollected() != null ? request.getUpiCollected() : BigDecimal.ZERO;
        BigDecimal chequeCol = request.getChequeCollected() != null ? request.getChequeCollected() : BigDecimal.ZERO;

        BigDecimal actualTotal = cashCol.add(upiCol).add(chequeCol);

        BigDecimal shortageExcess = actualTotal.subtract(expectedTotal);
        SettlementStatus status = shortageExcess.compareTo(BigDecimal.ZERO) == 0 ? SettlementStatus.SETTLED : SettlementStatus.DISCREPANCY;

        String collCode = "COLL-" + System.currentTimeMillis();

        DriverCollection collection = DriverCollection.builder()
                .collectionCode(collCode)
                .trip(trip)
                .driver(driver)
                .cashCollected(cashCol)
                .upiCollected(upiCol)
                .chequeCollected(chequeCol)
                .expectedTotal(expectedTotal)
                .actualTotal(actualTotal)
                .shortageExcess(shortageExcess)
                .settlementStatus(status)
                .settledAt(ZonedDateTime.now())
                .build();

        DriverCollection savedCollection = collectionRepository.save(collection);

        // Auto deposit Cash collected into Cash Drawer Treasury
        if (cashCol.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal lastCash = cashBankService.getCurrentCashBalance();
            BigDecimal lastBank = cashBankService.getCurrentBankBalance();
            BigDecimal newCash = lastCash.add(cashCol);

            CashBankTransaction cashTxn = CashBankTransaction.builder()
                    .transactionNumber("TXN-" + System.currentTimeMillis())
                    .accountType(CashBankType.CASH)
                    .transactionType(CashTransactionType.CASH_IN)
                    .amount(cashCol)
                    .referenceType("DRIVER_SETTLEMENT")
                    .referenceNumber(collCode)
                    .runningCashBalance(newCash)
                    .runningBankBalance(lastBank)
                    .reconciliationStatus("RECONCILED")
                    .notes("Route Cash Handover from Driver " + (driver.getFullName() != null ? driver.getFullName() : driver.getUsername()) + " (Trip #" + trip.getTripNumber() + ")")
                    .build();
            cashBankTransactionRepository.save(cashTxn);
        }

        // Auto deposit UPI / Bank collected into Bank Account Treasury
        if (upiCol.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal lastCash = cashBankService.getCurrentCashBalance();
            BigDecimal lastBank = cashBankService.getCurrentBankBalance();
            BigDecimal newBank = lastBank.add(upiCol);

            CashBankTransaction bankTxn = CashBankTransaction.builder()
                    .transactionNumber("TXN-" + System.currentTimeMillis())
                    .accountType(CashBankType.BANK)
                    .transactionType(CashTransactionType.BANK_DEPOSIT)
                    .amount(upiCol)
                    .referenceType("DRIVER_SETTLEMENT")
                    .referenceNumber(collCode)
                    .runningCashBalance(lastCash)
                    .runningBankBalance(newBank)
                    .reconciliationStatus("RECONCILED")
                    .notes("Route UPI/Digital Collection from Driver " + (driver.getFullName() != null ? driver.getFullName() : driver.getUsername()) + " (Trip #" + trip.getTripNumber() + ")")
                    .build();
            cashBankTransactionRepository.save(bankTxn);
        }

        // Post Journal Entry for Route Cash/Digital Collection Settlement
        if (actualTotal.compareTo(BigDecimal.ZERO) > 0) {
            String debitAcc = (cashCol.compareTo(BigDecimal.ZERO) > 0) ? "1000" : "1100";
            accountingService.recordJournalEntry(
                    "DRIVER_SETTLEMENT", collCode,
                    "Route Cash Handover: Driver " + (driver.getFullName() != null ? driver.getFullName() : driver.getUsername()) + " (Trip " + trip.getTripNumber() + ")",
                    debitAcc, actualTotal,
                    "1200", actualTotal
            );
        }

        log.info("Driver settlement {} completed for trip {}: Total Collected ₹{} (Cash ₹{}, UPI ₹{})",
                collCode, trip.getTripNumber(), actualTotal, cashCol, upiCol);

        return savedCollection;
    }
}
