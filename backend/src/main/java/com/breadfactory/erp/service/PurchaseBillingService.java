package com.breadfactory.erp.service;

import com.breadfactory.erp.dto.PurchaseInvoiceCreateRequest;
import com.breadfactory.erp.dto.SupplierPaymentRequest;
import com.breadfactory.erp.entity.*;
import com.breadfactory.erp.enums.*;
import com.breadfactory.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseBillingService {

    private final PurchaseInvoiceRepository purchaseInvoiceRepository;
    private final SupplierRepository supplierRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final SupplierLedgerRepository supplierLedgerRepository;
    private final CashBankTransactionRepository cashBankTransactionRepository;
    private final AccountingAutomationService accountingService;

    @Transactional(readOnly = true)
    public List<PurchaseInvoice> getAllPurchaseInvoices() {
        return purchaseInvoiceRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<PurchaseInvoice> getPurchaseInvoicesBySupplier(Long supplierId) {
        return purchaseInvoiceRepository.findBySupplierIdOrderByCreatedAtDesc(supplierId);
    }

    @Transactional
    public PurchaseInvoice createPurchaseInvoice(PurchaseInvoiceCreateRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found with ID: " + request.getSupplierId()));

        String purchaseNumber = "PUR-" + System.currentTimeMillis();

        BigDecimal subtotal = BigDecimal.ZERO;

        PurchaseInvoice invoice = PurchaseInvoice.builder()
                .purchaseNumber(purchaseNumber)
                .supplier(supplier)
                .dueDate(request.getDueDate())
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .freightCharges(request.getFreightCharges() != null ? request.getFreightCharges() : BigDecimal.ZERO)
                .additionalCharges(request.getAdditionalCharges() != null ? request.getAdditionalCharges() : BigDecimal.ZERO)
                .paymentMode(request.getPaymentMode())
                .notes(request.getNotes())
                .items(new ArrayList<>())
                .build();

        for (PurchaseInvoiceCreateRequest.PurchaseItemRequest itemReq : request.getItems()) {
            RawMaterial material = rawMaterialRepository.findById(itemReq.getRawMaterialId())
                    .orElseThrow(() -> new RuntimeException("Raw material not found: " + itemReq.getRawMaterialId()));

            BigDecimal lineTotal = itemReq.getUnitCost().multiply(itemReq.getQuantity());
            subtotal = subtotal.add(lineTotal);

            PurchaseInvoiceItem item = PurchaseInvoiceItem.builder()
                    .purchaseInvoice(invoice)
                    .rawMaterial(material)
                    .quantity(itemReq.getQuantity())
                    .unitCost(itemReq.getUnitCost())
                    .totalCost(lineTotal)
                    .returnedQuantity(BigDecimal.ZERO)
                    .build();

            invoice.getItems().add(item);

            // AUTO UPDATE RAW MATERIAL INVENTORY STOCK
            BigDecimal newStock = (material.getCurrentStock() != null ? material.getCurrentStock() : BigDecimal.ZERO)
                    .add(itemReq.getQuantity());
            material.setCurrentStock(newStock);
            material.setUnitCost(itemReq.getUnitCost()); // Update latest cost
            rawMaterialRepository.save(material);
        }

        BigDecimal tax = subtotal.subtract(invoice.getDiscountAmount()).multiply(BigDecimal.valueOf(0.05)); // 5% GST
        BigDecimal total = subtotal.subtract(invoice.getDiscountAmount())
                .add(tax)
                .add(invoice.getFreightCharges())
                .add(invoice.getAdditionalCharges());

        BigDecimal initialPaid = request.getInitialPaidAmount() != null ? request.getInitialPaidAmount() : BigDecimal.ZERO;
        if (request.getPaymentMode() == PaymentMode.CASH || request.getPaymentMode() == PaymentMode.UPI) {
            initialPaid = total; // Paid in full
        }

        BigDecimal outstanding = total.subtract(initialPaid);
        if (outstanding.compareTo(BigDecimal.ZERO) < 0) outstanding = BigDecimal.ZERO;

        PaymentStatus status = PaymentStatus.PENDING;
        if (outstanding.compareTo(BigDecimal.ZERO) == 0) {
            status = PaymentStatus.PAID;
        } else if (initialPaid.compareTo(BigDecimal.ZERO) > 0) {
            status = PaymentStatus.PARTIAL;
        }

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(tax);
        invoice.setTotalAmount(total);
        invoice.setPaidAmount(initialPaid);
        invoice.setOutstandingAmount(outstanding);
        invoice.setPaymentStatus(status);

        PurchaseInvoice savedInvoice = purchaseInvoiceRepository.save(invoice);

        // UPDATE SUPPLIER OUTSTANDING BALANCE & LEDGER
        BigDecimal currentSupBal = supplier.getOutstandingBalance() != null ? supplier.getOutstandingBalance() : BigDecimal.ZERO;
        BigDecimal newSupBal = currentSupBal.add(outstanding);
        supplier.setOutstandingBalance(newSupBal);
        supplierRepository.save(supplier);

        // Record Supplier Ledger Entry
        SupplierLedger ledgerEntry = SupplierLedger.builder()
                .supplier(supplier)
                .transactionType(SupplierLedgerType.PURCHASE_INVOICE)
                .referenceNumber(purchaseNumber)
                .debitAmount(BigDecimal.ZERO)
                .creditAmount(total)
                .runningBalance(newSupBal)
                .description("Raw Material Purchase Bill generated (" + invoice.getItems().size() + " items)")
                .build();
        supplierLedgerRepository.save(ledgerEntry);

        // Record Cash/Bank Transaction if paid
        if (initialPaid.compareTo(BigDecimal.ZERO) > 0) {
            recordPaymentOut(supplier, purchaseNumber, initialPaid, request.getPaymentMode(), "Payment for Purchase Bill " + purchaseNumber);
        }

        // AUTO ACCOUNTING JOURNAL ENTRY: Debit 1300 Raw Material Inventory, Credit 2000 Accounts Payable
        accountingService.recordJournalEntry(
                "PURCHASE_INVOICE", purchaseNumber,
                "Purchase Invoice for Raw Materials from " + supplier.getName(),
                "1300", total,
                "2000", total
        );

        return savedInvoice;
    }

    @Transactional
    public Supplier recordSupplierPayment(SupplierPaymentRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found: " + request.getSupplierId()));

        if (request.getPurchaseInvoiceId() != null) {
            purchaseInvoiceRepository.findById(request.getPurchaseInvoiceId()).ifPresent(inv -> {
                BigDecimal newPaid = inv.getPaidAmount().add(request.getAmount());
                BigDecimal newOut = inv.getTotalAmount().subtract(newPaid);
                if (newOut.compareTo(BigDecimal.ZERO) < 0) newOut = BigDecimal.ZERO;
                inv.setPaidAmount(newPaid);
                inv.setOutstandingAmount(newOut);
                inv.setPaymentStatus(newOut.compareTo(BigDecimal.ZERO) == 0 ? PaymentStatus.PAID : PaymentStatus.PARTIAL);
                purchaseInvoiceRepository.save(inv);
            });
        }

        BigDecimal currentBal = supplier.getOutstandingBalance() != null ? supplier.getOutstandingBalance() : BigDecimal.ZERO;
        BigDecimal newBal = currentBal.subtract(request.getAmount());
        if (newBal.compareTo(BigDecimal.ZERO) < 0) newBal = BigDecimal.ZERO;
        supplier.setOutstandingBalance(newBal);
        Supplier savedSupplier = supplierRepository.save(supplier);

        // Record Supplier Ledger Payment Entry
        String refNum = request.getReferenceNumber() != null ? request.getReferenceNumber() : "PAY-" + System.currentTimeMillis();
        SupplierLedger ledgerEntry = SupplierLedger.builder()
                .supplier(supplier)
                .transactionType(SupplierLedgerType.PAYMENT_MADE)
                .referenceNumber(refNum)
                .debitAmount(request.getAmount())
                .creditAmount(BigDecimal.ZERO)
                .runningBalance(newBal)
                .description(request.getDescription() != null ? request.getDescription() : "Payment made to supplier")
                .build();
        supplierLedgerRepository.save(ledgerEntry);

        // Record Cash/Bank Outflow
        recordPaymentOut(supplier, refNum, request.getAmount(), request.getPaymentMode(), "Supplier Payment: " + supplier.getName());

        // AUTO ACCOUNTING: Debit 2000 Accounts Payable, Credit 1000/1100 Cash/Bank
        String creditAcc = (request.getPaymentMode() == PaymentMode.CASH) ? "1000" : "1100";
        accountingService.recordJournalEntry(
                "SUPPLIER_PAYMENT", refNum,
                "Payment to Supplier " + supplier.getName(),
                "2000", request.getAmount(),
                creditAcc, request.getAmount()
        );

        return savedSupplier;
    }

    private void recordPaymentOut(Supplier supplier, String refNum, BigDecimal amount, PaymentMode mode, String notes) {
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
                .referenceType("SUPPLIER_PAYMENT")
                .referenceNumber(refNum)
                .runningCashBalance(newCash)
                .runningBankBalance(newBank)
                .reconciliationStatus("RECONCILED")
                .notes(notes)
                .build();
        cashBankTransactionRepository.save(txn);
    }
}
