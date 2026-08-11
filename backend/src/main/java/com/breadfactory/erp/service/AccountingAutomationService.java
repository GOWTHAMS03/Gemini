package com.breadfactory.erp.service;

import com.breadfactory.erp.entity.JournalEntry;
import com.breadfactory.erp.entity.JournalEntryLine;
import com.breadfactory.erp.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
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

        return journalEntryRepository.save(entry);
    }
}
