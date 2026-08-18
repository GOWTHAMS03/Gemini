package com.breadfactory.erp.service;

import com.breadfactory.erp.entity.JournalEntry;
import com.breadfactory.erp.entity.JournalEntryLine;
import com.breadfactory.erp.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountingAutomationService {

    private final JournalEntryRepository journalEntryRepository;

    @Transactional
    public JournalEntry recordJournalEntry(String refType, String refNumber, String description,
                                           String debitAccountCode, BigDecimal debitAmount,
                                           String creditAccountCode, BigDecimal creditAmount) {
        String entryNum = "JE-" + System.currentTimeMillis();

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(entryNum)
                .referenceType(refType)
                .referenceNumber(refNumber)
                .description(description)
                .totalDebit(debitAmount)
                .totalCredit(creditAmount)
                .lines(new ArrayList<>())
                .build();

        JournalEntryLine debitLine = JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode(debitAccountCode)
                .debitAmount(debitAmount)
                .creditAmount(BigDecimal.ZERO)
                .memo(description)
                .build();

        JournalEntryLine creditLine = JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode(creditAccountCode)
                .debitAmount(BigDecimal.ZERO)
                .creditAmount(creditAmount)
                .memo(description)
                .build();

        entry.getLines().add(debitLine);
        entry.getLines().add(creditLine);

        log.info("Recorded Journal Entry {}: Debit Account {} (₹{}), Credit Account {} (₹{})",
                entryNum, debitAccountCode, debitAmount, creditAccountCode, creditAmount);

        return journalEntryRepository.save(entry);
    }

    @Transactional
    public JournalEntry recordMultiLineJournalEntry(String refType, String refNumber, String description,
                                                    List<JournalEntryLineItem> lineItems) {
        String entryNum = "JE-" + System.currentTimeMillis();

        BigDecimal totalDebit = lineItems.stream()
                .map(JournalEntryLineItem::getDebit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = lineItems.stream()
                .map(JournalEntryLineItem::getCredit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(entryNum)
                .referenceType(refType)
                .referenceNumber(refNumber)
                .description(description)
                .totalDebit(totalDebit)
                .totalCredit(totalCredit)
                .lines(new ArrayList<>())
                .build();

        for (JournalEntryLineItem item : lineItems) {
            JournalEntryLine line = JournalEntryLine.builder()
                    .journalEntry(entry)
                    .accountCode(item.getAccountCode())
                    .debitAmount(item.getDebit())
                    .creditAmount(item.getCredit())
                    .memo(item.getMemo() != null ? item.getMemo() : description)
                    .build();
            entry.getLines().add(line);
        }

        return journalEntryRepository.save(entry);
    }

    /**
     * Records Sales Invoice:
     * Debit: 1200 A/R (or 1000 Cash / 1100 Bank if cash sale) (Total)
     * Credit: 4000 Sales Revenue (Subtotal - Discount)
     * Credit: 2100 GST Output Tax (Tax Amount)
     */
    @Transactional
    public JournalEntry recordSalesInvoice(String invoiceNumber, String shopName, BigDecimal totalAmount,
                                           BigDecimal netTaxable, BigDecimal taxAmount, boolean isCredit, boolean isBank) {
        String debitAcc = isCredit ? "1200" : (isBank ? "1100" : "1000");
        String desc = "Sales Invoice " + invoiceNumber + " to " + shopName;

        List<JournalEntryLineItem> lines = new ArrayList<>();
        lines.add(new JournalEntryLineItem(debitAcc, totalAmount, BigDecimal.ZERO, desc + (isCredit ? " (A/R)" : " (Cash/Bank)")));
        
        if (taxAmount != null && taxAmount.compareTo(BigDecimal.ZERO) > 0) {
            lines.add(new JournalEntryLineItem("4000", BigDecimal.ZERO, netTaxable, "Sales Revenue (Excl. Tax)"));
            lines.add(new JournalEntryLineItem("2100", BigDecimal.ZERO, taxAmount, "GST Output Tax Payable (5%)"));
        } else {
            lines.add(new JournalEntryLineItem("4000", BigDecimal.ZERO, totalAmount, "Sales Revenue"));
        }

        return recordMultiLineJournalEntry("SALES_INVOICE", invoiceNumber, desc, lines);
    }

    /**
     * Records Treasury Contra Transfer between Cash and Bank:
     * e.g. Cash Deposit to Bank: Debit 1100 Bank, Credit 1000 Cash
     */
    @Transactional
    public JournalEntry recordContraTransfer(String refNumber, String fromAccount, String toAccount, BigDecimal amount, String notes) {
        String debitAcc = "BANK".equalsIgnoreCase(toAccount) ? "1100" : "1000";
        String creditAcc = "CASH".equalsIgnoreCase(fromAccount) ? "1000" : "1100";
        String desc = "Treasury Contra Transfer from " + fromAccount + " to " + toAccount + (notes != null ? " - " + notes : "");

        return recordJournalEntry("CONTRA_TRANSFER", refNumber, desc, debitAcc, amount, creditAcc, amount);
    }

    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class JournalEntryLineItem {
        private String accountCode;
        private BigDecimal debit;
        private BigDecimal credit;
        private String memo;
    }
}
